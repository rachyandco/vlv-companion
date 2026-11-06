//! Sign-in screen: credentials, the phone's warnings, and the OAuth hand-off.

use egui::{RichText, TextEdit, Ui};

use crate::config::{is_legacy_client_id, Config, DEFAULT_REDIRECT, DEFAULT_SCOPES};
use crate::theme::Colors;
use crate::ui::widgets::{self, field, field_with_hint, muted, notice, primary_button, Level};

/// Editable copy of the credentials plus the hand-off state.
#[derive(Debug, Default, Clone)]
pub struct SignInForm {
    pub client_id: String,
    pub client_secret: String,
    pub vcc_api_key: String,
    /// Empty means the default bridge.
    pub redirect_uri: String,
    /// Space-separated; empty means the default scopes.
    pub scopes: String,
    pub callback_url: String,
    pub busy: bool,
    /// Set once the worker opened the authorize URL in the browser.
    pub authorize_url: Option<String>,
}

pub enum SignInAction {
    Connect(Config),
    FinishWithUrl(String),
}

impl SignInForm {
    /// Pre-fills from `cfg`; defaults show as empty fields with a placeholder.
    pub fn from_config(cfg: &Config) -> SignInForm {
        let redirect = cfg.redirect_uri.trim();
        let default_scopes = cfg.scopes.iter().map(String::as_str).eq(DEFAULT_SCOPES);
        SignInForm {
            client_id: cfg.client_id.clone(),
            client_secret: cfg.client_secret.clone(),
            vcc_api_key: cfg.vcc_api_key.clone(),
            redirect_uri: if redirect == DEFAULT_REDIRECT {
                String::new()
            } else {
                redirect.to_string()
            },
            scopes: if default_scopes {
                String::new()
            } else {
                cfg.scopes.join(" ")
            },
            ..Default::default()
        }
    }

    /// `base` with the form's credentials applied; blanks become defaults.
    pub fn to_config(&self, base: &Config) -> Config {
        Config {
            client_id: self.client_id.trim().to_string(),
            client_secret: self.client_secret.trim().to_string(),
            vcc_api_key: self.vcc_api_key.trim().to_string(),
            redirect_uri: redirect_or_default(&self.redirect_uri),
            scopes: scopes_or_default(&self.scopes),
            ..base.clone()
        }
    }
}

pub fn redirect_or_default(s: &str) -> String {
    match s.trim() {
        "" => DEFAULT_REDIRECT.to_string(),
        s => s.to_string(),
    }
}

pub fn scopes_or_default(s: &str) -> Vec<String> {
    let v: Vec<String> = s.split_whitespace().map(str::to_owned).collect();
    if v.is_empty() {
        DEFAULT_SCOPES.iter().map(|s| s.to_string()).collect()
    } else {
        v
    }
}

fn using_default_redirect(value: &str) -> bool {
    let t = value.trim();
    t.is_empty() || t == DEFAULT_REDIRECT
}

/// The five credential fields shared with Settings.
pub fn credential_fields(
    ui: &mut Ui,
    client_id: &mut String,
    client_secret: &mut String,
    vcc_api_key: &mut String,
    redirect_uri: &mut String,
    scopes: &mut String,
) {
    field_with_hint(
        ui,
        "OAuth client id",
        client_id,
        false,
        "From the Volvo portal",
    );
    field_with_hint(
        ui,
        "OAuth client secret",
        client_secret,
        true,
        "From the Volvo portal",
    );
    field_with_hint(ui, "VCC API key", vcc_api_key, true, "VCC-API-Key");
    field_with_hint(ui, "Redirect URI", redirect_uri, false, DEFAULT_REDIRECT);
    field_with_hint(
        ui,
        "OAuth scopes (space-separated)",
        scopes,
        false,
        "openid conve:vehicle_relation ...",
    );
}

/// The phone's warnings for a `dc-` client id and the default bridge.
pub fn credential_warnings(ui: &mut Ui, client_id: &str, redirect_uri: &str) {
    if is_legacy_client_id(client_id) {
        notice(
            ui,
            "This client id belongs to the retired Volvo ID service",
            "Volvo moved Volvo ID to a new sign-in service and applications whose client id \
             starts with dc- no longer work. Create a new application on developer.volvocars.com \
             with the same redirect URI and scopes, then paste its vid- client id and new client \
             secret above.",
            Level::Danger,
        );
        ui.add_space(10.0);
    }
    if using_default_redirect(redirect_uri) {
        notice(
            ui,
            "Using a third-party default bridge",
            &format!(
                "Leaving Redirect URI blank routes the OAuth callback through {DEFAULT_REDIRECT}, \
                 a personal domain not run by Volvo or this project. PKCE keeps your access token \
                 off that server, but the auth code transits it (and appears in its logs). For \
                 the strongest guarantees, host the page in redirect/ on your own HTTPS endpoint \
                 and paste that URL above."
            ),
            Level::Danger,
        );
        ui.add_space(10.0);
    }
}

