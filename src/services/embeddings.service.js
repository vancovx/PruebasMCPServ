import { pipeline } from '@xenova/transformers';
import pg from 'pg';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), 'src/config/.env'), quiet: true });

// ─────────────────────────────────────────────────────────────────────────────
//  Modelo singleton — se carga una sola vez en toda la vida del proceso
// ─────────────────────────────────────────────────────────────────────────────
let embedder = null;

async function getEmbedder() {
    if (!embedder) {
        console.error('[Embeddings] Cargando modelo all-mpnet-base-v2...');
        embedder = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-mpnet-base-v2');
        console.error('[Embeddings] Modelo cargado');
    }
    return embedder;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Pool de PostgreSQL singleton
// ─────────────────────────────────────────────────────────────────────────────
let pool = null;

function getPool() {
    if (!pool) {
        pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    }
    return pool;
}

// ─────────────────────────────────────────────────────────────────────────────
//  API pública del servicio
// ─────────────────────────────────────────────────────────────────────────────
export const EmbeddingsService = {

    /**
     * Genera un embedding para cualquier texto.
     * @param {string} text
     * @returns {Promise<number[]>}  Vector de 768 dimensiones
     */
    async generate(text) {
        const model = await getEmbedder();
        const output = await model(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    },

    /**
     * Lee las herramientas de la BD, genera su embedding a partir de
     * nombre + descripcion y lo persiste en la columna embedding.
     * Solo procesa herramientas activas.
     * Sin --force: solo las que tienen embedding IS NULL.
     * Con --force: regenera todas.
     * @param {boolean} force  Si true, regenera aunque ya exista embedding
     */
    async generateAndSaveAll(force = false) {
        const client = await getPool().connect();

        try {
            console.error('[Embeddings] Leyendo herramientas de la BD...');

            const { rows: tools } = await client.query(
                force
                    ? `SELECT nombre, descripcion FROM mcp_tools WHERE activo = true`
                    : `SELECT nombre, descripcion FROM mcp_tools WHERE activo = true AND embedding IS NULL`
            );

            if (tools.length === 0) {
                console.error('[Embeddings] No hay herramientas pendientes de embedding.');
                return;
            }

            console.error(`[Embeddings] ${tools.length} herramienta(s) a procesar.`);

            for (const tool of tools) {
                const text = `${tool.nombre}: ${tool.descripcion}`;

                console.error(`[Embeddings] Procesando: ${tool.nombre}`);
                const vector = await this.generate(text);
                const vectorLiteral = `[${vector.join(',')}]`;

                await client.query(
                    `UPDATE mcp_tools
                     SET embedding = $1::vector
                     WHERE nombre = $2`,
                    [vectorLiteral, tool.nombre]
                );

                console.error(`[Embeddings]   ✓ ${tool.nombre}`);
            }

            console.error('[Embeddings] Proceso completado.');
        } finally {
            client.release();
        }
    },

    /**
     * Busca las N herramientas más similares a la query del usuario.
     * Solo devuelve herramientas activas con embedding generado.
     * @param {string} userQuery   Pregunta en lenguaje natural
     * @param {number} topK        Número de resultados (default 3)
     * @param {number} threshold   Similitud mínima 0-1 (default 0.4)
     * @returns {Promise<Array<{nombre, descripcion, categoria, parametros, similarity}>>}
     */
    async findRelevantTools(userQuery, topK = 3, threshold = 0.4) {
        const vector = await this.generate(userQuery);
        const vectorLiteral = `[${vector.join(',')}]`;

        const { rows } = await getPool().query(
            `SELECT
                nombre,
                descripcion,
                categoria,
                parametros,
                1 - (embedding <=> $1::vector) AS similarity
             FROM mcp_tools
             WHERE activo = true
               AND embedding IS NOT NULL
               AND 1 - (embedding <=> $1::vector) > $2
             ORDER BY similarity DESC
             LIMIT $3`,
            [vectorLiteral, threshold, topK]
        );

        return rows;
    },
};