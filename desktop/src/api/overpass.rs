//! EV charging stations from OpenStreetMap via Overpass (port of the phone's
//! `chargingStations.ts`).

use super::error::{from_response, ApiError};
use serde_json::Value;
use std::collections::BTreeMap;

const ENDPOINT: &str = "https://overpass-api.de/api/interpreter";

#[derive(Clone, Debug, PartialEq)]
pub struct Connection {
    pub kind: String,
    pub power_kw: Option<f64>,
    pub quantity: Option<u32>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ChargingStation {
    pub id: String,
    pub latitude: f64,
    pub longitude: f64,
    pub name: Option<String>,
    pub address: Option<String>,
    pub operator: Option<String>,
    pub usage_type: Option<String>,
    pub connections: Vec<Connection>,
}

pub async fn fetch(
    http: &reqwest::Client,
    lat: f64,
    lon: f64,
    radius_m: u32,
) -> Result<Vec<ChargingStation>, ApiError> {
    let query = format!(
        "[out:json][timeout:20];node[\"amenity\"=\"charging_station\"](around:{radius_m},{lat},{lon});out body;"
    );
    let body = url::form_urlencoded::Serializer::new(String::new())
        .append_pair("data", &query)
        .finish();
    let res = http
        .post(ENDPOINT)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .header(
            "User-Agent",
            format!("VlvCompanion/{} (linux-desktop)", env!("CARGO_PKG_VERSION")),
        )
        .body(body)
        .send()
        .await
        .map_err(|e| ApiError::Network(e.to_string()))?;
    let status = res.status();
    let text = res
        .text()
        .await
        .map_err(|e| ApiError::Network(e.to_string()))?;
    if !status.is_success() {
        return Err(from_response(
            status.as_u16(),
            status.canonical_reason().unwrap_or(""),
            &text,
        ));
    }
    Ok(parse(&text))
}

pub fn parse(body: &str) -> Vec<ChargingStation> {
    let Ok(json) = serde_json::from_str::<Value>(body) else {
        return Vec::new();
    };
    let Some(elements) = json.get("elements").and_then(Value::as_array) else {
        return Vec::new();
    };
    elements.iter().filter_map(station).collect()
}

fn station(e: &Value) -> Option<ChargingStation> {
    if e.get("type")?.as_str()? != "node" {
        return None;
    }
    let id = e.get("id")?.as_i64()?;
    let latitude = e.get("lat")?.as_f64()?;
    let longitude = e.get("lon")?.as_f64()?;
    let tags: BTreeMap<String, String> = e
        .get("tags")
        .and_then(Value::as_object)
        .map(|m| {
            m.iter()
                .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_owned())))
                .collect()
        })
        .unwrap_or_default();
    let tag = |k: &str| tags.get(k).filter(|v| !v.is_empty()).cloned();
    Some(ChargingStation {
        id: format!("osm:{id}"),
        latitude,
        longitude,
        name: tag("name"),
        address: compose_address(&tags),
        operator: tag("operator").or_else(|| tag("brand")),
        usage_type: tag("access").map(|a| pretty_access(&a)),
        connections: collect_connections(&tags),
    })
}

fn compose_address(tags: &BTreeMap<String, String>) -> Option<String> {
    let join = |keys: [&str; 2]| {
        keys.iter()
            .filter_map(|k| tags.get(*k).filter(|v| !v.is_empty()).map(String::as_str))
            .collect::<Vec<_>>()
            .join(" ")
    };
    let street = join(["addr:housenumber", "addr:street"]);
    let city = join(["addr:postcode", "addr:city"]);
    let parts: Vec<String> = [street, city]
        .into_iter()
        .filter(|s| !s.is_empty())
        .collect();
    if parts.is_empty() {
        None
    } else {
        Some(parts.join(", "))
    }
}

fn pretty_access(value: &str) -> String {
    match value.to_lowercase().as_str() {
        "yes" | "public" => "Public".into(),
        "private" => "Private".into(),
        "customers" | "permit" => "Customers only".into(),
        _ => value.to_owned(),
    }
}

