//! The eframe application: drains worker events into `AppState`, tracks
//! activity, and draws the sidebar plus the current screen.

use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::mpsc::{Receiver, Sender};
use std::time::{Duration, Instant};

use egui::{Ui, Vec2};

use crate::api::commands::{friendly_message, Bucket, CommandName};
use crate::api::models::{CommandListItem, VehicleListItem};
use crate::config::Config;
use crate::state::schedule::Activity;
use crate::ui::dashboard::{self, CommandInputs, DashboardAction, DashboardState};
use crate::ui::data::VehicleData;
use crate::ui::map::distance_km;
use crate::ui::settings::{self, SettingsAction, SettingsDraft};
use crate::ui::sidebar::{self, SidebarAction};
use crate::ui::sign_in::{self, SignInAction, SignInForm};
use crate::ui::vehicle_label;
use crate::ui::widgets::{self, muted, notice, Level};
use crate::worker::messages::{UiRequest, WorkerEvent};

const ACTIVITY_RESEND: Duration = Duration::from_secs(10);
const TICK: Duration = Duration::from_secs(1);
const CONTENT_WIDTH: f32 = 720.0;
/// The dashboard lays cards side by side, so it gets a wider column.
const DASHBOARD_WIDTH: f32 = 1160.0;
const CALLBACK_SCHEME: &str = "volvo-companion://";
/// The charger overlay is fetched again once the car moved this far (km).
const CHARGERS_REFETCH_KM: f64 = 0.2;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Screen {
    Dashboard,
    Settings,
}

/// What the screens read. Everything here is fed by worker events or the
/// user's own edits.
pub struct AppState {
    pub config: Config,
    pub signed_in: bool,
    pub session_expired: Option<String>,
    pub offline: bool,
    pub garage: Vec<VehicleListItem>,
    pub selected_vin: Option<String>,
    pub vehicles: HashMap<String, VehicleData>,
}

pub struct App {
    tx: Sender<UiRequest>,
    rx: Receiver<WorkerEvent>,
    state: AppState,
    screen: Screen,
    banner: Option<(Level, String)>,
    sign_in_form: SignInForm,
    settings_draft: Option<SettingsDraft>,
    dashboard: DashboardState,
    /// Root of the on-disk caches (map tiles go under `tiles/`).
    cache_dir: PathBuf,
    /// Where the charger list was last requested for, while the overlay is on.
    chargers_at: Option<(f64, f64)>,
    initial_callback: Option<String>,
    /// (last_input, focused, minimised) as last sent, and when.
    activity: Activity,
    activity_sent: Option<(Activity, Instant)>,
    /// Epoch ms of each car's last accepted climatisation start.
    climate_started: HashMap<String, i64>,
    /// `VLV_DEMO=1`: commands are answered locally, not sent.
    demo: bool,
}

/// What the UI does with a command's answer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CommandOutcome {
    /// Button tint: `Some(true)` green, `Some(false)` red.
    pub flash: Option<bool>,
    /// New value of the sticky privacy banner, when it changes.
    pub privacy_blocked: Option<bool>,
    pub banner: Option<(Level, String)>,
}

/// The phone's rules: privacy mode becomes the sticky banner (no flash, no
/// alert); accepted commands flash green and clear it; an empty-body 2xx
/// (`UNKNOWN`) is treated as accepted with a note; everything else flashes
/// red with the friendly message.
pub fn command_outcome(status: &str, message: Option<&str>, bucket: Bucket) -> CommandOutcome {
    if status == "NOT_ALLOWED_PRIVACY_ENABLED" {
        return CommandOutcome {
            flash: None,
            privacy_blocked: Some(true),
            banner: None,
        };
    }
    if status == "UNKNOWN" {
        return CommandOutcome {
            flash: Some(true),
            privacy_blocked: Some(false),
            banner: Some((Level::Info, "Sent — outcome unknown.".into())),
        };
    }
    match bucket {
        Bucket::Success | Bucket::Pending => CommandOutcome {
            flash: Some(true),
            privacy_blocked: Some(false),
            banner: None,
        },
        Bucket::UserActionable | Bucket::Failure => CommandOutcome {
            flash: Some(false),
            privacy_blocked: None,
            banner: Some((Level::Danger, friendly_message(status, message))),
        },
    }
}

