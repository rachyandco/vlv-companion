//! Volvo ID OAuth: PKCE, authorize URL, callback parsing, token exchange and refresh.

pub mod flow;
pub mod pkce;
pub mod token;

pub const AUTHORIZE_URL: &str =
    "https://auth.volvocars.com/realms/volvocars/protocol/openid-connect/auth";
pub const TOKEN_URL: &str =
    "https://auth.volvocars.com/realms/volvocars/protocol/openid-connect/token";
#[allow(dead_code)] // not used yet: sign-out only drops local tokens
pub const REVOKE_URL: &str =
    "https://auth.volvocars.com/realms/volvocars/protocol/openid-connect/revoke";

#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum AuthError {
    #[error("Enter your Volvo client id in the settings first.")]
    MissingClientId,
    #[error("This OAuth client id starts with \"dc-\", which belongs to the retired Volvo ID service. Create a new application on developer.volvocars.com (its client id starts with \"vid-\") and enter the new client id and secret.")]
    LegacyClientId,
    #[error("No scopes are configured.")]
    NoScopes,
    #[error("{}", match description { Some(d) => format!("{error}: {d}"), None => error.clone() })]
    OAuth {
        error: String,
        description: Option<String>,
    },
    #[error("The sign-in response did not contain an authorization code.")]
    MissingCode,
    #[error("The sign-in response did not match this sign-in attempt (state mismatch).")]
    StateMismatch,
    #[error("The id token nonce did not match this sign-in attempt.")]
    NonceMismatch,
    #[error("Network error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("Unexpected response from the token endpoint: {0}")]
    BadResponse(String),
    /// The token endpoint answered with something other than an OAuth
    /// rejection (5xx, 429, an unexpected status or an undecodable body).
    /// Says nothing about the tokens: retry later.
    #[error("Volvo ID is temporarily unavailable ({0}).")]
    Unavailable(String),
    #[error("Start sign-in from this window, then return here.")]
    NoPendingSignIn,
}
