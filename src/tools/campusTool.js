import { z } from "zod";
import { CampusService } from "../services/campus.service.js";


export function registerCampusTools(server) {

    // Búsqueda flexible de edificios por texto libre
    server.registerTool(
        "search-campus-buildings",
        {
            description:
                "Busca edificios del campus de la Universidad de Alicante por nombre, código SIGUA o descripción. " +
                "Entiende nombres oficiales ('Escuela Politécnica Superior I'), nombres coloquiales ('la poli', 'EPS'), " +
                "códigos SIGUA ('0016', '16') y búsquedas parciales ('ciencias', 'letras'). " +
                "Devuelve: código SIGUA, nombre oficial, plantas disponibles, coordenadas del centro y bounding box. " +
                "Usar cuando el usuario pregunta por un edificio y se necesita identificar su código SIGUA " +
                "antes de consultar datos de sensores o consumo con las herramientas get-measurements-*. " +
                "También útil para: '¿qué edificios hay?', '¿dónde está X?', 'listar edificios del campus'. " +
                "REEMPLAZA a get-measurements-sigua-codes: es más rápida (datos en memoria) y más flexible (búsqueda semántica).",
            inputSchema: z.object({
                query: z.string().describe(
                    "Texto de búsqueda. Puede ser: " +
                    "un código SIGUA ('0016', '16'), " +
                    "un nombre oficial ('Escuela Politécnica Superior I'), " +
                    "un nombre coloquial ('la poli', 'EPS', 'derecho'), " +
                    "o una búsqueda parcial ('ciencias', 'filosofía'). " +
                    "La búsqueda ignora tildes y mayúsculas."
                ),
                limit: z.number().optional().describe(
                    "Número máximo de resultados. Por defecto 5. " +
                    "Usar 1 si se busca un edificio concreto, más si la búsqueda es ambigua."
                )
            })
        },
        async ({ query, limit }) => {
            const results = CampusService.searchBuildings(query, limit ?? 5);

            if (results.length === 0) {
                // Si no hay resultados, devolver todos los edificios como sugerencia
                const all = CampusService.getAllBuildings();
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            message: `No se encontró ningún edificio que coincida con "${query}".`,
                            sugerencia: "Estos son los edificios disponibles:",
                            edificios_disponibles: all.map(b => ({
                                codigo_sigua: b.id,
                                nombre: b.nombre
                            }))
                        }, null, 2)
                    }]
                };
            }

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        query,
                        num_resultados: results.length,
                        resultados: results.map(r => ({
                            codigo_sigua: r.building.id,
                            nombre: r.building.nombre,
                            plantas: r.building.plantas,
                            num_plantas: r.building.num_plantas,
                            centro: r.building.center,
                            bbox: r.building.bbox,
                            score: Math.round(r.score * 100) + "%",
                            tipo_match: r.matchType
                        }))
                    }, null, 2)
                }]
            };
        }
    );


    // Listar todos los edificios del campus
    server.registerTool(
        "list-campus-buildings",
        {
            description:
                "Devuelve la lista completa de todos los edificios del campus de la Universidad de Alicante. " +
                "Cada edificio incluye: código SIGUA, nombre oficial, plantas y coordenadas. " +
                "Usar cuando el usuario pregunta: '¿qué edificios hay?', 'lista de edificios', " +
                "'muéstrame todos los edificios', 'edificios del campus'. " +
                "No requiere parámetros.",
            inputSchema: z.object({})
        },
        async () => {
            const buildings = CampusService.getAllBuildings();
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        total: buildings.length,
                        edificios: buildings.map(b => ({
                            codigo_sigua: b.id,
                            nombre: b.nombre,
                            plantas: b.plantas,
                            num_plantas: b.num_plantas,
                            centro: b.center
                        }))
                    }, null, 2)
                }]
            };
        }
    );

}