/// A command's answer, as the worker reported it.
#[derive(Debug, Clone, Copy)]
pub enum CommandAnswer<'a> {
    /// The API answered with an invoke status.
    Result {
        status: &'a str,
        message: Option<&'a str>,
        bucket: Bucket,
    },
    /// The request failed (network, HTTP error, …).
    Error(&'a str),
}

/// The banner for an answer about a car that is no longer on screen: only
/// failures (user-actionable, failed or errored) are shown, as Danger and
/// prefixed with that car's `label`; accepted, pending and outcome-unknown
/// answers stay silent. Flashes, privacy and the unlock window are not
/// touched for such a car.
pub fn other_car_banner(
    label: &str,
    command: CommandName,
    answer: CommandAnswer<'_>,
) -> Option<(Level, String)> {
    let text = match answer {
        CommandAnswer::Error(message) => message.to_string(),
        CommandAnswer::Result {
            status: "UNKNOWN", ..
        } => return None,
        CommandAnswer::Result {
            bucket: Bucket::Success | Bucket::Pending,
            ..
        } => return None,
        CommandAnswer::Result {
            status, message, ..
        } => friendly_message(status, message),
    };
    Some((
        Level::Danger,
        format!("{label} — {}: {text}", command.label()),
    ))
}

/// The car's command list as a set; `None` when absent or with no known name.
pub fn supported_commands(list: Option<&[CommandListItem]>) -> Option<HashSet<CommandName>> {
    let set: HashSet<CommandName> = list?
        .iter()
        .filter_map(|i| i.command.as_deref())
        .filter_map(CommandName::from_api_name)
        .collect();
    (!set.is_empty()).then_some(set)
}

impl App {
    pub fn new(
        config: Config,
        tx: Sender<UiRequest>,
        rx: Receiver<WorkerEvent>,
        cache_dir: PathBuf,
        initial_callback: Option<String>,
    ) -> App {
        #[allow(unused_mut)] // only the debug demo mutates it
        let mut app = App {
            tx,
            rx,
            sign_in_form: SignInForm::from_config(&config),
            state: AppState {
                config,
                signed_in: false,
                session_expired: None,
                offline: false,
                garage: Vec::new(),
                selected_vin: None,
                vehicles: HashMap::new(),
            },
            screen: Screen::Dashboard,
            banner: None,
            settings_draft: None,
            dashboard: DashboardState::default(),
            cache_dir,
            chargers_at: None,
            initial_callback: initial_callback.filter(|u| u.starts_with(CALLBACK_SCHEME)),
            activity: Activity {
                last_input: Instant::now(),
                focused: true,
                minimised: false,
            },
            activity_sent: None,
            climate_started: HashMap::new(),
            demo: false,
        };
        #[cfg(debug_assertions)]
        if crate::demo::enabled() {
            crate::demo::seed(&mut app.state);
            app.demo = true;
        }
        app
    }

    fn send(&self, req: UiRequest) {
        // The worker only goes away when the app is closing.
        let _ = self.tx.send(req);
    }

    fn set_banner(&mut self, level: Level, text: impl Into<String>) {
        self.banner = Some((level, text.into()));
    }

    fn drain_events(&mut self) {
        while let Ok(ev) = self.rx.try_recv() {
            self.on_event(ev);
        }
    }

