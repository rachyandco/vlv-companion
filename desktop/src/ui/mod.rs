//! Screens and widgets drawn by `app::App`.

use std::collections::HashMap;

use crate::config::Config;

pub mod car_view;
pub mod cards;
pub mod commands_bar;
pub mod dashboard;
pub mod data;
pub mod energy;
pub mod health;
pub mod map;
pub mod settings;
pub mod sidebar;
pub mod sign_in;
pub mod widgets;

/// Display name of a car: the user's name for it, else "{model year} {model}"
/// from the details, else the VIN.
pub fn vehicle_label(
    cfg: &Config,
    vehicles: &HashMap<String, data::VehicleData>,
    vin: &str,
) -> String {
    if let Some(name) = cfg
        .vehicle_prefs
        .get(&vin.to_uppercase())
        .and_then(|p| p.name.as_deref())
        .filter(|n| !n.trim().is_empty())
    {
        return name.to_string();
    }
    vehicles
        .get(vin)
        .and_then(|d| d.details.as_ref())
        .and_then(model_line)
        .unwrap_or_else(|| vin.to_string())
}

/// "{model year} {model}" when the details carry at least one of them.
pub fn model_line(d: &crate::api::models::VehicleDetails) -> Option<String> {
    let model = d.descriptions.as_ref().and_then(|x| x.model.as_deref());
    match (d.model_year, model) {
        (Some(y), Some(m)) => Some(format!("{y} {m}")),
        (None, Some(m)) => Some(m.to_string()),
        (Some(y), None) => Some(y.to_string()),
        (None, None) => None,
    }
}
