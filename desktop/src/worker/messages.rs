//! Messages between the UI thread and the worker thread.

use crate::api::commands::{Bucket, CommandName};
use crate::api::models::VehicleListItem;
use crate::api::overpass::ChargingStation;
use crate::config::Config;
use crate::state::cache::Resource;
use crate::state::schedule::Activity;

/// Requests the UI sends to the worker.
#[derive(Debug, Clone)]
pub enum UiRequest {
    StartSignIn {
        prompt_login: bool,
    },
    FinishSignIn {
        callback_url: String,
    },
    SignOut,
    SaveConfig(Config),
    SelectVehicle(String),
    Refresh {
        vin: String,
        force: bool,
    },
    LoadGarage,
    Command {
        vin: String,
        command: CommandName,
        runtime_minutes: Option<u8>,
    },
    FetchChargers {
        lat: f64,
        lon: f64,
    },
    Activity(Activity),
}

/// Events the worker sends back to the UI. Each one is followed by a repaint request.
#[derive(Debug, Clone)]
pub enum WorkerEvent {
    SignedOut,
    SignedIn,
    SignInError(String),
    AuthorizeUrlOpened(String),
    Garage(Vec<VehicleListItem>),
    GarageError(String),
    Resource {
        vin: String,
        resource: Resource,
        value: Result<serde_json::Value, String>,
    },
    CommandResult {
        vin: String,
        command: CommandName,
        status: String,
        message: Option<String>,
        bucket: Bucket,
        ready_to_unlock_until: Option<i64>,
    },
    CommandError {
        command: CommandName,
        message: String,
    },
    Chargers(Result<Vec<ChargingStation>, String>),
    SessionExpired(String),
    Offline(bool),
    ClimateStarted {
        vin: String,
        at_ms: i64,
    },
    ClimateStopped {
        vin: String,
    },
}
