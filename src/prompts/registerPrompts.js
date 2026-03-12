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
                                1. Usa "get-measurements-metadata-device" para saber qué es el dispositivo.
                                2. Usa "get-measurements-query-aggregation" con last=${horas * 60}, operations="avg".
                                3. Responde con: nombre del dispositivo, consumo medio, y una línea de conclusión.`
                        }
                    }
                ]
            };
        }
    );

}

