import express from "express";
import dotenv from "dotenv";
import { OpenApiMeasurements } from "./src/services/measurements.Routes.js";

// Librerias MCP 
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"; //Transporte mejorado para el MCP
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Librerias varias
import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import { join } from 'path';

//TODO: Aqui configurar Middlewares de Express, CORS, seguridad helmet y demas cosas que se necesiten para el servidor Express.

// Configuracion de variables de entorno
dotenv.config({path: join(process.cwd(), 'src/config/.env'), debug: false}); 

// Crear servidor Express
// Esto para cuando usemos el servidor en remoto
const app = express();
const PORT = process.env.PORT || 3001;

// Configurar MCP Server 
const server = new McpServer({name: "mcp-server1-prueba", version: "1.0.0"}, {capabilities: { tools: {}}}); //Se supone que el capabilities es obligatorio a la hora de crear el servidor MCP.

//TODO: Registrar herramientas en el servidor MCP
// Se puede hacer con server.setRequestHandler() (más control) o con server.registerTool().




//Iniciar servidor MCP (Con STDIO o Stremeable)
async function startMcpServer() {
    if (process.env.NODE_ENV === "production") {
        // Streamable para producción y probar con Postman


    } else if (process.env.NODE_ENV === "development") {
        // STDIO para probar en local con MCP Inspector
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Servidor MCP iniciado");
    } 
}


