// Rutas para obtener la información de la OpenAPI.
import axios from 'axios';
import dotenv from "dotenv";
import { DateTime } from "luxon";


// Helper para parsear fechas en formato DD-MM-YYYY, YYYY-MM-DD o ISO 8601
// Ahora convierte correctamente la hora local (Europe/Madrid) a UTC
function parseDate(dateStr, isEnd = false, timezone = "Europe/Madrid") {
    if (!dateStr) return null;

    // ISO 8601 completo (con T) → ya tiene zona, devolver tal cual
    if (dateStr.includes("T")) return dateStr;

    // Formato DD-MM-YYYY → convertir a YYYY-MM-DD
    if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = dateStr.split("-");
        dateStr = `${year}-${month}-${day}`;
    }

    // Crear la fecha en la zona horaria local y convertir a UTC
    // Así "2026-03-01" en Madrid → 2026-02-28T23:00:00.000Z (UTC) en invierno
    //                             → 2026-02-29T22:00:00.000Z (UTC) en verano
    if (isEnd) {
        return DateTime
            .fromISO(`${dateStr}T23:59:59`, { zone: timezone })
            .toUTC()
            .toISO();
    } else {
        return DateTime
            .fromISO(`${dateStr}T00:00:00`, { zone: timezone })
            .toUTC()
            .toISO();
    }
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

            const parsedStart = parseDate(start, false, timezone);
            const parsedEnd = parseDate(end, true, timezone);

            let time_range;
            if (parsedStart && parsedEnd) {
                // Fechas absolutas: ya convertidas a UTC por parseDate
                time_range = { start: parsedStart, end: parsedEnd, timezone };
            } else {
                // Relativo: calcular start/end explícitamente en UTC
                // para evitar ambigüedades con "last" y zonas horarias
                const now = DateTime.now().setZone(timezone);
                const from = now.minus({ minutes: last ?? 60 });
                time_range = {
                    start: from.toUTC().toISO(),
                    end: now.toUTC().toISO(),
                    timezone
                };
            }

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

            const parsedStart = parseDate(start, false, timezone);
            const parsedEnd = parseDate(end, true, timezone);

            let time_range;
            if (parsedStart && parsedEnd) {
                // Fechas absolutas: ya convertidas a UTC por parseDate
                time_range = { start: parsedStart, end: parsedEnd, timezone };
            } else {
                // Relativo: calcular start/end explícitamente en UTC
                const now = DateTime.now().setZone(timezone);
                const from = now.minus({ minutes: last ?? 60 });
                time_range = {
                    start: from.toUTC().toISO(),
                    end: now.toUTC().toISO(),
                    timezone
                };
            }

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