    fn on_event(&mut self, ev: WorkerEvent) {
        match ev {
            WorkerEvent::SignedIn => {
                self.state.signed_in = true;
                self.state.session_expired = None;
                self.sign_in_form.busy = false;
                self.sign_in_form.authorize_url = None;
                self.sign_in_form.callback_url.clear();
                self.banner = None;
            }
            WorkerEvent::SignedOut => {
                self.state.signed_in = false;
                self.state.session_expired = None;
                self.state.vehicles.clear();
                self.state.garage.clear();
                self.state.selected_vin = None;
                self.climate_started.clear();
                self.dashboard.set_stations(Vec::new());
                self.chargers_at = None;
                self.screen = Screen::Dashboard;
                self.settings_draft = None;
                self.sign_in_form = SignInForm::from_config(&self.state.config);
            }
            WorkerEvent::SignInError(msg) => {
                self.sign_in_form.busy = false;
                self.set_banner(Level::Warn, msg);
            }
            WorkerEvent::AuthorizeUrlOpened(url) => {
                self.sign_in_form.busy = false;
                self.sign_in_form.authorize_url = Some(url);
            }
            WorkerEvent::Garage(list) => self.on_garage(list),
            WorkerEvent::GarageError(msg) => self.set_banner(Level::Danger, msg),
            WorkerEvent::Resource {
                vin,
                resource,
                value,
            } => self
                .state
                .vehicles
                .entry(vin)
                .or_default()
                .apply(resource, value, Instant::now()),
            WorkerEvent::CommandResult {
                vin,
                command,
                status,
                message,
                bucket,
                ready_to_unlock_until,
            } => {
                self.dashboard.finish_command(&vin, command);
                // Flashes, the unlock window and privacy belong to the car
                // on screen; another car only reports its failures.
                if self.state.selected_vin.as_deref() != Some(vin.as_str()) {
                    let answer = CommandAnswer::Result {
                        status: &status,
                        message: message.as_deref(),
                        bucket,
                    };
                    return self.other_car_answer(&vin, command, answer);
                }
                let out = command_outcome(&status, message.as_deref(), bucket);
                let bar = &mut self.dashboard.commands;
                if let Some(ok) = out.flash {
                    bar.set_flash(command, ok, Instant::now());
                }
                if let Some(p) = out.privacy_blocked {
                    bar.privacy_blocked = p;
                }
                if command == CommandName::Unlock && out.flash == Some(true) {
                    if let Some(until) = ready_to_unlock_until {
                        bar.unlock_until_ms = Some(until);
                    }
                }
                if let Some((level, text)) = out.banner {
                    self.set_banner(level, text);
                }
            }
            WorkerEvent::CommandError {
                vin,
                command,
                message,
            } => {
                self.dashboard.finish_command(&vin, command);
                if self.state.selected_vin.as_deref() != Some(vin.as_str()) {
                    return self.other_car_answer(&vin, command, CommandAnswer::Error(&message));
                }
                self.dashboard
                    .commands
                    .set_flash(command, false, Instant::now());
                self.set_banner(Level::Danger, format!("{}: {message}", command.label()));
            }
            WorkerEvent::SessionExpired(msg) => {
                self.sign_in_form.busy = false;
                self.state.session_expired = Some(msg);
            }
            WorkerEvent::Offline(offline) => self.state.offline = offline,
            WorkerEvent::Chargers(Ok(list)) => self.dashboard.set_stations(list),
            WorkerEvent::Chargers(Err(msg)) => {
                self.set_banner(Level::Warn, format!("EV chargers: {msg}"));
            }
            WorkerEvent::ClimateStarted { vin, at_ms }
            | WorkerEvent::ClimateState { vin, at_ms } => {
                self.climate_started.insert(vin, at_ms);
            }
            WorkerEvent::ClimateStopped { vin } => {
                self.climate_started.remove(&vin);
            }
        }
    }

    /// Shows the failure banner, if any, for a command answer about `vin`
    /// while another car is selected.
    fn other_car_answer(&mut self, vin: &str, command: CommandName, answer: CommandAnswer<'_>) {
        let label = vehicle_label(&self.state.config, &self.state.vehicles, vin);
        if let Some((level, text)) = other_car_banner(&label, command, answer) {
            self.set_banner(level, text);
        }
    }

