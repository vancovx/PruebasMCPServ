import { z } from "zod";


export function registerPrompts(server) {

    server.registerPrompt(
        "resumir-texto",  
        {
            description: "Resume un texto dado en un idioma específico (opcional).",
            inputSchema: z.object({
                texto: z.string().describe("El texto que se desea resumir."),
                idioma: z.string().optional().describe("El idioma en el que se desea el resumen. Si no se especifica, se asumirá español.")
            })  

        },
        async ({ texto, idioma }) => {
            return {                                
                content: { type: "text", text: `Por favor, resume el siguiente texto en ${idioma ?? "español"}, de forma clara y concisa:\n\n${texto}` }
            };
        }   
    );

};

