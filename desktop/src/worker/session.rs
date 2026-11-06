//! Volvo ID session owned by the worker: tokens, sign-in state and the
//! refresh-once-on-401 policy. Never touched from the UI thread.

use std::future::Future;
use std::sync::Arc;
use std::time::{Duration, Instant};

use crate::api::client::VolvoClient;
use crate::api::error::ApiError;
use crate::auth::flow::{parse_callback, PendingSignIn};
use crate::auth::token::{needs_refresh, TokenEndpoint};
use crate::auth::AuthError;
use crate::config::{clear_tokens, save_tokens, Config, Tokens};
use crate::paths::Paths;

/// Volvo ID refresh tokens die after about 30 minutes without use and
/// `offline_access` is not granted, so the worker refreshes at least this often
/// while the app runs, whatever the window state. This hits the token
/// endpoint only, not the metered connected-vehicle API.
pub const KEEPALIVE_INTERVAL: Duration = Duration::from_secs(20 * 60);

const HTTP_TIMEOUT: Duration = Duration::from_secs(30);
const USER_AGENT: &str = concat!(
    "VlvCompanion/",
    env!("CARGO_PKG_VERSION"),
    " (linux-desktop)"
);
const NOT_SIGNED_IN: &str = "Not signed in.";
const SIGN_IN_AGAIN: &str = "Your Volvo session has expired. Sign in again.";

pub struct Session {
    pub paths: Paths,
    pub config: Config,
    pub tokens: Option<Tokens>,
    pub pending: Option<PendingSignIn>,
    pub http: reqwest::Client,
    pub endpoint: TokenEndpoint,
    pub expired: bool,
    pub last_token_refresh: Option<Instant>,
    api_base: String,
    client: Arc<VolvoClient>,
    /// Set when the session has just expired; the worker turns it into one
    /// `SessionExpired` event.
    expired_notice: Option<String>,
}

fn endpoint_for(config: &Config, token_url: String) -> TokenEndpoint {
    TokenEndpoint {
        token_url,
        client_id: config.client_id.trim().to_string(),
        client_secret: Some(config.client_secret.trim().to_string()).filter(|s| !s.is_empty()),
    }
}

