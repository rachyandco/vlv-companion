use std::collections::BTreeMap;
use std::fs;
use std::io::{self, Write};
use std::os::unix::fs::{DirBuilderExt, OpenOptionsExt, PermissionsExt};
use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::paths::Paths;

pub const DEFAULT_REDIRECT: &str = "https://volvo.roussel-zeter.eu/redirect/";
pub const DEFAULT_SCOPES: [&str; 25] = [
    "openid",
    "conve:vehicle_relation",
    "conve:fuel_status",
    "conve:battery_charge_level",
    "conve:odometer_status",
    "conve:doors_status",
    "conve:windows_status",
    "conve:lock_status",
    "conve:lock",
    "conve:unlock",
    "conve:tyre_status",
    "conve:engine_status",
    "conve:engine_start_stop",
    "conve:climatization_start_stop",
    "conve:honk_flash",
    "conve:warnings",
    "conve:diagnostics_engine_status",
    "conve:diagnostics_workshop",
    "conve:brake_status",
    "conve:command_accessibility",
    "conve:commands",
    "conve:trip_statistics",
    "energy:state:read",
    "energy:capability:read",
    "location:read",
];

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(default)]
pub struct VehiclePrefs {
    pub name: Option<String>,
    pub is_ev: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(default)]
pub struct Config {
    pub client_id: String,
    pub client_secret: String,
    pub vcc_api_key: String,
    pub redirect_uri: String,
    pub scopes: Vec<String>,
    pub tile_url_template: Option<String>,
    pub selected_vin: Option<String>,
    /// Keyed by upper-case VIN.
    pub vehicle_prefs: BTreeMap<String, VehiclePrefs>,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            client_id: String::new(),
            client_secret: String::new(),
            vcc_api_key: String::new(),
            redirect_uri: DEFAULT_REDIRECT.to_string(),
            scopes: DEFAULT_SCOPES.iter().map(|s| s.to_string()).collect(),
            tile_url_template: None,
            selected_vin: None,
            vehicle_prefs: BTreeMap::new(),
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(default)]
pub struct Tokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at_unix: i64,
    pub id_token: Option<String>,
    /// VIN -> unix milliseconds.
    pub climate_started_at: BTreeMap<String, i64>,
}

pub fn is_legacy_client_id(id: &str) -> bool {
    id.trim().to_ascii_lowercase().starts_with("dc-")
}

fn write_atomic(dir: &Path, name: &str, bytes: &[u8]) -> io::Result<()> {
    fs::DirBuilder::new()
        .recursive(true)
        .mode(0o700)
        .create(dir)?;
    let tmp = dir.join(format!("{name}.tmp"));
    {
        let mut f = fs::OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .mode(0o600)
            .open(&tmp)?;
        // The temp file may pre-exist with looser permissions.
        f.set_permissions(fs::Permissions::from_mode(0o600))?;
        f.write_all(bytes)?;
        f.sync_all()?;
    }
    fs::rename(&tmp, dir.join(name))
}

pub fn load_config(p: &Paths) -> Config {
    let mut cfg: Config = fs::read(p.config_dir.join("config.json"))
        .ok()
        .and_then(|b| serde_json::from_slice(&b).ok())
        .unwrap_or_default();
    upgrade_default_scopes(&mut cfg.scopes);
    cfg
}

/// Scopes that older builds' default list lacked.
const SCOPES_ADDED_LATER: [&str; 1] = ["conve:diagnostics_workshop"];

/// A stored scope list that is exactly an older default set (ignoring order)
/// is replaced by the current default; a customised list is left alone.
/// Returns true when the list changed.
pub fn upgrade_default_scopes(scopes: &mut Vec<String>) -> bool {
    use std::collections::BTreeSet;
    let have: BTreeSet<&str> = scopes.iter().map(String::as_str).collect();
    let current: BTreeSet<&str> = DEFAULT_SCOPES.iter().copied().collect();
    let older: BTreeSet<&str> = DEFAULT_SCOPES
        .iter()
        .copied()
        .filter(|s| !SCOPES_ADDED_LATER.contains(s))
        .collect();
    if have.is_empty() || have == current || have != older {
        return false;
    }
    *scopes = DEFAULT_SCOPES.iter().map(|s| s.to_string()).collect();
    true
}

