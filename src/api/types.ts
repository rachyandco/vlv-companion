/**
 * Hand-written types mirroring the three OpenAPI specs in the repo root.
 * Run `pnpm gen:types` to regenerate `types.gen.ts` for fully-precise paths.
 *
 * Convention: every Connected-Vehicle scalar is wrapped in a ResourceInstance,
 * every Energy field is a `Result*` discriminated union (`status: "OK" | "ERROR"`).
 */

export type Timestamp = string; // ISO 8601 with offset

export type ResourceInstanceString = { value: string; updatedAt: Timestamp };
export type ResourceInstanceInteger = { value: number; updatedAt: Timestamp };
export type ResourceInstanceFloat = { value: number; updatedAt: Timestamp };
export type ResourceInstanceWithUnit<V> = { value: V; updatedAt: Timestamp; unit: string };

// ===== Connected Vehicle v2 =====

export type VehicleListItem = { vin: string };
export type VehicleList = { data: VehicleListItem[] };

export type VehicleImages = {
  exteriorDefaultUrl?: string;
  exteriorImageUrl?: string;
  internalUrl?: string;
};

export type VehicleDescriptions = {
  model?: string;
  upholstery?: string;
  steering?: string;
};

export type VehicleDetails = {
  vin: string;
  modelYear: number;
  gearbox: string;
  fuelType: string;
  externalColour: string;
  batteryCapacityKWH?: number;
  images?: VehicleImages;
  descriptions?: VehicleDescriptions;
};
export type VehicleDetailsResponse = { data: VehicleDetails };

export type Doors = {
  centralLock?: ResourceInstanceString;
  frontLeftDoor?: ResourceInstanceString;
  frontRightDoor?: ResourceInstanceString;
  rearLeftDoor?: ResourceInstanceString;
  rearRightDoor?: ResourceInstanceString;
  hood?: ResourceInstanceString;
  tailgate?: ResourceInstanceString;
  tankLid?: ResourceInstanceString;
};
export type DoorsResponse = { data: Doors };

export type FuelAmount = { fuelAmount?: ResourceInstanceFloat };
export type FuelResponse = { data: FuelAmount };

export type OdometerValue = { odometer?: ResourceInstanceWithUnit<number> };
export type OdometerResponse = { data: OdometerValue };

export type TyrePressure = {
  frontLeft?: ResourceInstanceString;
  frontRight?: ResourceInstanceString;
  rearLeft?: ResourceInstanceString;
  rearRight?: ResourceInstanceString;
};
export type TyrePressureResponse = { data: TyrePressure };

export type Diagnostics = {
  serviceWarning?: ResourceInstanceString;
  serviceTrigger?: ResourceInstanceString;
  engineHoursToService?: ResourceInstanceInteger;
  distanceToService?: ResourceInstanceInteger;
  washerFluidLevelWarning?: ResourceInstanceString;
  timeToService?: ResourceInstanceInteger;
};
export type DiagnosticsResponse = { data: Diagnostics };

export type CommandAccessibility = {
  availabilityStatus?: {
    value: string;
    /** Present when value !== "AVAILABLE". Examples: CAR_IN_USE, NOT_REACHABLE. */
    unavailableReason?: string;
    timestamp?: Timestamp;
    updatedAt?: Timestamp;
  };
};
export type CommandAccessibilityResponse = { data: CommandAccessibility };

// Invoke responses
export type InvokeStatus =
  | "WAITING"
  | "RUNNING"
  | "COMPLETED"
  | "REJECTED"
  | "UNKNOWN"
  | "TIMEOUT"
  | "CONNECTION_FAILURE"
  | "VEHICLE_IN_SLEEP"
  | "UNLOCK_TIME_FRAME_PASSED"
  | "UNABLE_TO_LOCK_DOOR_OPEN"
  | "EXPIRED"
  | "SENT"
  | "NOT_SUPPORTED"
  | "CAR_IN_SLEEP_MODE"
  | "DELIVERED"
  | "DELIVERY_TIMEOUT"
  | "SUCCESS"
  | "CAR_TIMEOUT"
  | "CAR_ERROR"
  | "NOT_ALLOWED_PRIVACY_ENABLED"
  | "NOT_ALLOWED_WRONG_USAGE_MODE"
  | "INVOCATION_SPECIFIC_ERROR";

export type Invoke = { vin: string; invokeStatus: InvokeStatus; message?: string };
export type InvokeUnlock = Invoke & { readyToUnlock?: boolean; readyToUnlockUntil?: number };
export type InvokeResponse<T extends Invoke = Invoke> = { data: T };

export type CommandName =
  | "lock"
  | "lock-reduced-guard"
  | "unlock"
  | "honk"
  | "flash"
  | "honk-flash"
  | "climatization-start"
  | "climatization-stop"
  | "engine-start"
  | "engine-stop";

export type EngineStartRequest = { runtimeMinutes: number };

// ===== Energy v2 =====

export type EnergyOk<V> = { status: "OK"; value: V; updatedAt: Timestamp; unit?: string };
export type EnergyErr = { status: "ERROR"; code: string; message: string };
export type EnergyField<V> = EnergyOk<V> | EnergyErr;

export type EnergyState = {
  batteryChargeLevel: EnergyField<number>;
  electricRange: EnergyField<number>;
  chargerConnectionStatus: EnergyField<string>;
  chargingStatus: EnergyField<string>;
  chargingType: EnergyField<string>;
  estimatedChargingTimeToTargetBatteryChargeLevel: EnergyField<number>;
  targetBatteryChargeLevel: EnergyField<number>;
  chargingCurrentLimit: EnergyField<number>;
  chargingPower: EnergyField<number>;
};

export type EnergyCapability = { isSupported: boolean };
export type EnergyCapabilities = {
  getEnergyState: EnergyCapability & {
    batteryChargeLevel: EnergyCapability;
    electricRange: EnergyCapability;
    chargerConnectionStatus: EnergyCapability;
    chargingSystemStatus: EnergyCapability;
    chargingType: EnergyCapability;
    estimatedChargingTimeToTargetBatteryChargeLevel: EnergyCapability;
    targetBatteryChargeLevel: EnergyCapability;
    chargingCurrentLimit: EnergyCapability;
    chargingPower: EnergyCapability;
  };
};

// ===== Location v1 =====

export type LocationFeature = {
  type: string;
  properties?: Record<string, string>;
  geometry?: {
    type: string;
    coordinates: [number, number] | [number, number, number];
  };
};
export type LocationResponse = {
  status: number;
  operationId: string;
  // Volvo returns the envelope without a `data` payload when the vehicle
  // hasn't yet reported a position (also the 404 body shape).
  data?: LocationFeature;
};
