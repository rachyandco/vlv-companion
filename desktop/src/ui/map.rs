//! Dashboard map: the car's last position on raster tiles from the user's
//! tile server, with an optional overlay of nearby EV chargers.

use std::path::Path;

use egui::{Color32, Pos2, RichText, Stroke, Ui};
use walkers::sources::{Attribution, TileSource};
use walkers::{lat_lon, HeaderValue, HttpOptions, HttpTiles, Map, MapMemory, TileId, Tiles};

use crate::api::models::ParsedLocation;
use crate::api::overpass::{ChargingStation, Connection};
use crate::theme::{card, Colors};
use crate::ui::dashboard::DashboardAction;
use crate::ui::widgets::{muted, primary_button};
use crate::worker::session::USER_AGENT;

/// The public OpenStreetMap tile server, offered as a one-click opt-in.
pub const OSM_TEMPLATE: &str = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_POLICY: &str = "https://operations.osmfoundation.org/policies/tiles/";
const OSM_ATTRIBUTION: &str = "© OpenStreetMap contributors";
const OSM_COPYRIGHT: &str = "https://www.openstreetmap.org/copyright";
/// Height of the map widget itself.
pub const MAP_HEIGHT: f32 = 300.0;
const START_ZOOM: f64 = 14.0;
/// A click this close to a station marker (in points) selects it.
const HIT_RADIUS: f32 = 12.0;
const STATION_GREEN: Color32 = Color32::from_rgb(0x22, 0xc5, 0x5e);

/// `template` with `{z}`, `{x}` and `{y}` replaced by the tile's coordinates.
pub fn tile_url(template: &str, id: TileId) -> String {
    template
        .replace("{z}", &id.zoom.to_string())
        .replace("{x}", &id.x.to_string())
        .replace("{y}", &id.y.to_string())
}

/// Attribution text and link for a template: the OSM notice for
/// openstreetmap.org servers, else the server's host.
pub fn attribution_for(template: &str) -> (String, String) {
    let parsed = url::Url::parse(template).ok();
    let host = parsed
        .as_ref()
        .and_then(|u| u.host_str())
        .map(str::to_owned);
    match host {
        Some(h) if h == "openstreetmap.org" || h.ends_with(".openstreetmap.org") => {
            (OSM_ATTRIBUTION.into(), OSM_COPYRIGHT.into())
        }
        Some(h) => {
            let scheme = parsed.as_ref().map_or("https", |u| u.scheme());
            (h.clone(), format!("{scheme}://{h}"))
        }
        None => (template.to_string(), String::new()),
    }
}

/// A raster XYZ source built from the user's URL template.
struct TemplateSource {
    template: String,
    /// Walkers wants `'static` strings; leaked once per template change.
    text: &'static str,
    url: &'static str,
}

impl TemplateSource {
    fn new(template: &str) -> TemplateSource {
        let (text, url) = attribution_for(template);
        TemplateSource {
            template: template.to_string(),
            text: Box::leak(text.into_boxed_str()),
            url: Box::leak(url.into_boxed_str()),
        }
    }
}

impl TileSource for TemplateSource {
    fn tile_url(&self, tile_id: TileId) -> String {
        tile_url(&self.template, tile_id)
    }

    fn attribution(&self) -> Attribution {
        Attribution {
            text: self.text,
            url: self.url,
            logo_light: None,
            logo_dark: None,
        }
    }
}

/// Great-circle distance in kilometres.
pub fn distance_km(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    const R: f64 = 6371.0;
    let (p1, p2) = (lat1.to_radians(), lat2.to_radians());
    let dp = (lat2 - lat1).to_radians();
    let dl = (lon2 - lon1).to_radians();
    let a = (dp / 2.0).sin().powi(2) + p1.cos() * p2.cos() * (dl / 2.0).sin().powi(2);
    2.0 * R * a.sqrt().atan2((1.0 - a).sqrt())
}

