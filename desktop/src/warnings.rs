//! Warning and engine-state descriptions, ported from the phone app
//! (`src/lib/warnings.ts`, `src/lib/engine.ts`).

use std::collections::BTreeMap;

use crate::api::models::RString;

/// How a warning field reads: fine, needs attention, or not reported.
#[allow(dead_code)] // used by the health row (Task 13)
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Level3 {
    Ok,
    Warn,
    Unknown,
}

fn capitalise(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        Some(first) => first.to_uppercase().chain(c).collect(),
        None => String::new(),
    }
}

/// "TOO_LOW" -> "Too low".
pub fn humanize_value(v: &str) -> String {
    capitalise(&v.to_lowercase().replace('_', " "))
}

/// Text and level of a warning field: `NO_WARNING`/`NONE`/`OK` are fine,
/// `UNSPECIFIED` or a missing field is unknown, anything else is a warning.
#[allow(dead_code)] // used by the health row (Task 13)
pub fn describe(field: Option<&RString>) -> (String, Level3) {
    let Some(field) = field else {
        return ("—".into(), Level3::Unknown);
    };
    match field.value.to_uppercase().as_str() {
        "NO_WARNING" | "NONE" | "OK" => ("OK".into(), Level3::Ok),
        "UNSPECIFIED" => ("—".into(), Level3::Unknown),
        _ => (humanize_value(&field.value), Level3::Warn),
    }
}

/// "brakeLightCenterWarning" -> "Brake light center".
#[allow(dead_code)] // used by the health row (Task 13)
pub fn humanize_key(k: &str) -> String {
    let base = k.strip_suffix("Warning").unwrap_or(k);
    let mut out = String::with_capacity(base.len() + 4);
    let mut prev: Option<char> = None;
    for c in base.chars() {
        if c.is_ascii_uppercase()
            && prev.is_some_and(|p| p.is_ascii_lowercase() || p.is_ascii_digit())
        {
            out.push(' ');
        }
        out.push(c);
        prev = Some(c);
    }
    capitalise(&out.to_lowercase())
}

/// (label, text) of every entry that is a warning, in map order.
#[allow(dead_code)] // used by the health row (Task 13)
pub fn active(map: &BTreeMap<String, RString>) -> Vec<(String, String)> {
    map.iter()
        .filter_map(|(k, f)| match describe(Some(f)) {
            (text, Level3::Warn) => Some((humanize_key(k), text)),
            _ => None,
        })
        .collect()
}

/// "Engine running" / "Engine off", or nothing for other states.
pub fn engine_label(field: Option<&RString>) -> Option<&'static str> {
    match field?.value.to_uppercase().as_str() {
        "RUNNING" => Some("Engine running"),
        "STOPPED" => Some("Engine off"),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn f(value: &str) -> RString {
        RString {
            value: value.to_string(),
            updated_at: Some("2026-11-06T00:00:00Z".into()),
            unit: None,
        }
    }

    #[test]
    fn no_warning_none_and_ok_are_ok() {
        for v in ["NO_WARNING", "NONE", "OK", "no_warning"] {
            assert_eq!(describe(Some(&f(v))), ("OK".to_string(), Level3::Ok));
        }
    }

    #[test]
    fn unspecified_and_missing_are_unknown() {
        assert_eq!(
            describe(Some(&f("UNSPECIFIED"))),
            ("—".to_string(), Level3::Unknown)
        );
        assert_eq!(describe(None), ("—".to_string(), Level3::Unknown));
    }

    #[test]
    fn anything_else_is_a_humanised_warning() {
        assert_eq!(
            describe(Some(&f("TOO_LOW"))),
            ("Too low".to_string(), Level3::Warn)
        );
        assert_eq!(
            describe(Some(&f("FAILURE"))),
            ("Failure".to_string(), Level3::Warn)
        );
    }

    #[test]
    fn humanize_key_splits_camel_case_and_drops_warning() {
        assert_eq!(
            humanize_key("brakeLightCenterWarning"),
            "Brake light center"
        );
        assert_eq!(humanize_key("oilLevelWarning"), "Oil level");
    }

    #[test]
    fn active_returns_only_warn_entries_in_map_order() {
        let mut m = BTreeMap::new();
        m.insert("brakeLightCenterWarning".to_string(), f("NO_WARNING"));
        m.insert("lowBeamLeftWarning".to_string(), f("FAILURE"));
        m.insert("fogLightRearWarning".to_string(), f("UNSPECIFIED"));
        m.insert("turnIndicationRearRightWarning".to_string(), f("TOO_LOW"));
        assert_eq!(
            active(&m),
            vec![
                ("Low beam left".to_string(), "Failure".to_string()),
                (
                    "Turn indication rear right".to_string(),
                    "Too low".to_string()
                ),
            ]
        );
    }

    #[test]
    fn active_is_empty_when_everything_is_fine() {
        assert!(active(&BTreeMap::new()).is_empty());
        let mut m = BTreeMap::new();
        m.insert("brakeLightCenterWarning".to_string(), f("NO_WARNING"));
        m.insert("hazardLightsWarning".to_string(), f("no_warning"));
        assert!(active(&m).is_empty());
    }

    #[test]
    fn engine_label_maps_running_and_stopped() {
        assert_eq!(engine_label(Some(&f("RUNNING"))), Some("Engine running"));
        assert_eq!(engine_label(Some(&f("stopped"))), Some("Engine off"));
        assert_eq!(engine_label(Some(&f("UNSPECIFIED"))), None);
        assert_eq!(engine_label(None), None);
    }
}
