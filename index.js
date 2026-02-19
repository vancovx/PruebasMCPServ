import express from "express";
import dotenv from "dotenv";
import { registerTools } from "./src/tools/InfoCollectionTool.js";

// Librerias MCP 
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"; 
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"; 

// Librerias varias
import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import { join } from 'path';
import { create } from "domain";
import { register } from "module";

//TODO: Configurar Middlewares de Express, CORS, seguridad helmet y demas cosas que se necesiten para el servidor Express.

// Configuracion de variables de entorno
dotenv.config({path: join(process.cwd(), 'src/config/.env'), debug: false}); 


// Configurar MCP Server 
function createMcpServer() {
    const server = new McpServer({name: "mcp-server1-prueba", version: "1.0.0"}, {capabilities: { tools: {}}});

    //TODO: Registrar herramientas en el servidor MCP
    registerTools(server);


    return server;
}


//Crear servidor MCP (Con STDIO o Stremeable)
async function startMcpServer() {
    if (process.env.NODE_ENV === "production") {
        // Streamable para producción y probar con Postman
        const app = express();
        app.use(express.json());

        app.get("/health", (req, res) => { res.json({ status: "ok" });});

        // Cada request crea su propio transport
        app.post("/mcp", async (req, res) => {
            const server = createMcpServer();
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
        // STDIO para probar en local con MCP Inspector
        const server = createMcpServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Servidor MCP iniciado");

    } 
}

// Ejecutar servidor MCP
startMcpServer().catch((error) => {
    console.error("Error al iniciar el servidor MCP:", error);
    process.exit(1);
});

