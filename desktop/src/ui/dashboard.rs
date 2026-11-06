//! Vehicle dashboard: header, status cards, car top view, tyres and map,
//! then the energy, health and trip rows. Controls come in a later task.

use egui::{Align, Color32, CornerRadius, Frame, Layout, Margin, RichText, Stroke, Ui};

use crate::api::commands::CommandName;
use crate::api::models::{render, render_energy, EnergyField, RString, Tyres};
use crate::api::overpass::ChargingStation;
use crate::config::Config;
use crate::state::cache::Resource;
use crate::theme::{card, Colors, RADIUS};
use crate::ui::car_view::{CarView, CAR_ASPECT, DEFAULT_WIDTH};
use crate::ui::cards::{battery_card, lock_card, slot, status_card, CARD_MIN_WIDTH};
use crate::ui::data::VehicleData;
use crate::ui::map::{MapPanel, MAP_HEIGHT};
use crate::ui::model_line;
use crate::ui::widgets::{muted, section_title};
use crate::ui::{energy, health};
use crate::warnings::{engine_label, humanize_value};

const GAP: f32 = 12.0;
/// Two tyre cells, the gap between them and the card margins.
const TYRES_WIDTH: f32 = 2.0 * CARD_MIN_WIDTH + GAP + 28.0;
/// Narrower than this, the map moves under the car and tyres.
const MAP_ROW_MIN_WIDTH: f32 = 900.0;
/// Nor does the map stay beside them in less than this.
const MAP_MIN_WIDTH: f32 = 320.0;

/// Per-dashboard UI state kept across frames.
#[derive(Debug, Default)]
pub struct DashboardState {
    /// Uploaded on first draw (needs the egui context).
    car: Option<CarView>,
    /// VIN of an unlock waiting for the user's confirmation.
    confirm_unlock: Option<String>,
    /// Lock or unlock sent and not answered yet: (VIN, command). While set,
    /// the lock card ignores clicks, like the phone's `busy` flag.
    pending: Option<(String, CommandName)>,
    /// Map tiles, view and charger overlay.
    pub map: MapPanel,
    /// Chargers near the car from the last successful fetch.
    pub stations: Vec<ChargingStation>,
}

impl DashboardState {
    /// Marks `command` as in flight for `vin`.
    pub fn begin_command(&mut self, vin: &str, command: CommandName) {
        self.pending = Some((vin.to_string(), command));
    }

    /// Clears the marker on the answer to `command`. `vin` is `None` for
    /// worker errors, which do not carry one.
    pub fn finish_command(&mut self, vin: Option<&str>, command: CommandName) {
        if self
            .pending
            .as_ref()
            .is_some_and(|(v, c)| *c == command && vin.is_none_or(|x| x == v))
        {
            self.pending = None;
        }
    }

    /// Replaces the charger list (a new fetch answered).
    pub fn set_stations(&mut self, stations: Vec<ChargingStation>) {
        self.stations = stations;
        self.map.selected_station = None;
    }

    /// True while a lock or unlock for `vin` is in flight.
    pub fn is_busy(&self, vin: &str) -> bool {
        self.pending.as_ref().is_some_and(|(v, _)| v == vin)
    }

    /// Drops the pending marker and any open confirmation that belong to
    /// another car than `vin` (the selection changed).
    pub fn retain_vin(&mut self, vin: &str) {
        if self.pending.as_ref().is_some_and(|(v, _)| v != vin) {
            self.pending = None;
        }
        if self.confirm_unlock.as_deref().is_some_and(|v| v != vin) {
            self.confirm_unlock = None;
        }
    }
}

/// Things the dashboard asks the app to do.
#[derive(Debug, Clone, PartialEq)]
pub enum DashboardAction {
    Command(CommandName, Option<u8>),
    RefreshLocation,
    ToggleChargers,
    OpenInMaps(f64, f64),
    OpenStation(f64, f64),
    SetTileTemplate(String),
}

