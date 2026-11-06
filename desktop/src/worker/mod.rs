//! Background worker: owns the Volvo session and does all network and
//! process-spawning work so the UI thread never blocks.
//!
//! One `vlv-worker` thread runs a tokio runtime. UI requests and IPC callback
//! URLs arrive on std channels; two small bridge threads forward them into a
//! single tokio channel that the worker loop `select!`s on together with a
//! 1 s timer (scheduler tick and session keep-alive).

#[allow(dead_code)] // variants and fields are read by the UI task
pub mod messages;
pub mod session;

use std::collections::HashMap;
use std::sync::mpsc as std_mpsc;
use std::sync::Arc;
use std::time::{Duration, Instant};

use tokio::sync::{mpsc, Semaphore};
use tokio::task::JoinSet;

use crate::api::client::EMPTY_BODY;
use crate::api::commands::{bucket_of, Bucket, CommandName};
use crate::api::error::ApiError;
use crate::api::models::{Envelope, Invoke, InvokeResponse, VehicleListItem};
use crate::api::overpass;
use crate::auth::flow::build_authorize_url;
use crate::auth::{AuthError, TOKEN_URL};
use crate::config::{save_config, Config, Tokens};
use crate::open;
use crate::paths::Paths;
use crate::state::cache::{Resource, VehicleCache};
use crate::state::climate;
use crate::state::schedule::{Activity, Scheduler};

use messages::{UiRequest, WorkerEvent};
use session::Session;

pub const API_BASE: &str = "https://api.volvocars.com";
const GARAGE_PATH: &str = "/connected-vehicle/v2/vehicles";
const MAX_IN_FLIGHT: usize = 4;
const TICK: Duration = Duration::from_secs(1);
const POST_COMMAND_REFRESH: Duration = Duration::from_secs(5);
/// Wait before retrying a keep-alive refresh that failed on the network.
const KEEPALIVE_RETRY: Duration = Duration::from_secs(60);
const CHARGER_RADIUS_M: u32 = 5000;

enum Msg {
    Ui(UiRequest),
    Callback(String),
    DelayedRefresh(String),
    Shutdown,
}

/// Starts the worker thread. `repaint` is called after every event.
pub fn spawn(
    paths: Paths,
    config: Config,
    tokens: Option<Tokens>,
    ipc_rx: std_mpsc::Receiver<String>,
    repaint: impl Fn() + Send + 'static,
) -> (std_mpsc::Sender<UiRequest>, std_mpsc::Receiver<WorkerEvent>) {
    let (req_tx, req_rx) = std_mpsc::channel::<UiRequest>();
    let (ev_tx, ev_rx) = std_mpsc::channel::<WorkerEvent>();
    let (msg_tx, msg_rx) = mpsc::unbounded_channel::<Msg>();

    let ui_bridge = msg_tx.clone();
    let _ = std::thread::Builder::new()
        .name("vlv-worker-ui".into())
        .spawn(move || {
            for req in req_rx {
                if ui_bridge.send(Msg::Ui(req)).is_err() {
                    return;
                }
            }
            // The UI dropped its sender: the app is closing.
            let _ = ui_bridge.send(Msg::Shutdown);
        });
    let ipc_bridge = msg_tx.clone();
    let _ = std::thread::Builder::new()
        .name("vlv-worker-ipc".into())
        .spawn(move || {
            for url in ipc_rx {
                if ipc_bridge.send(Msg::Callback(url)).is_err() {
                    return;
                }
            }
        });

    let spawned = std::thread::Builder::new()
        .name("vlv-worker".into())
        .spawn(move || {
            let rt = match tokio::runtime::Builder::new_multi_thread()
                .worker_threads(2)
                .thread_name("vlv-worker-rt")
                .enable_all()
                .build()
            {
                Ok(rt) => rt,
                Err(e) => {
                    eprintln!("cannot start the worker runtime: {e}");
                    return;
                }
            };
            let session = Session::new(
                paths,
                config,
                tokens,
                API_BASE.to_string(),
                TOKEN_URL.to_string(),
            );
            let worker = Worker::new(session, ev_tx, Box::new(repaint), msg_tx);
            rt.block_on(worker.run(msg_rx));
        });
    if let Err(e) = spawned {
        eprintln!("cannot start the worker thread: {e}");
    }
    (req_tx, ev_rx)
}

