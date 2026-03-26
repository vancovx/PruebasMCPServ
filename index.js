import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { registerTools } from "./src/tools/registerTool.js";
import { registerPrompts } from "./src/prompts/registerPrompts.js";
import { EmbeddingsService } from "./src/services/embeddings.service.js";
import { registerCampusTools } from "./src/tools/campusTool.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"; 
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"; 
import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import { join } from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
dotenv.config({ path: join(process.cwd(), 'src/config/.env'), quiet: true });


function extractUserQuery(body) {
    try {
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


function createMcpServer(relevantToolNames = null) {
    const server = new McpServer(
        { name: "mcp-server1-prueba", version: "1.0.0" },
        { capabilities: { tools: {}, prompts: {} } }
    );

    registerTools(server, relevantToolNames);
    registerCampusTools(server);
    registerPrompts(server);

    return server;
}


async function startMcpServer() {
    
    if (process.env.NODE_ENV === "production") {

        const app = express();

        app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Mcp-Session-Id'],
            exposedHeaders: ['Mcp-Session-Id'],
            credentials: false
        }));

        app.options('/mcp', cors());

        app.use(express.json());

        app.get("/health", (req, res) => {
            res.json({ status: "ok" });
        });

        // GET /mcp — devuelve info del servidor y lista de herramientas
        // Open WebUI usa este endpoint para descubrir y mostrar las herramientas
        app.get("/mcp", (req, res) => {
            const server = createMcpServer();
            
            const tools = Object.entries(server._registeredTools).map(([name, tool]) => ({
                name,
                description: tool.description || "",
                inputSchema: tool.inputSchema || { type: "object", properties: {} }
            }));

            res.json({
                name: "mcp-server1-prueba",
                version: "1.0.0",
                protocolVersion: "2024-11-05",
                capabilities: {
                    tools: { listChanged: true },
                    prompts: { listChanged: true }
                },
                tools
            });
        });

        // POST /mcp — maneja todas las peticiones del protocolo MCP
        app.post("/mcp", async (req, res) => {
            let relevantToolNames = null;

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
                        console.error(`[MCP] Sin coincidencias semánticas para: "${userQuery.slice(0, 60)}..." → Registrando todas las tools`);
                    }
                }
            } catch (err) {
                console.error('[MCP] Error en búsqueda semántica, usando todas las tools:', err.message);
            }

            const server = createMcpServer(relevantToolNames);
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
            });
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        });

        // DELETE /mcp — cierre de sesión MCP
        app.delete("/mcp", (req, res) => {
            res.status(200).json({ status: "session closed" });
        });

        const port = process.env.PORT || 3000;
        app.listen(port, '0.0.0.0', () => {
            console.error("Express + MCP corriendo en el puerto:", port);
        });

    } else if (process.env.NODE_ENV === "development") {
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