/// A number without a trailing ".0".
fn num(x: f64) -> String {
    let r = (x * 10.0).round() / 10.0;
    if r.fract() == 0.0 {
        format!("{r:.0}")
    } else {
        format!("{r}")
    }
}

/// "type2 · 22 kW · ×2".
pub fn connector_line(c: &Connection) -> String {
    let mut parts = vec![if c.kind.is_empty() {
        "Unknown connector".to_string()
    } else {
        c.kind.clone()
    }];
    parts.extend(c.power_kw.map(|p| format!("{} kW", num(p))));
    parts.extend(c.quantity.map(|q| format!("×{q}")));
    parts.join(" · ")
}

/// Map state kept across frames.
pub struct MapPanel {
    pub memory: MapMemory,
    pub tiles: Option<HttpTiles>,
    pub chargers_on: bool,
    pub selected_station: Option<usize>,
    /// The template `tiles` was built from.
    template: Option<String>,
    /// (text, link) shown under the map.
    attribution: (String, String),
}

impl std::fmt::Debug for MapPanel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("MapPanel")
            .field("template", &self.template)
            .field("chargers_on", &self.chargers_on)
            .field("selected_station", &self.selected_station)
            .finish_non_exhaustive()
    }
}

impl Default for MapPanel {
    fn default() -> Self {
        let mut memory = MapMemory::default();
        let _ = memory.set_zoom(START_ZOOM);
        MapPanel {
            memory,
            tiles: None,
            chargers_on: false,
            selected_station: None,
            template: None,
            attribution: (String::new(), String::new()),
        }
    }
}

impl MapPanel {
    /// Builds the tile loader for `tile_template` (blank means no map), or
    /// keeps the current one when the template did not change. Tiles are
    /// cached on disk under `cache_dir/tiles`.
    pub fn configure(
        &mut self,
        ctx: &egui::Context,
        tile_template: Option<&str>,
        cache_dir: &Path,
    ) {
        let template = tile_template.map(str::trim).filter(|t| !t.is_empty());
        if template == self.template.as_deref() {
            return;
        }
        self.template = template.map(str::to_owned);
        self.attribution = template.map(attribution_for).unwrap_or_default();
        self.tiles = template.map(|t| {
            let options = HttpOptions {
                cache: Some(cache_dir.join("tiles")),
                user_agent: Some(HeaderValue::from_static(USER_AGENT)),
                ..Default::default()
            };
            HttpTiles::with_options(TemplateSource::new(t), options, ctx.clone())
        });
    }

