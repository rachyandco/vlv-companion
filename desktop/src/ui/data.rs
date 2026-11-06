//! Typed per-vehicle data built from the worker's `Resource` events.

use std::collections::HashMap;
use std::time::Instant;

use serde::de::DeserializeOwned;
use serde_json::Value;

use crate::api::models::{
    Brakes, CommandAccessibility, CommandListItem, Diagnostics, Doors, EnergyCapabilities,
    EnergyState, EngineDiagnostics, EngineStatus, Envelope, ExteriorWarnings, Fuel,
    LocationResponse, Odometer, ParsedLocation, Statistics, Tyres, VehicleDetails, Windows,
};
use crate::state::cache::Resource;

/// Everything the UI knows about one vehicle. Values stay in place when a
/// later fetch fails, so the screen keeps showing the last good data.
#[derive(Debug, Default, Clone)]
pub struct VehicleData {
    pub details: Option<VehicleDetails>,
    pub doors: Option<Doors>,
    pub windows: Option<Windows>,
    pub fuel: Option<Fuel>,
    pub odometer: Option<Odometer>,
    pub tyres: Option<Tyres>,
    pub diagnostics: Option<Diagnostics>,
    pub accessibility: Option<CommandAccessibility>,
    pub engine_status: Option<EngineStatus>,
    pub engine_diag: Option<EngineDiagnostics>,
    pub brakes: Option<Brakes>,
    pub warnings: Option<ExteriorWarnings>,
    pub statistics: Option<Statistics>,
    pub command_list: Option<Vec<CommandListItem>>,
    pub energy_state: Option<EnergyState>,
    pub energy_caps: Option<EnergyCapabilities>,
    pub location: Option<ParsedLocation>,
    /// Last error per resource; cleared by the next success.
    pub errors: HashMap<Resource, String>,
    pub updated_at: HashMap<Resource, Instant>,
    /// Time of the newest successful fetch of any resource.
    pub last_updated: Option<Instant>,
}

impl VehicleData {
    /// Stores one worker result. A body that does not parse counts as an
    /// error; an error keeps the previous value so it can be shown greyed.
    pub fn apply(
        &mut self,
        resource: Resource,
        value: Result<serde_json::Value, String>,
        now: Instant,
    ) {
        match value.and_then(|v| self.store(resource, v)) {
            Ok(()) => {
                self.errors.remove(&resource);
                self.updated_at.insert(resource, now);
                self.last_updated = Some(self.last_updated.map_or(now, |t| t.max(now)));
            }
            Err(e) => {
                self.errors.insert(resource, e);
            }
        }
    }

    fn store(&mut self, resource: Resource, v: Value) -> Result<(), String> {
        match resource {
            Resource::Details => self.details = Some(enveloped(v)?),
            Resource::Doors => self.doors = Some(enveloped(v)?),
            Resource::Windows => self.windows = Some(enveloped(v)?),
            Resource::Fuel => self.fuel = Some(enveloped(v)?),
            Resource::Odometer => self.odometer = Some(enveloped(v)?),
            Resource::Tyres => self.tyres = Some(enveloped(v)?),
            Resource::Diagnostics => self.diagnostics = Some(enveloped(v)?),
            Resource::Accessibility => self.accessibility = Some(enveloped(v)?),
            Resource::EngineStatus => self.engine_status = Some(enveloped(v)?),
            Resource::EngineDiag => self.engine_diag = Some(enveloped(v)?),
            Resource::Brakes => self.brakes = Some(enveloped(v)?),
            Resource::Warnings => self.warnings = Some(enveloped(v)?),
            Resource::Statistics => self.statistics = Some(enveloped(v)?),
            Resource::CommandList => self.command_list = Some(enveloped(v)?),
            Resource::EnergyState => self.energy_state = Some(bare_or_data(v)?),
            Resource::EnergyCaps => self.energy_caps = Some(bare_or_data(v)?),
            Resource::Location => {
                let r: LocationResponse = parse(v)?;
                self.location = Some(
                    r.parsed()
                        .ok_or_else(|| "The API returned no position.".to_string())?,
                );
            }
        }
        Ok(())
    }
}