    /// Keeps the saved selection when it is still in the garage, else picks
    /// (and saves) the first car.
    fn on_garage(&mut self, list: Vec<VehicleListItem>) {
        self.state.garage = list;
        let in_garage = |vin: &String| {
            self.state
                .garage
                .iter()
                .any(|v| v.vin.as_ref() == Some(vin))
        };
        let saved = self.state.config.selected_vin.clone().filter(in_garage);
        match saved {
            Some(vin) => {
                self.state.selected_vin = Some(vin.clone());
                self.send(UiRequest::SelectVehicle(vin));
            }
            None => match self.state.garage.iter().find_map(|v| v.vin.clone()) {
                Some(first) => self.select(first),
                None => self.state.selected_vin = None,
            },
        }
    }

    /// Selects `vin` in the worker and persists it.
    fn select(&mut self, vin: String) {
        self.send(UiRequest::SelectVehicle(vin.clone()));
        self.state.selected_vin = Some(vin.clone());
        self.state.config.selected_vin = Some(vin);
        self.send(UiRequest::SaveConfig(self.state.config.clone()));
    }

    fn track_activity(&mut self, ctx: &egui::Context) {
        let (input, focused, minimised) = ctx.input(|i| {
            (
                i.pointer.any_down() || i.pointer.delta() != Vec2::ZERO || !i.events.is_empty(),
                i.viewport().focused.unwrap_or(true),
                i.viewport().minimized.unwrap_or(false),
            )
        });
        let now = Instant::now();
        // Pointer motion counts at most once a second.
        if input && now.duration_since(self.activity.last_input) >= Duration::from_secs(1) {
            self.activity.last_input = now;
        }
        self.activity.focused = focused;
        self.activity.minimised = minimised;
        let a = self.activity;
        let due = match self.activity_sent {
            None => true,
            Some((sent, at)) => {
                sent.last_input != a.last_input
                    || sent.focused != a.focused
                    || sent.minimised != a.minimised
                    || now.duration_since(at) >= ACTIVITY_RESEND
            }
        };
        if due {
            self.activity_sent = Some((a, now));
            self.send(UiRequest::Activity(a));
        }
    }

    fn on_sidebar(&mut self, action: SidebarAction) {
        match action {
            SidebarAction::Select(vin) => {
                self.screen = Screen::Dashboard;
                self.select(vin);
            }
            SidebarAction::Refresh => match self.state.selected_vin.clone() {
                Some(vin) => self.send(UiRequest::Refresh { vin, force: true }),
                None => self.send(UiRequest::LoadGarage),
            },
            SidebarAction::Settings => {
                self.settings_draft = Some(SettingsDraft::new(&self.state.config));
                self.screen = Screen::Settings;
            }
            SidebarAction::SignOut => self.send(UiRequest::SignOut),
        }
    }

    fn on_sign_in(&mut self, action: SignInAction) {
        match action {
            SignInAction::Connect(cfg) => {
                self.state.config = cfg;
                self.send(UiRequest::SaveConfig(self.state.config.clone()));
                let c = &self.state.config;
                if c.client_id.is_empty() || c.vcc_api_key.is_empty() {
                    self.set_banner(
                        Level::Warn,
                        "Configuration missing — Both the OAuth client id and VCC API key are required.",
                    );
                    return;
                }
                self.sign_in_form.busy = true;
                self.sign_in_form.authorize_url = None;
                self.send(UiRequest::StartSignIn { prompt_login: true });
            }
            SignInAction::FinishWithUrl(callback_url) => {
                self.send(UiRequest::FinishSignIn { callback_url });
            }
        }
    }

