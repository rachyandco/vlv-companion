//! Left sidebar: car list and app actions.

use egui::{Align, Layout, RichText, Ui};

use crate::app::AppState;
use crate::theme::Colors;
use crate::ui::vehicle_label;
use crate::ui::widgets::{muted, section_title};

pub enum SidebarAction {
    Select(String),
    Refresh,
    Settings,
    SignOut,
}

pub fn show(ui: &mut Ui, state: &AppState) -> Option<SidebarAction> {
    let mut action = None;
    ui.add_space(14.0);
    ui.label(RichText::new("Vlv Companion").size(18.0).strong());
    if state.offline {
        ui.label(RichText::new("Offline").size(12.0).color(Colors::AMBER));
    }
    if state.signed_in {
        section_title(ui, "Vehicles");
        if state.garage.is_empty() {
            ui.label(muted("No vehicles yet").size(13.0));
        }
        for vin in state.garage.iter().filter_map(|v| v.vin.as_deref()) {
            let selected = state.selected_vin.as_deref() == Some(vin);
            let mut label = vehicle_label(&state.config, &state.vehicles, vin);
            if state
                .config
                .vehicle_prefs
                .get(&vin.to_uppercase())
                .is_some_and(|p| p.is_ev)
            {
                label.push_str("  ·  EV");
            }
            let r = ui.add_sized(
                [ui.available_width(), 32.0],
                egui::Button::selectable(selected, label),
            );
            if r.on_hover_text(vin).clicked() && !selected {
                action = Some(SidebarAction::Select(vin.to_string()));
            }
        }
    }
    ui.with_layout(Layout::bottom_up(Align::Min), |ui| {
        ui.add_space(14.0);
        let wide = [ui.available_width(), 30.0];
        if state.signed_in {
            if ui.add_sized(wide, egui::Button::new("Sign out")).clicked() {
                action = Some(SidebarAction::SignOut);
            }
            if ui.add_sized(wide, egui::Button::new("Settings")).clicked() {
                action = Some(SidebarAction::Settings);
            }
        }
        let can_refresh = state.signed_in && state.session_expired.is_none();
        if ui
            .add_enabled(
                can_refresh,
                egui::Button::new("Refresh").min_size(wide.into()),
            )
            .clicked()
        {
            action = Some(SidebarAction::Refresh);
        }
    });
    action
}
