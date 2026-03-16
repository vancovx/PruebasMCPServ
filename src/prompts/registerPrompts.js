import { z } from "zod";


export function registerPrompts(server) {

    server.registerPrompt(
        "resumen-consumo",
        {
            description: "Genera un resumen rápido del consumo de un dispositivo.",
            inputSchema: z.object({
                device_id: z.string().describe("ID del dispositivo."),
                horas: z.number().describe("Últimas X horas a analizar. Ej: 24, 48, 72.")
            })
        },
        async (args) => {
            console.error("Args recibidos:", JSON.stringify(args)); 

            const device_id = args?.device_id ?? args?.arguments?.device_id ?? "sin_id";
            const horas     = args?.horas     ?? args?.arguments?.horas     ?? 24;

            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Genera un resumen breve del dispositivo "${device_id}" 
                                de las últimas ${horas} horas.

                                Pasos:
                                1. Usa "get-device-details" para saber qué es el dispositivo.
                                2. Usa "query-aggregation" con last=${horas * 60}, operations="avg".
                                3. Responde con: nombre del dispositivo, consumo medio, y una línea de conclusión.`
                        }
                    }
                ]
            };
        }
    );


    // ─────────────────────────────────────────────────────────────────────────
    //  Informe mensual de electricidad de un edificio + detección de anomalías
    // ─────────────────────────────────────────────────────────────────────────
    server.registerPrompt(
        "informe-electricidad-edificio-mensual",
        {
            description: "Genera un informe exhaustivo del consumo eléctrico de un edificio durante un mes concreto, detecta anomalías y presenta los resultados de forma estructurada. Se puede identificar el edificio por código SIGUA o por alias (nombre).",
            inputSchema: z.object({
                edificio: z.string().describe("Identificador del edificio. Puede ser el código SIGUA (ej: '0025', '0038') o el alias/nombre del edificio (ej: 'Aulario 1', 'Politécnica II'). El sistema buscará coincidencias en ambos campos."),
                mes: z.string().describe("Mes a analizar en formato YYYY-MM (ej: '2025-06' para junio de 2025)."),
            })
        },
        async (args) => {
            console.error("Args recibidos (informe-electricidad):", JSON.stringify(args));

            const edificio = args?.edificio ?? args?.arguments?.edificio ?? "sin_identificador";
            const mes      = args?.mes      ?? args?.arguments?.mes      ?? "2025-01";

            // Calcular start y end del mes
            const [year, month] = mes.split("-");
            const start = `${year}-${month}-01T00:00:00.000Z`;
            const lastDay = new Date(Number(year), Number(month), 0).getDate();
            const end = `${year}-${month}-${String(lastDay).padStart(2, "0")}T23:59:59.000Z`;

            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Eres un experto en análisis energético de edificios universitarios. Genera un informe exhaustivo del consumo eléctrico del edificio identificado como "${edificio}" durante el mes ${mes} (del ${start} al ${end}).

                                Sigue estos pasos en orden estricto:

                                ─── PASO 1: Identificar dispositivos del edificio ───
                                Usa "search-buildings" con collection="energy" y query="${edificio}" para obtener los dispositivos del edificio.
                                Si no encuentra resultados, prueba sin query para listar todos los edificios disponibles y sugiere las opciones más cercanas al usuario.
                                Si no encuentras ningún dispositivo, informa al usuario con las opciones disponibles más parecidas y detente.

                                ─── PASO 2: Obtener metadatos ───
                                Para cada dispositivo encontrado, usa "get-device-details" con collection="energy" para conocer su nombre, ubicación y tipo.

                                ─── PASO 3: Obtener datos agregados diarios ───
                                Para cada dispositivo, usa "query-aggregation" con:
                                - collection = "energy"
                                - device_id = (el ID del dispositivo)
                                - start = "${start}"
                                - end = "${end}"
                                - operations = "avg"
                                - interval_minutes = 1440 (agrupación diaria)
                                Repite con operations = "max" y operations = "min".

                                ─── PASO 4: Obtener datos agregados horarios (para detectar anomalías) ───
                                Usa "query-aggregation" con:
                                - interval_minutes = 60 (agrupación horaria)
                                - operations = "avg"
                                - Mismo rango de fechas y dispositivos.

                                ─── PASO 5: Generar el informe con esta estructura ───

                                ## 1. Datos del edificio
                                - Código SIGUA, nombre del edificio, número de dispositivos/contadores encontrados.
                                - Lista de dispositivos con su alias y ubicación.

                                ## 2. Resumen de consumo mensual
                                - Consumo total estimado del edificio (suma de todos los dispositivos).
                                - Consumo medio diario.
                                - Día de mayor consumo y día de menor consumo.
                                - Tabla resumen por dispositivo: alias, consumo medio diario, máximo, mínimo.

                                ## 3. Evolución diaria
                                - Describe la tendencia del consumo a lo largo del mes.
                                - Identifica patrones claros (ej: bajada en fines de semana, picos al inicio de semana).

                                ## 4. Análisis horario y patrones
                                - Describe el patrón horario típico del edificio.
                                - Compara días laborables vs fines de semana si los datos lo permiten.

                                ## 5. Detección de anomalías
                                Aplica estos criterios:
                                a) **Picos extremos**: cualquier valor horario que supere en más de 2 desviaciones estándar la media horaria del mes.
                                b) **Consumo nocturno inusual**: consumo entre las 00:00-06:00 que supere el 30% del consumo medio diurno.
                                c) **Días atípicos**: días cuyo consumo total se desvíe más de 1.5 desviaciones estándar de la media diaria.
                                d) **Caídas a cero**: periodos donde el consumo cae a 0 durante horas laborables.

                                Para cada anomalía encontrada indica: fecha/hora, dispositivo afectado, valor registrado, valor esperado y tipo de anomalía.
                                Si no se detectan anomalías, indícalo explícitamente.

                                ## 6. Conclusiones y recomendaciones
                                - Resumen ejecutivo del estado del consumo eléctrico del edificio.
                                - Si hay anomalías, sugiere posibles causas y acciones.
                                - Compara si el patrón es coherente con el uso esperado de un edificio universitario.

                                Importante: Presenta los datos de forma clara. Usa tablas cuando sea apropiado. Si algún paso falla o no devuelve datos, indícalo y continúa con los datos disponibles.`
                        }
                    }
                ]
            };
        }
    );

}