pub fn show(
    ui: &mut Ui,
    state: &mut DashboardState,
    cfg: &Config,
    vin: &str,
    label: &str,
    data: Option<&VehicleData>,
) -> Vec<DashboardAction> {
    let mut actions = Vec::new();
    state.retain_vin(vin);
    let is_ev = cfg
        .vehicle_prefs
        .get(&vin.to_uppercase())
        .is_some_and(|p| p.is_ev);

    header(ui, label, data, is_ev);
    ui.add_space(GAP);

    let Some(d) = data.filter(|d| d.last_updated.is_some()) else {
        ui.label(muted("Loading…"));
        errors(ui, data);
        return actions;
    };

    let lock = d
        .doors
        .as_ref()
        .and_then(|x| x.central_lock.as_ref())
        .map(|r| r.value.as_str());
    let busy = state.is_busy(vin);
    wrapped_row(ui, |ui| {
        if lock_card(ui, lock, busy) && !busy {
            if lock == Some("LOCKED") {
                state.confirm_unlock = Some(vin.to_string());
            } else {
                state.begin_command(vin, CommandName::Lock);
                actions.push(DashboardAction::Command(CommandName::Lock, None));
            }
        }
        status_cards(ui, d, is_ev);
    });
    ui.add_space(GAP);

    middle_row(ui, state, d, is_ev, &mut actions);

    if d.energy_state.is_some() || d.energy_caps.is_some() {
        section_title(ui, "Energy");
        wrapped_row(ui, |ui| {
            energy::show(ui, d.energy_state.as_ref(), d.energy_caps.as_ref())
        });
    }
    section_title(ui, "Health");
    wrapped_row(ui, |ui| {
        health::show_health(
            ui,
            d.engine_diag.as_ref(),
            d.brakes.as_ref(),
            d.warnings.as_ref(),
        )
    });
    if d.statistics.is_some() {
        section_title(ui, "Trip");
        wrapped_row(ui, |ui| health::show_trip(ui, d.statistics.as_ref(), is_ev));
    }
    ui.add_space(GAP);
    errors(ui, data);

    // A refresh showed the car is no longer locked: nothing to unlock.
    if lock != Some("LOCKED") {
        state.confirm_unlock = None;
    }
    if state.confirm_unlock.is_some() {
        if let Some(confirmed) = confirm_unlock(ui.ctx()) {
            state.confirm_unlock = None;
            if confirmed {
                state.begin_command(vin, CommandName::Unlock);
                actions.push(DashboardAction::Command(CommandName::Unlock, None));
            }
        }
    }
    actions
}

/// Title, model line and "colour · gearbox · availability · engine · updated".
fn header(ui: &mut Ui, label: &str, data: Option<&VehicleData>, is_ev: bool) {
    ui.add_space(12.0);
    ui.label(RichText::new(label).size(24.0).strong());
    let details = data.and_then(|d| d.details.as_ref());
    if let Some(line) = details.and_then(model_line) {
        if line != label {
            ui.label(muted(line));
        }
    }
    let Some(d) = data else { return };
    let mut parts: Vec<String> = Vec::new();
    if let Some(det) = details {
        parts.extend(det.external_colour.clone().filter(|s| !s.is_empty()));
        parts.extend(det.gearbox.clone().filter(|s| !s.is_empty()));
    }
    if let Some(a) = d
        .accessibility
        .as_ref()
        .and_then(|a| a.availability_status.as_ref())
    {
        parts.push(a.value.clone());
    }
    if !is_ev {
        let engine = d
            .engine_status
            .as_ref()
            .and_then(|e| e.engine_status.as_ref());
        parts.extend(engine_label(engine).map(str::to_owned));
    }
    if let Some(t) = d.last_updated_wall {
        parts.push(format!("updated {}", t.format("%H:%M")));
    }
    if !parts.is_empty() {
        ui.label(muted(parts.join("  ·  ")).size(14.0));
    }
}

fn energy_number(f: Option<&EnergyField<serde_json::Value>>) -> Option<f64> {
    match f? {
        EnergyField::Ok { value, .. } => match value {
            serde_json::Value::Number(n) => n.as_f64(),
            serde_json::Value::String(s) => s.trim().parse().ok(),
            _ => None,
        },
        EnergyField::Error { .. } => None,
    }
}

