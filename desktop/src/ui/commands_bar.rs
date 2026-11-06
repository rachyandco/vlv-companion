//! Remote commands under the dashboard rows: availability, the unlock,
//! climate and "commands unavailable" banners, the ten command buttons and
//! their confirmations (the phone's commands screen).

use std::collections::HashSet;
use std::ops::RangeInclusive;
use std::time::{Duration, Instant};

use egui::{Button, Color32, CornerRadius, Frame, Margin, RichText, Sense, Stroke, Ui};

use crate::api::commands::{humanize_reason, CommandName};
use crate::api::models::Availability;
use crate::state::climate;
use crate::theme::{Colors, RADIUS};
use crate::ui::widgets::{muted, notice, Level};

/// How long a button stays tinted after its result.
pub const FLASH_DURATION: Duration = Duration::from_millis(1200);
/// Engine runtimes the API accepts, in minutes.
pub const ENGINE_MINUTES: RangeInclusive<u8> = 1..=15;
const DEFAULT_ENGINE_MINUTES: u8 = 5;
const GAP: f32 = 8.0;

/// Command-bar state kept across frames.
#[derive(Debug)]
pub struct State {
    /// Engine runtime picked with the slider.
    pub engine_minutes: u8,
    /// Command waiting for the user's confirmation.
    pub confirm: Option<CommandName>,
    /// (command, success, when): the button is tinted for `FLASH_DURATION`.
    pub flash: Option<(CommandName, bool, Instant)>,
    /// Epoch ms until which a door handle unlocks the car.
    pub unlock_until_ms: Option<i64>,
    /// Learned from a `NOT_ALLOWED_PRIVACY_ENABLED` answer; cleared by the
    /// next accepted command.
    pub privacy_blocked: bool,
}

impl Default for State {
    fn default() -> Self {
        State {
            engine_minutes: DEFAULT_ENGINE_MINUTES,
            confirm: None,
            flash: None,
            unlock_until_ms: None,
            privacy_blocked: false,
        }
    }
}

impl State {
    /// Tints `command`'s button green (`success`) or red from `now`.
    pub fn set_flash(&mut self, command: CommandName, success: bool, now: Instant) {
        self.flash = Some((command, success, now));
    }

    /// `Some(success)` while `command`'s flash is showing.
    pub fn flash_for(&self, command: CommandName, now: Instant) -> Option<bool> {
        match self.flash {
            Some((c, ok, at))
                if c == command && now.saturating_duration_since(at) < FLASH_DURATION =>
            {
                Some(ok)
            }
            _ => None,
        }
    }

    /// Time left on the current flash, if one is showing.
    fn flash_left(&self, now: Instant) -> Option<Duration> {
        let (_, _, at) = self.flash?;
        FLASH_DURATION
            .checked_sub(now.saturating_duration_since(at))
            .filter(|d| !d.is_zero())
    }

    /// Forgets everything tied to the previous car; keeps the runtime.
    pub fn reset_for_other_car(&mut self) {
        *self = State {
            engine_minutes: self.engine_minutes,
            ..State::default()
        };
    }
}

/// False when the car's command list is known (non-empty) and lacks `command`.
pub fn is_supported(command: CommandName, supported: Option<&HashSet<CommandName>>) -> bool {
    supported.is_none_or(|s| s.is_empty() || s.contains(&command))
}

/// Whether `command`'s button takes clicks: the Volvo session has not
/// expired, the car is AVAILABLE, privacy mode was not reported, the car
/// supports it, no command is in flight, and (for Stop climatisation) a
/// climatisation is running.
pub fn is_enabled(
    command: CommandName,
    session_expired: bool,
    available: bool,
    privacy_blocked: bool,
    supported: Option<&HashSet<CommandName>>,
    busy: Option<CommandName>,
    climate_active: bool,
) -> bool {
    !session_expired
        && available
        && !privacy_blocked
        && is_supported(command, supported)
        && busy.is_none()
        && (command != CommandName::ClimatizationStop || climate_active)
}

/// Seconds left in the unlock window, or `None` once it has passed.
pub fn unlock_seconds_left(until_ms: Option<i64>, now_ms: i64) -> Option<i64> {
    let left = until_ms? - now_ms;
    (left > 0).then(|| (left + 999) / 1000)
}