    fn on_settings(&mut self, action: SettingsAction) {
        match action {
            SettingsAction::Save(mut new) => {
                // The sidebar stays usable while editing; keep its choice.
                new.selected_vin = self.state.config.selected_vin.clone();
                let old = &self.state.config;
                let credentials_changed = old.client_id != new.client_id
                    || old.client_secret != new.client_secret
                    || old.vcc_api_key != new.vcc_api_key
                    || old.scopes != new.scopes;
                let sign_out = credentials_changed && self.state.signed_in;
                self.state.config = new;
                self.sign_in_form = SignInForm::from_config(&self.state.config);
                if sign_out {
                    self.send(UiRequest::SignOut);
                }
                self.send(UiRequest::SaveConfig(self.state.config.clone()));
                if sign_out {
                    self.set_banner(
                        Level::Warn,
                        "Configuration changed — you've been signed out. Connect again to issue a token with the new settings.",
                    );
                } else {
                    self.set_banner(Level::Info, "Configuration updated.");
                }
            }
            SettingsAction::Cancel => {}
        }
        self.settings_draft = None;
        self.screen = Screen::Dashboard;
    }

    fn central(&mut self, ui: &mut Ui) {
        if let Some((level, text)) = &self.banner {
            if widgets::banner(ui, *level, text) {
                self.banner = None;
            }
            ui.add_space(8.0);
        }
        egui::ScrollArea::vertical()
            .auto_shrink([false, false])
            .show(ui, |ui| {
                let width = if self.state.signed_in && self.screen == Screen::Dashboard {
                    DASHBOARD_WIDTH
                } else {
                    CONTENT_WIDTH
                };
                centred_column(ui, width, |ui| self.screen_contents(ui))
            });
    }

    fn screen_contents(&mut self, ui: &mut Ui) {
        if !self.state.signed_in {
            if let Some(a) = sign_in::show(ui, &mut self.sign_in_form, &self.state.config) {
                self.on_sign_in(a);
            }
            return;
        }
        if self.screen == Screen::Settings {
            let draft = self
                .settings_draft
                .get_or_insert_with(|| SettingsDraft::new(&self.state.config));
            if let Some(a) = settings::show(ui, draft, &self.state.garage) {
                self.on_settings(a);
            }
            return;
        }
        if let Some(msg) = self.state.session_expired.clone() {
            ui.add_space(12.0);
            notice(ui, "Session expired", &msg, Level::Warn);
            ui.add_space(8.0);
            if let Some(a) =
                sign_in::connect_controls(ui, &mut self.sign_in_form, &self.state.config)
            {
                self.on_sign_in(a);
            }
        }
        let Some(vin) = self.state.selected_vin.clone() else {
            ui.add_space(12.0);
            ui.label(muted("Loading vehicles…"));
            return;
        };
        self.dashboard.map.configure(
            ui.ctx(),
            self.state.config.tile_url_template.as_deref(),
            &self.cache_dir,
        );
        let label = vehicle_label(&self.state.config, &self.state.vehicles, &vin);
        let data = self.state.vehicles.get(&vin);
        let supported = supported_commands(data.and_then(|d| d.command_list.as_deref()));
        let inputs = CommandInputs {
            supported: supported.as_ref(),
            climate_started_ms: self.climate_started.get(&vin).copied(),
            session_expired: self.state.session_expired.as_deref(),
        };
        let actions = dashboard::show(
            ui,
            &mut self.dashboard,
            &self.state.config,
            &vin,
            &label,
            data,
            inputs,
        );
        for action in actions {
            self.on_dashboard(&vin, action);
        }
        self.fetch_chargers_if_due(&vin);
    }

