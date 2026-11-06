//! Serde models for the Volvo connected-vehicle, energy and location APIs.
//! Field names mirror the wire format (camelCase); unknown fields are ignored.

use std::collections::BTreeMap;
use std::fmt::Display;

use serde::{Deserialize, Deserializer};
use serde_json::Value;

/// Conversion used by `Resource<T>` so numbers may arrive as numeric strings.
pub trait Lenient: Sized {
    fn from_json(v: Value) -> Result<Self, String>;
}

impl Lenient for f64 {
    fn from_json(v: Value) -> Result<Self, String> {
        match v {
            Value::Number(n) => n.as_f64().ok_or_else(|| format!("invalid number {n}")),
            Value::String(s) => s
                .trim()
                .parse::<f64>()
                .map_err(|_| format!("invalid numeric string {s:?}")),
            other => Err(format!("expected number or numeric string, got {other}")),
        }
    }
}

impl Lenient for String {
    fn from_json(v: Value) -> Result<Self, String> {
        match v {
            Value::String(s) => Ok(s),
            Value::Number(n) => Ok(n.to_string()),
            Value::Bool(b) => Ok(b.to_string()),
            other => Err(format!("expected string, got {other}")),
        }
    }
}

impl Lenient for Value {
    fn from_json(v: Value) -> Result<Self, String> {
        Ok(v)
    }
}