fn api_message(e: &ApiError) -> String {
    e.region_hint()
        .map(str::to_owned)
        .unwrap_or_else(|| e.to_string())
}

struct Worker {
    session: Session,
    events: std_mpsc::Sender<WorkerEvent>,
    repaint: Box<dyn Fn() + Send>,
    internal: mpsc::UnboundedSender<Msg>,
    garage: Vec<VehicleListItem>,
    selected: Option<String>,
    caches: HashMap<String, VehicleCache>,
    scheduler: Scheduler,
    activity: Activity,
    offline: bool,
    keepalive_retry_at: Option<Instant>,
}

impl Worker {
    fn new(
        session: Session,
        events: std_mpsc::Sender<WorkerEvent>,
        repaint: Box<dyn Fn() + Send>,
        internal: mpsc::UnboundedSender<Msg>,
    ) -> Worker {
        let selected = session.config.selected_vin.clone();
        Worker {
            session,
            events,
            repaint,
            internal,
            garage: Vec::new(),
            selected,
            caches: HashMap::new(),
            scheduler: Scheduler::default(),
            activity: Activity {
                last_input: Instant::now(),
                focused: true,
                minimised: false,
            },
            offline: false,
            keepalive_retry_at: None,
        }
    }

    fn emit(&self, ev: WorkerEvent) {
        let _ = self.events.send(ev);
        (self.repaint)();
    }

    async fn run(mut self, mut rx: mpsc::UnboundedReceiver<Msg>) {
        if self.session.tokens.is_some() {
            // Keeps the session alive straight away and loads the vehicles.
            self.keepalive().await;
            self.load_garage().await;
        }
        let mut timer = tokio::time::interval(TICK);
        timer.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
        loop {
            tokio::select! {
                msg = rx.recv() => match msg {
                    None | Some(Msg::Shutdown) => break,
                    Some(Msg::Ui(req)) => self.handle(req).await,
                    Some(Msg::Callback(url)) => self.finish_sign_in(&url).await,
                    Some(Msg::DelayedRefresh(vin)) => self.refresh(&vin, true).await,
                },
                _ = timer.tick() => self.on_tick().await,
            }
            self.flush_expired_notice();
        }
    }

    fn flush_expired_notice(&mut self) {
        if let Some(msg) = self.session.take_expired_notice() {
            self.emit(WorkerEvent::SessionExpired(msg));
        }
    }

    fn set_offline(&mut self, offline: bool) {
        if self.offline != offline {
            self.offline = offline;
            self.emit(WorkerEvent::Offline(offline));
        }
    }

    /// Tracks connectivity from the outcome of one API call.
    fn note<T>(&mut self, r: &Result<T, ApiError>) {
        match r {
            Ok(_) => self.set_offline(false),
            Err(ApiError::Network(_)) => self.set_offline(true),
            Err(_) => {}
        }
    }

    async fn handle(&mut self, req: UiRequest) {
        match req {
            UiRequest::StartSignIn { prompt_login } => self.start_sign_in(prompt_login),
            UiRequest::FinishSignIn { callback_url } => self.finish_sign_in(&callback_url).await,
            UiRequest::SignOut => {
                self.session.sign_out();
                self.caches.clear();
                self.garage.clear();
                self.emit(WorkerEvent::SignedOut);
            }
            UiRequest::SaveConfig(cfg) => {
                if let Err(e) = save_config(&self.session.paths, &cfg) {
                    eprintln!("cannot save config.json: {e}");
                }
                self.session.set_config(cfg);
            }
            UiRequest::SelectVehicle(vin) => {
                self.selected = Some(vin.clone());
                self.refresh(&vin, false).await;
            }
            UiRequest::Refresh { vin, force } => self.refresh(&vin, force).await,
            UiRequest::LoadGarage => self.load_garage().await,
            UiRequest::Command {
                vin,
                command,
                runtime_minutes,
            } => self.command(vin, command, runtime_minutes).await,
            UiRequest::FetchChargers { lat, lon } => {
                let r = overpass::fetch(&self.session.http, lat, lon, CHARGER_RADIUS_M).await;
                self.note(&r);
                self.emit(WorkerEvent::Chargers(r.map_err(|e| api_message(&e))));
            }
            UiRequest::Activity(a) => self.activity = a,
        }
    }

