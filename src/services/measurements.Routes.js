// Rutas para obtener la información de la OpenAPI.
import axios from 'axios';
import dotenv from "dotenv";


// Dependiendo del token que se use, se podrá acceder a la información de una colección u otra.
export const OpenApiMeasurements = {
    async fetchOpenApiInfo() {
        try {
            const response = await axios.get(`${process.env.KUNNA_ENDPOINT_API}/openapi/measurements/info`, {
                headers: {
                    'x-token-open-api': `${process.env.KUNNA_API_TOKEN_AGUA}`,
                },
            });
                console.log("Información de la OpenAPI obtenida correctamente");
                console.log(response.data);

            return response.data;

        } catch (error) {
            if (error.response) {
                return { error: true, status: error.response.status, message: error.response.data?.message || JSON.stringify(error.response.data)};
            }
            return { error: true, message: error.message };
        }
    },

    async fetchOpenApiDevices() {
        try {
            const response = await axios.get(`${process.env.KUNNA_ENDPOINT_API}/openapi/measurements/devices`, {
                headers: {
                    'x-token-open-api': `${process.env.KUNNA_API_TOKEN_AGUA}`,
                },
            });
                console.log("Información de los dispositivos obtenida correctamente");
                console.log(response.data);

            return response.data;

        } catch (error) {
            if (error.response) {
                return { error: true, status: error.response.status, message: error.response.data?.message || JSON.stringify(error.response.data)};
            }  
            return { error: true, message: error.message }; 

        }
    }



}; 