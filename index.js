import express from "express";
import dotenv from "dotenv";
import { registerTools } from "./src/tools/registerTool.js";
import { registerPrompts } from "./src/prompts/registerPrompts.js";
import { EmbeddingsService } from "./src/services/embeddings.service.js";

// Librerias MCP 
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"; 
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"; 

// Librerias varias
import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import { join } from 'path';

// Deshabilitamos la verificación de certificados TLS
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configuracion de variables de entorno
dotenv.config({ path: join(process.cwd(), 'src/config/.env'), quiet: true });


// ─────────────────────────────────────────────────────────────────────────────
//  Extraer la query del usuario desde el body MCP
//  El protocolo MCP envía los mensajes del usuario en req.body.messages
// ─────────────────────────────────────────────────────────────────────────────
function extractUserQuery(body) {
    try {
        // Formato MCP: { messages: [{ role: "user", content: { type: "text", text: "..." } }] }
        const messages = body?.messages ?? [];
        const userMessages = messages.filter(m => m.role === "user");
        if (userMessages.length === 0) return null;

        const last = userMessages[userMessages.length - 1];
        const content = last?.content;

        if (typeof content === "string") return content;
        if (Array.isArray(content)) {
            return content.find(c => c.type === "text")?.text ?? null;
        }
        if (content?.type === "text") return content.text;

        return null;
    } catch {
        return null;
    }
}


// ─────────────────────────────────────────────────────────────────────────────
//  Crear servidor MCP — acepta lista de nombres de tools a registrar
//  Si relevantToolNames es null, registra todas (comportamiento por defecto)
// ─────────────────────────────────────────────────────────────────────────────
function createMcpServer(relevantToolNames = null) {
    const server = new McpServer(
        { name: "mcp-server1-prueba", version: "1.0.0" },
        { capabilities: { tools: {}, prompts: {} } }
    );

    registerTools(server, relevantToolNames);
    registerPrompts(server);

    return server;
}


// ─────────────────────────────────────────────────────────────────────────────
//  Iniciar servidor
// ─────────────────────────────────────────────────────────────────────────────
async function startMcpServer() {
    if (process.env.NODE_ENV === "production") {

        const app = express();
        app.use(express.json());

        app.get("/health", (req, res) => { res.json({ status: "ok" }); });

        app.post("/mcp", async (req, res) => {
            let relevantToolNames = null;

            // Intentar búsqueda semántica — si falla, se registran todas las tools
            try {
                const userQuery = extractUserQuery(req.body);

                if (userQuery) {
                    const relevantTools = await EmbeddingsService.findRelevantTools(userQuery, 4, 0.35);

                    if (relevantTools.length > 0) {
                        relevantToolNames = relevantTools.map(t => t.nombre);
                        console.error(
                            `[MCP] Query: "${userQuery.slice(0, 60)}..." → Tools seleccionadas: [${relevantToolNames.join(', ')}]`
                        );
                    } else {
                        // Similitud por debajo del threshold en todas — usar todas las tools
                        console.error(`[MCP] Sin coincidencias semánticas para: "${userQuery.slice(0, 60)}..." → Registrando todas las tools`);
                    }
                }
            } catch (err) {
                // Nunca bloquear la request por un fallo de embeddings
                console.error('[MCP] Error en búsqueda semántica, usando todas las tools:', err.message);
            }

            const server = createMcpServer(relevantToolNames);
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
            });
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        });

        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.error("Express + MCP corriendo en el puerto:", port);
        });

    } else if (process.env.NODE_ENV === "development") {
        // STDIO para probar en local con MCP Inspector — todas las tools disponibles
        const server = createMcpServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Servidor MCP iniciado");
    }
}

startMcpServer().catch((error) => {
    console.error("Error al iniciar el servidor MCP:", error);
    process.exit(1);
});