import { z } from "zod";
import { OpenApiMeasurements } from "../services/measurements.Routes.js";

export function registerTools(server) {

    server.registerTool(
        "get-openapi-measurements-info",  
        {
            description: "Obtiene la información de la OpenAPI de mediciones..",
            inputSchema: {}  
        },
        async () => {  
            return OpenApiMeasurements.getOpenApiInfo();
        }
    );
}