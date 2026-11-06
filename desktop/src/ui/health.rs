//! Health and trip rows, composed like the phone's vehicle overview.

use std::collections::BTreeMap;

use egui::{Color32, Ui};

use crate::api::models::{render, Brakes, EngineDiagnostics, RString, Statistics};
use crate::ui::cards::status_card;
use crate::warnings::{active, describe, has_any_ok, Level3};

const OK_TEXT: Color32 = Color32::from_rgb(0x86, 0xef, 0xac);
const WARN_TEXT: Color32 = Color32::from_rgb(0xfb, 0xe2, 0xb3);

fn level_color(level: Level3) -> Option<Color32> {
    match level {
        Level3::Ok => Some(OK_TEXT),
        Level3::Warn => Some(WARN_TEXT),
        Level3::Unknown => None,
    }
}

/// Oil, coolant and brake fluid, then each active exterior warning, or a
/// single "Lights" card when there is none. Call inside a wrapping row.
pub fn show_health(
    ui: &mut Ui,
    engine: Option<&EngineDiagnostics>,
    brakes: Option<&Brakes>,
    warnings: Option<&BTreeMap<String, RString>>,
) {
    let fields = [
        (
            "Oil level",
            engine.and_then(|e| e.oil_level_warning.as_ref()),
        ),
        (
            "Coolant level",
            engine.and_then(|e| e.engine_coolant_level_warning.as_ref()),
        ),
        (
            "Brake fluid",
            brakes.and_then(|b| b.brake_fluid_level_warning.as_ref()),
        ),
    ];
    for (label, field) in fields {
        let (text, level) = describe(field);
        status_card(ui, label, &text, level_color(level));
    }
    // Like the phone, the Lights summary waits for the warnings to load.
    let Some(map) = warnings else { return };
    let list = active(map);
    for (label, text) in &list {
        status_card(ui, label, text, Some(WARN_TEXT));
    }
    if list.is_empty() {
        if has_any_ok(map) {
            status_card(ui, "Lights", "No warnings", Some(OK_TEXT));
        } else {
            status_card(ui, "Lights", "—", None);
        }
    }
}

/// Trip meters, average speed, fuel consumption (not on EVs) and distance
/// to empty. Draws nothing without statistics. Call inside a wrapping row.
pub fn show_trip(ui: &mut Ui, stats: Option<&Statistics>, is_ev: bool) {
    let Some(s) = stats else { return };
    // Volvo's live payload uses tripMeterManual/Automatic, averageSpeedAutomatic,
    // averageEnergyConsumption and distanceToEmptyBattery; the spec's older
    // names are kept as fallbacks for cars that still send them.
    let trip = s.trip_meter_manual.as_ref().or(s.trip_meter_1.as_ref());
    let trip_auto = s.trip_meter_automatic.as_ref().or(s.trip_meter_2.as_ref());
    let to_empty = s
        .distance_to_empty_battery
        .as_ref()
        .or(s.distance_to_empty.as_ref());
    status_card(ui, "Trip meter", &render(trip), None);
    status_card(ui, "Trip meter (auto)", &render(trip_auto), None);
    status_card(ui, "Average speed", &render(s.average_speed.as_ref()), None);
    if let Some(v) = s.average_speed_automatic.as_ref() {
        status_card(ui, "Average speed (auto)", &render(Some(v)), None);
    }
    if let Some(v) = s.average_energy_consumption.as_ref() {
        status_card(ui, "Energy consumption", &render(Some(v)), None);
    }
    if !is_ev {
        status_card(
            ui,
            "Fuel consumption",
            &render(s.average_fuel_consumption.as_ref()),
            None,
        );
    }
    status_card(ui, "Distance to empty", &render(to_empty), None);
}
