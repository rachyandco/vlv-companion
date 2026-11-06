//! Dark theme matching the Android app.

use egui::{Color32, Context, CornerRadius, Frame, Margin, Stroke, Ui};

pub const RADIUS: f32 = 12.0;

pub struct Colors;

impl Colors {
    pub const BG: Color32 = Color32::from_rgb(0x0b, 0x0c, 0x0f);
    pub const TEXT: Color32 = Color32::from_rgb(0xe8, 0xea, 0xed);
    pub const MUTED: Color32 = Color32::from_rgb(0xbd, 0xc1, 0xc6);
    pub const DIM: Color32 = Color32::from_rgb(0x9a, 0xa0, 0xa6);
    /// White at 4 % alpha (premultiplied: 255 * 0.04 = 10).
    pub const CARD_FILL: Color32 = Color32::from_rgba_premultiplied(10, 10, 10, 10);
    /// White at 8 % alpha (255 * 0.08 = 20).
    pub const CARD_BORDER: Color32 = Color32::from_rgba_premultiplied(20, 20, 20, 20);
    /// rgb(64,128,255) at 18 % alpha (premultiplied).
    pub const ACCENT_FILL: Color32 = Color32::from_rgba_premultiplied(12, 23, 46, 46);
    /// rgb(64,128,255) at 50 % alpha (premultiplied).
    pub const ACCENT_BORDER: Color32 = Color32::from_rgba_premultiplied(32, 64, 128, 128);
    pub const ACCENT_TEXT: Color32 = Color32::from_rgb(0xcf, 0xe0, 0xff);
    pub const GREEN: Color32 = Color32::from_rgb(0x34, 0xd3, 0x99);
    pub const AMBER: Color32 = Color32::from_rgb(0xf5, 0x9e, 0x0b);
    pub const RED: Color32 = Color32::from_rgb(0xef, 0x44, 0x44);
}

/// Install dark visuals using the app palette.
pub fn apply(ctx: &Context) {
    let mut v = egui::Visuals::dark();
    let radius = CornerRadius::same(RADIUS as u8);
    v.override_text_color = Some(Colors::TEXT);
    v.panel_fill = Colors::BG;
    v.window_fill = Colors::BG;
    v.extreme_bg_color = Colors::BG;
    v.faint_bg_color = Colors::CARD_FILL;
    v.window_corner_radius = radius;
    v.window_stroke = Stroke::new(1.0, Colors::CARD_BORDER);
    v.hyperlink_color = Colors::ACCENT_TEXT;
    v.selection.bg_fill = Colors::ACCENT_FILL;
    v.selection.stroke = Stroke::new(1.0, Colors::ACCENT_BORDER);
    for w in [
        &mut v.widgets.noninteractive,
        &mut v.widgets.inactive,
        &mut v.widgets.hovered,
        &mut v.widgets.active,
        &mut v.widgets.open,
    ] {
        w.corner_radius = radius;
    }
    v.widgets.noninteractive.bg_stroke = Stroke::new(1.0, Colors::CARD_BORDER);
    v.widgets.noninteractive.fg_stroke = Stroke::new(1.0, Colors::MUTED);
    v.widgets.inactive.bg_fill = Colors::CARD_FILL;
    v.widgets.inactive.weak_bg_fill = Colors::CARD_FILL;
    v.widgets.inactive.bg_stroke = Stroke::new(1.0, Colors::CARD_BORDER);
    v.widgets.hovered.bg_stroke = Stroke::new(1.0, Colors::ACCENT_BORDER);
    v.widgets.active.bg_fill = Colors::ACCENT_FILL;
    v.widgets.active.weak_bg_fill = Colors::ACCENT_FILL;
    v.widgets.active.bg_stroke = Stroke::new(1.0, Colors::ACCENT_BORDER);
    ctx.set_visuals(v);
}

/// Rounded translucent card with a subtle border.
pub fn card(ui: &mut Ui, add: impl FnOnce(&mut Ui)) {
    Frame::new()
        .fill(Colors::CARD_FILL)
        .stroke(Stroke::new(1.0, Colors::CARD_BORDER))
        .corner_radius(CornerRadius::same(RADIUS as u8))
        .inner_margin(Margin::same(14))
        .show(ui, add);
}