/// The phone's confirmation (title, message, danger) for the commands that ask.
pub fn confirmation(command: CommandName, minutes: u8) -> Option<(&'static str, String, bool)> {
    Some(match command {
        CommandName::LockReducedGuard => (
            "Reduced-guard lock",
            "Locks without arming the interior motion sensor. Use when leaving a pet or item inside."
                .to_string(),
            false,
        ),
        CommandName::Unlock => (
            "Unlock car",
            "After confirming, pull the door handle within the unlock window.".to_string(),
            true,
        ),
        CommandName::EngineStart => (
            "Start engine",
            format!(
                "Run the engine for {minutes} minutes. Make sure the car is in a ventilated area."
            ),
            true,
        ),
        _ => return None,
    })
}

fn runtime(command: CommandName, minutes: u8) -> Option<u8> {
    (command == CommandName::EngineStart).then_some(minutes)
}

fn alpha(c: Color32, a: u8) -> Color32 {
    Color32::from_rgba_unmultiplied(c.r(), c.g(), c.b(), a)
}

/// A rounded box tinted with `color`.
fn tinted(ui: &mut Ui, color: Color32, add: impl FnOnce(&mut Ui)) {
    Frame::new()
        .fill(alpha(color, 30))
        .stroke(Stroke::new(1.0, alpha(color, 100)))
        .corner_radius(CornerRadius::same(RADIUS as u8))
        .inner_margin(Margin::same(12))
        .show(ui, |ui| {
            ui.set_width(ui.available_width());
            add(ui);
        });
}

