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

            return response.data;

        } catch (error) {
            if (error.response) {
                return { error: true, status: error.response.status, message: error.response.data?.message || JSON.stringify(error.response.data)};
            }  
            return { error: true, message: error.message }; 

        }
    },

    async fetchOpenApiMagnitudes(device_id = null) {
        try {
            const params = {};
            if (device_id) params.device_id = device_id;

            const response = await axios.get(`${process.env.KUNNA_ENDPOINT_API}/openapi/measurements/magnitudes`, {
                headers: {
                    'x-token-open-api': `${process.env.KUNNA_API_TOKEN_AGUA}`,
                },
                params: params
            });


            return response.data;

        } catch (error) {
            if (error.response) {
                return { error: true, status: error.response.status, message: error.response.data?.message || JSON.stringify(error.response.data)};
            }  
            return { error: true, message: error.message }; 

        }
    },

    async fetchOpenApiMetadaDevice(device_id) {
        try {

            const response = await axios.get(`${process.env.KUNNA_ENDPOINT_API}/openapi/measurements/metadata/${device_id}`, {
                headers: {
                    'x-token-open-api': `${process.env.KUNNA_API_TOKEN_AGUA}`,
                },
            });

            return response.data;

        } catch (error) {
            if (error.response) {
                return { error: true, status: error.response.status, message: error.response.data?.message || JSON.stringify(error.response.data)};
            }  
            return { error: true, message: error.message }; 

        }
    },

    async fetchOpenApiQueryData({ device_id = null, magnitude = null, last = 60, timezone = "Europe/Madrid", limit = 1000, export_format = "json" } = {}) {
        try {
            const filters = [];
            if (device_id) filters.push({ field: "device_id", values: [device_id] });
            if (magnitude) filters.push({ field: "magnitude", values: [magnitude] });

            const body = {
                time_range: {
                    last,
                    timezone
                },
                filters,
                options: {
                    limit
                },
                export_format
            };

            const response = await axios.post(
                `${process.env.KUNNA_ENDPOINT_API}/openapi/measurements/query/data`, body,
                {
                    headers: {
                        'x-token-open-api': `${process.env.KUNNA_API_TOKEN_AGUA}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;

        } catch (error) {
            if (error.response) { return { error: true, status: error.response.status, message: error.response.data?.message || JSON.stringify(error.response.data) };
            }
            return { error: true, message: error.message };
        }
    },



}; 