/// Connect button, the authorize URL fallback and the paste-back field.
pub fn connect_controls(ui: &mut Ui, form: &mut SignInForm, cfg: &Config) -> Option<SignInAction> {
    let mut action = None;
    let label = if form.busy {
        "Opening browser…"
    } else {
        "Connect Volvo account"
    };
    let clicked = ui
        .add_enabled_ui(!form.busy, |ui| primary_button(ui, label))
        .inner;
    if clicked {
        action = Some(SignInAction::Connect(form.to_config(cfg)));
    }
    if let Some(url) = &form.authorize_url {
        ui.add_space(8.0);
        ui.label(muted("If the browser did not open, copy this URL:").size(13.0));
        let mut shown = url.as_str();
        ui.add(
            TextEdit::multiline(&mut shown)
                .desired_width(f32::INFINITY)
                .desired_rows(2)
                .font(egui::TextStyle::Monospace),
        );
    }
    ui.add_space(12.0);
    field(
        ui,
        "Callback URL (if the browser could not return to this app, paste the volvo-companion://oauth/callback… address here)",
        &mut form.callback_url,
        false,
    );
    let ready = !form.callback_url.trim().is_empty();
    let finish = ui
        .add_enabled_ui(ready, |ui| ui.button("Finish sign-in").clicked())
        .inner;
    if finish {
        action = Some(SignInAction::FinishWithUrl(
            form.callback_url.trim().to_string(),
        ));
    }
    action
}

/// The full sign-in screen.
pub fn show(ui: &mut Ui, form: &mut SignInForm, cfg: &Config) -> Option<SignInAction> {
    ui.add_space(12.0);
    ui.label(RichText::new("Vlv Companion").size(28.0).strong());
    ui.add_space(4.0);
    ui.label(
        muted(
            "Connect your Volvo account to read vehicle status and send commands. \
             No Google services required.",
        )
        .size(15.0),
    );
    ui.label(
        RichText::new(
            "Independent project. Not affiliated with, endorsed by, or sponsored by Volvo Car \
             Corporation, AB Volvo, or their affiliates.",
        )
        .size(11.0)
        .color(Colors::DIM),
    );
    ui.add_space(16.0);

    widgets::section_title(ui, "Volvo developer credentials");
    credential_fields(
        ui,
        &mut form.client_id,
        &mut form.client_secret,
        &mut form.vcc_api_key,
        &mut form.redirect_uri,
        &mut form.scopes,
    );
    ui.add_space(6.0);
    credential_warnings(ui, &form.client_id, &form.redirect_uri);

    let action = connect_controls(ui, form, cfg);

    ui.add_space(16.0);
    notice(
        ui,
        "Volvo portal won’t accept custom-scheme redirects",
        "The portal requires an https:// redirect URI. Host the static page from the repo’s \
         redirect/ folder on any HTTPS endpoint (Cloudflare Pages, GitHub Pages, Vercel, etc.). \
         Register that URL in the portal AND paste it above. The page bounces the OAuth response \
         back into the app via the deep link volvo-companion://oauth/callback.\n\n\
         Also confirm your developer-portal app is in the Published state — an unpublished app \
         yields invalid_request.",
        Level::Warn,
    );
    ui.add_space(12.0);
    ui.vertical_centered(|ui| {
        ui.label(
            muted(
                "OAuth runs in your system browser via PKCE. Tokens stay on this computer, \
                 in a file only your user can read.",
            )
            .size(12.0),
        );
    });
    ui.add_space(12.0);
    action
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_show_as_blank_and_blank_saves_defaults() {
        let cfg = Config::default();
        let form = SignInForm::from_config(&cfg);
        assert!(form.redirect_uri.is_empty() && form.scopes.is_empty());
        let back = form.to_config(&cfg);
        assert_eq!(back.redirect_uri, DEFAULT_REDIRECT);
        assert_eq!(back.scopes.len(), DEFAULT_SCOPES.len());
    }
}