impl Session {
    pub fn new(
        paths: Paths,
        config: Config,
        tokens: Option<Tokens>,
        api_base: String,
        token_url: String,
    ) -> Session {
        let http = reqwest::Client::builder()
            .timeout(HTTP_TIMEOUT)
            .user_agent(USER_AGENT)
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());
        let client = Arc::new(VolvoClient::new(
            http.clone(),
            api_base.clone(),
            config.vcc_api_key.trim().to_string(),
        ));
        Session {
            paths,
            endpoint: endpoint_for(&config, token_url),
            config,
            tokens,
            pending: None,
            http,
            expired: false,
            last_token_refresh: None,
            api_base,
            client,
            expired_notice: None,
        }
    }

    /// Replaces the configuration and rebuilds the API client and token endpoint.
    pub fn set_config(&mut self, config: Config) {
        let token_url = std::mem::take(&mut self.endpoint.token_url);
        self.endpoint = endpoint_for(&config, token_url);
        self.client = Arc::new(VolvoClient::new(
            self.http.clone(),
            self.api_base.clone(),
            config.vcc_api_key.trim().to_string(),
        ));
        self.config = config;
    }

    pub fn client(&self) -> Arc<VolvoClient> {
        self.client.clone()
    }

    pub fn signed_in(&self) -> bool {
        self.tokens.is_some() && !self.expired
    }

    pub fn take_expired_notice(&mut self) -> Option<String> {
        self.expired_notice.take()
    }

    /// True when the keep-alive refresh is due (signed in and not refreshed
    /// within `KEEPALIVE_INTERVAL`).
    pub fn keepalive_due(&self, now: Instant) -> bool {
        self.signed_in()
            && self
                .last_token_refresh
                .is_none_or(|t| now.saturating_duration_since(t) >= KEEPALIVE_INTERVAL)
    }

    /// Drops the tokens (memory and disk), stops polling and records a notice.
    pub fn expire(&mut self, message: &str) -> ApiError {
        self.tokens = None;
        if let Err(e) = clear_tokens(&self.paths) {
            eprintln!("cannot remove tokens.json: {e}");
        }
        self.expired = true;
        self.expired_notice = Some(message.to_string());
        ApiError::SessionExpired(message.to_string())
    }

    /// Clears the session on explicit sign-out.
    pub fn sign_out(&mut self) {
        self.tokens = None;
        if let Err(e) = clear_tokens(&self.paths) {
            eprintln!("cannot remove tokens.json: {e}");
        }
        self.expired = false;
        self.pending = None;
        self.last_token_refresh = None;
        self.expired_notice = None;
    }

    pub fn persist_tokens(&self) {
        if let Some(t) = &self.tokens {
            if let Err(e) = save_tokens(&self.paths, t) {
                eprintln!("cannot save tokens.json: {e}");
            }
        }
    }

    /// A valid access token, refreshing first when it is about to expire.
    pub async fn access_token(&mut self) -> Result<String, ApiError> {
        let Some(t) = &self.tokens else {
            return Err(ApiError::SessionExpired(NOT_SIGNED_IN.into()));
        };
        if self.expired {
            return Err(ApiError::SessionExpired(NOT_SIGNED_IN.into()));
        }
        if needs_refresh(t.expires_at_unix, chrono::Utc::now().timestamp()) {
            return self.refresh_tokens().await;
        }
        Ok(t.access_token.clone())
    }

    /// Uses the refresh token now. A rejected refresh expires the session; a
    /// transport failure is reported as `ApiError::Network` and keeps it.
    pub async fn refresh_tokens(&mut self) -> Result<String, ApiError> {
        let Some(old) = self.tokens.clone() else {
            return Err(ApiError::SessionExpired(NOT_SIGNED_IN.into()));
        };
        let Some(refresh_token) = old.refresh_token.as_deref().filter(|r| !r.is_empty()) else {
            return Err(self.expire(SIGN_IN_AGAIN));
        };
        match self.endpoint.refresh(&self.http, refresh_token).await {
            Ok(mut fresh) => {
                fresh.climate_started_at = old.climate_started_at;
                if fresh.id_token.is_none() {
                    fresh.id_token = old.id_token;
                }
                let access = fresh.access_token.clone();
                self.tokens = Some(fresh);
                self.last_token_refresh = Some(Instant::now());
                self.persist_tokens();
                Ok(access)
            }
            Err(AuthError::Http(e)) => Err(ApiError::Network(e.to_string())),
            Err(e) => Err(self.expire(&format!(
                "Your Volvo session has expired ({e}). Sign in again."
            ))),
        }
    }

    /// Runs `f` with a valid token. On a 401 it refreshes once and retries
    /// once; a second 401 expires the session.
    pub async fn with_retry<T, F, Fut>(&mut self, f: F) -> Result<T, ApiError>
    where
        F: Fn(Arc<VolvoClient>, String) -> Fut,
        Fut: Future<Output = Result<T, ApiError>>,
    {
        let token = self.access_token().await?;
        match f(self.client(), token).await {
            Err(ApiError::Http { status: 401, .. }) => {
                let token = self.refresh_tokens().await?;
                match f(self.client(), token).await {
                    Err(ApiError::Http { status: 401, .. }) => Err(self.expire(SIGN_IN_AGAIN)),
                    other => other,
                }
            }
            other => other,
        }
    }

    /// Validates the callback against the pending sign-in. The pending flow
    /// is consumed unless the state does not match (a stale or foreign
    /// callback must not cancel the attempt in progress).
    pub fn finish_sign_in(&mut self, url: &str) -> Result<(String, PendingSignIn), AuthError> {
        let pending = self.pending.as_ref().ok_or(AuthError::NoPendingSignIn)?;
        match parse_callback(url, pending) {
            Err(AuthError::StateMismatch) => Err(AuthError::StateMismatch),
            other => {
                let pending = self.pending.take().expect("checked above");
                other.map(|code| (code, pending))
            }
        }
    }

    /// Exchanges the callback's code for tokens and stores them.
    pub async fn complete_sign_in(&mut self, url: &str) -> Result<(), AuthError> {
        let (code, pending) = self.finish_sign_in(url)?;
        let mut tokens = self
            .endpoint
            .exchange_code(
                &self.http,
                &code,
                &pending.pkce.verifier,
                &pending.redirect_uri,
                &pending.nonce,
            )
            .await?;
        if let Some(old) = self.tokens.take() {
            tokens.climate_started_at = old.climate_started_at;
        }
        self.tokens = Some(tokens);
        self.expired = false;
        self.expired_notice = None;
        self.last_token_refresh = Some(Instant::now());
        self.persist_tokens();
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::auth::pkce::Pkce;

    fn session_with(paths: Paths, tokens: Option<Tokens>, base: &str) -> Session {
        let config = Config {
            client_id: "vid-dcr-x".into(),
            client_secret: "secret".into(),
            vcc_api_key: "K".into(),
            ..Config::default()
        };
        Session::new(
            paths,
            config,
            tokens,
            base.to_string(),
            format!("{base}/token"),
        )
    }

    fn tokens(access: &str, expires_at_unix: i64) -> Tokens {
        Tokens {
            access_token: access.into(),
            refresh_token: Some("R".into()),
            expires_at_unix,
            ..Tokens::default()
        }
    }

    fn pending(state: &str) -> PendingSignIn {
        PendingSignIn {
            state: state.into(),
            nonce: "N".into(),
            pkce: Pkce::generate(),
            redirect_uri: "volvo-companion://oauth/callback".into(),
        }
    }

    #[tokio::test]
    async fn with_retry_refreshes_once_on_401() {
        let server = httpmock::MockServer::start();
        let token = server.mock(|w, t| {
            w.method("POST")
                .path("/token")
                .body_contains("grant_type=refresh_token");
            t.status(200)
                .json_body(serde_json::json!({"access_token":"NEW","expires_in":300}));
        });
        let old = server.mock(|w, t| {
            w.method("GET")
                .path("/x")
                .header("authorization", "Bearer OLD");
            t.status(401)
                .json_body(serde_json::json!({"error":{"message":"expired"}}));
        });
        let new = server.mock(|w, t| {
            w.method("GET")
                .path("/x")
                .header("authorization", "Bearer NEW");
            t.status(200).json_body(serde_json::json!({"ok":true}));
        });
        let dir = tempfile::tempdir().unwrap();
        let far = chrono::Utc::now().timestamp() + 3600;
        let mut s = session_with(
            Paths::in_dir(dir.path()),
            Some(tokens("OLD", far)),
            &server.base_url(),
        );
        let v = s
            .with_retry(|c, t| async move { c.get::<serde_json::Value>("/x", &t).await })
            .await
            .unwrap();
        assert_eq!(v, serde_json::json!({"ok":true}));
        token.assert_hits(1);
        old.assert_hits(1);
        new.assert_hits(1);
        assert_eq!(s.tokens.as_ref().unwrap().access_token, "NEW");
        assert!(!s.expired);
    }

    #[tokio::test]
    async fn refresh_failure_sets_session_expired_and_stops_polling() {
        let server = httpmock::MockServer::start();
        let token = server.mock(|w, t| {
            w.method("POST").path("/token");
            t.status(400).json_body(
                serde_json::json!({"error":"invalid_grant","error_description":"Token is not active"}),
            );
        });
        let dir = tempfile::tempdir().unwrap();
        let paths = Paths::in_dir(dir.path());
        let expired_tokens = tokens("OLD", chrono::Utc::now().timestamp() - 10);
        crate::config::save_tokens(&paths, &expired_tokens).unwrap();
        let mut s = session_with(paths.clone(), Some(expired_tokens), &server.base_url());
        assert!(matches!(
            s.access_token().await,
            Err(ApiError::SessionExpired(_))
        ));
        assert!(s.expired);
        assert!(s.tokens.is_none());
        assert!(crate::config::load_tokens(&paths).is_none());
        assert!(matches!(
            s.access_token().await,
            Err(ApiError::SessionExpired(_))
        ));
        token.assert_hits(1);
    }

    #[test]
    fn finish_sign_in_without_pending_flow_errors() {
        let dir = tempfile::tempdir().unwrap();
        let mut s = session_with(Paths::in_dir(dir.path()), None, "http://127.0.0.1:9");
        let e = s
            .finish_sign_in("volvo-companion://oauth/callback?code=c&state=s")
            .unwrap_err();
        assert!(matches!(e, AuthError::NoPendingSignIn));
        assert_eq!(
            e.to_string(),
            "Start sign-in from this window, then return here."
        );
    }

    #[test]
    fn finish_sign_in_keeps_pending_on_state_mismatch() {
        let dir = tempfile::tempdir().unwrap();
        let mut s = session_with(Paths::in_dir(dir.path()), None, "http://127.0.0.1:9");
        s.pending = Some(pending("A"));
        assert!(matches!(
            s.finish_sign_in("volvo-companion://oauth/callback?code=c&state=B"),
            Err(AuthError::StateMismatch)
        ));
        assert!(s.pending.is_some());
    }
}
