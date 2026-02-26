// Rutas para obtener la información de la OpenAPI.
import axios from 'axios';
import dotenv from "dotenv";


// Dependiendo del token que se use, se podrá acceder a la información de una colección u otra.
export const OpenApiMeasurements = {
    async fetchOpenApiInfo(collection = "agua") {
        try {
            const response = await axios.get(`${process.env.KUNNA_ENDPOINT_API}/openapi/measurements/info`, {
                headers: {
                    'x-token-open-api': `${process.env[`KUNNA_API_TOKEN_${collection.toUpperCase()}`]}`,
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

    async fetchOpenApiDevices(collection = "agua") {
        try {
            const response = await axios.get(`${process.env.KUNNA_ENDPOINT_API}/openapi/measurements/devices`, {
                headers: {
                    'x-token-open-api': `${process.env[`KUNNA_API_TOKEN_${collection.toUpperCase()}`]}`,
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

    async fetchOpenApiMagnitudes(collection = "agua", device_id = null) {
        try {
            const params = {};
            if (device_id) params.device_id = device_id;

            const response = await axios.get(`${process.env.KUNNA_ENDPOINT_API}/openapi/measurements/magnitudes`, {
                headers: {
                    'x-token-open-api': `${process.env[`KUNNA_API_TOKEN_${collection.toUpperCase()}`] }`,
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

    async fetchOpenApiMetadaDevice(collection = "agua", device_id = null) {
        try {

            const response = await axios.get(`${process.env.KUNNA_ENDPOINT_API}/openapi/measurements/metadata/${device_id}`, {
                headers: {
                    'x-token-open-api': `${process.env[`KUNNA_API_TOKEN_${collection.toUpperCase()}`]}`,
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

    async fetchOpenApiQueryData({ collection = "agua", device_id = null, magnitude = null, tags = [], start = null, end = null, last = 60, timezone = "Europe/Madrid", limit = 1000, export_format = "json" } = {}) {
        try {
            const filters = [];
            if (device_id) filters.push({ field: "device_id", values: [device_id] });
            if (magnitude) filters.push({ field: "magnitude", values: [magnitude] });

            const time_range = start && end
                ? { start, end, timezone }
                : { last: last ?? 60, timezone };

            const body = {
                time_range,
                ...(filters.length > 0 && { filters }),
                ...(tags && tags.length > 0 && { tags }),
                options: { limit },
                export_format
            };

            const response = await axios.post(
                `${process.env.KUNNA_ENDPOINT_API}/openapi/measurements/query/data`,
                body,
                {
                    headers: {
                        'x-token-open-api': `${process.env[`KUNNA_API_TOKEN_${collection.toUpperCase()}`]}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;

        } catch (error) {
            if (error.response) {
                return { error: true, status: error.response.status, message: error.response.data?.message || JSON.stringify(error.response.data) };
            }
            return { error: true, message: error.message };
        }
    },

    async fetchOpenApiQueryAggregation({ collection = "agua", device_id = null, magnitude = null, tags = [], start = null, end = null, last = 60, timezone = "Europe/Madrid", operations = "avg", interval_minutes = 60, group_by = "device_id", export_format = "json" } = {}) {
        try {
            const filters = [];
            if (device_id) filters.push({ field: "device_id", values: [device_id] });
            if (magnitude) filters.push({ field: "magnitude", values: [magnitude] });

            const time_range = start && end
                ? { start, end, timezone }
                : { last: last ?? 60, timezone };

            const body = {
                time_range,
                aggregation: {
                    operations,
                    interval_minutes,
                    group_by
                },
                ...(filters.length > 0 && { filters }),
                ...(tags && tags.length > 0 && { tags }),
                export_format
                
            };

            const response = await axios.post(
                `${process.env.KUNNA_ENDPOINT_API}/openapi/measurements/query/data/aggregation`,
                body,
                {
                    headers: {
                        'x-token-open-api': `${process.env[`KUNNA_API_TOKEN_${collection.toUpperCase()}`]}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;

        } catch (error) {
            if (error.response) {
                return { error: true, status: error.response.status, message: error.response.data?.message || JSON.stringify(error.response.data)};
            }
            return { error: true, message: error.message };
        }
    },



}; 