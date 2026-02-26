import { z } from "zod";
import { OpenApiMeasurements } from "../services/measurements.service.js";

export function registerTools(server) {

    server.registerTool(
        "get-measurements-info",  
        {
            description: "Proporciona información sobre la fuente de datos que se va a consultar, dependiendo del Token se recibe información de una coleccion u otra.",
            inputSchema: z.object({
                collection: z.enum(["agua", "luz"]).describe("Colección de la que se quiere obtener la información. Por defecto 'agua'.")
            })
        },
        async ({ collection = "agua" }) => {
            const result = await OpenApiMeasurements.fetchOpenApiInfo(collection);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    );

    server.registerTool(
        "get-measurements-devices",
        {
            description: "Obtiene la lista de dispositivos disponibles que han emitido mediciones.",
            inputSchema: z.object({
                collection: z.enum(["agua", "luz"]).describe("Colección de la que se quiere obtener la información. Por defecto 'agua'.")
            })
        },
        async ({ collection = "agua" }) => {
            const result = await OpenApiMeasurements.fetchOpenApiDevices(collection);
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
                collection: z.enum(["agua", "luz"]).describe("Colección de la que se quiere obtener la información. Por defecto 'agua'."),
                device_id: z.string().optional().describe("ID del dispositivo para filtrar las magnitudes que ha emitido. Si no se proporciona, devuelve todas.")
            })
        },
        async ({ collection = "agua", device_id } = {}) => {
            const result = await OpenApiMeasurements.fetchOpenApiMagnitudes(collection, device_id);
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
            description: "Consulta series temporales de mediciones. Permite filtrar por device_id, magnitude y tags. El rango temporal puede definirse con fechas absolutas (start/end) o relativo en minutos (last).",
            inputSchema: z.object({
                collection: z.enum(["agua", "luz"]).describe("Colección de la que se quiere obtener la información. Por defecto 'agua'."),
                device_id: z.string().optional().describe("ID del dispositivo a filtrar."),
                magnitude: z.string().optional().describe("Magnitud a filtrar (temperatura, humedad, co2, etc.)."),
                tags: z.array(z.object({
                    field: z.string().describe("Campo del tag por el que filtrar (ej: origin, location, etc.)."),
                    values: z.array(z.string()).describe("Valores del tag. Múltiples valores se evalúan con OR.")
                })).optional().describe("Filtros por tags. Múltiples objetos tag se combinan con AND."),
                start: z.string().optional().describe("Fecha de inicio en ISO 8601 (ej: 2025-11-01T00:00:00Z). Usar junto con 'end'."),
                end: z.string().optional().describe("Fecha de fin en ISO 8601 (ej: 2025-11-02T00:00:00Z). Usar junto con 'start'."),
                last: z.number().optional().describe("Minutos hacia atrás desde ahora. Se usa si no se proporcionan 'start' y 'end'. Por defecto 60."),
                timezone: z.string().optional().describe("Zona horaria. Por defecto Europe/Madrid."),
                limit: z.number().optional().describe("Número máximo de resultados. Por defecto 1000."),
                export_format: z.enum(["json", "csv", "xml"]).optional().describe("Formato de exportación. Por defecto json.")
            })
        },
        async (params = {}) => {
            const result = await OpenApiMeasurements.fetchOpenApiQueryData(params);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    );

    server.registerTool(
        "get-measurements-query-aggregation",
        {
            description: "Consulta datos agregados de mediciones (avg, min, max, sum, count, last) agrupados por intervalos de tiempo. Permite filtrar por device_id, magnitude y tags.",
            inputSchema: z.object({
                collection: z.enum(["agua", "luz"]).describe("Colección de la que se quiere obtener la información. Por defecto 'agua'."),
                device_id: z.string().optional().describe("ID del dispositivo a filtrar."),
                magnitude: z.string().optional().describe("Magnitud a filtrar (temperatura, humedad, co2, etc.)."),
                tags: z.array(z.object({
                    field: z.string().describe("Campo del tag por el que filtrar."),
                    values: z.array(z.string()).describe("Valores del tag. Múltiples valores se evalúan con OR.")
                })).optional().describe("Filtros por tags. Múltiples objetos tag se combinan con AND."),
                start: z.string().optional().describe("Fecha de inicio en ISO 8601 (ej: 2025-11-01T00:00:00Z). Usar junto con 'end'."),
                end: z.string().optional().describe("Fecha de fin en ISO 8601 (ej: 2025-11-02T00:00:00Z). Usar junto con 'start'."),
                last: z.number().optional().describe("Minutos hacia atrás desde ahora. Se usa si no se proporcionan 'start' y 'end'. Por defecto 60."),
                timezone: z.string().optional().describe("Zona horaria. Por defecto Europe/Madrid."),
                operations: z.enum(["avg", "min", "max", "sum", "count", "last"]).optional().describe("Función estadística a aplicar. Por defecto avg."),
                interval_minutes: z.number().optional().describe("Intervalo de agrupación en minutos. Por defecto 60."),
                group_by: z.enum(["device_id", "magnitude"]).optional().describe("Campo por el que agrupar. Por defecto device_id."),
                export_format: z.enum(["json", "csv", "xml"]).optional().describe("Formato de exportación. Por defecto json.")
            })
        },
        async (params = {}) => {
            const result = await OpenApiMeasurements.fetchOpenApiQueryAggregation(params);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    );

}