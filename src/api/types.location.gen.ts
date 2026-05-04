/* eslint-disable */
// AUTO-GENERATED — run `pnpm gen:types` to regenerate.

// Location — bare openapi-typescript output

export type paths = {
    "/v1/vehicles/{vin}/location": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get last known location
         * @description Get last known location
         */
        get: operations["GetVehicleLocation"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
};
export type webhooks = Record<string, never>;
export type components = {
    schemas: {
        Error: {
            message?: string;
            description?: string;
        };
        ErrorResponse: {
            /** Format: int32 */
            status?: number;
            operationId?: string;
            error?: components["schemas"]["Error"];
        };
        Feature: {
            type?: string;
            properties?: {
                [key: string]: string;
            };
            geometry?: components["schemas"]["Point"];
        };
        LocationResponse: {
            /** Format: int32 */
            status?: number;
            operationId?: string;
            data?: components["schemas"]["Feature"];
        };
        Point: {
            type?: string;
            coordinates: number[];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
    GetVehicleLocation: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems. Deprecated since 2025-09-29. Please use traceparent instead. */
                "vcc-api-operationId"?: string;
            };
            path: {
                vin: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "status": 0,
                     *       "operationId": "string",
                     *       "data": {
                     *         "type": "string",
                     *         "properties": {},
                     *         "geometry": {
                     *           "type": "string",
                     *           "coordinates": [
                     *             0
                     *           ]
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["LocationResponse"];
                };
            };
            /** @description Request contains an unaccepted input */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "status": 0,
                     *       "operationId": "string",
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "status": 0,
                     *       "operationId": "string",
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "status": 0,
                     *       "operationId": "string",
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "status": 0,
                     *       "operationId": "string",
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unsupported Media Type */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "status": 0,
                     *       "operationId": "string",
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "status": 0,
                     *       "operationId": "string",
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "status": 0,
                     *       "operationId": "string",
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}
