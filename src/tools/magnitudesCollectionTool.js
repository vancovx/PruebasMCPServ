import { z } from "zod";
import { OpenApiMeasurements } from "../services/measurements.Routes.js";

export function registerTools(server) {

    server.registerTool(
        "get-measurements-info",  
        {
            description: "Proporciona información sobre la fuente de datos que se va a consultar, dependiendo del Token se recibe información de una coleccion u otra.",
            inputSchema: {}  
        },
        async () => {  
            return OpenApiMeasurements.fetchOpenApiInfo();
        }
    );

    server.registerTool(
        "get-measurements-magnitudes",
        {
            description: "Lista las magnitudes disponibles que han sido emitidas por los dispositivos (temperatura, humedad, co2, etc.). Opcionalmente se puede filtrar por dispositivo.",
            inputSchema: {
                type: "object",
                properties: {
                    device_id: {
                        type: "string",
                        description: "ID del dispositivo para filtrar las magnitudes que ha emitido. Si no se proporciona, devuelve todas."
                    }
                }
            }
        },
        async ({ device_id } = {}) => {
            return OpenApiMeasurements.fetchOpenApiMagnitudes(device_id);
        }
    );
}