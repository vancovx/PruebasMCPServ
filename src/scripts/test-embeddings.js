import { EmbeddingsService } from '../services/embeddings.service.js';

const query = "Dime los dispositivos de la coleccion de electricidad?";
console.error(`\nBuscando tools relevantes para: "${query}"\n`);

const results = await EmbeddingsService.findRelevantTools(query, 3, 0.3);

for (const r of results) {
    console.error(`  [${(r.similarity * 100).toFixed(1)}%] ${r.nombre}`);
}

process.exit(0);