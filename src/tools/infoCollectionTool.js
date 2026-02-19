import { z } from "zod";
import { OpenApiMeasurements } from "../services/measurements.Routes.js";

export function registerTools(server) {

    server.registerTool(
        "get-openapi-measurements-info",  
        {
            description: "Proporciona información sobre la fuente de datos que se va a consultar, dependiendo del Token se recibe información de una coleccion u otra.",
            inputSchema: {}  
        },
        async () => {  
            return OpenApiMeasurements.fetchOpenApiInfo();
        }
    );
}