fn parse<T: DeserializeOwned>(v: Value) -> Result<T, String> {
    serde_json::from_value(v).map_err(|e| format!("Unexpected response: {e}"))
}

/// Connected-vehicle endpoints wrap their payload in `{ "data": … }`.
fn enveloped<T: DeserializeOwned>(v: Value) -> Result<T, String> {
    parse::<Envelope<T>>(v)?
        .data
        .ok_or_else(|| "The API returned no data.".to_string())
}

/// The energy endpoints answer with the bare object; accept an envelope too.
fn bare_or_data<T: DeserializeOwned>(v: Value) -> Result<T, String> {
    match v {
        Value::Object(mut m) if m.get("data").is_some_and(Value::is_object) => {
            parse(m.remove("data").unwrap_or_default())
        }
        other => parse(other),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn doors_value_converts_into_typed_doors() {
        let mut d = VehicleData::default();
        let now = Instant::now();
        d.apply(
            Resource::Doors,
            Ok(json!({"status":200,"data":{"centralLock":{"value":"LOCKED"},"tailgate":{"value":"OPEN"}}})),
            now,
        );
        let doors = d.doors.as_ref().expect("doors parsed");
        assert_eq!(doors.central_lock.as_ref().unwrap().value, "LOCKED");
        assert_eq!(doors.tailgate.as_ref().unwrap().value, "OPEN");
        assert_eq!(d.updated_at.get(&Resource::Doors), Some(&now));
        assert_eq!(d.last_updated, Some(now));
        assert!(d.errors.is_empty());
    }

    #[test]
    fn err_value_lands_in_errors_and_keeps_old_data() {
        let mut d = VehicleData::default();
        let now = Instant::now();
        d.apply(
            Resource::Doors,
            Ok(json!({"data":{"centralLock":{"value":"LOCKED"}}})),
            now,
        );
        d.apply(Resource::Doors, Err("offline".into()), now);
        assert_eq!(
            d.errors.get(&Resource::Doors).map(String::as_str),
            Some("offline")
        );
        assert!(d.doors.is_some());
    }

    #[test]
    fn energy_state_accepts_bare_and_enveloped_bodies() {
        let mut d = VehicleData::default();
        let now = Instant::now();
        d.apply(
            Resource::EnergyState,
            Ok(json!({"batteryChargeLevel":{"status":"OK","value":44}})),
            now,
        );
        assert!(d
            .energy_state
            .as_ref()
            .unwrap()
            .battery_charge_level
            .is_some());
        let mut e = VehicleData::default();
        e.apply(
            Resource::EnergyState,
            Ok(json!({"data":{"batteryChargeLevel":{"status":"OK","value":44}}})),
            now,
        );
        assert!(e
            .energy_state
            .as_ref()
            .unwrap()
            .battery_charge_level
            .is_some());
    }

    #[test]
    fn unparseable_body_is_an_error() {
        let mut d = VehicleData::default();
        d.apply(
            Resource::Odometer,
            Ok(json!({"data":{"odometer":{"value":"abc"}}})),
            Instant::now(),
        );
        assert!(d.odometer.is_none());
        assert!(d.errors.contains_key(&Resource::Odometer));
    }

    #[test]
    fn location_is_parsed_to_coordinates() {
        let mut d = VehicleData::default();
        d.apply(
            Resource::Location,
            Ok(json!({"data":{"geometry":{"coordinates":[11.9,57.7,0.0]},"properties":{"heading":"90"}}})),
            Instant::now(),
        );
        let l = d.location.unwrap();
        assert_eq!(
            (l.longitude, l.latitude, l.heading),
            (11.9, 57.7, Some(90.0))
        );
    }
}
