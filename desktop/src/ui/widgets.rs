//! Small shared widgets in the app's dark style.

use egui::text::LayoutJob;
use egui::{Button, Color32, CornerRadius, FontId, Frame, Margin, RichText, Stroke, TextEdit, Ui};

use crate::theme::{Colors, RADIUS};

/// Severity of a notice or banner.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Level {
    Info,
    Warn,
    Danger,
}

impl Level {
    pub fn color(self) -> Color32 {
        match self {
            Level::Info => Colors::ACCENT_TEXT,
            Level::Warn => Colors::AMBER,
            Level::Danger => Colors::RED,
        }
    }

    /// Translucent fill and border derived from the level colour.
    fn frame(self) -> Frame {
        let c = match self {
            Level::Info => Color32::from_rgb(64, 128, 255),
            other => other.color(),
        };
        let tint = |a: u8| Color32::from_rgba_unmultiplied(c.r(), c.g(), c.b(), a);
        Frame::new()
            .fill(tint(20))
            .stroke(Stroke::new(1.0, tint(100)))
            .corner_radius(CornerRadius::same(RADIUS as u8))
            .inner_margin(Margin::same(14))
    }
}

/// Muted text, coloured explicitly (the theme forces TEXT otherwise).
pub fn muted(text: impl Into<String>) -> RichText {
    RichText::new(text).color(Colors::MUTED)
}

/// A labelled single-line text field spanning the available width.
pub fn field(ui: &mut Ui, label: &str, value: &mut String, password: bool) {
    field_with_hint(ui, label, value, password, "");
}

/// `field` with placeholder text shown while the value is empty.
pub fn field_with_hint(ui: &mut Ui, label: &str, value: &mut String, password: bool, hint: &str) {
    ui.label(muted(label).size(13.0));
    ui.add(
        TextEdit::singleline(value)
            .password(password)
            .hint_text(RichText::new(hint).color(Colors::DIM))
            .desired_width(f32::INFINITY)
            .margin(Margin::symmetric(10, 8)),
    );
    ui.add_space(6.0);
}

/// A tinted box with a bold title and a body paragraph.
pub fn notice(ui: &mut Ui, title: &str, body: &str, level: Level) {
    level.frame().show(ui, |ui| {
        ui.set_width(ui.available_width());
        ui.label(RichText::new(title).strong().color(level.color()));
        ui.add_space(4.0);
        ui.label(RichText::new(body).size(13.0).color(Colors::TEXT));
    });
}

/// Accent-filled button; returns true when clicked.
pub fn primary_button(ui: &mut Ui, label: &str) -> bool {
    ui.add(
        Button::new(RichText::new(label).strong().color(Colors::ACCENT_TEXT))
            .fill(Colors::ACCENT_FILL)
            .stroke(Stroke::new(1.0, Colors::ACCENT_BORDER))
            .min_size(egui::vec2(0.0, 36.0)),
    )
    .clicked()
}

/// Upper-case, muted, letter-spaced heading.
pub fn section_title(ui: &mut Ui, text: &str) {
    let job = LayoutJob::single_section(
        text.to_uppercase(),
        egui::TextFormat {
            font_id: FontId::proportional(12.0),
            color: Colors::MUTED,
            extra_letter_spacing: 1.2,
            ..Default::default()
        },
    );
    ui.add_space(8.0);
    ui.label(job);
    ui.add_space(4.0);
}

/// Full-width banner with a dismiss button; returns true when dismissed.
pub fn banner(ui: &mut Ui, level: Level, text: &str) -> bool {
    let mut dismissed = false;
    level.frame().show(ui, |ui| {
        ui.set_width(ui.available_width());
        ui.horizontal(|ui| {
            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                dismissed = ui.button("Dismiss").clicked();
                ui.with_layout(egui::Layout::left_to_right(egui::Align::Center), |ui| {
                    ui.add(egui::Label::new(RichText::new(text).color(level.color())).wrap());
                });
            });
        });
    });
    dismissed
}
