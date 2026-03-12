import { z } from "zod";
import { OpenApiMeasurements } from "../services/measurements.service.js";

export function registerTools(server) {

    server.registerTool(
        "get-measurements-info",  
        {
            description: "Proporciona información sobre la fuente de datos que se va a consultar, dependiendo del Token se recibe información de una coleccion u otra.",
            inputSchema: z.object({
            collection: z.enum([
                    "bim",
                    "water",
                    "energy",
                    "weather",
                    "sensotran",
                    "roomsensors",
                    "light",
                    "fv",
                    "irrigation",
                    "bibliotecaindoorambiental",
                    "wifi",
                    "gva_weather",
                ]).describe(
                    `Colección de datos IoT a consultar. Selecciona según el tipo de consulta del usuario:\n` +

                    `- 'bim': Sensores IoT de suelo Dragino LSE01 en jardines del campus y caudalímetro CZUS/50. ` +
                        `Miden humedad del suelo, temperatura del suelo y conductividad eléctrica (tecnología FDR con compensación por temperatura y calibración de fábrica para suelos minerales). ` +
                        `Usar cuando pregunten por: estado del suelo, humedad de tierra, jardines inteligentes, conductividad del terreno, sensores de suelo, caudalímetro.\n` +

                    `- 'water': Consumo de agua potable en edificios del campus. ` +
                        `Usar cuando pregunten por: litros, m³, consumo de agua, gasto hídrico, fugas de agua, contadores de agua, agua potable.\n` +

                    `- 'energy': Consumo eléctrico de edificios y zonas comunes del campus de la Universidad de Alicante (kWh). ` +
                        `Usar cuando pregunten por: electricidad, consumo eléctrico, kilovatios, potencia eléctrica, factura de luz, contadores eléctricos.\n` +

                    `- 'weather': Estación meteorológica propia instalada en el campus de la Universidad de Alicante. ` +
                        `Usar cuando pregunten por: temperatura exterior del campus, viento en la universidad, lluvia en el campus, humedad ambiente, presión atmosférica, clima del campus.\n` +

                    `- 'sensotran': Sensores de prevención y seguridad de gases. ` +
                        `Miden concentraciones de monóxido de carbono (CO), hidrógeno (H₂), compuestos orgánicos volátiles (VOC) y gases inflamables. ` +
                        `Objetivo: evaluar seguridad, detectar fugas y validar el sistema antes de despliegue definitivo. ` +
                        `Usar cuando pregunten por: detección de gases, fugas de gas, seguridad de gases, CO, hidrógeno, VOC exterior, gases inflamables.\n` +

                    `- 'roomsensors': Calidad ambiental interior de salas, aulas y despachos. ` +
                        `Miden CO2, temperatura interior, humedad interior y VOC. ` +
                        `Usar cuando pregunten por: CO2 en aulas, temperatura de una sala, humedad dentro de un edificio, calidad del aire interior, confort térmico, ventilación de salas.\n` +

                    `- 'light': Luminarias de exterior instaladas en el campus universitario. ` +
                        `Usar cuando pregunten por: farolas, alumbrado exterior, iluminación del campus, luminarias, luces exteriores.\n` +

                    `- 'fv': Producción solar fotovoltaica de la Universidad de Alicante. ` +
                        `Usar cuando pregunten por: paneles solares, producción solar, energía renovable, autoconsumo, fotovoltaica, generación solar.\n` +

                    `- 'irrigation': Gestión de agua de riego de jardines y zonas verdes del campus. ` +
                        `Usar cuando pregunten por: riego, aspersores, agua de riego, zonas verdes, jardines, programación de riego.\n` +

                    `- 'bibliotecaindoorambiental': Sensores ambientales interiores específicos de la Biblioteca General. ` +
                        `Usar cuando pregunten por: ambiente en la biblioteca, temperatura de la biblioteca, CO2 en la biblioteca, humedad en la biblioteca. ` +
                        `NOTA: si preguntan por calidad ambiental de OTROS edificios, usar 'roomsensors' en su lugar.\n` +

                    `- 'wifi': Datos de conectividad WiFi del campus. ` +
                        `Usar cuando pregunten por: conexiones WiFi, usuarios conectados, cobertura WiFi, red inalámbrica, puntos de acceso, tráfico de red.\n` +

                    `- 'gva.weather': Datos meteorológicos de la API de la Generalitat Valenciana (red de estaciones AVAMET/AEMET). ` +
                        `Usar cuando pregunten por: meteorología regional, clima de la Comunidad Valenciana, estaciones meteorológicas de la GVA, comparar clima campus vs región. ` +
                        `NOTA: si preguntan por meteorología específica del campus, usar 'weather' en su lugar.`
                )
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
                collection: z.enum(["agua", "luz"]).describe("Colección de la que se quiere obtener la información. Por defecto 'agua'."),
                device_id: z.string().describe("Identificador del dispositivo del que se quieren obtener los metadatos.")
            })
        },
        async ({ collection = "agua", device_id }) => {
            const result = await OpenApiMeasurements.fetchOpenApiMetadaDevice(collection, device_id);
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
                include_metadata: z.boolean().optional().describe("Si es true, incluye los metadatos del dispositivo en la respuesta. Por defecto false."),
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

    server.registerTool(
        "get-measurements-sigua-codes",
        {
            description: "Obtiene el código SIGUA de edificio de cada dispositivo a partir de sus metadatos.",
            inputSchema: z.object({
                collection: z.enum(["agua", "luz"]).describe("Colección de la que se quiere obtener la información. Por defecto 'agua'.")
            })
        },
        async ({ collection = "agua" } = {}) => {
            const result = await OpenApiMeasurements.fetchOpenApiQueryData({
                collection,
                last: 10080, // 7 días para garantizar datos de todos los dispositivos
                include_metadata: true,
                limit: 1000
            });

            if (result.error) {
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }

            const records = result?.data?.records ?? [];
            const metadataList = result?.data?.metadata ?? [];

            // Crear mapa metadata_id -> metadata
            const metadataMap = new Map(metadataList.map(m => [m.metadata_id, m]));

            const seen = new Set();
            const siguas = [];

            for (const record of records) {
                if (seen.has(record.device_id)) continue;
                seen.add(record.device_id);

                const meta = metadataMap.get(record.metadata_id) ?? {};
                const customFields = meta?.custom_fields ?? {};

                siguas.push({
                    device_id: record.device_id,
                    alias: meta?.alias ?? null,
                    sigua_edificio: customFields?.sigua_edificio ?? null,
                });
            }

            return {
                content: [{ type: "text", text: JSON.stringify({ data: siguas }, null, 2) }]
            };
        }
    );

}