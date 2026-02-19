import { z } from "zod";
import { OpenApiMeasurements } from "../services/measurements.service.js";

export function registerTools(server) {

    server.registerTool(
        "get-measurements-info",  
        {
            description: "Proporciona información sobre la fuente de datos que se va a consultar, dependiendo del Token se recibe información de una coleccion u otra.",
            inputSchema: z.object({})
        },
        async () => {
            const result = await OpenApiMeasurements.fetchOpenApiInfo();
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    );

    server.registerTool(
        "get-measurements-devices",
        {
            description: "Obtiene la lista de dispositivos disponibles que han emitido mediciones.",
            inputSchema: z.object({})
        },
        async () => {
            const result = await OpenApiMeasurements.fetchOpenApiDevices();
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    );

    server.registerTool(
        "get-measurements-magnitudes",
        {
            description: "Lista las magnitudes disponibles que han sido emitidas por los dispositivos (temperatura, humedad, co2, etc.). Opcionalmente se puede filtrar por dispositivo.",
            inputSchema: z.object({
                device_id: z.string().optional().describe("ID del dispositivo para filtrar las magnitudes que ha emitido. Si no se proporciona, devuelve todas.")
            })
        },
        async ({ device_id } = {}) => {
            const result = await OpenApiMeasurements.fetchOpenApiMagnitudes(device_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    );

    server.registerTool(
        "get-measurements-metadata-device",
        {
            description: "Obtiene los metadatos asociados a un dispositivo (geolocalización, nombre, ubicación, organización, tipo de métrica, etc.).",
            inputSchema: z.object({
                device_id: z.string().describe("Identificador del dispositivo del que se quieren obtener los metadatos.")
            })
        },
        async ({ device_id }) => {
            const result = await OpenApiMeasurements.fetchOpenApiMetadaDevice(device_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    );
}