/// Battery, Range, Odometer, Fuel (not on EVs) and Service.
fn status_cards(ui: &mut Ui, d: &VehicleData, is_ev: bool) {
    let energy = d.energy_state.as_ref();
    let percent = energy_number(energy.and_then(|e| e.battery_charge_level.as_ref()));
    let caption = match energy.and_then(|e| e.charging_status.as_ref()) {
        Some(EnergyField::Ok { value, .. }) => {
            value.as_str().map(humanize_value).unwrap_or_default()
        }
        _ => String::new(),
    };
    battery_card(ui, percent, &caption);
    status_card(
        ui,
        "Range",
        &render_energy(energy.and_then(|e| e.electric_range.as_ref())),
        None,
    );
    status_card(
        ui,
        "Odometer",
        &render(d.odometer.as_ref().and_then(|o| o.odometer.as_ref())),
        None,
    );
    if !is_ev {
        let fuel = d
            .fuel
            .as_ref()
            .and_then(|f| f.fuel_amount.as_ref())
            .map_or("—".to_string(), |f| format!("{:.1} L", f.value));
        status_card(ui, "Fuel", &fuel, None);
    }
    let service = d
        .diagnostics
        .as_ref()
        .and_then(|x| x.distance_to_service.as_ref())
        .map_or("—".to_string(), |r| format!("{} km", r.value.round()));
    status_card(ui, "Service", &service, None);
}

/// A left-to-right row that wraps, with items aligned to the top (egui's
/// `horizontal_wrapped` centres them vertically).
fn wrapped_row(ui: &mut Ui, add: impl FnOnce(&mut Ui)) {
    ui.with_layout(
        Layout::left_to_right(Align::Min).with_main_wrap(true),
        |ui| {
            ui.spacing_mut().item_spacing = egui::vec2(GAP, GAP);
            add(ui);
        },
    );
}

/// "06 Nov 14:05" from the position's RFC 3339 timestamp.
fn position_time(ts: &str) -> String {
    chrono::DateTime::parse_from_rfc3339(ts)
        .map(|t| {
            t.with_timezone(&chrono::Local)
                .format("%d %b %H:%M")
                .to_string()
        })
        .unwrap_or_else(|_| ts.to_string())
}