    /// Draws the map card contents. `updated` is when the position was taken.
    pub fn show(
        &mut self,
        ui: &mut Ui,
        location: Option<&ParsedLocation>,
        stations: &[ChargingStation],
        updated: Option<&str>,
    ) -> Vec<DashboardAction> {
        let mut actions = Vec::new();
        if self.selected_station.is_some_and(|i| i >= stations.len()) || !self.chargers_on {
            self.selected_station = None;
        }
        let Some(tiles) = self.tiles.as_mut() else {
            opt_in(ui, location, &mut actions);
            return actions;
        };

        ui.horizontal(|ui| {
            ui.label(RichText::new("Location").size(16.0).strong());
            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                if ui
                    .selectable_label(self.chargers_on, "Chargers")
                    .on_hover_text("EV chargers within 5 km (OpenStreetMap)")
                    .clicked()
                {
                    self.chargers_on = !self.chargers_on;
                    actions.push(DashboardAction::ToggleChargers);
                }
                if ui.button("Refresh").clicked() {
                    self.memory.follow_my_position();
                    actions.push(DashboardAction::RefreshLocation);
                }
                if let Some(l) = location {
                    if ui.button("Open in maps").clicked() {
                        actions.push(DashboardAction::OpenInMaps(l.latitude, l.longitude));
                    }
                }
            });
        });
        ui.add_space(6.0);

        let Some(loc) = location else {
            ui.label(muted("No position reported yet."));
            return actions;
        };
        let car = lat_lon(loc.latitude, loc.longitude);
        let shown: &[ChargingStation] = if self.chargers_on { stations } else { &[] };
        let selected = &mut self.selected_station;
        let size = egui::vec2(ui.available_width(), MAP_HEIGHT);
        ui.allocate_ui(size, |ui| {
            ui.set_min_size(size);
            Map::new(Some(tiles as &mut dyn Tiles), &mut self.memory, car).show(
                ui,
                |ui, response, projector, _| {
                    let painter = ui.painter().with_clip_rect(response.rect);
                    let at = |lat: f64, lon: f64| projector.project(lat_lon(lat, lon)).to_pos2();
                    let points: Vec<Pos2> =
                        shown.iter().map(|s| at(s.latitude, s.longitude)).collect();
                    for (i, p) in points.iter().enumerate() {
                        let chosen = *selected == Some(i);
                        let (r, stroke) = if chosen {
                            (8.0, Stroke::new(2.5, Color32::WHITE))
                        } else {
                            (6.0, Stroke::new(1.5, Color32::from_rgb(0x0b, 0x3a, 0x26)))
                        };
                        painter.circle(*p, r, STATION_GREEN, stroke);
                    }
                    let c = at(loc.latitude, loc.longitude);
                    painter.circle(c, 10.0, Colors::GREEN, Stroke::new(3.0, Color32::WHITE));

                    let nearest = |pos: Pos2| {
                        points
                            .iter()
                            .enumerate()
                            .map(|(i, p)| (i, p.distance(pos)))
                            .filter(|(_, d)| *d <= HIT_RADIUS)
                            .min_by(|a, b| a.1.total_cmp(&b.1))
                            .map(|(i, _)| i)
                    };
                    if response.hover_pos().and_then(nearest).is_some() {
                        ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
                    }
                    if response.clicked() {
                        *selected = response.interact_pointer_pos().and_then(nearest);
                    }
                },
            );
        });

        ui.horizontal_wrapped(|ui| {
            let (text, link) = &self.attribution;
            let label = RichText::new(text).size(11.0).color(Colors::DIM);
            if link.is_empty() {
                ui.label(label);
            } else {
                ui.hyperlink_to(label, link);
            }
            if let Some(u) = updated {
                ui.label(
                    RichText::new(format!("·  position {u}"))
                        .size(11.0)
                        .color(Colors::DIM),
                );
            }
            if self.chargers_on {
                let n = stations.len();
                ui.label(
                    RichText::new(format!(
                        "·  {n} EV charger{} within 5 km",
                        if n == 1 { "" } else { "s" }
                    ))
                    .size(11.0)
                    .color(Colors::DIM),
                );
            }
        });

        if let Some(s) = self.selected_station.and_then(|i| stations.get(i)) {
            ui.add_space(8.0);
            if let Some(a) = station_card(ui, s, loc) {
                match a {
                    StationAction::Open => {
                        actions.push(DashboardAction::OpenStation(s.latitude, s.longitude))
                    }
                    StationAction::Close => self.selected_station = None,
                }
            }
        }
        actions
    }
}

enum StationAction {
    Open,
    Close,
}