    fn start_sign_in(&mut self, prompt_login: bool) {
        let prompt = if prompt_login { Some("login") } else { None };
        match build_authorize_url(&self.session.config, prompt) {
            Ok((url, pending)) => {
                self.session.pending = Some(pending);
                if let Err(e) = open::url(url.as_str()) {
                    eprintln!("cannot open the browser: {e}");
                }
                self.emit(WorkerEvent::AuthorizeUrlOpened(url.to_string()));
            }
            Err(e) => self.emit(WorkerEvent::SignInError(e.to_string())),
        }
    }

    async fn finish_sign_in(&mut self, url: &str) {
        match self.session.complete_sign_in(url).await {
            Ok(()) => {
                self.keepalive_retry_at = None;
                self.emit(WorkerEvent::SignedIn);
                self.load_garage().await;
            }
            Err(e) => {
                if let AuthError::Http(_) = e {
                    self.set_offline(true);
                }
                self.emit(WorkerEvent::SignInError(e.to_string()));
            }
        }
    }

    async fn on_tick(&mut self) {
        let now = Instant::now();
        if self.keepalive_retry_at.is_none_or(|t| now >= t) && self.session.keepalive_due(now) {
            self.keepalive().await;
        }
        if !self.session.signed_in() {
            return;
        }
        if self.scheduler.should_tick(&self.activity, now) {
            if let Some(vin) = self.selected_vin() {
                self.refresh(&vin, false).await;
            }
        }
    }

    async fn keepalive(&mut self) {
        let r = self.session.refresh_tokens().await;
        self.keepalive_retry_at = match &r {
            Err(ApiError::Network(_)) => Some(Instant::now() + KEEPALIVE_RETRY),
            _ => None,
        };
        self.note(&r);
    }

    fn selected_vin(&self) -> Option<String> {
        self.selected
            .clone()
            .or_else(|| self.garage.iter().find_map(|v| v.vin.clone()))
    }

    async fn load_garage(&mut self) {
        let r = self
            .session
            .with_retry(|c, t| async move {
                c.get::<Envelope<Vec<VehicleListItem>>>(GARAGE_PATH, &t)
                    .await
            })
            .await;
        self.note(&r);
        match r {
            Ok(env) => {
                self.garage = env.data.unwrap_or_default();
                let known = |vin: &String| self.garage.iter().any(|v| v.vin.as_ref() == Some(vin));
                if !self.selected.as_ref().is_some_and(known) {
                    self.selected = None;
                }
                self.emit(WorkerEvent::Garage(self.garage.clone()));
                if let Some(vin) = self.selected_vin() {
                    self.refresh(&vin, false).await;
                }
            }
            Err(ApiError::SessionExpired(_)) => {}
            Err(e) => self.emit(WorkerEvent::GarageError(api_message(&e))),
        }
    }

    /// Fetches the due (or, with `force`, all) resources of `vin`, at most
    /// `MAX_IN_FLIGHT` at a time. Resources answered with 401 are retried
    /// once after a token refresh.
    async fn refresh(&mut self, vin: &str, force: bool) {
        if !self.session.signed_in() {
            return;
        }
        let due = self
            .caches
            .entry(vin.to_string())
            .or_default()
            .due(Instant::now(), force);
        if due.is_empty() {
            return;
        }
        let token = match self.session.access_token().await {
            Ok(t) => t,
            Err(e) => return self.note(&Err::<(), _>(e)),
        };
        let unauthorised = self.fetch_batch(vin, due, token).await;
        if unauthorised.is_empty() {
            return;
        }
        match self.session.refresh_tokens().await {
            Ok(token) => {
                if !self.fetch_batch(vin, unauthorised, token).await.is_empty() {
                    self.session
                        .expire("Your Volvo session was rejected by the API. Sign in again.");
                }
            }
            Err(e) => self.note(&Err::<(), _>(e)),
        }
    }

