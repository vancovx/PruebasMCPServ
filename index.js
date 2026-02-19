import express from "express";
import dotenv from "dotenv";
import { OpenApiMeasurements } from "./src/services/measurements.Routes.js";

// Librerias MCP 
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"; //Transporte remoto para el MCP
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"; //Transporte para desarrollo local con MCP Inspector

// Librerias varias
import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import { join } from 'path';

//TODO: Aqui configurar Middlewares de Express, CORS, seguridad helmet y demas cosas que se necesiten para el servidor Express.

// Configuracion de variables de entorno
dotenv.config({path: join(process.cwd(), 'src/config/.env'), debug: false}); 


// Configurar MCP Server 
const server = new McpServer({name: "mcp-server1-prueba", version: "1.0.0"}, {capabilities: { tools: {}}}); //Se supone que el capabilities es obligatorio a la hora de crear el servidor MCP.

//TODO: Registrar herramientas en el servidor MCP
// Se puede hacer con server.setRequestHandler() (más control) o con server.registerTool().




//Iniciar servidor MCP (Con STDIO o Stremeable)
async function startMcpServer() {
    if (process.env.NODE_ENV === "production") {
        // Streamable para producción y probar con Postman
        const app = express();
        app.use(express.json());

        // Rutas Express normales
        app.get("/health", (req, res) => {
        res.json({ status: "ok" });
        });

        // MCP montado en su propia ruta
        const mcpTransport = new StreamableHTTPServerTransport({
        endpoint: "/mcp"
        });
        await server.connect(mcpTransport);
        app.use("/mcp", mcpTransport.requestHandler);

        app.listen(process.env.PORT, () => {
        console.error("Express + MCP corriendo en el puerto:", process.env.PORT);
        });


    } else if (process.env.NODE_ENV === "development") {
        // STDIO para probar en local con MCP Inspector
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Servidor MCP iniciado");
    } 
}


startMcpServer().catch((error) => {
    console.error("Error al iniciar el servidor MCP:", error);
    process.exit(1);
});

