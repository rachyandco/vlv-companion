//! Top view of the car with door, window and lid overlays, mirroring the
//! phone's `CarTopView.tsx`. Coordinates are in the image's 588×1030 space.

use egui::{Color32, Rect, TextureHandle, TextureOptions, Ui};

use crate::api::models::{Doors, RString, Windows};

const PNG: &[u8] = include_bytes!("../../../assets/volvo-top-black.png");
const IMG_W: f32 = 588.0;
const IMG_H: f32 = 1030.0;
pub const DEFAULT_WIDTH: f32 = 260.0;
/// Height over width of the image.
pub const CAR_ASPECT: f32 = IMG_H / IMG_W;

/// rgba(52,211,153,0.55)
const CLOSED: Color32 = Color32::from_rgba_unmultiplied_const(52, 211, 153, 140);
/// rgba(239,68,68,0.85)
const OPEN: Color32 = Color32::from_rgba_unmultiplied_const(239, 68, 68, 217);

/// `Some(true)` for OPEN/AJAR, `Some(false)` for other states, `None` when
/// missing or UNSPECIFIED.
fn is_open(field: Option<&RString>) -> Option<bool> {
    let v = field?.value.to_uppercase();
    if v == "UNSPECIFIED" {
        return None;
    }
    Some(v == "OPEN" || v == "AJAR")
}

fn fill(open: Option<bool>) -> Color32 {
    match open {
        None => Color32::TRANSPARENT,
        Some(true) => OPEN,
        Some(false) => CLOSED,
    }
}

/// One overlay: x, y, w, h, corner radius (image space) and its state.
type Overlay = ([f32; 5], Option<bool>);

fn overlays(doors: Option<&Doors>, windows: Option<&Windows>, is_ev: bool) -> Vec<Overlay> {
    let d = |f: fn(&Doors) -> Option<&RString>| is_open(doors.and_then(f));
    let w = |f: fn(&Windows) -> Option<&RString>| is_open(windows.and_then(f));
    let mut v = vec![
        ([140.0, 70.0, 308.0, 170.0, 20.0], d(|x| x.hood.as_ref())),
        (
            [20.0, 355.0, 120.0, 140.0, 18.0],
            d(|x| x.front_left_door.as_ref()),
        ),
        (
            [448.0, 355.0, 120.0, 140.0, 18.0],
            d(|x| x.front_right_door.as_ref()),
        ),
        (
            [20.0, 510.0, 120.0, 155.0, 18.0],
            d(|x| x.rear_left_door.as_ref()),
        ),
        (
            [448.0, 510.0, 120.0, 155.0, 18.0],
            d(|x| x.rear_right_door.as_ref()),
        ),
        // Windows are drawn over the doors.
        (
            [40.0, 370.0, 80.0, 100.0, 12.0],
            w(|x| x.front_left_window.as_ref()),
        ),
        (
            [468.0, 370.0, 80.0, 100.0, 12.0],
            w(|x| x.front_right_window.as_ref()),
        ),
        (
            [40.0, 525.0, 80.0, 110.0, 12.0],
            w(|x| x.rear_left_window.as_ref()),
        ),
        (
            [468.0, 525.0, 80.0, 110.0, 12.0],
            w(|x| x.rear_right_window.as_ref()),
        ),
    ];
    let sunroof = windows.and_then(|x| x.sunroof.as_ref());
    if sunroof.is_some_and(|s| !s.value.eq_ignore_ascii_case("UNSPECIFIED")) {
        v.push(([190.0, 330.0, 208.0, 120.0, 20.0], is_open(sunroof)));
    }
    // The tank lid (left side on this car) is hidden on EVs.
    if !is_ev {
        v.push(([20.0, 695.0, 108.0, 70.0, 10.0], d(|x| x.tank_lid.as_ref())));
    }
    v.push((
        [130.0, 830.0, 328.0, 140.0, 26.0],
        d(|x| x.tailgate.as_ref()),
    ));
    v
}

pub struct CarView {
    texture: TextureHandle,
}

impl std::fmt::Debug for CarView {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("CarView").finish_non_exhaustive()
    }
}

impl CarView {
    /// Decodes the bundled image and uploads it once.
    pub fn new(ctx: &egui::Context) -> CarView {
        let rgba = image::load_from_memory_with_format(PNG, image::ImageFormat::Png)
            .expect("bundled car image is a valid PNG")
            .to_rgba8();
        let size = [rgba.width() as usize, rgba.height() as usize];
        let img = egui::ColorImage::from_rgba_unmultiplied(size, rgba.as_raw());
        CarView {
            texture: ctx.load_texture("volvo-top-black", img, TextureOptions::LINEAR),
        }
    }

    /// Draws the car `width` px wide (height follows the image aspect).
    pub fn show(
        &mut self,
        ui: &mut Ui,
        doors: Option<&Doors>,
        windows: Option<&Windows>,
        is_ev: bool,
        width: f32,
    ) {
        let scale = width / IMG_W;
        let size = egui::vec2(width, (IMG_H * scale).round());
        let (rect, _) = ui.allocate_exact_size(size, egui::Sense::hover());
        let painter = ui.painter_at(rect);
        let uv = Rect::from_min_max(egui::pos2(0.0, 0.0), egui::pos2(1.0, 1.0));
        painter.image(self.texture.id(), rect, uv, Color32::WHITE);
        for ([x, y, w, h, r], open) in overlays(doors, windows, is_ev) {
            if open.is_none() {
                continue;
            }
            let o = Rect::from_min_size(
                rect.min + egui::vec2(x, y) * scale,
                egui::vec2(w, h) * scale,
            );
            painter.rect_filled(o, r * scale, fill(open));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn r(v: &str) -> Option<RString> {
        Some(RString {
            value: v.into(),
            updated_at: None,
            unit: None,
        })
    }

    #[test]
    fn open_closed_and_unknown_states() {
        assert_eq!(is_open(r("OPEN").as_ref()), Some(true));
        assert_eq!(is_open(r("ajar").as_ref()), Some(true));
        assert_eq!(is_open(r("CLOSED").as_ref()), Some(false));
        assert_eq!(is_open(r("UNSPECIFIED").as_ref()), None);
        assert_eq!(is_open(None), None);
        assert_eq!(fill(None), Color32::TRANSPARENT);
    }

    #[test]
    fn sunroof_and_tank_lid_rules() {
        let w = Windows {
            sunroof: r("UNSPECIFIED"),
            ..Default::default()
        };
        assert_eq!(overlays(None, Some(&w), true).len(), 10);
        assert_eq!(overlays(None, Some(&w), false).len(), 11);
        let w = Windows {
            sunroof: r("CLOSED"),
            ..Default::default()
        };
        assert_eq!(overlays(None, Some(&w), false).len(), 12);
    }
}
