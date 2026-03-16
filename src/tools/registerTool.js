import { z } from "zod";
import { OpenApiMeasurements } from "../services/measurements.service.js";


// ─────────────────────────────────────────────────────────────────────────────
// Schema reutilizable: colecciones IoT
// ─────────────────────────────────────────────────────────────────────────────
const collectionEnum = z.enum([
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

    `- 'gva_weather': Datos meteorológicos de la API de la Generalitat Valenciana (red de estaciones AVAMET/AEMET). ` +
        `Usar cuando pregunten por: meteorología regional, clima de la Comunidad Valenciana, estaciones meteorológicas de la GVA, comparar clima campus vs región. ` +
        `NOTA: si pregunten por meteorología específica del campus, usar 'weather' en su lugar.`
);


// ═════════════════════════════════════════════════════════════════════════════
//  REGISTRO DE TOOLS — 5 herramientas optimizadas
// ═════════════════════════════════════════════════════════════════════════════
export function registerTools(server) {

    // ─────────────────────────────────────────────────────────────────────────
    //  1. DISCOVER-COLLECTION
    //     Fusión de: info + devices + magnitudes
    //     Una sola llamada devuelve TODO lo necesario para entender una colección.
    // ─────────────────────────────────────────────────────────────────────────
    server.registerTool(
        "discover-collection",
        {
            description:
                "Devuelve toda la información de una colección IoT en una sola llamada: " +
                "descripción general, lista de dispositivos (con IDs y alias) y magnitudes disponibles. " +
                "Usar como PRIMER PASO para cualquier consulta: " +
                "'¿qué datos hay?', '¿qué sensores existen?', '¿qué mide esta colección?', " +
                "'¿qué dispositivos hay en energía?', '¿qué magnitudes tiene el sensor X?'. " +
                "También útil para obtener IDs de dispositivos antes de consultar datos con query-data o query-aggregation.",
            inputSchema: z.object({
                collection: collectionEnum,
                device_id: z.string().optional().describe(
                    "ID de un dispositivo concreto para filtrar sus magnitudes. " +
                    "Si se omite, devuelve las magnitudes de toda la colección."
                )
            })
        },
        async ({ collection, device_id }) => {
            // Lanzar las 3 peticiones en paralelo para mayor velocidad
            const [info, devices, magnitudes] = await Promise.all([
                OpenApiMeasurements.fetchOpenApiInfo(collection),
                OpenApiMeasurements.fetchOpenApiDevices(collection),
                OpenApiMeasurements.fetchOpenApiMagnitudes(collection, device_id)
            ]);

            const result = {
                collection_info: info,
                devices: devices,
                magnitudes: magnitudes,
            };

            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    );


    // ─────────────────────────────────────────────────────────────────────────
    //  2. GET-DEVICE-DETAILS
    //     Antes: metadata-device (renombrada para mayor claridad)
    //     Devuelve metadatos completos de un dispositivo concreto.
    // ─────────────────────────────────────────────────────────────────────────
    server.registerTool(
        "get-device-details",
        {
            description:
                "Devuelve los detalles completos de un dispositivo específico: " +
                "nombre, alias, geolocalización (lat/lon), ubicación dentro del edificio, " +
                "organización, tipo de métrica, código SIGUA del edificio y campos personalizados. " +
                "Usar cuando el usuario pregunta: '¿dónde está este sensor?', '¿qué es el dispositivo X?', " +
                "'información del contador', 'ubicación del equipo', 'detalles del sensor'. " +
                "Requiere el device_id, que se obtiene de discover-collection o search-buildings.",
            inputSchema: z.object({
                collection: collectionEnum,
                device_id: z.string().describe(
                    "ID del dispositivo del que se quieren obtener los detalles. " +
                    "Se obtiene de discover-collection o search-buildings."
                )
            })
        },
        async ({ collection, device_id }) => {
            const result = await OpenApiMeasurements.fetchOpenApiMetadaDevice(collection, device_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    );


    // ─────────────────────────────────────────────────────────────────────────
    //  3. QUERY-DATA — Sin cambios
    //     Series temporales de mediciones (datos crudos)
    // ─────────────────────────────────────────────────────────────────────────
    server.registerTool(
        "query-data",
        {
            description:
                "Consulta datos CRUDOS de mediciones en series temporales. " +
                "Devuelve cada lectura individual con su timestamp, valor y unidad. " +
                "Usar cuando el usuario necesita: valores exactos, datos sin procesar, " +
                "exportar lecturas, ver cada medición individual, detectar valores puntuales. " +
                "Para obtener estadísticas (media, máximo, mínimo) o evolución por horas/días, " +
                "usar query-aggregation en su lugar, que es más eficiente. " +
                "El rango temporal se define con start/end (fechas absolutas) o last (minutos hacia atrás).",
            inputSchema: z.object({
                collection: collectionEnum,
                device_id: z.string().optional().describe(
                    "ID del dispositivo a filtrar. Sin este parámetro, devuelve datos de todos los dispositivos de la colección."
                ),
                magnitude: z.string().optional().describe(
                    "Magnitud a filtrar (ej: 'temperature', 'humidity', 'co2', 'generalelectricity', 'electricityfacility'). " +
                    "Usar discover-collection para ver las magnitudes disponibles en la colección."
                ),
                tags: z.array(z.object({
                    field: z.string().describe("Campo del tag por el que filtrar (ej: 'origin', 'location', 'building')."),
                    values: z.array(z.string()).describe("Valores del tag. Múltiples valores se evalúan con OR.")
                })).optional().describe("Filtros adicionales por tags. Múltiples objetos tag se combinan con AND."),
                start: z.string().optional().describe(
                    "Fecha de inicio en ISO 8601 (ej: '2025-11-01T00:00:00Z'). Usar junto con 'end'. " +
                    "Si no se proporcionan start/end, se usa el parámetro 'last'."
                ),
                end: z.string().optional().describe(
                    "Fecha de fin en ISO 8601 (ej: '2025-11-02T00:00:00Z'). Usar junto con 'start'."
                ),
                last: z.number().optional().describe(
                    "Minutos hacia atrás desde ahora. Alternativa a start/end para consultas relativas. " +
                    "Ej: 60 = última hora, 1440 = último día, 10080 = última semana. Por defecto 60."
                ),
                timezone: z.string().optional().describe("Zona horaria para interpretar las fechas. Por defecto 'Europe/Madrid'."),
                limit: z.number().optional().describe(
                    "Número máximo de resultados a devolver. Por defecto 1000. " +
                    "Subir si se necesitan más datos, bajar para consultas rápidas."
                ),
                include_metadata: z.boolean().optional().describe(
                    "Si es true, incluye los metadatos del dispositivo (nombre, ubicación, etc.) junto con cada lectura. Por defecto false."
                ),
                export_format: z.enum(["json", "csv", "xml"]).optional().describe("Formato de exportación de los datos. Por defecto 'json'.")
            })
        },
        async (params = {}) => {
            const result = await OpenApiMeasurements.fetchOpenApiQueryData(params);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    );


    // ─────────────────────────────────────────────────────────────────────────
    //  4. QUERY-AGGREGATION — Sin cambios
    //     Datos agregados por intervalos
    // ─────────────────────────────────────────────────────────────────────────
    server.registerTool(
        "query-aggregation",
        {
            description:
                "Consulta datos AGREGADOS de mediciones agrupados por intervalos de tiempo. " +
                "Aplica funciones estadísticas (media, mínimo, máximo, suma, cuenta, último valor) " +
                "sobre los datos agrupados en intervalos configurables (por hora, por día, etc.). " +
                "Usar cuando el usuario necesita: consumo medio, evolución horaria/diaria, " +
                "valores máximos/mínimos en un periodo, tendencias, comparativas entre periodos, " +
                "resúmenes de consumo, informes energéticos. " +
                "Esta herramienta es MÁS EFICIENTE que query-data para análisis y resúmenes. " +
                "Para ver datos crudos individuales, usar query-data.",
            inputSchema: z.object({
                collection: collectionEnum,
                device_id: z.string().optional().describe(
                    "ID del dispositivo a filtrar. Sin este parámetro, agrega datos de todos los dispositivos."
                ),
                magnitude: z.string().optional().describe(
                    "Magnitud a filtrar (ej: 'temperature', 'humidity', 'co2', 'generalelectricity'). " +
                    "Usar discover-collection para ver las disponibles."
                ),
                tags: z.array(z.object({
                    field: z.string().describe("Campo del tag por el que filtrar."),
                    values: z.array(z.string()).describe("Valores del tag. Múltiples valores se evalúan con OR.")
                })).optional().describe("Filtros adicionales por tags. Múltiples objetos tag se combinan con AND."),
                start: z.string().optional().describe(
                    "Fecha de inicio en ISO 8601 (ej: '2025-11-01T00:00:00Z'). Usar junto con 'end'. " +
                    "Si no se proporcionan start/end, se usa 'last'."
                ),
                end: z.string().optional().describe(
                    "Fecha de fin en ISO 8601 (ej: '2025-11-02T00:00:00Z'). Usar junto con 'start'."
                ),
                last: z.number().optional().describe(
                    "Minutos hacia atrás desde ahora. " +
                    "Ej: 60 = última hora, 1440 = último día, 10080 = última semana, 43200 = último mes. Por defecto 60."
                ),
                timezone: z.string().optional().describe("Zona horaria para interpretar las fechas. Por defecto 'Europe/Madrid'."),
                operations: z.enum(["avg", "min", "max", "sum", "count", "last"]).optional().describe(
                    "Función estadística a aplicar sobre cada intervalo: " +
                    "'avg' (media), 'min' (mínimo), 'max' (máximo), 'sum' (suma total), " +
                    "'count' (número de lecturas), 'last' (último valor). Por defecto 'avg'."
                ),
                interval_minutes: z.number().optional().describe(
                    "Intervalo de agrupación en minutos. " +
                    "Ej: 60 = agrupación horaria, 1440 = agrupación diaria, 10080 = agrupación semanal. " +
                    "Por defecto 60 (horario)."
                ),
                group_by: z.enum(["device_id", "magnitude"]).optional().describe(
                    "Campo por el que agrupar los resultados: " +
                    "'device_id' (un resultado por dispositivo) o 'magnitude' (un resultado por tipo de medición). " +
                    "Por defecto 'device_id'."
                ),
                export_format: z.enum(["json", "csv", "xml"]).optional().describe("Formato de exportación de los datos. Por defecto 'json'.")
            })
        },
        async (params = {}) => {
            const result = await OpenApiMeasurements.fetchOpenApiQueryAggregation(params);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    );


    // ─────────────────────────────────────────────────────────────────────────
    //  5. SEARCH-BUILDINGS
    //     Fusión de: sigua-codes + list-buildings + search-buildings
    //     Busca edificios por nombre o código SIGUA, o lista todos si no hay query.
    //     Reemplaza completamente a get-measurements-sigua-codes.
    // ─────────────────────────────────────────────────────────────────────────
    server.registerTool(
        "search-buildings",
        {
            description:
                "Busca edificios del campus y devuelve sus dispositivos asociados. " +
                "Si se proporciona un término de búsqueda (query), filtra edificios por nombre parcial " +
                "(ej: 'Aulario', 'Politécnica', 'Biblioteca') o por código SIGUA (ej: '0025', '0038'). " +
                "Si NO se proporciona query, devuelve la lista completa de edificios monitorizados. " +
                "Usar cuando el usuario pregunta: '¿qué edificios hay?', 'sensores del Aulario 1', " +
                "'dispositivos del edificio 0025', 'buscar edificio Politécnica'. " +
                "Devuelve: device_id, alias (nombre descriptivo) y sigua_edificio (código del edificio). " +
                "Los device_id obtenidos se pueden usar en query-data, query-aggregation y get-device-details.",
            inputSchema: z.object({
                collection: collectionEnum,
                query: z.string().optional().describe(
                    "Término de búsqueda: nombre parcial del edificio (ej: 'Aulario', 'Politécnica') " +
                    "o código SIGUA (ej: '0025', '38'). " +
                    "La búsqueda NO distingue mayúsculas/minúsculas. " +
                    "Si se omite, devuelve todos los edificios de la colección."
                )
            })
        },
        async ({ collection, query }) => {
            // Obtener datos con metadatos para extraer info de edificios
            const result = await OpenApiMeasurements.fetchOpenApiQueryData({
                collection,
                last: 10080,
                include_metadata: true,
                limit: 1000
            });

            if (result.error) {
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }

            const records = result?.data?.records ?? [];
            const metadataList = result?.data?.metadata ?? [];
            const metadataMap = new Map(metadataList.map(m => [m.metadata_id, m]));

            // Extraer dispositivos únicos con su info de edificio
            const seen = new Set();
            const allDevices = [];

            for (const record of records) {
                if (seen.has(record.device_id)) continue;
                seen.add(record.device_id);

                const meta = metadataMap.get(record.metadata_id) ?? {};
                const customFields = meta?.custom_fields ?? {};

                allDevices.push({
                    device_id: record.device_id,
                    alias: meta?.alias ?? null,
                    sigua_edificio: customFields?.sigua_edificio ?? null,
                });
            }

            // Si no hay query, devolver todo
            if (!query || query.trim() === "") {
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            total: allDevices.length,
                            query: null,
                            data: allDevices
                        }, null, 2)
                    }]
                };
            }

            // Filtrar por query (búsqueda parcial, case-insensitive)
            const q = query.trim().toLowerCase();

            // Normalizar query numérica: si es un número, pad con ceros a 4 dígitos
            const numericQuery = /^\d+$/.test(q) ? q.padStart(4, "0") : null;

            const filtered = allDevices.filter(device => {
                const alias = (device.alias ?? "").toLowerCase();
                const sigua = (device.sigua_edificio ?? "").toLowerCase();

                // Buscar por código SIGUA (exacto o parcial con padding)
                if (numericQuery) {
                    if (sigua === numericQuery || sigua === q) return true;
                }

                // Buscar por texto en alias o sigua
                if (alias.includes(q) || sigua.includes(q)) return true;

                return false;
            });

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        total: filtered.length,
                        query: query,
                        data: filtered
                    }, null, 2)
                }]
            };
        }
    );

}