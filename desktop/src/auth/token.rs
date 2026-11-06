use super::AuthError;
use crate::config::Tokens;
use base64::engine::general_purpose::{STANDARD, URL_SAFE_NO_PAD};
use base64::Engine;
use serde::Deserialize;

#[derive(Debug, Clone)]
pub struct TokenEndpoint {
    pub token_url: String,
    pub client_id: String,
    pub client_secret: Option<String>,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: Option<i64>,
    id_token: Option<String>,
}

#[derive(Deserialize)]
struct ErrorBody {
    error: Option<String>,
    error_description: Option<String>,
}

/// OAuth error codes that mean the grant itself was refused: the refresh
/// token (or the client) is no longer accepted and only a new sign-in helps.
pub const REJECTION_CODES: [&str; 4] = [
    "invalid_grant",
    "invalid_client",
    "unauthorized_client",
    "invalid_request",
];

/// Maps a non-2xx token-endpoint answer. A 400 or 401 with an OAuth error
/// body is `AuthError::OAuth`; everything else (5xx, 429, other statuses,
/// bodies that are not an OAuth error) is `AuthError::Unavailable`.
fn classify_error(status: u16, body: &str) -> AuthError {
    if matches!(status, 400 | 401) {
        if let Ok(ErrorBody {
            error: Some(error),
            error_description,
        }) = serde_json::from_str::<ErrorBody>(body)
        {
            return AuthError::OAuth {
                error,
                description: error_description,
            };
        }
    }
    AuthError::Unavailable(format!("HTTP {status}"))
}

impl AuthError {
    /// True when the token endpoint refused the grant (400/401 with one of
    /// `REJECTION_CODES`): the session cannot be kept.
    pub fn is_rejection(&self) -> bool {
        matches!(self, AuthError::OAuth { error, .. } if REJECTION_CODES.contains(&error.as_str()))
    }
}

pub fn needs_refresh(expires_at_unix: i64, now_unix: i64) -> bool {
    expires_at_unix - 60 <= now_unix
}

/// Reads one claim from a JWT payload. The signature is not checked.
pub fn read_jwt_claim(jwt: &str, claim: &str) -> Option<String> {
    let payload = jwt.split('.').nth(1)?;
    let bytes = URL_SAFE_NO_PAD.decode(payload).ok()?;
    let value: serde_json::Value = serde_json::from_slice(&bytes).ok()?;
    match value.get(claim)? {
        serde_json::Value::String(s) => Some(s.clone()),
        serde_json::Value::Null => None,
        other => Some(other.to_string()),
    }
}

impl TokenEndpoint {
    async fn post(
        &self,
        http: &reqwest::Client,
        mut form: Vec<(&str, String)>,
    ) -> Result<TokenResponse, AuthError> {
        let mut req = http.post(&self.token_url);
        match self.client_secret.as_deref().filter(|s| !s.is_empty()) {
            Some(secret) => {
                let basic = STANDARD.encode(format!("{}:{}", self.client_id, secret));
                req = req.header("Authorization", format!("Basic {basic}"));
            }
            None => form.push(("client_id", self.client_id.clone())),
        }
        let body = url::form_urlencoded::Serializer::new(String::new())
            .extend_pairs(form.iter().map(|(k, v)| (*k, v.as_str())))
            .finish();
        let resp = req
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(body)
            .send()
            .await?;
        let status = resp.status();
        let body = resp.text().await?;
        if !status.is_success() {
            return Err(classify_error(status.as_u16(), &body));
        }
        serde_json::from_str(&body).map_err(|e| AuthError::BadResponse(e.to_string()))
    }

    fn into_tokens(r: TokenResponse, fallback_refresh: Option<String>) -> Tokens {
        Tokens {
            access_token: r.access_token,
            refresh_token: r.refresh_token.or(fallback_refresh),
            expires_at_unix: chrono::Utc::now().timestamp() + r.expires_in.unwrap_or(0),
            id_token: r.id_token,
            climate_started_at: Default::default(),
        }
    }

    pub async fn exchange_code(
        &self,
        http: &reqwest::Client,
        code: &str,
        verifier: &str,
        redirect_uri: &str,
        nonce: &str,
    ) -> Result<Tokens, AuthError> {
        let r = self
            .post(
                http,
                vec![
                    ("grant_type", "authorization_code".into()),
                    ("code", code.into()),
                    ("redirect_uri", redirect_uri.into()),
                    ("code_verifier", verifier.into()),
                ],
            )
            .await?;
        if let Some(claim) = r
            .id_token
            .as_deref()
            .and_then(|t| read_jwt_claim(t, "nonce"))
        {
            if claim != nonce {
                return Err(AuthError::NonceMismatch);
            }
        }
        Ok(Self::into_tokens(r, None))
    }

