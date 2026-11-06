//! Vehicle dashboard. This first version shows the model line and the
//! loading/error state; later tasks add the cards, map and controls.

use egui::{RichText, Ui};

use crate::state::cache::Resource;
use crate::theme::Colors;
use crate::ui::data::VehicleData;
use crate::ui::model_line;
use crate::ui::widgets::muted;

/// Per-dashboard UI state kept across frames.
#[derive(Debug, Default)]
pub struct DashboardState {}

/// Things the dashboard asks the app to do.
#[derive(Debug, Clone)]
pub enum DashboardAction {}

pub fn show(
    ui: &mut Ui,
    _state: &mut DashboardState,
    label: &str,
    data: Option<&VehicleData>,
) -> Vec<DashboardAction> {
    ui.add_space(12.0);
    ui.label(RichText::new(label).size(24.0).strong());
    if let Some(line) = data.and_then(|d| d.details.as_ref()).and_then(model_line) {
        if line != label {
            ui.label(muted(line));
        }
    }
    ui.add_space(8.0);
    let loaded = data.is_some_and(|d| d.last_updated.is_some());
    if !loaded {
        ui.label(muted("Loading…"));
    }
    if let Some(d) = data {
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
    Vec::new()
}
