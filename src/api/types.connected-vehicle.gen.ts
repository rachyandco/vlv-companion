/* eslint-disable */
// AUTO-GENERATED — run `pnpm gen:types` to regenerate.

// ConnectedVehicle — bare openapi-typescript output

export type paths = {
    "/vehicles/{vin}/commands/unlock": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Unlock doors
         * @description Used to send an unlock command to the vehicle.
         */
        post: operations["InvokeUnlock"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/commands/lock": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Lock doors
         * @description Used to send a lock command to the vehicle.
         */
        post: operations["InvokeLock"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/commands/honk": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Honk horn
         * @description Used to send a honk command to the vehicle.
         */
        post: operations["InvokeHonk"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/commands/flash": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Flash exterior lights
         * @description Used to send a flash command to the vehicle.
         */
        post: operations["InvokeFlash"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/commands/engine-stop": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Stop Engine
         * @description Used to send a engine stop command to the vehicle.
         */
        post: operations["InvokeEngineStop"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/commands/engine-start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Start Engine
         * @description Command used to start the engine of the vehicle. To check which vehicles support this function please call [List commands](/apis/connected-vehicle/endpoints/commands/#list-commands).
         */
        post: operations["InvokeEngineStart"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/commands/climatization-stop": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Stop climatisation
         * @description Used to send a climatisation stop command to the vehicle.
         */
        post: operations["InvokeClimatizationStop"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/commands/climatization-start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Start climatisation
         * @description Used to send a climatisation start command to the vehicle.
         */
        post: operations["InvokeClimatizationStart"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List vehicles
         * @description Provides all current valid relations between a Volvo Id (user) and its connected vehicles. Returns a list of VINs. Required Scope(s): conve:vehicle_relation
         */
        get: operations["GetVehicleList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get vehicle details
         * @description Provides details about the vehicle such as model, model-year etc. Required Scope(s): conve:vehicle_relation
         */
        get: operations["GetVehicleDetails"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/windows": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get window status
         * @description Vehicle's Latest Window Status Values
         */
        get: operations["GetWindowStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/warnings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get warnings
         * @description Vehicle's Latest Warning Values like bulb failure
         */
        get: operations["GetWarnings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/tyres": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get tyres status
         * @description Endpoint used to get vehicle’s latest tyre status values.
         */
        get: operations["GetTyrePressureValues"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/statistics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get statistics
         * @description Endpoint used to get vehicle values grouped under the category of statistics. The latest retrieved value is presented upon a successful execution.
         */
        get: operations["GetStatistics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/odometer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get odometer value
         * @description Vehicle's latest odometer value in km
         */
        get: operations["GetOdometer"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/fuel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get fuel amount
         * @description Vehicle's Latest Fuel Amount in Liters
         */
        get: operations["GetFuelAmount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/engine": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get engine diagnostic values
         * @description Vehicle's Latest Engine Diagnostic Values such as engine-coolant-level, oil level etc.
         */
        get: operations["GetEngineDiagnostics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/doors": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get door and lock status
         * @description Vehicle's Door and Lock Status Values
         */
        get: operations["GetDoorAndLockStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/diagnostics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get diagnostic values
         * @description Vehicle's Latest Diagnostic Values
         */
        get: operations["GetDiagnostics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/commands": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List commands
         * @description Used to list the commands which can be sent to the vehicle
         */
        get: operations["GetCommandList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/command-accessibility": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get accessibility status
         * @description Check if vehicle is accessible to send invocation commands. If not available a unavailable reason is displayed.
         */
        get: operations["GetCommandsAccessibility"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/brakes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get brake fluid level
         * @description Vehicle's Latest Brake Status Values like brake fluid level
         */
        get: operations["GetBrakeStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/engine-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get engine status
         * @description Vehicle's latest engine status value.
         */
        get: operations["GetEngineStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/commands/lock-reduced-guard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Lock doors with reduced guard
         * @description Used to send a lock with reduced guard command to the vehicle.
         */
        post: operations["InvokeLockReducedGuard"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vehicles/{vin}/commands/honk-flash": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Honk and Flash
         * @description Used to send a honk & flash command to the vehicle.
         */
        post: operations["InvokeHonkFlash"];
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
            error?: components["schemas"]["Error"];
        };
        InvokeUnlock: {
            vin?: string;
            /** @enum {string} */
            invokeStatus?: "WAITING" | "RUNNING" | "COMPLETED" | "REJECTED" | "UNKNOWN" | "TIMEOUT" | "CONNECTION_FAILURE" | "VEHICLE_IN_SLEEP" | "UNLOCK_TIME_FRAME_PASSED" | "UNABLE_TO_LOCK_DOOR_OPEN" | "EXPIRED" | "SENT" | "NOT_SUPPORTED" | "CAR_IN_SLEEP_MODE" | "DELIVERED" | "DELIVERY_TIMEOUT" | "SUCCESS" | "CAR_TIMEOUT" | "CAR_ERROR" | "NOT_ALLOWED_PRIVACY_ENABLED" | "NOT_ALLOWED_WRONG_USAGE_MODE" | "INVOCATION_SPECIFIC_ERROR";
            message?: string;
            readyToUnlock?: boolean;
            /** Format: int64 */
            readyToUnlockUntil?: number;
        };
        Invoke: {
            vin?: string;
            /** @enum {string} */
            invokeStatus?: "WAITING" | "RUNNING" | "COMPLETED" | "REJECTED" | "UNKNOWN" | "TIMEOUT" | "CONNECTION_FAILURE" | "VEHICLE_IN_SLEEP" | "UNLOCK_TIME_FRAME_PASSED" | "UNABLE_TO_LOCK_DOOR_OPEN" | "EXPIRED" | "SENT" | "NOT_SUPPORTED" | "CAR_IN_SLEEP_MODE" | "DELIVERED" | "DELIVERY_TIMEOUT" | "SUCCESS" | "CAR_TIMEOUT" | "CAR_ERROR" | "NOT_ALLOWED_PRIVACY_ENABLED" | "NOT_ALLOWED_WRONG_USAGE_MODE" | "INVOCATION_SPECIFIC_ERROR";
            message?: string;
        };
        EngineStartRequest: {
            /**
             * Format: int32
             * @description Time in minutes engine will be running. Can be set to maximum 15 minutes
             */
            runtimeMinutes?: number;
        };
        VehicleList: {
            data?: components["schemas"]["VehicleVin"][];
        };
        VehicleVin: {
            vin?: string;
        };
        Descriptions: {
            model?: string;
            upholstery?: string;
            steering?: string;
        };
        Images: {
            exteriorImageUrl?: string;
            internalImageUrl?: string;
        };
        VehicleDetails: {
            vin?: string;
            /** Format: int32 */
            modelYear?: number;
            gearbox?: string;
            fuelType?: string;
            externalColour?: string;
            /** Format: float */
            batteryCapacityKWH?: number;
            images?: components["schemas"]["Images"];
            descriptions?: components["schemas"]["Descriptions"];
        };
        ResourceInstanceString: {
            value?: string;
            unit?: string;
            /** Format: date-time */
            timestamp?: string;
        };
        Windows: {
            frontLeftWindow?: components["schemas"]["ResourceInstanceString"];
            frontRightWindow?: components["schemas"]["ResourceInstanceString"];
            rearLeftWindow?: components["schemas"]["ResourceInstanceString"];
            rearRightWindow?: components["schemas"]["ResourceInstanceString"];
            sunroof?: components["schemas"]["ResourceInstanceString"];
        };
        ExteriorWarning: {
            brakeLightCenterWarning?: components["schemas"]["ResourceInstanceString"];
            brakeLightLeftWarning?: components["schemas"]["ResourceInstanceString"];
            brakeLightRightWarning?: components["schemas"]["ResourceInstanceString"];
            fogLightFrontWarning?: components["schemas"]["ResourceInstanceString"];
            fogLightRearWarning?: components["schemas"]["ResourceInstanceString"];
            positionLightFrontLeftWarning?: components["schemas"]["ResourceInstanceString"];
            positionLightFrontRightWarning?: components["schemas"]["ResourceInstanceString"];
            positionLightRearLeftWarning?: components["schemas"]["ResourceInstanceString"];
            positionLightRearRightWarning?: components["schemas"]["ResourceInstanceString"];
            highBeamLeftWarning?: components["schemas"]["ResourceInstanceString"];
            highBeamRightWarning?: components["schemas"]["ResourceInstanceString"];
            lowBeamLeftWarning?: components["schemas"]["ResourceInstanceString"];
            lowBeamRightWarning?: components["schemas"]["ResourceInstanceString"];
            daytimeRunningLightLeftWarning?: components["schemas"]["ResourceInstanceString"];
            daytimeRunningLightRightWarning?: components["schemas"]["ResourceInstanceString"];
            turnIndicationFrontLeftWarning?: components["schemas"]["ResourceInstanceString"];
            turnIndicationFrontRightWarning?: components["schemas"]["ResourceInstanceString"];
            turnIndicationRearLeftWarning?: components["schemas"]["ResourceInstanceString"];
            turnIndicationRearRightWarning?: components["schemas"]["ResourceInstanceString"];
            registrationPlateLightWarning?: components["schemas"]["ResourceInstanceString"];
            sideMarkLightsWarning?: components["schemas"]["ResourceInstanceString"];
            hazardLightsWarning?: components["schemas"]["ResourceInstanceString"];
            reverseLightsWarning?: components["schemas"]["ResourceInstanceString"];
        };
        RInstance: {
            value?: string;
            /** Format: date-time */
            timestamp?: string;
        };
        TyrePressure: {
            frontLeft?: components["schemas"]["RInstance"];
            frontRight?: components["schemas"]["RInstance"];
            rearLeft?: components["schemas"]["RInstance"];
            rearRight?: components["schemas"]["RInstance"];
        };
        TyrePressureResponse: {
            /** Format: int32 */
            status?: number;
            operationId?: string;
            data?: components["schemas"]["TyrePressure"];
        };
        RInstanceWithUnit: {
            value?: string;
            /** Format: date-time */
            timestamp?: string;
            unit?: string;
        };
        StatisticResponse: {
            /** Format: int32 */
            status?: number;
            operationId?: string;
            data?: components["schemas"]["StatisticVals"];
        };
        StatisticVals: {
            averageSpeed?: components["schemas"]["RInstanceWithUnit"];
            distanceToEmpty?: components["schemas"]["RInstanceWithUnit"];
            tripMeter1?: components["schemas"]["RInstanceWithUnit"];
            tripMeter2?: components["schemas"]["RInstanceWithUnit"];
            averageFuelConsumption?: components["schemas"]["RInstanceWithUnit"];
        };
        OdometerValue: {
            odometer?: components["schemas"]["ResourceInstanceInteger"];
        };
        ResourceInstanceInteger: {
            /** Format: int32 */
            value?: number;
            unit?: string;
            /** Format: date-time */
            timestamp?: string;
        };
        FuelAmount: {
            fuelAmount?: components["schemas"]["ResourceInstanceFloat"];
        };
        ResourceInstanceFloat: {
            /** Format: float */
            value?: number;
            unit?: string;
            /** Format: date-time */
            timestamp?: string;
        };
        EngineDiagnostics: {
            oilLevelWarning?: components["schemas"]["ResourceInstanceString"];
            engineCoolantLevelWarning?: components["schemas"]["ResourceInstanceString"];
        };
        EngineStatus: {
            engineStatus?: components["schemas"]["ResourceInstanceString"];
        };
        Doors: {
            centralLock?: components["schemas"]["ResourceInstanceString"];
            frontLeftDoor?: components["schemas"]["ResourceInstanceString"];
            frontRightDoor?: components["schemas"]["ResourceInstanceString"];
            rearLeftDoor?: components["schemas"]["ResourceInstanceString"];
            rearRightDoor?: components["schemas"]["ResourceInstanceString"];
            hood?: components["schemas"]["ResourceInstanceString"];
            tailgate?: components["schemas"]["ResourceInstanceString"];
            tankLid?: components["schemas"]["ResourceInstanceString"];
        };
        Diagnostics: {
            serviceWarning?: components["schemas"]["ResourceInstanceString"];
            serviceTrigger?: components["schemas"]["ResourceInstanceString"];
            engineHoursToService?: components["schemas"]["ResourceInstanceInteger"];
            distanceToService?: components["schemas"]["ResourceInstanceInteger"];
            washerFluidLevelWarning?: components["schemas"]["ResourceInstanceString"];
            timeToService?: components["schemas"]["ResourceInstanceInteger"];
        };
        CommandListItem: {
            /** @enum {string} */
            command?: "HONK_AND_FLASH" | "HONK" | "FLASH" | "LOCK" | "LOCK_REDUCED_GUARD" | "UNLOCK" | "ENGINE_START" | "ENGINE_STOP" | "CLIMATIZATION_START" | "CLIMATIZATION_STOP" | "SEND_NAVI_POI";
            href?: string;
        };
        CommandListResponse: {
            /** Format: int32 */
            status?: number;
            operationId?: string;
            data?: components["schemas"]["CommandListItem"][];
        };
        CommandAccessibility: {
            data?: {
                availabilityStatus?: {
                    value: string;
                    unavailableReason?: string;
                    /** Format: date-time */
                    timestamp: string;
                };
            };
        };
        BrakeStatus: {
            brakeFluidLevelWarning?: components["schemas"]["ResourceInstanceString"];
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
    InvokeUnlock: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
                vin: string;
            };
            cookie?: never;
        };
        /** @description Empty request body for this command. */
        requestBody?: {
            content: {
                "application/json": unknown;
            };
        };
        responses: {
            /** @description Successful */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "vin": "string",
                     *       "invokeStatus": "WAITING",
                     *       "message": "string",
                     *       "readyToUnlock": true,
                     *       "readyToUnlockUntil": 0
                     *     }
                     */
                    "application/json": components["schemas"]["InvokeUnlock"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    InvokeLock: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
                vin: string;
            };
            cookie?: never;
        };
        /** @description Empty request body for this command. */
        requestBody?: {
            content: {
                "application/json": unknown;
            };
        };
        responses: {
            /** @description Successful */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "vin": "string",
                     *       "invokeStatus": "WAITING",
                     *       "message": "string"
                     *     }
                     */
                    "application/json": components["schemas"]["Invoke"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    InvokeHonk: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
                vin: string;
            };
            cookie?: never;
        };
        /** @description Empty request body for this command. */
        requestBody?: {
            content: {
                "application/json": unknown;
            };
        };
        responses: {
            /** @description Successful */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "vin": "string",
                     *       "invokeStatus": "WAITING",
                     *       "message": "string"
                     *     }
                     */
                    "application/json": components["schemas"]["Invoke"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    InvokeFlash: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
                vin: string;
            };
            cookie?: never;
        };
        /** @description Empty request body for this command. */
        requestBody?: {
            content: {
                "application/json": unknown;
            };
        };
        responses: {
            /** @description Successful */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "vin": "string",
                     *       "invokeStatus": "WAITING",
                     *       "message": "string"
                     *     }
                     */
                    "application/json": components["schemas"]["Invoke"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    InvokeEngineStop: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
                vin: string;
            };
            cookie?: never;
        };
        /** @description Empty request body for this command. */
        requestBody?: {
            content: {
                "application/json": unknown;
            };
        };
        responses: {
            /** @description Successful */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "vin": "string",
                     *       "invokeStatus": "WAITING",
                     *       "message": "string"
                     *     }
                     */
                    "application/json": components["schemas"]["Invoke"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    InvokeEngineStart: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
                vin: string;
            };
            cookie?: never;
        };
        /** @description The minimum runtimeMinutes value is 0 and maximum 15. */
        requestBody?: {
            content: {
                /**
                 * @example {
                 *       "runtimeMinutes": 0
                 *     }
                 */
                "application/json": components["schemas"]["EngineStartRequest"];
            };
        };
        responses: {
            /** @description Successful */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "vin": "string",
                     *       "invokeStatus": "WAITING",
                     *       "message": "string"
                     *     }
                     */
                    "application/json": components["schemas"]["Invoke"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    InvokeClimatizationStop: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
                vin: string;
            };
            cookie?: never;
        };
        /** @description Empty request body for this command. */
        requestBody?: {
            content: {
                "application/json": unknown;
            };
        };
        responses: {
            /** @description Successful */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "vin": "string",
                     *       "invokeStatus": "WAITING",
                     *       "message": "string"
                     *     }
                     */
                    "application/json": components["schemas"]["Invoke"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    InvokeClimatizationStart: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
                vin: string;
            };
            cookie?: never;
        };
        /** @description Empty request body for this command. */
        requestBody?: {
            content: {
                "application/json": unknown;
            };
        };
        responses: {
            /** @description Successful */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "vin": "string",
                     *       "invokeStatus": "WAITING",
                     *       "message": "string"
                     *     }
                     */
                    "application/json": components["schemas"]["Invoke"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetVehicleList: {
        parameters: {
            query?: never;
            header?: {
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path?: never;
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
                     *       "data": [
                     *         {
                     *           "vin": "string"
                     *         },
                     *         {
                     *           "vin": "string"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["VehicleList"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetVehicleDetails: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *       "vin": "string",
                     *       "modelYear": 0,
                     *       "gearbox": "string",
                     *       "fuelType": "string",
                     *       "externalColour": "string",
                     *       "batteryCapacityKWH": 0,
                     *       "images": {
                     *         "exteriorImageUrl": "string",
                     *         "internalImageUrl": "string"
                     *       },
                     *       "descriptions": {
                     *         "model": "string",
                     *         "upholstery": "string",
                     *         "steering": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["VehicleDetails"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetWindowStatus: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *       "frontLeftWindow": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "frontRightWindow": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "rearLeftWindow": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "rearRightWindow": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "sunroof": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Windows"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetWarnings: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *       "brakeLightCenterWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "brakeLightLeftWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "brakeLightRightWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "fogLightFrontWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "fogLightRearWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "positionLightFrontLeftWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "positionLightFrontRightWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "positionLightRearLeftWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "positionLightRearRightWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "highBeamLeftWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "highBeamRightWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "lowBeamLeftWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "lowBeamRightWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "daytimeRunningLightLeftWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "daytimeRunningLightRightWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "turnIndicationFrontLeftWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "turnIndicationFrontRightWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "turnIndicationRearLeftWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "turnIndicationRearRightWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "registrationPlateLightWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "sideMarkLightsWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "hazardLightsWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "reverseLightsWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ExteriorWarning"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetTyrePressureValues: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *         "frontLeft": {
                     *           "value": "string",
                     *           "timestamp": "string"
                     *         },
                     *         "frontRight": {
                     *           "value": "string",
                     *           "timestamp": "string"
                     *         },
                     *         "rearLeft": {
                     *           "value": "string",
                     *           "timestamp": "string"
                     *         },
                     *         "rearRight": {
                     *           "value": "string",
                     *           "timestamp": "string"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["TyrePressureResponse"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetStatistics: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *         "averageSpeed": {
                     *           "value": "string",
                     *           "timestamp": "string",
                     *           "unit": "string"
                     *         },
                     *         "distanceToEmpty": {
                     *           "value": "string",
                     *           "timestamp": "string",
                     *           "unit": "string"
                     *         },
                     *         "tripMeter1": {
                     *           "value": "string",
                     *           "timestamp": "string",
                     *           "unit": "string"
                     *         },
                     *         "tripMeter2": {
                     *           "value": "string",
                     *           "timestamp": "string",
                     *           "unit": "string"
                     *         },
                     *         "averageFuelConsumption": {
                     *           "value": "string",
                     *           "timestamp": "string",
                     *           "unit": "string"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["StatisticResponse"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetOdometer: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *       "odometer": {
                     *         "value": 0,
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["OdometerValue"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetFuelAmount: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *       "fuelAmount": {
                     *         "value": 0,
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["FuelAmount"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetEngineDiagnostics: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *       "oilLevelWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "engineCoolantLevelWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["EngineDiagnostics"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetDoorAndLockStatus: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *       "centralLock": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "frontLeftDoor": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "frontRightDoor": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "rearLeftDoor": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "rearRightDoor": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "hood": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "tailgate": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "tankLid": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Doors"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetDiagnostics: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *       "serviceWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "serviceTrigger": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "engineHoursToService": {
                     *         "value": 0,
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "distanceToService": {
                     *         "value": 0,
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "washerFluidLevelWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       },
                     *       "timeToService": {
                     *         "value": 0,
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Diagnostics"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetCommandList: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *       "data": [
                     *         {
                     *           "command": "HONK_AND_FLASH",
                     *           "href": "string"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["CommandListResponse"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetCommandsAccessibility: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *       "data": {
                     *         "availabilityStatus": {
                     *           "value": "string",
                     *           "unavailableReason": "string",
                     *           "timestamp": "string"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["CommandAccessibility"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetBrakeStatus: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *       "brakeFluidLevelWarning": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["BrakeStatus"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    GetEngineStatus: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
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
                     *       "engineStatus": {
                     *         "value": "string",
                     *         "unit": "string",
                     *         "timestamp": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["EngineStatus"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    InvokeLockReducedGuard: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
                vin: string;
            };
            cookie?: never;
        };
        /** @description Empty request body for this command. */
        requestBody?: {
            content: {
                "application/json": unknown;
            };
        };
        responses: {
            /** @description Successful */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "vin": "string",
                     *       "invokeStatus": "WAITING",
                     *       "message": "string"
                     *     }
                     */
                    "application/json": components["schemas"]["Invoke"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
    InvokeHonkFlash: {
        parameters: {
            query?: never;
            header?: {
                traceparent?: string;
                /** @description A transaction unique id which can be used do identify the transaction in integrated systems */
                "vcc-api-operationId"?: string;
            };
            path: {
                /**
                 * @description Vehicle identifier (VIN)
                 * @example YV1CT9551B1570982
                 */
                vin: string;
            };
            cookie?: never;
        };
        /** @description Empty request body for this command. */
        requestBody?: {
            content: {
                "application/json": unknown;
            };
        };
        responses: {
            /** @description Successful */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "vin": "string",
                     *       "invokeStatus": "WAITING",
                     *       "message": "string"
                     *     }
                     */
                    "application/json": components["schemas"]["Invoke"];
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Resource forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Method Not Allowed */
            405: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invocation specific error, due to a conflict with the vehicle */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "message": "string",
                     *         "description": "string"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Gateway Timeout */
            504: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
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