pub fn save_config(p: &Paths, c: &Config) -> io::Result<()> {
    let bytes = serde_json::to_vec_pretty(c).map_err(io::Error::other)?;
    write_atomic(&p.config_dir, "config.json", &bytes)
}

pub fn load_tokens(p: &Paths) -> Option<Tokens> {
    let b = fs::read(p.state_dir.join("tokens.json")).ok()?;
    serde_json::from_slice(&b).ok()
}

pub fn save_tokens(p: &Paths, t: &Tokens) -> io::Result<()> {
    let bytes = serde_json::to_vec_pretty(t).map_err(io::Error::other)?;
    write_atomic(&p.state_dir, "tokens.json", &bytes)
}

pub fn clear_tokens(p: &Paths) -> io::Result<()> {
    match fs::remove_file(p.state_dir.join("tokens.json")) {
        Err(e) if e.kind() != io::ErrorKind::NotFound => Err(e),
        _ => Ok(()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_has_25_scopes_and_no_offline_access() {
        let c = Config::default();
        assert_eq!(c.scopes.len(), 25);
        assert!(!c.scopes.iter().any(|s| s == "offline_access"));
        assert_eq!(c.redirect_uri, "https://volvo.roussel-zeter.eu/redirect/");
    }
    #[test]
    fn save_then_load_round_trips_and_sets_0600() {
        let dir = tempfile::tempdir().unwrap();
        let p = Paths::in_dir(dir.path());
        let c = Config {
            client_id: "vid-dcr-x".into(),
            ..Default::default()
        };
        save_config(&p, &c).unwrap();
        let mode = std::fs::metadata(p.config_dir.join("config.json"))
            .unwrap()
            .permissions()
            .mode()
            & 0o777;
        assert_eq!(mode, 0o600);
        assert_eq!(
            std::fs::metadata(&p.config_dir)
                .unwrap()
                .permissions()
                .mode()
                & 0o777,
            0o700
        );
        assert_eq!(load_config(&p).client_id, "vid-dcr-x");
    }
    #[test]
    fn tokens_parse_failure_yields_none() {
        let dir = tempfile::tempdir().unwrap();
        let p = Paths::in_dir(dir.path());
        std::fs::create_dir_all(&p.state_dir).unwrap();
        std::fs::write(p.state_dir.join("tokens.json"), b"{\"access_token\": 12").unwrap();
        assert!(load_tokens(&p).is_none());
    }
    #[test]
    fn tokens_with_unknown_fields_still_load() {
        let dir = tempfile::tempdir().unwrap();
        let p = Paths::in_dir(dir.path());
        std::fs::create_dir_all(&p.state_dir).unwrap();
        std::fs::write(
            p.state_dir.join("tokens.json"),
            br#"{"access_token":"a","expires_at_unix":1,"future":true}"#,
        )
        .unwrap();
        assert_eq!(load_tokens(&p).unwrap().access_token, "a");
    }
    #[test]
    fn legacy_client_ids() {
        assert!(is_legacy_client_id(" DC-abc "));
        assert!(!is_legacy_client_id("vid-dcr-abc"));
    }

    #[test]
    fn old_default_scope_list_is_upgraded_but_custom_lists_are_kept() {
        let older: Vec<String> = DEFAULT_SCOPES
            .iter()
            .filter(|s| **s != "conve:diagnostics_workshop")
            .map(|s| s.to_string())
            .collect();
        let mut v = older.clone();
        assert!(upgrade_default_scopes(&mut v));
        assert_eq!(v.len(), 25);
        let mut rev: Vec<String> = older.iter().rev().cloned().collect();
        assert!(upgrade_default_scopes(&mut rev));
        let mut current: Vec<String> = DEFAULT_SCOPES.iter().map(|s| s.to_string()).collect();
        assert!(!upgrade_default_scopes(&mut current));
        let mut custom = vec!["openid".to_string(), "conve:lock".to_string()];
        assert!(!upgrade_default_scopes(&mut custom));
        assert_eq!(custom.len(), 2);
    }
}