fn lenient<'de, D, T>(d: D) -> Result<T, D::Error>
where
    D: Deserializer<'de>,
    T: Lenient,
{
    let v = Value::deserialize(d)?;
    T::from_json(v).map_err(serde::de::Error::custom)
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Resource<T: Lenient> {
    #[serde(deserialize_with = "lenient")]
    pub value: T,
    #[serde(default)]
    pub updated_at: Option<String>,
    #[serde(default)]
    pub unit: Option<String>,
}

pub type RString = Resource<String>;
pub type RNumber = Resource<f64>;

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Envelope<T> {
    #[serde(default)]
    pub status: Option<i64>,
    #[serde(default)]
    pub operation_id: Option<String>,
    #[serde(default = "none")]
    pub data: Option<T>,
}

fn none<T>() -> Option<T> {
    None
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct VehicleListItem {
    pub vin: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Descriptions {
    pub model: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct VehicleDetails {
    pub vin: Option<String>,
    pub model_year: Option<i64>,
    pub gearbox: Option<String>,
    pub fuel_type: Option<String>,
    pub external_colour: Option<String>,
    pub descriptions: Option<Descriptions>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Doors {
    pub central_lock: Option<RString>,
    pub front_left_door: Option<RString>,
    pub front_right_door: Option<RString>,
    pub rear_left_door: Option<RString>,
    pub rear_right_door: Option<RString>,
    pub hood: Option<RString>,
    pub tailgate: Option<RString>,
    pub tank_lid: Option<RString>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Windows {
    pub front_left_window: Option<RString>,
    pub front_right_window: Option<RString>,
    pub rear_left_window: Option<RString>,
    pub rear_right_window: Option<RString>,
    pub sunroof: Option<RString>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Fuel {
    pub fuel_amount: Option<RNumber>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Odometer {
    pub odometer: Option<RNumber>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Tyres {
    pub front_left: Option<RString>,
    pub front_right: Option<RString>,
    pub rear_left: Option<RString>,
    pub rear_right: Option<RString>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Diagnostics {
    pub service_warning: Option<RString>,
    pub service_trigger: Option<RString>,
    pub engine_hours_to_service: Option<RNumber>,
    pub distance_to_service: Option<RNumber>,
    pub washer_fluid_level_warning: Option<RString>,
    pub time_to_service: Option<RNumber>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Availability {
    pub value: String,
    pub unavailable_reason: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct CommandAccessibility {
    pub availability_status: Option<Availability>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct EngineDiagnostics {
    pub oil_level_warning: Option<RString>,
    pub engine_coolant_level_warning: Option<RString>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct EngineStatus {
    pub engine_status: Option<RString>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Brakes {
    pub brake_fluid_level_warning: Option<RString>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Statistics {
    pub average_speed: Option<RNumber>,
    pub distance_to_empty: Option<RNumber>,
    #[serde(rename = "tripMeter1")]
    pub trip_meter_1: Option<RNumber>,
    #[serde(rename = "tripMeter2")]
    pub trip_meter_2: Option<RNumber>,
    pub average_fuel_consumption: Option<RNumber>,
    /// Field names Volvo actually sends for current cars (observed 2026-11-06
    /// on an XC40 Recharge); the published spec lists only the five above.
    pub trip_meter_manual: Option<RNumber>,
    pub trip_meter_automatic: Option<RNumber>,
    pub average_speed_automatic: Option<RNumber>,
    pub average_energy_consumption: Option<RNumber>,
    pub distance_to_empty_battery: Option<RNumber>,
}

/// Exterior warnings are an open-ended map of warning name to state.
pub type ExteriorWarnings = BTreeMap<String, RString>;

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct CommandListItem {
    pub command: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(tag = "status")]
pub enum EnergyField<T> {
    #[serde(rename = "OK")]
    Ok {
        value: T,
        #[serde(default)]
        unit: Option<String>,
        #[serde(default, rename = "updatedAt")]
        updated_at: Option<String>,
    },
    #[serde(rename = "ERROR")]
    Error {
        #[serde(default)]
        code: Option<String>,
        #[serde(default)]
        message: Option<String>,
    },
    /// Any other status (e.g. `PENDING`): rendered as "—", like an error,
    /// instead of failing the whole energy state.
    #[serde(other)]
    Unknown,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct EnergyState {
    pub battery_charge_level: Option<EnergyField<Value>>,
    pub electric_range: Option<EnergyField<Value>>,
    pub charger_connection_status: Option<EnergyField<Value>>,
    pub charging_status: Option<EnergyField<Value>>,
    pub charging_type: Option<EnergyField<Value>>,
    pub estimated_charging_time_to_target_battery_charge_level: Option<EnergyField<Value>>,
    pub target_battery_charge_level: Option<EnergyField<Value>>,
    pub charging_current_limit: Option<EnergyField<Value>>,
    pub charging_power: Option<EnergyField<Value>>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct EnergyCapabilities {
    pub get_energy_state: Option<Value>,
}

impl EnergyCapabilities {
    /// Reads `getEnergyState.<field>.isSupported`.
    pub fn is_supported(&self, field: &str) -> Option<bool> {
        self.get_energy_state
            .as_ref()?
            .get(field)?
            .get("isSupported")?
            .as_bool()
    }
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Geometry {
    pub coordinates: Vec<f64>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Feature {
    pub geometry: Option<Geometry>,
    pub properties: Option<BTreeMap<String, Value>>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct LocationResponse {
    pub data: Option<Feature>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ParsedLocation {
    pub longitude: f64,
    pub latitude: f64,
    pub heading: Option<f64>,
    pub timestamp: Option<String>,
}

impl LocationResponse {
    /// Coordinates are `[lon, lat(, alt)]`.
    pub fn parsed(&self) -> Option<ParsedLocation> {
        let feature = self.data.as_ref()?;
        let c = &feature.geometry.as_ref()?.coordinates;
        if c.len() < 2 {
            return None;
        }
        let props = feature.properties.as_ref();
        let heading = props.and_then(|p| p.get("heading")).and_then(|v| match v {
            Value::Number(n) => n.as_f64(),
            Value::String(s) => s.trim().parse().ok(),
            _ => None,
        });
        let timestamp = props
            .and_then(|p| p.get("timestamp"))
            .and_then(|v| v.as_str())
            .map(str::to_owned);
        Some(ParsedLocation {
            longitude: c[0],
            latitude: c[1],
            heading,
            timestamp,
        })
    }
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Invoke {
    pub vin: Option<String>,
    pub invoke_status: String,
    pub message: Option<String>,
    pub ready_to_unlock: Option<bool>,
    pub ready_to_unlock_until: Option<i64>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct InvokeResponse {
    pub data: Invoke,
}

// ===== Display helpers =====

const DASH: &str = "—";

fn fmt_f64(x: f64) -> String {
    let r = (x * 100.0).round() / 100.0;
    if r.fract() == 0.0 {
        format!("{r:.0}")
    } else {
        format!("{r}")
    }
}

/// Display for resource values: numbers are rounded to two decimals.
pub trait RenderValue: Display {
    fn render_value(&self) -> String {
        self.to_string()
    }
}

impl RenderValue for String {}
impl RenderValue for i64 {}
impl RenderValue for f64 {
    fn render_value(&self) -> String {
        fmt_f64(*self)
    }
}
impl RenderValue for Value {
    fn render_value(&self) -> String {
        match self {
            Value::Number(n) => n.as_f64().map(fmt_f64).unwrap_or_else(|| n.to_string()),
            Value::String(s) => s.clone(),
            other => other.to_string(),
        }
    }
}

fn with_unit(v: String, unit: Option<&String>) -> String {
    match unit {
        Some(u) if !u.is_empty() => format!("{v} {u}"),
        _ => v,
    }
}

pub fn render<T: RenderValue + Lenient>(r: Option<&Resource<T>>) -> String {
    match r {
        None => DASH.to_string(),
        Some(r) => with_unit(r.value.render_value(), r.unit.as_ref()),
    }
}

pub fn render_energy(f: Option<&EnergyField<Value>>) -> String {
    match f {
        Some(EnergyField::Ok { value, unit, .. }) => with_unit(value.render_value(), unit.as_ref()),
        _ => DASH.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn p<T: serde::de::DeserializeOwned>(s: &str) -> T {
        serde_json::from_str(s).unwrap()
    }

    #[test]
    fn vehicle_list_item() {
        let e: Envelope<Vec<VehicleListItem>> =
            p(r#"{"status":200,"operationId":"o","data":[{"vin":"YV1"}]}"#);
        assert_eq!(e.status, Some(200));
        assert_eq!(e.data.unwrap()[0].vin.as_deref(), Some("YV1"));
    }

    #[test]
    fn vehicle_details() {
        let d: Envelope<VehicleDetails> = p(
            r#"{"data":{"vin":"YV1","modelYear":2024,"gearbox":"AUTOMATIC","fuelType":"PETROL","externalColour":"Black","descriptions":{"model":"XC60"}}}"#,
        );
        let d = d.data.unwrap();
        assert_eq!(d.model_year, Some(2024));
        assert_eq!(d.fuel_type.as_deref(), Some("PETROL"));
        assert_eq!(d.external_colour.as_deref(), Some("Black"));
        assert_eq!(d.descriptions.unwrap().model.as_deref(), Some("XC60"));
    }

    #[test]
    fn doors() {
        let d: Doors = p(
            r#"{"centralLock":{"value":"LOCKED","updatedAt":"t"},"frontLeftDoor":{"value":"CLOSED"},"frontRightDoor":{"value":"CLOSED"},"rearLeftDoor":{"value":"CLOSED"},"rearRightDoor":{"value":"CLOSED"},"hood":{"value":"CLOSED"},"tailgate":{"value":"OPEN"},"tankLid":{"value":"CLOSED"}}"#,
        );
        assert_eq!(d.tailgate.unwrap().value, "OPEN");
        assert_eq!(d.tank_lid.unwrap().value, "CLOSED");
        assert_eq!(d.front_left_door.unwrap().value, "CLOSED");
        assert_eq!(d.rear_right_door.unwrap().value, "CLOSED");
        assert_eq!(d.central_lock.unwrap().updated_at.as_deref(), Some("t"));
    }

    #[test]
    fn windows() {
        let w: Windows = p(
            r#"{"frontLeftWindow":{"value":"CLOSED"},"frontRightWindow":{"value":"CLOSED"},"rearLeftWindow":{"value":"OPEN"},"rearRightWindow":{"value":"CLOSED"},"sunroof":{"value":"CLOSED"}}"#,
        );
        assert_eq!(w.rear_left_window.unwrap().value, "OPEN");
        assert!(w.sunroof.is_some() && w.front_left_window.is_some());
        assert!(w.front_right_window.is_some() && w.rear_right_window.is_some());
    }

    #[test]
    fn fuel() {
        let f: Fuel = p(r#"{"fuelAmount":{"value":"35.5","updatedAt":"t","unit":"l"}}"#);
        assert_eq!(f.fuel_amount.unwrap().value, 35.5);
    }

    #[test]
    fn odometer() {
        let o: Odometer = p(r#"{"odometer":{"value":35813,"unit":"km"}}"#);
        assert_eq!(render(o.odometer.as_ref()), "35813 km");
    }

    #[test]
    fn tyres() {
        let t: Tyres = p(
            r#"{"frontLeft":{"value":"NO_WARNING"},"frontRight":{"value":"NO_WARNING"},"rearLeft":{"value":"VERY_LOW_PRESSURE"},"rearRight":{"value":"NO_WARNING"}}"#,
        );
        assert_eq!(t.rear_left.unwrap().value, "VERY_LOW_PRESSURE");
        assert!(t.front_left.is_some() && t.front_right.is_some() && t.rear_right.is_some());
    }

    #[test]
    fn diagnostics() {
        let d: Diagnostics = p(
            r#"{"serviceWarning":{"value":"NO_WARNING"},"serviceTrigger":{"value":"X"},"engineHoursToService":{"value":10},"distanceToService":{"value":"5000","unit":"km"},"washerFluidLevelWarning":{"value":"NO_WARNING"},"timeToService":{"value":3,"unit":"months"}}"#,
        );
        assert_eq!(d.distance_to_service.unwrap().value, 5000.0);
        assert_eq!(d.engine_hours_to_service.unwrap().value, 10.0);
        assert_eq!(d.time_to_service.unwrap().value, 3.0);
        assert!(d.service_warning.is_some() && d.service_trigger.is_some());
        assert!(d.washer_fluid_level_warning.is_some());
    }

    #[test]
    fn command_accessibility() {
        let c: Envelope<CommandAccessibility> = p(
            r#"{"data":{"availabilityStatus":{"value":"UNAVAILABLE","unavailableReason":"CAR_IN_USE","timestamp":"t"}}}"#,
        );
        let a = c.data.unwrap().availability_status.unwrap();
        assert_eq!(a.value, "UNAVAILABLE");
        assert_eq!(a.unavailable_reason.as_deref(), Some("CAR_IN_USE"));
    }

    #[test]
    fn engine_diagnostics_status_brakes() {
        let d: EngineDiagnostics = p(
            r#"{"oilLevelWarning":{"value":"NO_WARNING"},"engineCoolantLevelWarning":{"value":"LOW"}}"#,
        );
        assert_eq!(d.engine_coolant_level_warning.unwrap().value, "LOW");
        assert!(d.oil_level_warning.is_some());
        let s: EngineStatus = p(r#"{"engineStatus":{"value":"STOPPED"}}"#);
        assert_eq!(s.engine_status.unwrap().value, "STOPPED");
        let b: Brakes = p(r#"{"brakeFluidLevelWarning":{"value":"NO_WARNING"}}"#);
        assert_eq!(b.brake_fluid_level_warning.unwrap().value, "NO_WARNING");
    }

    #[test]
    fn statistics_accept_numbers_and_strings() {
        let s: Statistics = p(
            r#"{"averageSpeed":{"value":"47.5","unit":"km/h"},"distanceToEmpty":{"value":500,"unit":"km"},"tripMeter1":{"value":1.25},"tripMeter2":{"value":"0"},"averageFuelConsumption":{"value":7.1,"unit":"l/100km"}}"#,
        );
        assert_eq!(s.average_speed.unwrap().value, 47.5);
        assert_eq!(s.distance_to_empty.unwrap().value, 500.0);
        assert_eq!(s.trip_meter_1.unwrap().value, 1.25);
        assert_eq!(s.trip_meter_2.unwrap().value, 0.0);
        assert_eq!(s.average_fuel_consumption.unwrap().value, 7.1);
    }

    #[test]
    fn unparsable_numeric_string_is_an_error() {
        let r: Result<Fuel, _> = serde_json::from_str(r#"{"fuelAmount":{"value":"abc"}}"#);
        assert!(r.is_err());
    }

    #[test]
    fn exterior_warnings_is_a_map() {
        let w: Envelope<ExteriorWarnings> = p(
            r#"{"data":{"hazardLightsWarning":{"value":"NO_WARNING"},"fogLightFrontWarning":{"value":"FAILURE"}}}"#,
        );
        let w = w.data.unwrap();
        assert_eq!(w.len(), 2);
        assert_eq!(w["fogLightFrontWarning"].value, "FAILURE");
    }

    #[test]
    fn command_list_item() {
        let c: Envelope<Vec<CommandListItem>> =
            p(r#"{"data":[{"command":"LOCK","href":"/x"},{}]}"#);
        let c = c.data.unwrap();
        assert_eq!(c[0].command.as_deref(), Some("LOCK"));
        assert!(c[1].command.is_none());
    }

    #[test]
    fn energy_state() {
        let s: Envelope<EnergyState> = p(
            r#"{"data":{"batteryChargeLevel":{"status":"OK","value":44,"unit":"percentage","updatedAt":"t"},"electricRange":{"status":"ERROR","code":"NOT_SUPPORTED","message":"m"},"chargerConnectionStatus":{"status":"OK","value":"DISCONNECTED"},"chargingStatus":{"status":"OK","value":"IDLE"},"chargingType":{"status":"OK","value":"NONE"},"estimatedChargingTimeToTargetBatteryChargeLevel":{"status":"OK","value":0,"unit":"minutes"},"targetBatteryChargeLevel":{"status":"OK","value":80,"unit":"percentage"},"chargingCurrentLimit":{"status":"OK","value":16,"unit":"ampere"},"chargingPower":{"status":"OK","value":0,"unit":"watts"}}}"#,
        );
        let s = s.data.unwrap();
        assert_eq!(
            render_energy(s.battery_charge_level.as_ref()),
            "44 percentage"
        );
        assert_eq!(render_energy(s.electric_range.as_ref()), "—");
        assert_eq!(
            render_energy(s.charger_connection_status.as_ref()),
            "DISCONNECTED"
        );
        assert!(s.charging_status.is_some() && s.charging_type.is_some());
        assert!(s
            .estimated_charging_time_to_target_battery_charge_level
            .is_some());
        assert!(s.target_battery_charge_level.is_some() && s.charging_current_limit.is_some());
        assert!(s.charging_power.is_some());
    }

    #[test]
    fn energy_capabilities() {
        let c: Envelope<EnergyCapabilities> = p(
            r#"{"data":{"getEnergyState":{"isSupported":true,"batteryChargeLevel":{"isSupported":true},"electricRange":{"isSupported":false}}}}"#,
        );
        let c = c.data.unwrap();
        assert_eq!(c.is_supported("batteryChargeLevel"), Some(true));
        assert_eq!(c.is_supported("electricRange"), Some(false));
        assert_eq!(c.is_supported("nope"), None);
        assert_eq!(EnergyCapabilities::default().is_supported("x"), None);
    }

    #[test]
    fn location_full() {
        let r: LocationResponse = p(
            r#"{"status":200,"operationId":"o","data":{"type":"Feature","geometry":{"type":"Point","coordinates":[6.1,46.2,400]},"properties":{"heading":"90","timestamp":"2026-01-01T00:00:00Z"}}}"#,
        );
        let l = r.parsed().unwrap();
        assert_eq!(l.timestamp.as_deref(), Some("2026-01-01T00:00:00Z"));
    }

    #[test]
    fn invoke_response() {
        let r: InvokeResponse = p(
            r#"{"data":{"vin":"YV1","invokeStatus":"COMPLETED","message":"ok","readyToUnlock":true,"readyToUnlockUntil":1730000000000}}"#,
        );
        assert_eq!(r.data.invoke_status, "COMPLETED");
        assert_eq!(r.data.ready_to_unlock, Some(true));
        assert_eq!(r.data.ready_to_unlock_until, Some(1730000000000));
        assert_eq!(r.data.vin.as_deref(), Some("YV1"));
        assert_eq!(r.data.message.as_deref(), Some("ok"));
    }

    #[test]
    fn render_rules() {
        assert_eq!(render::<String>(None), "—");
        let n: RNumber = p(r#"{"value":2.499}"#);
        assert_eq!(render(Some(&n)), "2.5");
        let n: RNumber = p(r#"{"value":2.5}"#);
        assert_eq!(render(Some(&n)), "2.5");
        let n: RNumber = p(r#"{"value":3.14159,"unit":"km"}"#);
        assert_eq!(render(Some(&n)), "3.14 km");
        let s: RString = p(r#"{"value":"LOCKED"}"#);
        assert_eq!(render(Some(&s)), "LOCKED");
    }

    #[test]
    fn energy_field_error_renders_dash() {
        let f: EnergyField<serde_json::Value> =
            serde_json::from_str(r#"{"status":"ERROR","code":"E","message":"m"}"#).unwrap();
        assert_eq!(render_energy(Some(&f)), "—");
        let ok: EnergyField<serde_json::Value> =
            serde_json::from_str(r#"{"status":"OK","value":44,"unit":"%"}"#).unwrap();
        assert_eq!(render_energy(Some(&ok)), "44 %");
    }

    #[test]
    fn unknown_energy_status_parses_to_unknown() {
        let f: EnergyField<serde_json::Value> = p(r#"{"status":"PENDING"}"#);
        assert_eq!(f, EnergyField::Unknown);
        assert_eq!(render_energy(Some(&f)), "—");
        let s: EnergyState = p(r#"{
            "batteryChargeLevel":{"status":"OK","value":80,"unit":"percentage"},
            "chargingStatus":{"status":"PENDING"},
            "electricRange":{"status":"ERROR","code":"E"}
        }"#);
        assert_eq!(s.charging_status, Some(EnergyField::Unknown));
        assert!(matches!(
            s.battery_charge_level,
            Some(EnergyField::Ok { .. })
        ));
        assert!(matches!(s.electric_range, Some(EnergyField::Error { .. })));
    }

    #[test]
    fn location_without_data_parses_to_none() {
        let r: LocationResponse =
            serde_json::from_str(r#"{"status":404,"operationId":"x"}"#).unwrap();
        assert!(r.parsed().is_none());
    }

    #[test]
    fn location_coordinates_are_lon_lat() {
        let r: LocationResponse = serde_json::from_str(
            r#"{"data":{"geometry":{"coordinates":[6.1,46.2,400]},"properties":{"heading":"90"}}}"#,
        )
        .unwrap();
        let p = r.parsed().unwrap();
        assert_eq!((p.longitude, p.latitude), (6.1, 46.2));
        assert_eq!(p.heading, Some(90.0));
    }

    #[test]
    fn unknown_fields_are_ignored_everywhere() {
        let d: Envelope<Doors> = serde_json::from_str(
            r#"{"data":{"centralLock":{"value":"LOCKED","updatedAt":"t"},"newThing":1}}"#,
        )
        .unwrap();
        assert_eq!(d.data.unwrap().central_lock.unwrap().value, "LOCKED");
    }
}
