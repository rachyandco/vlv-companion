//! The eframe application: drains worker events into `AppState`, tracks
//! activity, and draws the sidebar plus the current screen.

use std::collections::HashMap;
use std::sync::mpsc::{Receiver, Sender};
use std::time::{Duration, Instant};

use egui::{Ui, Vec2};

use crate::api::commands::{friendly_message, Bucket};
use crate::api::models::VehicleListItem;
use crate::config::Config;
use crate::state::schedule::Activity;
use crate::ui::dashboard::{self, DashboardAction, DashboardState};
use crate::ui::data::VehicleData;
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
const DASHBOARD_WIDTH: f32 = 1100.0;
const CALLBACK_SCHEME: &str = "volvo-companion://";

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
    initial_callback: Option<String>,
    /// (last_input, focused, minimised) as last sent, and when.
    activity: Activity,
    activity_sent: Option<(Activity, Instant)>,
}

impl App {
    pub fn new(
        config: Config,
        tx: Sender<UiRequest>,
        rx: Receiver<WorkerEvent>,
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
            initial_callback: initial_callback.filter(|u| u.starts_with(CALLBACK_SCHEME)),
            activity: Activity {
                last_input: Instant::now(),
                focused: true,
                minimised: false,
            },
            activity_sent: None,
        };
        #[cfg(debug_assertions)]
        if crate::demo::enabled() {
            crate::demo::seed(&mut app.state);
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
                ..
            } => {
                self.dashboard.finish_command(Some(&vin), command);
                let level = match bucket {
                    Bucket::Success | Bucket::Pending => Level::Info,
                    Bucket::UserActionable => Level::Warn,
                    Bucket::Failure => Level::Danger,
                };
                let text = friendly_message(&status, message.as_deref());
                self.set_banner(level, format!("{}: {text}", command.label()));
            }
            WorkerEvent::CommandError { command, message } => {
                self.dashboard.finish_command(None, command);
                self.set_banner(Level::Danger, format!("{}: {message}", command.label()));
            }
            WorkerEvent::SessionExpired(msg) => {
                self.sign_in_form.busy = false;
                self.state.session_expired = Some(msg);
            }
            WorkerEvent::Offline(offline) => self.state.offline = offline,
            // Drawn by the dashboard map and climate tasks.
            WorkerEvent::Chargers(_)
            | WorkerEvent::ClimateStarted { .. }
            | WorkerEvent::ClimateStopped { .. } => {}
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
        let label = vehicle_label(&self.state.config, &self.state.vehicles, &vin);
        let data = self.state.vehicles.get(&vin);
        let actions = dashboard::show(
            ui,
            &mut self.dashboard,
            &self.state.config,
            &vin,
            &label,
            data,
        );
        for action in actions {
            self.on_dashboard(&vin, action);
        }
    }

    fn on_dashboard(&mut self, vin: &str, action: DashboardAction) {
        match action {
            DashboardAction::Command(command, runtime_minutes) => {
                self.send(UiRequest::Command {
                    vin: vin.to_string(),
                    command,
                    runtime_minutes,
                });
            }
            // Wired to the map in Task 12.
            DashboardAction::RefreshLocation
            | DashboardAction::ToggleChargers
            | DashboardAction::OpenInMaps(..)
            | DashboardAction::OpenStation(..)
            | DashboardAction::SetTileTemplate(_) => {}
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