/// Draws the bar; returns a command to send (with its engine runtime) once
/// clicked, or confirmed for those that ask first. `session_expired` holds
/// the expiry message while the Volvo session is gone: every button is
/// disabled and the "Commands unavailable" banner reads it.
#[allow(clippy::too_many_arguments)]
pub fn show(
    ui: &mut Ui,
    st: &mut State,
    session_expired: Option<&str>,
    availability: Option<&Availability>,
    supported: Option<&HashSet<CommandName>>,
    busy: Option<CommandName>,
    is_ev: bool,
    climate_started_ms: Option<i64>,
    now_ms: i64,
) -> Option<(CommandName, Option<u8>)> {
    let now = Instant::now();
    let available = availability.is_some_and(|a| a.value == "AVAILABLE");
    let climate_on = climate::is_active(climate_started_ms, now_ms);
    if unlock_seconds_left(st.unlock_until_ms, now_ms).is_none() {
        st.unlock_until_ms = None;
    }
    if let Some(left) = st.flash_left(now) {
        ui.ctx().request_repaint_after(left);
    } else {
        st.flash = None;
    }

    availability_row(ui, availability);
    if let Some(s) = unlock_seconds_left(st.unlock_until_ms, now_ms) {
        ui.add_space(GAP);
        tinted(ui, Colors::GREEN, |ui| {
            ui.label(
                RichText::new(format!("Ready to unlock — pull a door handle within {s} s"))
                    .strong()
                    .color(Colors::GREEN),
            );
        });
    }
    if climate_on {
        let mins = (climate::remaining_ms(climate_started_ms, now_ms) + 59_999) / 60_000;
        ui.add_space(GAP);
        tinted(ui, Colors::GREEN, |ui| {
            ui.label(
                RichText::new(format!("Climatisation running — about {mins} min left"))
                    .strong()
                    .color(Colors::GREEN),
            );
            ui.label(
                muted(
                    "Volvo’s public API doesn’t expose live climate status; this is tracked locally from your last Start.",
                )
                .size(12.0),
            );
        });
    }
    let expired = session_expired.is_some();
    let block = if let Some(msg) = session_expired {
        Some(msg.to_string())
    } else if st.privacy_blocked {
        Some(humanize_reason("PRIVACY_ENABLED"))
    } else {
        availability
            .filter(|a| a.value != "AVAILABLE")
            .map(|a| humanize_reason(a.unavailable_reason.as_deref().unwrap_or(&a.value)))
    };
    if let Some(msg) = block {
        ui.add_space(GAP);
        notice(ui, "Commands unavailable", &msg, Level::Warn);
    }
    ui.add_space(GAP + 4.0);

    let mut clicked = None;
    let mut button = |ui: &mut Ui, st: &State, command: CommandName| {
        let enabled = is_enabled(
            command,
            expired,
            available,
            st.privacy_blocked,
            supported,
            busy,
            climate_on,
        );
        let text = if busy == Some(command) {
            "Sending…".to_string()
        } else if is_supported(command, supported) {
            command.label().to_string()
        } else {
            format!("{} — not supported", command.label())
        };
        let danger = matches!(command, CommandName::Unlock | CommandName::EngineStart);
        let mut b =
            Button::new(RichText::new(text).color(if danger { Colors::RED } else { Colors::TEXT }))
                .min_size(egui::vec2(0.0, 36.0));
        if let Some(ok) = st.flash_for(command, now) {
            let c = if ok { Colors::GREEN } else { Colors::RED };
            b = b.fill(alpha(c, 40)).stroke(Stroke::new(1.5, alpha(c, 153)));
        }
        if ui.add_enabled(enabled, b).clicked() {
            clicked = Some(command);
        }
    };

    let row = |ui: &mut Ui, add: &mut dyn FnMut(&mut Ui)| {
        ui.horizontal_wrapped(|ui| {
            ui.spacing_mut().item_spacing = egui::vec2(GAP, GAP);
            add(ui);
        });
    };
    row(ui, &mut |ui| {
        for c in [
            CommandName::Lock,
            CommandName::LockReducedGuard,
            CommandName::Unlock,
            CommandName::Honk,
            CommandName::Flash,
            CommandName::HonkFlash,
        ] {
            button(ui, st, c);
        }
    });
    ui.add_space(GAP);
    row(ui, &mut |ui| {
        button(ui, st, CommandName::ClimatizationStart);
        button(ui, st, CommandName::ClimatizationStop);
        if !is_ev {
            ui.add_space(GAP);
            button(ui, st, CommandName::EngineStart);
            ui.add(
                egui::Slider::new(&mut st.engine_minutes, ENGINE_MINUTES)
                    .show_value(false)
                    .step_by(1.0),
            );
            ui.label(muted(format!("Run for {} min", st.engine_minutes)));
            ui.add_space(GAP);
            button(ui, st, CommandName::EngineStop);
        }
    });

    let mut send = None;
    if let Some(c) = clicked {
        if confirmation(c, st.engine_minutes).is_some() {
            st.confirm = Some(c);
        } else {
            send = Some(c);
        }
    }
    // A confirmation outlives neither a refresh that disables its button
    // nor the engine section disappearing.
    if let Some(c) = st.confirm {
        let still = is_enabled(
            c,
            expired,
            available,
            st.privacy_blocked,
            supported,
            busy,
            climate_on,
        ) && !(is_ev && c == CommandName::EngineStart);
        if !still {
            st.confirm = None;
        } else if let Some(confirmed) = confirm_modal(ui.ctx(), c, st.engine_minutes) {
            st.confirm = None;
            if confirmed {
                send = Some(c);
            }
        }
    }
    send.map(|c| (c, runtime(c, st.engine_minutes)))
}

/// Coloured dot and the raw availability value.
fn availability_row(ui: &mut Ui, availability: Option<&Availability>) {
    ui.horizontal(|ui| {
        let available = availability.is_some_and(|a| a.value == "AVAILABLE");
        let (rect, _) = ui.allocate_exact_size(egui::vec2(10.0, 10.0), Sense::hover());
        let color = if available {
            Colors::GREEN
        } else {
            Colors::AMBER
        };
        ui.painter().circle_filled(rect.center(), 5.0, color);
        let text = availability.map_or("Checking accessibility…", |a| a.value.as_str());
        ui.label(muted(text).size(14.0));
    });
}

