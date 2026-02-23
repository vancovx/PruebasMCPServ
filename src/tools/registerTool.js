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

    server.registerTool(
        "get-measurements-query-data",
        {
            description: "Consulta series temporales de mediciones de dispositivos. Permite filtrar por device_id y magnitude, definir un rango temporal, límite de resultados y zona horaria.",
            inputSchema: z.object({
                device_id: z.string().optional().describe("ID del dispositivo. Si no se proporciona, no se filtra por dispositivo."),
                magnitude: z.string().optional().describe("Magnitud a consultar (temperatura, humedad, co2, etc.). Si no se proporciona, no se filtra por magnitud."),
                last: z.number().optional().describe("Minutos hacia atrás desde ahora para definir el rango temporal. Por defecto 60."),
                timezone: z.string().optional().describe("Zona horaria. Por defecto Europe/Madrid."),
                limit: z.number().optional().describe("Número máximo de resultados. Por defecto 1000."),
                export_format: z.enum(["json", "csv", "xml"]).optional().describe("Formato de exportación de los datos. Por defecto json.")
            })
        },
        async (params = {}) => {
            const result = await OpenApiMeasurements.fetchOpenApiQueryData(params);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    );
}