    /// When the response omits a refresh token, the one passed in is kept.
    pub async fn refresh(
        &self,
        http: &reqwest::Client,
        refresh_token: &str,
    ) -> Result<Tokens, AuthError> {
        let r = self
            .post(
                http,
                vec![
                    ("grant_type", "refresh_token".into()),
                    ("refresh_token", refresh_token.into()),
                ],
            )
            .await?;
        Ok(Self::into_tokens(r, Some(refresh_token.to_string())))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn needs_refresh_uses_60s_leeway() {
        assert!(needs_refresh(1000, 940));
        assert!(!needs_refresh(1000, 939));
    }

    #[tokio::test]
    async fn exchange_sends_basic_auth_and_parses_tokens() {
        let server = httpmock::MockServer::start();
        let m = server.mock(|w, t| {
            w.method("POST")
                .path("/token")
                .header("authorization", "Basic aWQ6c2VjcmV0")
                .body_contains("grant_type=authorization_code")
                .body_contains("code_verifier=v1")
                .body_contains("code=c")
                .body_contains("redirect_uri=https%3A%2F%2Fr%2F");
            t.status(200).json_body(
                serde_json::json!({"access_token":"A","refresh_token":"R","expires_in":300}),
            );
        });
        let ep = TokenEndpoint {
            token_url: server.url("/token"),
            client_id: "id".into(),
            client_secret: Some("secret".into()),
        };
        let t = ep
            .exchange_code(&reqwest::Client::new(), "c", "v1", "https://r/", "n")
            .await
            .unwrap();
        m.assert();
        assert_eq!(t.access_token, "A");
        assert_eq!(t.refresh_token.as_deref(), Some("R"));
        assert!(t.expires_at_unix > chrono::Utc::now().timestamp() + 200);
    }

    #[tokio::test]
    async fn exchange_error_body_is_surfaced() {
        let server = httpmock::MockServer::start();
        server.mock(|w, t| {
            w.method("POST")
                .path("/token")
                .body_contains("client_id=id");
            t.status(400).json_body(
                serde_json::json!({"error":"invalid_grant","error_description":"Code not valid"}),
            );
        });
        let ep = TokenEndpoint {
            token_url: server.url("/token"),
            client_id: "id".into(),
            client_secret: None,
        };
        let e = ep
            .exchange_code(&reqwest::Client::new(), "c", "v", "https://r/", "n")
            .await
            .unwrap_err();
        assert_eq!(e.to_string(), "invalid_grant: Code not valid");
    }

    #[test]
    fn only_400_or_401_oauth_bodies_are_rejections() {
        let grant = r#"{"error":"invalid_grant","error_description":"Token is not active"}"#;
        assert!(classify_error(400, grant).is_rejection());
        assert!(classify_error(401, r#"{"error":"invalid_client"}"#).is_rejection());
        assert!(classify_error(400, r#"{"error":"unauthorized_client"}"#).is_rejection());
        assert!(classify_error(400, r#"{"error":"invalid_request"}"#).is_rejection());
        // Other OAuth codes are surfaced but do not end the session.
        let scope = classify_error(400, r#"{"error":"invalid_scope"}"#);
        assert!(matches!(scope, AuthError::OAuth { .. }));
        assert!(!scope.is_rejection());
        for e in [
            classify_error(503, grant),
            classify_error(429, ""),
            classify_error(500, "<html>"),
            classify_error(400, "<html>"),
            classify_error(403, r#"{"error":"invalid_grant"}"#),
        ] {
            assert!(matches!(e, AuthError::Unavailable(_)), "{e:?}");
            assert!(!e.is_rejection());
        }
        assert!(!AuthError::BadResponse("x".into()).is_rejection());
    }

    fn fake_jwt(payload: &str) -> String {
        format!("h.{}.s", URL_SAFE_NO_PAD.encode(payload))
    }

    async fn exchange_with_id_token(id_token: String) -> Result<Tokens, AuthError> {
        let server = httpmock::MockServer::start();
        server.mock(|w, t| {
            w.method("POST").path("/token");
            t.status(200).json_body(serde_json::json!({
                "access_token":"A","expires_in":300,"id_token":id_token
            }));
        });
        let ep = TokenEndpoint {
            token_url: server.url("/token"),
            client_id: "id".into(),
            client_secret: Some("s".into()),
        };
        ep.exchange_code(&reqwest::Client::new(), "c", "v", "https://r/", "n")
            .await
    }

    #[tokio::test]
    async fn mismatched_nonce_is_rejected() {
        let r = exchange_with_id_token(fake_jwt(r#"{"nonce":"other"}"#)).await;
        assert!(matches!(r, Err(AuthError::NonceMismatch)));
    }

    #[tokio::test]
    async fn id_token_without_nonce_is_accepted() {
        assert!(exchange_with_id_token(fake_jwt(r#"{"sub":"x"}"#))
            .await
            .is_ok());
    }

    #[test]
    fn read_jwt_claim_rejects_malformed_tokens() {
        assert_eq!(read_jwt_claim("abc", "nonce"), None);
        assert_eq!(read_jwt_claim("a.!!!.c", "nonce"), None);
        assert_eq!(read_jwt_claim(&fake_jwt("[1,2]"), "nonce"), None);
    }
}