/// `Some(true)` on confirm, `Some(false)` on Cancel, Escape or a click
/// outside, `None` while undecided.
fn confirm_modal(ctx: &egui::Context, command: CommandName, minutes: u8) -> Option<bool> {
    let (title, message, danger) = confirmation(command, minutes)?;
    let mut answer = None;
    let modal = egui::Modal::new(egui::Id::unique("confirm_command")).show(ctx, |ui| {
        ui.set_max_width(380.0);
        ui.label(RichText::new(title).size(18.0).strong());
        ui.add_space(6.0);
        ui.label(message);
        ui.add_space(10.0);
        ui.horizontal(|ui| {
            if ui.button("Cancel").clicked() {
                answer = Some(false);
            }
            let color = if danger { Colors::RED } else { Colors::TEXT };
            if ui
                .button(RichText::new(command.label()).color(color))
                .clicked()
            {
                answer = Some(true);
            }
        });
    });
    if answer.is_none() && modal.should_close() {
        answer = Some(false);
    }
    answer
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn enablement_follows_session_availability_privacy_support_and_busy() {
        let lock = CommandName::Lock;
        assert!(is_enabled(lock, false, true, false, None, None, false));
        assert!(!is_enabled(lock, false, false, false, None, None, false));
        assert!(!is_enabled(lock, false, true, true, None, None, false));
        // An expired session disables every button, whatever else holds.
        assert!(!is_enabled(lock, true, true, false, None, None, false));
        assert!(!is_enabled(
            CommandName::ClimatizationStop,
            true,
            true,
            false,
            None,
            None,
            true
        ));
        // Any command in flight disables every button.
        assert!(!is_enabled(
            lock,
            false,
            true,
            false,
            None,
            Some(CommandName::Honk),
            false
        ));
        // An empty or absent list leaves everything enabled.
        let empty = HashSet::new();
        assert!(is_enabled(
            lock,
            false,
            true,
            false,
            Some(&empty),
            None,
            false
        ));
        let only_honk = HashSet::from([CommandName::Honk]);
        assert!(!is_enabled(
            lock,
            false,
            true,
            false,
            Some(&only_honk),
            None,
            false
        ));
        assert!(!is_supported(lock, Some(&only_honk)));
        assert!(is_enabled(
            CommandName::Honk,
            false,
            true,
            false,
            Some(&only_honk),
            None,
            false
        ));
        // Stop climatisation needs a running climatisation.
        let stop = CommandName::ClimatizationStop;
        assert!(!is_enabled(stop, false, true, false, None, None, false));
        assert!(is_enabled(stop, false, true, false, None, None, true));
    }

    #[test]
    fn flash_expires_after_its_duration() {
        let mut st = State::default();
        let t0 = Instant::now();
        st.set_flash(CommandName::Honk, true, t0);
        assert_eq!(st.flash_for(CommandName::Honk, t0), Some(true));
        assert_eq!(st.flash_for(CommandName::Flash, t0), None);
        let late = t0 + FLASH_DURATION - Duration::from_millis(1);
        assert_eq!(st.flash_for(CommandName::Honk, late), Some(true));
        assert!(st.flash_left(late).is_some());
        assert_eq!(st.flash_for(CommandName::Honk, t0 + FLASH_DURATION), None);
        assert!(st.flash_left(t0 + FLASH_DURATION).is_none());
        st.set_flash(CommandName::Lock, false, t0);
        assert_eq!(st.flash_for(CommandName::Lock, t0), Some(false));
    }

    #[test]
    fn unlock_window_counts_down_in_whole_seconds() {
        assert_eq!(unlock_seconds_left(None, 0), None);
        assert_eq!(unlock_seconds_left(Some(10_000), 0), Some(10));
        assert_eq!(unlock_seconds_left(Some(10_000), 9_001), Some(1));
        assert_eq!(unlock_seconds_left(Some(10_000), 10_000), None);
    }

    #[test]
    fn confirmations_and_runtime() {
        assert!(confirmation(CommandName::Lock, 5).is_none());
        assert_eq!(
            confirmation(CommandName::Unlock, 5).unwrap().0,
            "Unlock car"
        );
        let (_, msg, danger) = confirmation(CommandName::EngineStart, 12).unwrap();
        assert!(msg.starts_with("Run the engine for 12 minutes."));
        assert!(danger);
        assert_eq!(runtime(CommandName::EngineStart, 12), Some(12));
        assert_eq!(runtime(CommandName::Honk, 12), None);
        let mut st = State {
            engine_minutes: 9,
            privacy_blocked: true,
            ..State::default()
        };
        st.reset_for_other_car();
        assert_eq!(st.engine_minutes, 9);
        assert!(!st.privacy_blocked);
        assert_eq!(State::default().engine_minutes, 5);
    }
}
