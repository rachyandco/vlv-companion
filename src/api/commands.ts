import type { KyInstance } from "ky";

import type {
  CommandName,
  EngineStartRequest,
  Invoke,
  InvokeResponse,
  InvokeStatus,
  InvokeUnlock,
} from "./types";

const PREFIX = "connected-vehicle/v2";

export async function invokeCommand(
  api: KyInstance,
  vin: string,
  command: CommandName,
  body?: EngineStartRequest,
): Promise<InvokeResponse<Invoke | InvokeUnlock>> {
  // Volvo's spec documents the request body for empty-body commands as
  // `application/json: {}` — sending an actual `{}` (not omitted) is required.
  return api
    .post(`${PREFIX}/vehicles/${vin}/commands/${command}`, { json: body ?? {} })
    .json<InvokeResponse<Invoke | InvokeUnlock>>();
}

export type InvokeBucket = "success" | "pending" | "user-actionable" | "failure";

const BUCKETS: Record<InvokeStatus, InvokeBucket> = {
  SUCCESS: "success",
  COMPLETED: "success",
  DELIVERED: "success",
  RUNNING: "success",

  WAITING: "pending",
  SENT: "pending",
  VEHICLE_IN_SLEEP: "pending",
  CAR_IN_SLEEP_MODE: "pending",

  UNABLE_TO_LOCK_DOOR_OPEN: "user-actionable",
  UNLOCK_TIME_FRAME_PASSED: "user-actionable",
  NOT_ALLOWED_PRIVACY_ENABLED: "user-actionable",
  NOT_ALLOWED_WRONG_USAGE_MODE: "user-actionable",
  NOT_SUPPORTED: "user-actionable",

  REJECTED: "failure",
  UNKNOWN: "failure",
  TIMEOUT: "failure",
  CONNECTION_FAILURE: "failure",
  EXPIRED: "failure",
  DELIVERY_TIMEOUT: "failure",
  CAR_TIMEOUT: "failure",
  CAR_ERROR: "failure",
  INVOCATION_SPECIFIC_ERROR: "failure",
};

export function bucketOf(status: InvokeStatus): InvokeBucket {
  return BUCKETS[status] ?? "failure";
}

const FRIENDLY: Partial<Record<InvokeStatus, string>> = {
  SUCCESS: "Done.",
  COMPLETED: "Done.",
  DELIVERED: "Sent to the car.",
  RUNNING: "Running.",
  WAITING: "Waiting on the car…",
  SENT: "Sent — waiting for confirmation…",
  VEHICLE_IN_SLEEP: "Waking the car…",
  CAR_IN_SLEEP_MODE: "Waking the car…",
  UNABLE_TO_LOCK_DOOR_OPEN: "A door is open — close it and try again.",
  UNLOCK_TIME_FRAME_PASSED: "Unlock window expired — tap unlock again.",
  NOT_ALLOWED_PRIVACY_ENABLED: "Privacy mode is on in the car.",
  NOT_ALLOWED_WRONG_USAGE_MODE: "Car is in a state that blocks this action.",
  NOT_SUPPORTED: "This car doesn't support that action.",
  TIMEOUT: "Timed out — try again.",
  CONNECTION_FAILURE: "Couldn't reach the car.",
  CAR_TIMEOUT: "Car didn't respond in time.",
  CAR_ERROR: "Car reported an error.",
};

export function friendlyMessage(status: InvokeStatus, fallback?: string): string {
  return FRIENDLY[status] ?? fallback ?? status.replaceAll("_", " ").toLowerCase();
}
