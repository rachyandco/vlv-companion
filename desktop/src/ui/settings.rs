//! Settings screen: credentials, map tiles, per-car preferences.

use egui::{RichText, Ui};

use crate::api::models::VehicleListItem;
use crate::config::Config;
use crate::theme::{card, Colors};
use crate::ui::sign_in::{credential_fields, credential_warnings, scopes_or_default};
use crate::ui::widgets::{field_with_hint, muted, primary_button, section_title};

/// The config being edited. Scopes are edited as one string so typing a
/// space does not get normalised away mid-edit.
#[derive(Debug, Clone)]
pub struct SettingsDraft {
    pub config: Config,
    pub scopes: String,
}

pub enum SettingsAction {
    Save(Config),
    Cancel,
}

impl SettingsDraft {
    pub fn new(cfg: &Config) -> SettingsDraft {
        SettingsDraft {
            config: cfg.clone(),
            scopes: cfg.scopes.join(" "),
        }
    }

    /// The draft with blanks normalised: default redirect and scopes, no
    /// empty tile template or car name, no all-default car entries.
    pub fn finish(&self) -> Config {
        let mut c = self.config.clone();
        c.client_id = c.client_id.trim().to_string();
        c.client_secret = c.client_secret.trim().to_string();
        c.vcc_api_key = c.vcc_api_key.trim().to_string();
        c.redirect_uri = crate::ui::sign_in::redirect_or_default(&c.redirect_uri);
        c.scopes = scopes_or_default(&self.scopes);
        c.tile_url_template = c
            .tile_url_template
            .map(|t| t.trim().to_string())
            .filter(|t| !t.is_empty());
        for prefs in c.vehicle_prefs.values_mut() {
            prefs.name = prefs
                .name
                .take()
                .map(|n| n.trim().to_string())
                .filter(|n| !n.is_empty());
        }
        c.vehicle_prefs.retain(|_, p| p.name.is_some() || p.is_ev);
        c
    }
}

const TRADEMARK: &str = "Vlv Companion is an independent open-source project. It is not \
    affiliated with, endorsed by, sponsored by, certified by, or otherwise authorised by Volvo \
    Car Corporation, AB Volvo, Volvo Car USA, LLC, the Volvo Trademark Holding AB, or any other \
    Volvo company.";

pub fn show(
    ui: &mut Ui,
    draft: &mut SettingsDraft,
    garage: &[VehicleListItem],
) -> Option<SettingsAction> {
    let mut action = None;
    ui.add_space(12.0);
    ui.label(RichText::new("Settings").size(24.0).strong());
    ui.add_space(8.0);

    section_title(ui, "Volvo developer credentials");
    ui.label(
        muted(
            "Register and publish an app at developer.volvocars.com to receive your client id \
             and VCC API key. Set the redirect URI in the portal to your HTTPS bridge URL.",
        )
        .size(13.0),
    );
    ui.add_space(6.0);
    let c = &mut draft.config;
    credential_fields(
        ui,
        &mut c.client_id,
        &mut c.client_secret,
        &mut c.vcc_api_key,
        &mut c.redirect_uri,
        &mut draft.scopes,
    );
    credential_warnings(ui, &c.client_id, &c.redirect_uri);

    section_title(ui, "Map");
    field_with_hint(
        ui,
        "Tile URL template",
        c.tile_url_template.get_or_insert_with(String::new),
        false,
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    );
    ui.label(
        muted("Raster XYZ tiles. Leave blank to keep the map off; respect the tile server's usage policy.")
            .size(12.0),
    );

    let vins: Vec<String> = garage.iter().filter_map(|v| v.vin.clone()).collect();
    if !vins.is_empty() {
        section_title(ui, "Vehicles");
        for vin in vins {
            let prefs = c.vehicle_prefs.entry(vin.to_uppercase()).or_default();
            card(ui, |ui| {
                ui.set_width(ui.available_width());
                ui.label(RichText::new(&vin).monospace().color(Colors::MUTED));
                ui.add_space(4.0);
                field_with_hint(
                    ui,
                    "Name",
                    prefs.name.get_or_insert_with(String::new),
                    false,
                    "Model year and model",
                );
                ui.checkbox(&mut prefs.is_ev, "Electric vehicle");
            });
            ui.add_space(8.0);
        }
    }

    ui.add_space(12.0);
    ui.horizontal(|ui| {
        if primary_button(ui, "Save") {
            action = Some(SettingsAction::Save(draft.finish()));
        }
        if ui.button("Cancel").clicked() {
            action = Some(SettingsAction::Cancel);
        }
    });

    ui.add_space(20.0);
    ui.label(RichText::new(TRADEMARK).size(11.0).color(Colors::DIM));
    ui.add_space(12.0);
    action
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::VehiclePrefs;

    #[test]
    fn finish_normalises_blanks() {
        let mut d = SettingsDraft::new(&Config::default());
        d.scopes = "  ".into();
        d.config.redirect_uri = " ".into();
        d.config.tile_url_template = Some(" ".into());
        d.config.vehicle_prefs.insert(
            "YV1".into(),
            VehiclePrefs {
                name: Some(" ".into()),
                is_ev: false,
            },
        );
        let c = d.finish();
        assert_eq!(c, Config::default());
    }
}