    /// While the charger overlay is on, asks for chargers around the car
    /// when none were requested yet or the car moved more than 200 m.
    fn fetch_chargers_if_due(&mut self, vin: &str) {
        if !self.dashboard.map.chargers_on {
            return;
        }
        let Some(loc) = self
            .state
            .vehicles
            .get(vin)
            .and_then(|d| d.location.as_ref())
        else {
            return;
        };
        let (lat, lon) = (loc.latitude, loc.longitude);
        let due = self
            .chargers_at
            .is_none_or(|(a, b)| distance_km(a, b, lat, lon) > CHARGERS_REFETCH_KM);
        if due {
            self.chargers_at = Some((lat, lon));
            self.send(UiRequest::FetchChargers { lat, lon });
        }
    }

    fn on_dashboard(&mut self, vin: &str, action: DashboardAction) {
        match action {
            DashboardAction::Command(..) if self.state.session_expired.is_some() => {}
            DashboardAction::Command(command, _) if self.demo => self.demo_command(vin, command),
            DashboardAction::Command(command, runtime_minutes) => {
                self.send(UiRequest::Command {
                    vin: vin.to_string(),
                    command,
                    runtime_minutes,
                });
            }
            // The worker has no per-resource refresh; like the phone's
            // pull-to-refresh, this forces every resource.
            // Disabled while the session is expired (spec §6.2).
            DashboardAction::RefreshLocation if self.state.session_expired.is_some() => {}
            DashboardAction::RefreshLocation => self.send(UiRequest::Refresh {
                vin: vin.to_string(),
                force: true,
            }),
            // The map flips `chargers_on` itself; turning it on fetches anew.
            DashboardAction::ToggleChargers => {
                if self.dashboard.map.chargers_on {
                    self.chargers_at = None;
                }
            }
            DashboardAction::OpenInMaps(lat, lon) | DashboardAction::OpenStation(lat, lon) => {
                // `geo` waits up to 300 ms for xdg-open: keep it off the UI thread.
                std::thread::spawn(move || {
                    if let Err(e) = crate::open::geo(lat, lon) {
                        eprintln!("cannot open the map: {e}");
                    }
                });
            }
            DashboardAction::SetTileTemplate(template) => {
                self.state.config.tile_url_template = Some(template);
                self.send(UiRequest::SaveConfig(self.state.config.clone()));
            }
        }
    }
}

impl App {
    /// Demo mode: answers a command as the worker would on success.
    fn demo_command(&mut self, vin: &str, command: CommandName) {
        let now_ms = chrono::Utc::now().timestamp_millis();
        self.on_event(WorkerEvent::CommandResult {
            vin: vin.to_string(),
            command,
            status: "COMPLETED".into(),
            message: None,
            bucket: Bucket::Success,
            ready_to_unlock_until: (command == CommandName::Unlock).then_some(now_ms + 30_000),
        });
        let vin = vin.to_string();
        match command {
            CommandName::ClimatizationStart => {
                self.on_event(WorkerEvent::ClimateStarted { vin, at_ms: now_ms })
            }
            CommandName::ClimatizationStop => self.on_event(WorkerEvent::ClimateStopped { vin }),
            _ => {}
        }
    }
}

/// Lays `add` out in a column at most `max_width` wide, centred.
fn centred_column(ui: &mut Ui, max_width: f32, add: impl FnOnce(&mut Ui)) {
    let avail = ui.available_width();
    let width = avail.min(max_width);
    ui.horizontal(|ui| {
        ui.add_space(((avail - width) / 2.0).max(0.0));
        ui.vertical(|ui| {
            ui.set_width(width);
            add(ui);
        });
    });
}