/// Name, operator, address, distance, usage type and connectors.
fn station_card(ui: &mut Ui, s: &ChargingStation, car: &ParsedLocation) -> Option<StationAction> {
    let mut action = None;
    card(ui, |ui| {
        ui.set_width(ui.available_width());
        ui.horizontal(|ui| {
            let name = s.name.as_deref().unwrap_or("Charging station");
            ui.label(RichText::new(name).size(15.0).strong());
            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                if ui.small_button("✕").on_hover_text("Close").clicked() {
                    action = Some(StationAction::Close);
                }
            });
        });
        if let Some(op) = &s.operator {
            ui.label(muted(op).size(13.0));
        }
        if let Some(addr) = &s.address {
            ui.label(RichText::new(addr).size(13.0));
        }
        let km = distance_km(car.latitude, car.longitude, s.latitude, s.longitude);
        let mut meta = vec![format!("{km:.1} km away")];
        meta.extend(s.usage_type.clone());
        ui.label(muted(meta.join("  ·  ")).size(13.0));
        if !s.connections.is_empty() {
            ui.add_space(4.0);
            ui.label(RichText::new("Connectors").size(12.0).color(Colors::MUTED));
            for c in &s.connections {
                ui.label(RichText::new(connector_line(c)).size(13.0));
            }
        }
        ui.add_space(6.0);
        if ui.button("Open in maps").clicked() {
            action = Some(StationAction::Open);
        }
    });
    action
}

/// Shown until the user picks a tile server.
fn opt_in(ui: &mut Ui, location: Option<&ParsedLocation>, actions: &mut Vec<DashboardAction>) {
    ui.label(
        RichText::new("No tile server configured")
            .size(16.0)
            .strong(),
    );
    ui.add_space(4.0);
    ui.label(
        muted(
            "The map needs a raster tile server. OpenStreetMap's public tiles are free \
             for light use; downloaded tiles are cached on this computer.",
        )
        .size(13.0),
    );
    ui.add_space(8.0);
    if primary_button(ui, "Use OpenStreetMap tiles") {
        actions.push(DashboardAction::SetTileTemplate(OSM_TEMPLATE.to_string()));
    }
    ui.hyperlink_to("OSM tile usage policy", OSM_POLICY);
    if let Some(l) = location {
        ui.add_space(8.0);
        ui.horizontal(|ui| {
            ui.label(
                muted(format!(
                    "Last position {:.5}, {:.5}",
                    l.latitude, l.longitude
                ))
                .size(13.0),
            );
            if ui.button("Open in maps").clicked() {
                actions.push(DashboardAction::OpenInMaps(l.latitude, l.longitude));
            }
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn template_placeholders_are_substituted() {
        let id = TileId {
            x: 1061,
            y: 724,
            zoom: 11,
        };
        assert_eq!(
            tile_url(OSM_TEMPLATE, id),
            "https://tile.openstreetmap.org/11/1061/724.png"
        );
        assert_eq!(
            tile_url("https://t.example/{z}-{y}-{x}@2x?k=1", id),
            "https://t.example/11-724-1061@2x?k=1"
        );
    }

    #[test]
    fn attribution_names_osm_or_the_host() {
        assert_eq!(
            attribution_for(OSM_TEMPLATE).0,
            "© OpenStreetMap contributors"
        );
        assert_eq!(
            attribution_for("https://a.tile.openstreetmap.org/{z}/{x}/{y}.png").0,
            "© OpenStreetMap contributors"
        );
        assert_eq!(
            attribution_for("https://tiles.example.com/{z}/{x}/{y}.png"),
            (
                "tiles.example.com".to_string(),
                "https://tiles.example.com".to_string()
            )
        );
        // A look-alike host is not OSM.
        assert_eq!(
            attribution_for("https://notopenstreetmap.org/{z}/{x}/{y}.png").0,
            "notopenstreetmap.org"
        );
    }

    #[test]
    fn connectors_and_distance() {
        let c = Connection {
            kind: "type2".into(),
            power_kw: Some(22.0),
            quantity: Some(2),
        };
        assert_eq!(connector_line(&c), "type2 · 22 kW · ×2");
        let c = Connection {
            kind: String::new(),
            power_kw: Some(7.4),
            quantity: None,
        };
        assert_eq!(connector_line(&c), "Unknown connector · 7.4 kW");
        // Geneva to Lausanne is about 51 km as the crow flies.
        let d = distance_km(46.2044, 6.1432, 46.5197, 6.6323);
        assert!((d - 51.0).abs() < 2.0, "{d}");
    }
}
