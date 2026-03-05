// Rutas para obtener la información de la OpenAPI.
import axios from 'axios';
import dotenv from "dotenv";


// Helper para parsear fechas en formato DD-MM-YYYY, YYYY-MM-DD o ISO 8601
function parseDate(dateStr, isEnd = false) {
    if (!dateStr) return null;

    // ISO 8601 completo → sin cambios
    if (dateStr.includes("T")) return dateStr;

    // Formato DD-MM-YYYY → convertir a YYYY-MM-DD
    if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = dateStr.split("-");
        dateStr = `${year}-${month}-${day}`;
    }

    return isEnd
        ? `${dateStr}T23:59:59.000Z`
        : `${dateStr}T00:00:00.000Z`;
}


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

    async fetchOpenApiQueryData({ collection = "agua", device_id = null, magnitude = null, tags = [], start = null, end = null, last = 60, timezone = "Europe/Madrid", limit = 1000, include_metadata = false, export_format = "json" } = {}) {
        try {
            const filters = [];
            if (device_id) filters.push({ field: "device_id", values: [device_id] });
            if (magnitude) filters.push({ field: "magnitude", values: [magnitude] });

            const parsedStart = parseDate(start);
            const parsedEnd = parseDate(end, true);

            const time_range = parsedStart && parsedEnd
                ? { start: parsedStart, end: parsedEnd, timezone }
                : { last: last ?? 60, timezone };

            const body = {
                time_range,
                ...(filters.length > 0 && { filters }),
                ...(tags && tags.length > 0 && { tags }),
                options: { limit, ...(include_metadata && { include_metadata: true }) },
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

            const parsedStart = parseDate(start);
            const parsedEnd = parseDate(end, true);

            const time_range = parsedStart && parsedEnd
                ? { start: parsedStart, end: parsedEnd, timezone }
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