fn collect_connections(tags: &BTreeMap<String, String>) -> Vec<Connection> {
    let mut out = Vec::new();
    for (key, value) in tags {
        let Some(standard) = key.strip_prefix("socket:") else {
            continue;
        };
        if key.contains(":output") || key.ends_with(":voltage") || key.ends_with(":current") {
            continue;
        }
        if value.is_empty() || value == "no" {
            continue;
        }
        out.push(Connection {
            kind: standard.to_owned(),
            power_kw: tags
                .get(&format!("socket:{standard}:output"))
                .and_then(|p| parse_power(p)),
            quantity: parse_leading_int(value).filter(|n| *n > 0),
        });
    }
    out
}

/// Like JS `parseInt`: leading digits, ignoring trailing text.
fn parse_leading_int(s: &str) -> Option<u32> {
    let t = s.trim_start();
    let end = t.find(|c: char| !c.is_ascii_digit()).unwrap_or(t.len());
    t[..end].parse().ok()
}

/// Port of `parsePower`: `([\d.]+)\s*(k?W)` case-insensitive, result in kW.
fn parse_power(raw: &str) -> Option<f64> {
    let lower = raw.to_lowercase();
    let b = lower.as_bytes();
    let mut i = 0;
    while i < b.len() {
        if b[i].is_ascii_digit() || b[i] == b'.' {
            let start = i;
            while i < b.len() && (b[i].is_ascii_digit() || b[i] == b'.') {
                i += 1;
            }
            let rest = lower[i..].trim_start();
            let kilo = rest.starts_with("kw");
            if kilo || rest.starts_with('w') {
                let n: f64 = lower[start..i].parse().ok()?;
                return Some(if kilo { n } else { n / 1000.0 });
            }
        } else {
            i += 1;
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    const FIXTURE: &str = r#"{"elements":[
      {"type":"node","id":1,"lat":46.2,"lon":6.1,"tags":{"name":"Station A","operator":"Op",
        "addr:housenumber":"12","addr:street":"Rue X","addr:postcode":"1200","addr:city":"Geneva",
        "access":"customers","socket:type2":"2","socket:type2:output":"22 kW"}},
      {"type":"node","id":2,"lat":46.3,"lon":6.2},
      {"type":"way","id":3}
    ]}"#;

    #[test]
    fn parses_tagged_and_untagged_nodes() {
        let s = parse(FIXTURE);
        assert_eq!(s.len(), 2);
        assert_eq!(s[0].id, "osm:1");
        assert_eq!(s[0].latitude, 46.2);
        assert_eq!(s[0].longitude, 6.1);
        assert_eq!(s[0].name.as_deref(), Some("Station A"));
        assert_eq!(s[0].operator.as_deref(), Some("Op"));
        assert_eq!(s[0].usage_type.as_deref(), Some("Customers only"));
        assert_eq!(s[0].address.as_deref(), Some("12 Rue X, 1200 Geneva"));
        assert_eq!(
            s[0].connections[0],
            Connection {
                kind: "type2".into(),
                power_kw: Some(22.0),
                quantity: Some(2)
            }
        );
        assert_eq!(s[1].id, "osm:2");
        assert_eq!(s[1].name, None);
        assert!(s[1].connections.is_empty());
    }

    #[test]
    fn watts_are_converted() {
        let b = r#"{"elements":[{"type":"node","id":5,"lat":1.0,"lon":2.0,"tags":{"brand":"B","socket:chademo":"1","socket:chademo:output":"50000 W"}}]}"#;
        let s = parse(b);
        assert_eq!(s[0].operator.as_deref(), Some("B"));
        assert_eq!(s[0].connections[0].power_kw, Some(50.0));
    }

    #[test]
    fn invalid_json_gives_empty() {
        assert!(parse("not json").is_empty());
    }
}