    /// Emits one `Resource` event per completed fetch; returns the resources
    /// that came back 401 (no event is emitted for those).
    async fn fetch_batch(
        &mut self,
        vin: &str,
        list: Vec<Resource>,
        token: String,
    ) -> Vec<Resource> {
        let client = self.session.client();
        let gate = Arc::new(Semaphore::new(MAX_IN_FLIGHT));
        let mut set = JoinSet::new();
        for resource in list {
            let (client, gate, token) = (client.clone(), gate.clone(), token.clone());
            let path = resource.path(vin);
            set.spawn(async move {
                let _permit = gate.acquire_owned().await;
                let r = client.get::<serde_json::Value>(&path, &token).await;
                (resource, r)
            });
        }
        let mut unauthorised = Vec::new();
        while let Some(joined) = set.join_next().await {
            let Ok((resource, r)) = joined else { continue };
            if let Err(ApiError::Http { status: 401, .. }) = r {
                unauthorised.push(resource);
                continue;
            }
            self.note(&r);
            let value = r.map_err(|e| api_message(&e));
            self.caches.entry(vin.to_string()).or_default().put(
                resource,
                value.clone(),
                Instant::now(),
            );
            self.emit(WorkerEvent::Resource {
                vin: vin.to_string(),
                resource,
                value,
            });
        }
        unauthorised
    }

    async fn command(&mut self, vin: String, command: CommandName, runtime_minutes: Option<u8>) {
        let path = format!(
            "/connected-vehicle/v2/vehicles/{vin}/commands/{}",
            command.path()
        );
        let body = match runtime_minutes {
            Some(n) => serde_json::json!({ "runtimeMinutes": n }),
            None => serde_json::json!({}),
        };
        let r = self
            .session
            .with_retry(|c, t| {
                let (path, body) = (path.clone(), body.clone());
                async move { c.post_json::<InvokeResponse>(&path, &t, &body).await }
            })
            .await;
        self.note(&r);
        let invoke = match r {
            Ok(resp) => resp.data,
            // A 2xx without a body: the request was taken but the outcome is unknown.
            Err(ApiError::Http {
                status: 200..=299,
                code: Some(code),
                ..
            }) if code == EMPTY_BODY => Invoke {
                invoke_status: "UNKNOWN".into(),
                ..Invoke::default()
            },
            Err(e) => {
                return self.emit(WorkerEvent::CommandError {
                    command,
                    message: api_message(&e),
                })
            }
        };
        let bucket = bucket_of(&invoke.invoke_status);
        let accepted = matches!(bucket, Bucket::Success | Bucket::Pending);
        self.emit(WorkerEvent::CommandResult {
            vin: vin.clone(),
            command,
            status: invoke.invoke_status,
            message: invoke.message,
            bucket,
            ready_to_unlock_until: invoke.ready_to_unlock_until,
        });
        if !accepted {
            return;
        }
        self.climate_bookkeeping(&vin, command);
        let tx = self.internal.clone();
        tokio::spawn(async move {
            tokio::time::sleep(POST_COMMAND_REFRESH).await;
            let _ = tx.send(Msg::DelayedRefresh(vin));
        });
    }

    fn climate_bookkeeping(&mut self, vin: &str, command: CommandName) {
        let now_ms = chrono::Utc::now().timestamp_millis();
        let Some(tokens) = self.session.tokens.as_mut() else {
            return;
        };
        let event = match command {
            CommandName::ClimatizationStart => {
                climate::purge(&mut tokens.climate_started_at, now_ms);
                tokens.climate_started_at.insert(vin.to_string(), now_ms);
                WorkerEvent::ClimateStarted {
                    vin: vin.to_string(),
                    at_ms: now_ms,
                }
            }
            CommandName::ClimatizationStop => {
                tokens.climate_started_at.remove(vin);
                WorkerEvent::ClimateStopped {
                    vin: vin.to_string(),
                }
            }
            _ => return,
        };
        self.session.persist_tokens();
        self.emit(event);
    }
}
