/* eslint-disable */
// AUTO-GENERATED — run `pnpm gen:types` to regenerate.

// Energy — bare openapi-typescript output

export type paths = {
    "/vehicles/{vin}/capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get capabilities
         * @description Provides a summary of the supported endpoints and data points for a vehicle. Each endpoint has a capability
         *     representation in the capabilities response indicating whether the endpoint is available for the specific
         *     vehicle along with additional information specific to that endpoint.
         */
        get: operations["GetCapabilities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get the latest energy state
         * @description Provides the latest energy state data for the vehicle in the form of a map of resource values.
         */
        get: operations["GetEnergyState"];
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
        /**
         * Format: date-time
         * @example 2021-01-01T12:00:00.0000000+00:00
         */
        Timestamp: string;
        ResultResourceInstanceString: components["schemas"]["SuccessResultResourceInstanceString"] | components["schemas"]["ErrorResultWithDescription"];
        ResultResourceInstanceFloatWithUnit: components["schemas"]["SuccessResultResourceInstanceFloatWithUnit"] | components["schemas"]["ErrorResultWithDescription"];
        ResultResourceInstanceIntegerWithUnit: components["schemas"]["SuccessResultResourceInstanceIntegerWithUnit"] | components["schemas"]["ErrorResultWithDescription"];
        SuccessResult: {
            /** @enum {string} */
            status: "OK";
        };
        ErrorResult: {
            /** @enum {string} */
            status: "ERROR";
        };
        SuccessResultResourceInstanceFloatWithUnit: components["schemas"]["SuccessResult"] & components["schemas"]["ResourceInstanceFloatWithUnit"] & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            status: "OK";
        };
        SuccessResultResourceInstanceIntegerWithUnit: components["schemas"]["SuccessResult"] & components["schemas"]["ResourceInstanceIntegerWithUnit"] & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            status: "OK";
        };
        SuccessResultResourceInstanceString: components["schemas"]["SuccessResult"] & components["schemas"]["ResourceInstanceString"] & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            status: "OK";
        };
        SuccessResultResourceInstanceBoolean: components["schemas"]["SuccessResult"] & components["schemas"]["ResourceInstanceBoolean"];
        ErrorResultWithDescription: components["schemas"]["ErrorResult"] & components["schemas"]["Error"] & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            status: "ERROR";
        };
        ResourceInstanceString: {
            value: string;
            updatedAt: components["schemas"]["Timestamp"];
        };
        ResourceInstanceBoolean: {
            value: boolean;
            updatedAt: components["schemas"]["Timestamp"];
        };
        ResourceInstanceInteger: {
            value: number;
            updatedAt: components["schemas"]["Timestamp"];
        };
        ResourceInstanceFloat: {
            /** Format: float */
            value: number;
            updatedAt: components["schemas"]["Timestamp"];
        };
        ResourceInstanceStringWithUnit: components["schemas"]["ResourceInstanceString"] & {
            unit: string;
        };
        ResourceInstanceIntegerWithUnit: components["schemas"]["ResourceInstanceInteger"] & {
            unit: string;
        };
        ResourceInstanceFloatWithUnit: components["schemas"]["ResourceInstanceFloat"] & {
            unit: string;
        };
        /**
         * @example {
         *       "batteryChargeLevel": {
         *         "status": "OK",
         *         "value": 27,
         *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00",
         *         "unit": "percentage"
         *       },
         *       "electricRange": {
         *         "status": "OK",
         *         "value": 120,
         *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00",
         *         "unit": "km"
         *       },
         *       "chargerConnectionStatus": {
         *         "status": "OK",
         *         "value": "DISCONNECTED",
         *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00"
         *       },
         *       "chargingStatus": {
         *         "status": "OK",
         *         "value": "IDLE",
         *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00"
         *       },
         *       "chargingType": {
         *         "status": "OK",
         *         "value": "NONE",
         *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00"
         *       },
         *       "chargerPowerStatus": {
         *         "status": "OK",
         *         "value": "NO_POWER_AVAILABLE",
         *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00"
         *       },
         *       "estimatedChargingTimeToTargetBatteryChargeLevel": {
         *         "status": "OK",
         *         "value": 0,
         *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00",
         *         "unit": "minutes"
         *       },
         *       "targetBatteryChargeLevel": {
         *         "status": "OK",
         *         "value": 100,
         *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00",
         *         "unit": "percentage"
         *       },
         *       "chargingCurrentLimit": {
         *         "status": "OK",
         *         "value": 10,
         *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00",
         *         "unit": "ampere"
         *       },
         *       "chargingPower": {
         *         "status": "ERROR",
         *         "code": "NOT_SUPPORTED",
         *         "message": "Property is not supported by vehicle"
         *       }
         *     }
         */
        EnergyState: {
            batteryChargeLevel: components["schemas"]["ResultResourceInstanceFloatWithUnit"];
            electricRange: components["schemas"]["ResultResourceInstanceIntegerWithUnit"];
            chargerConnectionStatus: components["schemas"]["ResultResourceInstanceString"];
            chargingStatus: components["schemas"]["ResultResourceInstanceString"];
            chargingType: components["schemas"]["ResultResourceInstanceString"];
            chargerPowerStatus: components["schemas"]["ResultResourceInstanceString"];
            estimatedChargingTimeToTargetBatteryChargeLevel: components["schemas"]["ResultResourceInstanceIntegerWithUnit"];
            targetBatteryChargeLevel: components["schemas"]["ResultResourceInstanceIntegerWithUnit"];
            chargingCurrentLimit: components["schemas"]["ResultResourceInstanceIntegerWithUnit"];
            chargingPower: components["schemas"]["ResultResourceInstanceIntegerWithUnit"];
        };
        Capabilities: {
            getEnergyState: components["schemas"]["GetEnergyStateCapability"];
        };
        GetEnergyStateCapability: {
            batteryChargeLevel: components["schemas"]["Capability"];
            electricRange: components["schemas"]["Capability"];
            chargerConnectionStatus: components["schemas"]["Capability"];
            chargingSystemStatus: components["schemas"]["Capability"];
            chargingType: components["schemas"]["Capability"];
            chargerPowerStatus: components["schemas"]["Capability"];
            estimatedChargingTimeToTargetBatteryChargeLevel: components["schemas"]["Capability"];
            targetBatteryChargeLevel: components["schemas"]["Capability"];
            chargingCurrentLimit: components["schemas"]["Capability"];
            chargingPower: components["schemas"]["Capability"];
        } & components["schemas"]["Capability"];
        Capability: {
            isSupported: boolean;
        };
        ErrorResponse: {
            error: components["schemas"]["Error"];
        };
        DetailedErrorResponse: {
            error: components["schemas"]["DetailedError"];
        };
        Error: {
            /** @example ERROR_CODE */
            code: string;
            /** @example Error message. */
            message: string;
        };
        /**
         * @example {
         *       "code": "ERROR_CODE",
         *       "message": "Error message.",
         *       "details": [
         *         {
         *           "code": "DETAIL_ERROR_CODE",
         *           "message": "Detail error message."
         *         }
         *       ]
         *     }
         */
        DetailedError: {
            details?: components["schemas"]["Error"][];
        } & components["schemas"]["Error"];
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
    GetCapabilities: {
        parameters: {
            query?: never;
            header?: {
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationid"?: string;
                /** @description The distributed trace header containing the trace-id, and parent-id. */
                traceparent?: string;
            };
            path: {
                /** @description Vehicle identification number */
                vin: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "getEnergyState": {
                     *         "isSupported": true,
                     *         "batteryChargeLevel": {
                     *           "isSupported": true
                     *         },
                     *         "electricRange": {
                     *           "isSupported": true
                     *         },
                     *         "chargerConnectionStatus": {
                     *           "isSupported": true
                     *         },
                     *         "chargingSystemStatus": {
                     *           "isSupported": true
                     *         },
                     *         "chargingType": {
                     *           "isSupported": true
                     *         },
                     *         "chargerPowerStatus": {
                     *           "isSupported": true
                     *         },
                     *         "estimatedChargingTimeToTargetBatteryChargeLevel": {
                     *           "isSupported": true
                     *         },
                     *         "chargingCurrentLimit": {
                     *           "isSupported": true
                     *         },
                     *         "targetBatteryChargeLevel": {
                     *           "isSupported": true
                     *         },
                     *         "chargingPower": {
                     *           "isSupported": true
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Capabilities"];
                };
            };
            /** @description Request contains an unaccepted input */
            400: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Resource Forbidden */
            403: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Method not allowed */
            405: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Unsupported Media Type */
            415: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message."
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message."
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description GatewayTimeout */
            504: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message."
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    GetEnergyState: {
        parameters: {
            query?: never;
            header?: {
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationid"?: string;
                /** @description The distributed trace header containing the trace-id, and parent-id. */
                traceparent?: string;
            };
            path: {
                /** @description Vehicle identification number */
                vin: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "batteryChargeLevel": {
                     *         "status": "OK",
                     *         "value": 27,
                     *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00",
                     *         "unit": "percentage"
                     *       },
                     *       "electricRange": {
                     *         "status": "OK",
                     *         "value": 120,
                     *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00",
                     *         "unit": "km"
                     *       },
                     *       "chargerConnectionStatus": {
                     *         "status": "OK",
                     *         "value": "DISCONNECTED",
                     *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00"
                     *       },
                     *       "chargingStatus": {
                     *         "status": "OK",
                     *         "value": "IDLE",
                     *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00"
                     *       },
                     *       "chargingType": {
                     *         "status": "OK",
                     *         "value": "NONE",
                     *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00"
                     *       },
                     *       "chargerPowerStatus": {
                     *         "status": "OK",
                     *         "value": "NO_POWER_AVAILABLE",
                     *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00"
                     *       },
                     *       "estimatedChargingTimeToTargetBatteryChargeLevel": {
                     *         "status": "OK",
                     *         "value": 0,
                     *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00",
                     *         "unit": "minutes"
                     *       },
                     *       "targetBatteryChargeLevel": {
                     *         "status": "OK",
                     *         "value": 100,
                     *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00",
                     *         "unit": "percentage"
                     *       },
                     *       "chargingCurrentLimit": {
                     *         "status": "OK",
                     *         "value": 10,
                     *         "updatedAt": "2024-09-02T12:00:00.0000000+00:00",
                     *         "unit": "ampere"
                     *       },
                     *       "chargingPower": {
                     *         "status": "ERROR",
                     *         "code": "NOT_SUPPORTED",
                     *         "message": "Property is not supported by vehicle"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["EnergyState"];
                };
            };
            /** @description Request contains an unaccepted input */
            400: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Resource Forbidden */
            403: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Method not allowed */
            405: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Unsupported Media Type */
            415: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message.",
                     *         "details": [
                     *           {
                     *             "code": "DETAIL_ERROR_CODE",
                     *             "message": "Detail error message."
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DetailedErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message."
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message."
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description GatewayTimeout */
            504: {
                headers: {
                    /** @description The distributed trace header containing the trace-id, and parent-id. */
                    traceparent?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "ERROR_CODE",
                     *         "message": "Error message."
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}
