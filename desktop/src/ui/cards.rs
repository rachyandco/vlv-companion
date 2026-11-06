//! Dashboard cards: a labelled value, the battery bar and the lock toggle.

use egui::{Color32, CornerRadius, Frame, Margin, RichText, Sense, Stroke, Ui};

use crate::theme::{Colors, RADIUS};

/// Narrowest a card in the wrapped row may be.
pub const CARD_MIN_WIDTH: f32 = 150.0;
const CARD_MIN_HEIGHT: f32 = 64.0;
const LOCK_WIDTH: f32 = 230.0;
const MARGIN: i8 = 14;

fn tint(c: Color32, alpha: f32) -> Color32 {
    Color32::from_rgba_unmultiplied(c.r(), c.g(), c.b(), (alpha * 255.0).round() as u8)
}

fn frame(fill: Color32, border: Color32) -> Frame {
    Frame::new()
        .fill(fill)
        .stroke(Stroke::new(1.0, border))
        .corner_radius(CornerRadius::same(RADIUS as u8))
        .inner_margin(Margin::same(MARGIN))
}

fn plain() -> Frame {
    frame(Colors::CARD_FILL, Colors::CARD_BORDER)
}

/// Sets the inner size so the outer card is at least `CARD_MIN_WIDTH` wide.
fn min_inner(ui: &mut Ui, width: f32) {
    let m = 2.0 * f32::from(MARGIN);
    ui.set_min_width(width - m);
    ui.set_min_height(CARD_MIN_HEIGHT - m);
}

/// Places `add` in a `width`-wide slot. Unlike a bare `Frame`, the slot
/// wraps to the next line in a `horizontal_wrapped` row when it does not fit.
pub fn slot<R>(ui: &mut Ui, width: f32, add: impl FnOnce(&mut Ui) -> R) -> R {
    ui.allocate_ui_with_layout(
        egui::vec2(width, CARD_MIN_HEIGHT),
        egui::Layout::top_down(egui::Align::Min),
        add,
    )
    .inner
}

fn card_label(ui: &mut Ui, label: &str) {
    ui.label(RichText::new(label).size(12.0).color(Colors::MUTED));
}

/// A small card: muted label over a large value, optionally coloured.
pub fn status_card(ui: &mut Ui, label: &str, value: &str, accent: Option<Color32>) {
    slot(ui, CARD_MIN_WIDTH, |ui| {
        plain().show(ui, |ui| {
            min_inner(ui, CARD_MIN_WIDTH);
            ui.vertical(|ui| {
                card_label(ui, label);
                ui.label(
                    RichText::new(value)
                        .size(20.0)
                        .strong()
                        .color(accent.unwrap_or(Colors::TEXT)),
                );
            });
        })
    });
}

/// Battery level with a thin green bar and a caption underneath.
pub fn battery_card(ui: &mut Ui, percent: Option<f64>, caption: &str) {
    slot(ui, CARD_MIN_WIDTH, |ui| {
        plain().show(ui, |ui| {
            min_inner(ui, CARD_MIN_WIDTH);
            ui.vertical(|ui| {
                card_label(ui, "Battery");
                let value = percent.map_or("—".to_string(), |p| format!("{}%", p.round()));
                ui.label(RichText::new(value).size(20.0).strong().color(Colors::TEXT));
                let width = CARD_MIN_WIDTH - 2.0 * f32::from(MARGIN);
                let (rect, _) = ui.allocate_exact_size(egui::vec2(width, 4.0), Sense::hover());
                let p = ui.painter();
                p.rect_filled(rect, 2.0, tint(Color32::WHITE, 0.08));
                if let Some(pc) = percent {
                    let mut bar = rect;
                    bar.set_width(rect.width() * (pc.clamp(0.0, 100.0) / 100.0) as f32);
                    p.rect_filled(bar, 2.0, Colors::GREEN);
                }
                if !caption.is_empty() {
                    ui.add_space(2.0);
                    ui.label(RichText::new(caption).size(11.0).color(Colors::DIM));
                }
            });
        })
    });
}

/// The central-lock toggle. Returns true when clicked; the caller asks for
/// confirmation before unlocking. While `busy` (a command is in flight) it
/// shows "Sending…" and ignores clicks; while `session_expired` it says so
/// and ignores clicks too.
pub fn lock_card(ui: &mut Ui, lock: Option<&str>, busy: bool, session_expired: bool) -> bool {
    let locked = lock == Some("LOCKED");
    let known = locked || lock == Some("UNLOCKED");
    let (state, hint) = match (known, locked) {
        (false, _) => ("—", "Lock state unknown"),
        (true, true) => ("Locked", "Tap to unlock"),
        (true, false) => ("Unlocked", "Tap to lock"),
    };
    let hint = if busy {
        "Sending…"
    } else if session_expired {
        "Session expired — sign in again"
    } else {
        hint
    };
    let blue = Color32::from_rgb(64, 128, 255);
    // Shrinks to the row on narrow windows.
    let width = LOCK_WIDTH.min(ui.max_rect().width()).max(CARD_MIN_WIDTH);
    let resp = slot(ui, width, |ui| {
        frame(tint(blue, 0.08), tint(blue, 0.32)).show(ui, |ui| {
            min_inner(ui, width);
            ui.horizontal(|ui| {
                let (rect, _) = ui.allocate_exact_size(egui::vec2(40.0, 40.0), Sense::hover());
                let bubble = if locked { Colors::GREEN } else { Colors::RED };
                ui.painter().circle_filled(rect.center(), 20.0, bubble);
                draw_padlock(ui, rect.center(), locked);
                ui.add_space(6.0);
                ui.vertical(|ui| {
                    ui.label(RichText::new("CENTRAL LOCK").size(11.0).color(Colors::DIM));
                    ui.label(RichText::new(state).size(20.0).strong().color(Colors::TEXT));
                    ui.label(RichText::new(hint).size(12.0).color(Colors::MUTED));
                });
            });
        })
    });
    if busy || session_expired {
        return false;
    }
    let resp = resp.response.interact(Sense::click());
    resp.on_hover_cursor(egui::CursorIcon::PointingHand)
        .clicked()
}

/// A tiny padlock glyph: body plus a shackle that is open when unlocked.
fn draw_padlock(ui: &Ui, c: egui::Pos2, locked: bool) {
    let ink = if locked {
        Color32::from_rgb(0x0b, 0x3a, 0x26)
    } else {
        Color32::from_rgb(0x3b, 0x10, 0x11)
    };
    let p = ui.painter();
    let body = egui::Rect::from_center_size(c + egui::vec2(0.0, 4.0), egui::vec2(16.0, 12.0));
    p.rect_filled(body, 2.0, ink);
    let stroke = Stroke::new(2.5, ink);
    let shift = if locked { 0.0 } else { 6.0 };
    let top = c.y - 9.0;
    let (l, r) = (c.x - 5.0, c.x + 5.0);
    p.line_segment(
        [
            egui::pos2(l + shift, body.top()),
            egui::pos2(l + shift, top + 3.0),
        ],
        stroke,
    );
    p.line_segment(
        [
            egui::pos2(l + shift, top + 3.0),
            egui::pos2(r + shift, top + 3.0),
        ],
        stroke,
    );
    let right_bottom = if locked { body.top() } else { top + 7.0 };
    p.line_segment(
        [
            egui::pos2(r + shift, top + 3.0),
            egui::pos2(r + shift, right_bottom),
        ],
        stroke,
    );
}
