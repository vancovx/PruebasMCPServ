import { z } from "zod";


export function registerPrompts(server) {

    server.registerPrompt(
        "Informe-Dispositivo-Rango-Fechas",  
        {
            description: "Genera un informe detallado sobre las mediciones de un dispositivo dentro de un rango de fechas específico.",
            inputSchema: z.object({
                device_id: z.string().describe("El ID del dispositivo del que se desea generar el informe."),
                start: z.string().describe("Fecha de inicio del rango para el informe (formato ISO 8601)."),
                end: z.string().describe("Fecha de fin del rango para el informe (formato ISO 8601)."),
                magnitude: z.string().optional().describe("Magnitud específica a incluir en el informe (ej: temperatura, humedad, etc.). Si no se proporciona, se incluirán todas las magnitudes disponibles para el dispositivo.")
            })  

        },

        async ({ device_id, start, end, magnitude }) => {
            messages: [
                { 
                    role: "system", 
                    content: "Eres un asistente experto en análisis de datos de sensores IoT. Tu tarea es generar un informe detallado sobre las mediciones de un dispositivo específico dentro de un rango de fechas determinado. El informe debe incluir estadísticas clave, tendencias, anomalías y cualquier insight relevante basado en los datos disponibles." 
                },
                {
                    role: "user",
                    type: "text",
                    text: `Eres un experto en análisis de datos de sensores IoT. 
                        Genera un reporte estructurado del dispositivo con ID "${device_id}" para el período comprendido entre "${start}" y "${end}".
                        ${magnitude ? `Analiza únicamente la magnitud: "${magnitude}".` : "Analiza todas las magnitudes disponibles del dispositivo."}

                        Para construir el reporte sigue estos pasos en orden:
                        1. Usa la tool "get-measurements-metadata-device" con device_id="${device_id}" para obtener el contexto del dispositivo (nombre, ubicación, tipo, etc.).
                        2. Usa la tool "get-measurements-magnitudes" con device_id="${device_id}" para conocer qué magnitudes ha emitido.
                        3. Usa la tool "get-measurements-query-aggregation" con device_id="${device_id}", start="${start}", end="${end}", operations="avg", interval_minutes=60${magnitude ? `, magnitude="${magnitude}"` : ""} para obtener la evolución horaria.
                        4. Repite el paso 3 con operations="min" y operations="max" para obtener los valores extremos.

                        Con los datos obtenidos, presenta el reporte con esta estructura exacta:

                        ##  Información del dispositivo
                        - Nombre, ubicación, organización y tipo de métrica.

                        ##  Resumen estadístico por magnitud
                        Una tabla o sección por cada magnitud con: valor medio, mínimo, máximo y unidad.

                        ##  Evolución temporal
                        Describe la tendencia general del período: si los valores subieron, bajaron, se mantuvieron estables o tuvieron picos.

                        ##  Anomalías detectadas
                        Identifica valores fuera de lo común o cambios bruscos en el período analizado. Si no hay anomalías, indícalo explícitamente.

                        ##  Conclusión
                        Un párrafo breve con las conclusiones clave del período analizado.`,
                }

            ]
        }
    );

};

