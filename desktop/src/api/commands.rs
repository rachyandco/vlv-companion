//! Command names, status buckets and user-facing strings, copied from the
//! phone app (`src/api/commands.ts`, `humanizeReason` in commands.tsx).

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub enum CommandName {
    Lock,
    LockReducedGuard,
    Unlock,
    Honk,
    Flash,
    HonkFlash,
    ClimatizationStart,
    ClimatizationStop,
    EngineStart,
    EngineStop,
}

impl CommandName {
    pub const ALL: [CommandName; 10] = [
        CommandName::Lock,
        CommandName::LockReducedGuard,
        CommandName::Unlock,
        CommandName::Honk,
        CommandName::Flash,
        CommandName::HonkFlash,
        CommandName::ClimatizationStart,
        CommandName::ClimatizationStop,
        CommandName::EngineStart,
        CommandName::EngineStop,
    ];

    pub fn path(&self) -> &'static str {
        match self {
            CommandName::Lock => "lock",
            CommandName::LockReducedGuard => "lock-reduced-guard",
            CommandName::Unlock => "unlock",
            CommandName::Honk => "honk",
            CommandName::Flash => "flash",
            CommandName::HonkFlash => "honk-flash",
            CommandName::ClimatizationStart => "climatization-start",
            CommandName::ClimatizationStop => "climatization-stop",
            CommandName::EngineStart => "engine-start",
            CommandName::EngineStop => "engine-stop",
        }
    }

    pub fn from_api_name(s: &str) -> Option<CommandName> {
        Some(match s {
            "LOCK" => CommandName::Lock,
            "LOCK_REDUCED_GUARD" => CommandName::LockReducedGuard,
            "UNLOCK" => CommandName::Unlock,
            "HONK" => CommandName::Honk,
            "FLASH" => CommandName::Flash,
            "HONK_AND_FLASH" => CommandName::HonkFlash,
            "CLIMATIZATION_START" => CommandName::ClimatizationStart,
            "CLIMATIZATION_STOP" => CommandName::ClimatizationStop,
            "ENGINE_START" => CommandName::EngineStart,
            "ENGINE_STOP" => CommandName::EngineStop,
            _ => return None,
        })
    }

    pub fn label(&self) -> &'static str {
        match self {
            CommandName::Lock => "Lock",
            CommandName::LockReducedGuard => "Lock (reduced guard)",
            CommandName::Unlock => "Unlock",
            CommandName::Honk => "Honk",
            CommandName::Flash => "Flash",
            CommandName::HonkFlash => "Honk and flash",
            CommandName::ClimatizationStart => "Start climatisation",
            CommandName::ClimatizationStop => "Stop climatisation",
            CommandName::EngineStart => "Start engine",
            CommandName::EngineStop => "Stop engine",
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub enum Bucket {
    Success,
    Pending,
    UserActionable,
    Failure,
}

pub fn bucket_of(status: &str) -> Bucket {
    match status {
        "SUCCESS" | "COMPLETED" | "DELIVERED" | "RUNNING" => Bucket::Success,
        "WAITING" | "SENT" | "VEHICLE_IN_SLEEP" | "CAR_IN_SLEEP_MODE" => Bucket::Pending,
        "UNABLE_TO_LOCK_DOOR_OPEN"
        | "UNLOCK_TIME_FRAME_PASSED"
        | "NOT_ALLOWED_PRIVACY_ENABLED"
        | "NOT_ALLOWED_WRONG_USAGE_MODE"
        | "NOT_SUPPORTED" => Bucket::UserActionable,
        _ => Bucket::Failure,
    }
}

fn friendly(status: &str) -> Option<&'static str> {
    Some(match status {
        "SUCCESS" | "COMPLETED" => "Done.",
        "DELIVERED" => "Sent to the car.",
        "RUNNING" => "Running.",
        "WAITING" => "Waiting on the car…",
        "SENT" => "Sent — waiting for confirmation…",
        "VEHICLE_IN_SLEEP" | "CAR_IN_SLEEP_MODE" => "Waking the car…",
        "UNABLE_TO_LOCK_DOOR_OPEN" => "A door is open — close it and try again.",
        "UNLOCK_TIME_FRAME_PASSED" => "Unlock window expired — tap unlock again.",
        "NOT_ALLOWED_PRIVACY_ENABLED" => "Privacy mode is on in the car.",
        "NOT_ALLOWED_WRONG_USAGE_MODE" => "Car is in a state that blocks this action.",
        "NOT_SUPPORTED" => "This car doesn't support that action.",
        "TIMEOUT" => "Timed out — try again.",
        "CONNECTION_FAILURE" => "Couldn't reach the car.",
        "CAR_TIMEOUT" => "Car didn't respond in time.",
        "CAR_ERROR" => "Car reported an error.",
        _ => return None,
    })
}

pub fn friendly_message(status: &str, fallback: Option<&str>) -> String {
    if let Some(f) = friendly(status) {
        return f.to_owned();
    }
    match fallback {
        Some(f) => f.to_owned(),
        None => status.replace('_', " ").to_lowercase(),
    }
}

pub fn humanize_reason(raw: &str) -> String {
    let upper = raw.to_uppercase();
    let has = |s: &str| upper.contains(s);
    if has("PRIVACY") {
        "Privacy mode is enabled in the car. Disable it from the central display → Settings → Privacy."
    } else if has("CAR_IN_USE") || has("IN_USE") {
        "The car is currently being driven. Commands are blocked while the vehicle is in motion."
    } else if has("SLEEP") {
        "The car is in deep sleep. It may take up to a minute to wake up — try again shortly."
    } else if has("NOT_REACHABLE") || has("NO_CONNECTION") {
        "The car is unreachable. Make sure it has cell coverage."
    } else if has("ENGINE_RUNNING") {
        "The engine is running. Some commands aren't available while driving."
    } else if has("CHARGING") {
        "The car is busy charging."
    } else if upper == "UNAVAILABLE" || upper == "NOT_AVAILABLE" {
        "The car is currently unavailable."
    } else {
        return raw.replace('_', " ").to_lowercase();
    }
    .to_owned()
}
