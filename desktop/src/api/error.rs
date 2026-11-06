//! Error type for Volvo API calls and the phone app's classification rules.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("HTTP {status}: {message}")]
    Http {
        status: u16,
        code: Option<String>,
        message: String,
    },
    #[error("network error: {0}")]
    Network(String),
    #[error("session expired: {0}")]
    SessionExpired(String),
    #[error("not configured: {0}")]
    NotConfigured(String),
}

#[derive(Debug, PartialEq)]
pub enum ErrorKind {
    Session,
    Transient,
    Api,
}

impl ApiError {
    pub fn kind(&self) -> ErrorKind {
        match self {
            ApiError::Http { status: 401, .. } | ApiError::SessionExpired(_) => ErrorKind::Session,
            ApiError::Network(_) => ErrorKind::Transient,
            _ => ErrorKind::Api,
        }
    }

    /// Mirrors the phone's `regionRestrictionHint`, limited to 403 responses.
    pub fn region_hint(&self) -> Option<&'static str> {
        if let ApiError::Http {
            status: 403,
            code,
            message,
        } = self
        {
            let hay = format!("{} {}", code.as_deref().unwrap_or(""), message).to_lowercase();
            const NEEDLES: [&str; 5] = [
                "allowed markets",
                "not allowed to access",
                "out-of-market",
                "out of market",
                "wrong market",
            ];
            if NEEDLES.iter().any(|n| hay.contains(n)) {
                return Some("This API is not available for your vehicle's market.");
            }
        }
        None
    }
}

/// Parse a non-2xx response body into an `ApiError::Http`, following the
/// phone's `readError`: `{error:{code,message,description}}` or flat
/// `{code,message}`; description wins over message.
pub fn from_response(status: u16, reason: &str, body: &str) -> ApiError {
    let payload: Option<serde_json::Value> = serde_json::from_str(body).ok();
    let envelope = payload
        .as_ref()
        .and_then(|p| p.get("error"))
        .filter(|e| e.is_object());
    let flat = if envelope.is_none() {
        payload.as_ref().filter(|p| p.is_object())
    } else {
        None
    };
    let node = envelope.or(flat);
    let s = |v: &serde_json::Value, k: &str| -> Option<String> {
        v.get(k).and_then(|x| x.as_str()).map(str::to_owned)
    };
    let message = node
        .and_then(|n| s(n, "description").or_else(|| s(n, "message")))
        .filter(|m| !m.is_empty())
        .or_else(|| {
            if body.trim().is_empty() {
                None
            } else {
                Some(body.chars().take(200).collect())
            }
        })
        .unwrap_or_else(|| reason.to_owned());
    let code = node
        .and_then(|n| s(n, "code"))
        .or_else(|| envelope.and_then(|e| s(e, "message")));
    ApiError::Http {
        status,
        code,
        message,
    }
}