impl eframe::App for App {
    fn ui(&mut self, ui: &mut Ui, _frame: &mut eframe::Frame) {
        let ctx = ui.ctx().clone();
        if let Some(url) = self.initial_callback.take() {
            self.send(UiRequest::FinishSignIn { callback_url: url });
        }
        self.drain_events();
        self.track_activity(&ctx);

        let sidebar_action = egui::Panel::left("sidebar")
            .exact_size(200.0)
            .resizable(false)
            .show(ui, |ui| sidebar::show(ui, &self.state))
            .inner;
        if let Some(a) = sidebar_action {
            self.on_sidebar(a);
        }
        egui::CentralPanel::default().show(ui, |ui| self.central(ui));
        ctx.request_repaint_after(TICK);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn command_outcomes_follow_the_phone() {
        let ok = command_outcome("COMPLETED", None, Bucket::Success);
        assert_eq!(
            (ok.flash, ok.privacy_blocked, ok.banner),
            (Some(true), Some(false), None)
        );
        let pending = command_outcome("WAITING", None, Bucket::Pending);
        assert_eq!(pending.flash, Some(true));
        assert!(pending.banner.is_none());

        let privacy = command_outcome("NOT_ALLOWED_PRIVACY_ENABLED", None, Bucket::UserActionable);
        assert_eq!(
            (privacy.flash, privacy.privacy_blocked, privacy.banner),
            (None, Some(true), None)
        );

        let door = command_outcome("UNABLE_TO_LOCK_DOOR_OPEN", None, Bucket::UserActionable);
        assert_eq!(door.flash, Some(false));
        assert_eq!(door.privacy_blocked, None);
        assert_eq!(
            door.banner,
            Some((
                Level::Danger,
                "A door is open — close it and try again.".into()
            ))
        );
        let other = command_outcome("WEIRD", Some("from api"), Bucket::Failure);
        assert_eq!(other.banner, Some((Level::Danger, "from api".into())));

        let unknown = command_outcome("UNKNOWN", None, Bucket::Failure);
        assert_eq!(unknown.flash, Some(true));
        assert_eq!(
            unknown.banner,
            Some((Level::Info, "Sent — outcome unknown.".into()))
        );
    }

    #[test]
    fn other_car_answers_only_report_failures() {
        let result = |status, message, bucket| CommandAnswer::Result {
            status,
            message,
            bucket,
        };
        let lock = CommandName::Lock;
        for quiet in [
            result("COMPLETED", None, Bucket::Success),
            result("WAITING", None, Bucket::Pending),
            result("UNKNOWN", None, Bucket::Failure),
        ] {
            assert_eq!(other_car_banner("XC40", lock, quiet), None);
        }
        assert_eq!(
            other_car_banner(
                "XC40",
                lock,
                result("UNABLE_TO_LOCK_DOOR_OPEN", None, Bucket::UserActionable)
            ),
            Some((
                Level::Danger,
                "XC40 — Lock: A door is open — close it and try again.".into()
            ))
        );
        // Privacy mode on another car is a plain failure, not the sticky banner.
        let privacy = other_car_banner(
            "XC40",
            lock,
            result("NOT_ALLOWED_PRIVACY_ENABLED", None, Bucket::UserActionable),
        );
        assert_eq!(privacy.map(|(l, _)| l), Some(Level::Danger));
        assert_eq!(
            other_car_banner(
                "YV1X",
                CommandName::Honk,
                result("WEIRD", Some("from api"), Bucket::Failure)
            ),
            Some((
                Level::Danger,
                format!("YV1X — {}: from api", CommandName::Honk.label())
            ))
        );
        assert_eq!(
            other_car_banner(
                "2024 EX30",
                lock,
                CommandAnswer::Error("network error: dns")
            ),
            Some((Level::Danger, "2024 EX30 — Lock: network error: dns".into()))
        );
    }

    #[test]
    fn supported_set_from_command_list() {
        assert_eq!(supported_commands(None), None);
        assert_eq!(supported_commands(Some(&[])), None);
        let item = |c: Option<&str>| CommandListItem {
            command: c.map(str::to_string),
        };
        assert_eq!(
            supported_commands(Some(&[item(Some("TELEPORT")), item(None)])),
            None
        );
        let set =
            supported_commands(Some(&[item(Some("LOCK")), item(Some("HONK_AND_FLASH"))])).unwrap();
        assert_eq!(
            set,
            HashSet::from([CommandName::Lock, CommandName::HonkFlash])
        );
    }
}