/// Car view and tyre grid at their fixed widths, the map in the rest.
/// Below `MAP_ROW_MIN_WIDTH` the map wraps under them; the car shrinks to
/// fit when even it alone does not.
fn middle_row(
    ui: &mut Ui,
    state: &mut DashboardState,
    d: &VehicleData,
    is_ev: bool,
    actions: &mut Vec<DashboardAction>,
) {
    const PAD: f32 = 28.0; // card inner margin, both sides
    let row_width = ui.available_width();
    let car_width = DEFAULT_WIDTH.min(ui.available_width() - PAD).max(80.0);
    let inner_height = car_width * CAR_ASPECT + 26.0;
    wrapped_row(ui, |ui| {
        slot(ui, car_width + PAD, |ui| {
            card(ui, |ui| {
                ui.set_min_height(inner_height);
                ui.vertical_centered(|ui| {
                    let car = state.car.get_or_insert_with(|| CarView::new(ui.ctx()));
                    car.show(ui, d.doors.as_ref(), d.windows.as_ref(), is_ev, car_width);
                    let lock = d
                        .doors
                        .as_ref()
                        .and_then(|x| x.central_lock.as_ref())
                        .map_or("—", |r| r.value.as_str());
                    ui.label(RichText::new(format!("Central lock: {lock}")).size(14.0));
                });
            })
        });
        slot(ui, TYRES_WIDTH, |ui| {
            card(ui, |ui| {
                ui.set_min_height(inner_height);
                ui.vertical(|ui| {
                    section_title(ui, "Tyre pressure");
                    tyre_grid(ui, d.tyres.as_ref());
                });
            })
        });
        // `available_width` is the full row in a wrapping layout; what is
        // left beside the tyres is the space before the wrap.
        if row_width < MAP_ROW_MIN_WIDTH || ui.available_size_before_wrap().x < MAP_MIN_WIDTH {
            ui.end_row();
        }
        let map_width = ui.available_size_before_wrap().x.max(CARD_MIN_WIDTH);
        let location = d.location.as_ref();
        let updated = location
            .and_then(|l| l.timestamp.as_deref())
            .map(position_time);
        slot(ui, map_width, |ui| {
            card(ui, |ui| {
                ui.set_min_size(egui::vec2(map_width - PAD, inner_height.max(MAP_HEIGHT)));
                ui.set_max_width(map_width - PAD);
                ui.vertical(|ui| {
                    actions.extend(state.map.show(
                        ui,
                        location,
                        &state.stations,
                        updated.as_deref(),
                    ));
                });
            })
        });
    });
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum TyreLevel {
    Ok,
    Warn,
    Crit,
    Unknown,
}

/// Phone's `TyreStatus` rules: missing, NO_SENSOR, NOT_SUPPORTED and
/// UNSPECIFIED are unknown; hard LOW/HIGH (and VERY_LOW) are critical; any
/// other LOW, HIGH or WARNING is a warning; the rest is fine.
fn tyre_level(value: Option<&str>) -> TyreLevel {
    let Some(v) = value.map(str::to_uppercase) else {
        return TyreLevel::Unknown;
    };
    match v.as_str() {
        "NO_SENSOR" | "NOT_SUPPORTED" | "UNSPECIFIED" | "" => TyreLevel::Unknown,
        "NORMAL" | "NO_WARNING" | "OK" => TyreLevel::Ok,
        _ if v.contains("HARD") || v.contains("VERY_LOW") => TyreLevel::Crit,
        _ if v.contains("LOW") || v.contains("HIGH") || v.contains("WARNING") => TyreLevel::Warn,
        _ => TyreLevel::Ok,
    }
}

fn tyre_text(value: Option<&str>) -> String {
    let Some(v) = value else { return "—".into() };
    match v.to_uppercase().as_str() {
        "NORMAL" | "NO_WARNING" | "OK" => "OK".into(),
        "LOW_SOFT" => "Low".into(),
        "LOW_HARD" => "Low!".into(),
        "HIGH_SOFT" => "High".into(),
        "HIGH_HARD" => "High!".into(),
        "NO_SENSOR" => "No sensor".into(),
        "NOT_SUPPORTED" | "UNSPECIFIED" => "—".into(),
        _ => humanize_value(v),
    }
}

/// (fill, border, text) as in the phone's `TyreStatus`.
fn tyre_colors(level: TyreLevel) -> (Color32, Color32, Color32) {
    let rgba = |r, g, b, a: f32| Color32::from_rgba_unmultiplied(r, g, b, (a * 255.0) as u8);
    match level {
        TyreLevel::Ok => (
            rgba(52, 211, 153, 0.10),
            rgba(52, 211, 153, 0.45),
            Color32::from_rgb(0x86, 0xef, 0xac),
        ),
        TyreLevel::Warn => (
            rgba(245, 158, 11, 0.10),
            rgba(245, 158, 11, 0.45),
            Color32::from_rgb(0xfb, 0xe2, 0xb3),
        ),
        TyreLevel::Crit => (
            rgba(239, 68, 68, 0.12),
            rgba(239, 68, 68, 0.5),
            Color32::from_rgb(0xfb, 0xca, 0xca),
        ),
        TyreLevel::Unknown => (
            rgba(255, 255, 255, 0.04),
            rgba(255, 255, 255, 0.12),
            Colors::MUTED,
        ),
    }
}

fn tyre_cell(ui: &mut Ui, label: &str, field: Option<&RString>) {
    let value = field.map(|f| f.value.as_str());
    let (fill, border, text) = tyre_colors(tyre_level(value));
    Frame::new()
        .fill(fill)
        .stroke(Stroke::new(1.0, border))
        .corner_radius(CornerRadius::same(RADIUS as u8))
        .inner_margin(Margin::same(12))
        .show(ui, |ui| {
            ui.set_min_width(CARD_MIN_WIDTH - 24.0);
            ui.vertical(|ui| {
                ui.label(RichText::new(label).size(12.0).color(Colors::MUTED));
                ui.label(
                    RichText::new(tyre_text(value))
                        .size(16.0)
                        .strong()
                        .monospace()
                        .color(text),
                );
            });
        });
}

fn tyre_grid(ui: &mut Ui, tyres: Option<&Tyres>) {
    let t = |f: fn(&Tyres) -> Option<&RString>| tyres.and_then(f);
    egui::Grid::new("tyres")
        .spacing(egui::vec2(GAP, GAP))
        .show(ui, |ui| {
            tyre_cell(ui, "Front-left", t(|x| x.front_left.as_ref()));
            tyre_cell(ui, "Front-right", t(|x| x.front_right.as_ref()));
            ui.end_row();
            tyre_cell(ui, "Rear-left", t(|x| x.rear_left.as_ref()));
            tyre_cell(ui, "Rear-right", t(|x| x.rear_right.as_ref()));
            ui.end_row();
        });
}

/// Per-resource fetch errors, small and muted.
fn errors(ui: &mut Ui, data: Option<&VehicleData>) {
    let Some(d) = data else { return };
    for r in Resource::ALL {
        if let Some(e) = d.errors.get(&r) {
            ui.label(
                RichText::new(format!("{r:?}: {e}"))
                    .size(12.0)
                    .color(Colors::MUTED),
            );
        }
    }
}

/// The phone's unlock confirmation as a modal (the dashboard behind is
/// dimmed and blocked). `Some(true)` on Unlock, `Some(false)` on Cancel,
/// Escape or a click outside, `None` while undecided.
fn confirm_unlock(ctx: &egui::Context) -> Option<bool> {
    let mut answer = None;
    let modal = egui::Modal::new(egui::Id::unique("confirm_unlock")).show(ctx, |ui| {
        ui.set_max_width(360.0);
        ui.label(RichText::new("Unlock car").size(18.0).strong());
        ui.add_space(6.0);
        ui.label("After confirming, pull a door handle within the unlock window to open it.");
        ui.add_space(10.0);
        ui.horizontal(|ui| {
            if ui.button("Cancel").clicked() {
                answer = Some(false);
            }
            if ui
                .button(RichText::new("Unlock").color(Colors::RED))
                .clicked()
            {
                answer = Some(true);
            }
        });
    });
    if answer.is_none() && modal.should_close() {
        answer = Some(false);
    }
    answer
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pending_command_marker() {
        let mut s = DashboardState::default();
        assert!(!s.is_busy("A"));
        s.begin_command("A", CommandName::Lock);
        assert!(s.is_busy("A"));
        assert!(!s.is_busy("B"));
        // Answers for another car or command leave it set.
        s.finish_command(Some("B"), CommandName::Lock);
        s.finish_command(Some("A"), CommandName::Unlock);
        s.finish_command(None, CommandName::Honk);
        assert!(s.is_busy("A"));
        s.finish_command(Some("A"), CommandName::Lock);
        assert!(!s.is_busy("A"));
        // Errors carry no VIN and match on the command.
        s.begin_command("A", CommandName::Unlock);
        s.finish_command(None, CommandName::Unlock);
        assert!(!s.is_busy("A"));
    }

    #[test]
    fn selecting_another_car_drops_pending_state() {
        let mut s = DashboardState::default();
        s.begin_command("A", CommandName::Lock);
        s.confirm_unlock = Some("A".into());
        s.retain_vin("A");
        assert!(s.is_busy("A") && s.confirm_unlock.is_some());
        s.retain_vin("B");
        assert!(!s.is_busy("A") && !s.is_busy("B"));
        assert!(s.confirm_unlock.is_none());
    }

    #[test]
    fn tyre_levels_follow_the_phone_rules() {
        assert_eq!(tyre_level(None), TyreLevel::Unknown);
        assert_eq!(tyre_level(Some("NO_SENSOR")), TyreLevel::Unknown);
        assert_eq!(tyre_level(Some("UNSPECIFIED")), TyreLevel::Unknown);
        assert_eq!(tyre_level(Some("NO_WARNING")), TyreLevel::Ok);
        assert_eq!(tyre_level(Some("NORMAL")), TyreLevel::Ok);
        assert_eq!(tyre_level(Some("LOW_SOFT")), TyreLevel::Warn);
        assert_eq!(tyre_level(Some("HIGH_SOFT")), TyreLevel::Warn);
        assert_eq!(tyre_level(Some("LOW_PRESSURE_WARNING")), TyreLevel::Warn);
        assert_eq!(tyre_level(Some("LOW_HARD")), TyreLevel::Crit);
        assert_eq!(tyre_level(Some("VERY_LOW_PRESSURE")), TyreLevel::Crit);
        assert_eq!(tyre_text(Some("NO_WARNING")), "OK");
        assert_eq!(tyre_text(Some("VERY_LOW_PRESSURE")), "Very low pressure");
        assert_eq!(tyre_text(None), "—");
    }
}
