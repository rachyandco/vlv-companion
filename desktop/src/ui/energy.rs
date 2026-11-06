//! Energy row: the phone's energy tiles (charger, charging, power, target…).

use egui::Ui;
use serde_json::Value;

use crate::api::models::{EnergyCapabilities, EnergyField, EnergyState};
use crate::ui::cards::status_card;
use crate::warnings::humanize_value;

const DASH: &str = "—";
/// Opacity of a tile the car does not support or that only matters while
/// plugged in.
const FADED: f32 = 0.4;

/// A number without a trailing ".0".
fn num(x: f64) -> String {
    let r = (x * 10.0).round() / 10.0;
    if r.fract() == 0.0 {
        format!("{r:.0}")
    } else {
        format!("{r}")
    }
}

/// Phone's `formatWatts`: "7.4 kW" from 1000 W up, else "850 W".
pub fn format_watts(watts: f64) -> String {
    if !watts.is_finite() || watts <= 0.0 {
        return "0 W".into();
    }
    if watts >= 1000.0 {
        format!("{:.1} kW", watts / 1000.0)
    } else {
        format!("{} W", watts.round())
    }
}

/// "16 A", or "Auto" for 0 (no manual cap set), as on the phone.
pub fn format_current_limit(amps: f64) -> String {
    if amps > 0.0 {
        format!("{} A", num(amps))
    } else {
        "Auto".into()
    }
}

fn ok_value(f: Option<&EnergyField<Value>>) -> Option<&Value> {
    match f? {
        EnergyField::Ok { value, .. } => Some(value),
        EnergyField::Error { .. } => None,
    }
}

fn number(v: &Value) -> Option<f64> {
    match v {
        Value::Number(n) => n.as_f64(),
        Value::String(s) => s.trim().parse().ok(),
        _ => None,
    }
}

/// A textual state, humanised ("CONNECTED" -> "Connected"); short
/// acronyms such as "AC" and "DC" stay as they are.
fn text(f: Option<&EnergyField<Value>>) -> String {
    match ok_value(f) {
        Some(Value::String(s)) if s.len() <= 3 => s.clone(),
        Some(Value::String(s)) => humanize_value(s),
        Some(Value::Null) | None => DASH.into(),
        Some(other) => other.to_string(),
    }
}

/// A numeric value through `fmt`; non-numbers are shown as they are.
fn numeric(f: Option<&EnergyField<Value>>, fmt: impl Fn(f64) -> String) -> String {
    match ok_value(f) {
        None | Some(Value::Null) => DASH.into(),
        Some(v) => number(v).map_or_else(
            || v.as_str().map_or_else(|| v.to_string(), str::to_owned),
            fmt,
        ),
    }
}

/// The phone's plugged-in rule: `chargerConnectionStatus` is `CONNECTED`.
pub fn plugged_in(state: Option<&EnergyState>) -> bool {
    ok_value(state.and_then(|s| s.charger_connection_status.as_ref()))
        .and_then(Value::as_str)
        .is_some_and(|v| v == "CONNECTED")
}

fn tile(ui: &mut Ui, label: &str, value: &str, faded: bool) {
    let before = ui.opacity();
    if faded {
        ui.set_opacity(before * FADED);
    }
    status_card(ui, label, value, None);
    ui.set_opacity(before);
}

/// Seven cards; call inside a wrapping row.
pub fn show(ui: &mut Ui, state: Option<&EnergyState>, caps: Option<&EnergyCapabilities>) {
    let unsupported = |field: &str| caps.and_then(|c| c.is_supported(field)) == Some(false);
    let unplugged = !plugged_in(state);
    let s = |f: fn(&EnergyState) -> Option<&EnergyField<Value>>| state.and_then(f);

    tile(
        ui,
        "Charger",
        &text(s(|x| x.charger_connection_status.as_ref())),
        unsupported("chargerConnectionStatus"),
    );
    tile(
        ui,
        "Charging",
        &text(s(|x| x.charging_status.as_ref())),
        unsupported("chargingSystemStatus") || unplugged,
    );
    tile(
        ui,
        "Charge type",
        &text(s(|x| x.charging_type.as_ref())),
        unsupported("chargingType") || unplugged,
    );
    tile(
        ui,
        "Charging power",
        &numeric(s(|x| x.charging_power.as_ref()), format_watts),
        unsupported("chargingPower") || unplugged,
    );
    tile(
        ui,
        "Target SoC",
        &numeric(s(|x| x.target_battery_charge_level.as_ref()), |v| {
            format!("{}%", num(v))
        }),
        unsupported("targetBatteryChargeLevel"),
    );
    tile(
        ui,
        "Time to target",
        &numeric(
            s(|x| {
                x.estimated_charging_time_to_target_battery_charge_level
                    .as_ref()
            }),
            |v| format!("{} min", num(v)),
        ),
        unsupported("estimatedChargingTimeToTargetBatteryChargeLevel") || unplugged,
    );
    tile(
        ui,
        "Current limit",
        &numeric(
            s(|x| x.charging_current_limit.as_ref()),
            format_current_limit,
        ),
        unsupported("chargingCurrentLimit"),
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn watts_switch_to_kilowatts_at_1000() {
        assert_eq!(format_watts(0.0), "0 W");
        assert_eq!(format_watts(-5.0), "0 W");
        assert_eq!(format_watts(f64::NAN), "0 W");
        assert_eq!(format_watts(850.0), "850 W");
        assert_eq!(format_watts(999.4), "999 W");
        assert_eq!(format_watts(1000.0), "1.0 kW");
        assert_eq!(format_watts(7400.0), "7.4 kW");
        assert_eq!(format_watts(11040.0), "11.0 kW");
    }

    #[test]
    fn current_limit_zero_is_auto() {
        assert_eq!(format_current_limit(0.0), "Auto");
        assert_eq!(format_current_limit(16.0), "16 A");
        assert_eq!(format_current_limit(6.5), "6.5 A");
    }

    #[test]
    fn plugged_in_needs_connected() {
        let st = |v: &str| -> EnergyState {
            serde_json::from_value(json!({"chargerConnectionStatus": {"status": "OK", "value": v}}))
                .unwrap()
        };
        assert!(plugged_in(Some(&st("CONNECTED"))));
        assert!(!plugged_in(Some(&st("DISCONNECTED"))));
        assert!(!plugged_in(None));
        let err: EnergyState = serde_json::from_value(
            json!({"chargerConnectionStatus": {"status": "ERROR", "code": "x"}}),
        )
        .unwrap();
        assert!(!plugged_in(Some(&err)));
    }

    #[test]
    fn numeric_values_accept_numbers_and_strings() {
        let f: EnergyField<Value> =
            serde_json::from_value(json!({"status": "OK", "value": "7400"})).unwrap();
        assert_eq!(numeric(Some(&f), format_watts), "7.4 kW");
        assert_eq!(numeric(None, format_watts), "—");
    }
}
