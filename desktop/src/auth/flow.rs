use super::pkce::{random_string, Pkce};
use super::{AuthError, AUTHORIZE_URL};
use crate::config::{is_legacy_client_id, Config};

#[derive(Debug, Clone)]
pub struct PendingSignIn {
    pub state: String,
    pub nonce: String,
    pub pkce: Pkce,
    pub redirect_uri: String,
}

pub fn build_authorize_url(
    cfg: &Config,
    prompt: Option<&str>,
) -> Result<(url::Url, PendingSignIn), AuthError> {
    let client_id = cfg.client_id.trim();
    if client_id.is_empty() {
        return Err(AuthError::MissingClientId);
    }
    if is_legacy_client_id(client_id) {
        return Err(AuthError::LegacyClientId);
    }
    if cfg.scopes.is_empty() {
        return Err(AuthError::NoScopes);
    }
    let pending = PendingSignIn {
        state: random_string(32),
        nonce: random_string(32),
        pkce: Pkce::generate(),
        redirect_uri: cfg.redirect_uri.clone(),
    };
    let mut url = url::Url::parse(AUTHORIZE_URL).expect("constant URL is valid");
    {
        let mut q = url.query_pairs_mut();
        q.append_pair("client_id", client_id)
            .append_pair("redirect_uri", &pending.redirect_uri)
            .append_pair("response_type", "code")
            .append_pair("scope", &cfg.scopes.join(" "))
            .append_pair("state", &pending.state)
            .append_pair("nonce", &pending.nonce)
            .append_pair("code_challenge", &pending.pkce.challenge)
            .append_pair("code_challenge_method", "S256");
        if let Some(p) = prompt {
            q.append_pair("prompt", p);
        }
    }
    Ok((url, pending))
}

/// Accepts the custom-scheme callback and the HTTPS bridge URL; returns the code.
pub fn parse_callback(url: &str, pending: &PendingSignIn) -> Result<String, AuthError> {
    let parsed = url::Url::parse(url.trim()).map_err(|_| AuthError::MissingCode)?;
    let get = |k: &str| {
        parsed
            .query_pairs()
            .find(|(key, _)| key == k)
            .map(|(_, v)| v.into_owned())
    };
    if get("state").as_deref() != Some(pending.state.as_str()) {
        return Err(AuthError::StateMismatch);
    }
    if let Some(error) = get("error") {
        return Err(AuthError::OAuth {
            error,
            description: get("error_description"),
        });
    }
    get("code")
        .filter(|c| !c.is_empty())
        .ok_or(AuthError::MissingCode)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pending_fixture(state: &str) -> PendingSignIn {
        PendingSignIn {
            state: state.into(),
            nonce: "N".into(),
            pkce: Pkce::generate(),
            redirect_uri: "volvo-companion://oauth/callback".into(),
        }
    }

    #[test]
    fn authorize_url_carries_every_param() {
        let c = Config {
            client_id: "vid-dcr-x".into(),
            ..Config::default()
        };
        let (u, pending) = build_authorize_url(&c, Some("login")).unwrap();
        assert!(u.as_str().starts_with(
            "https://auth.volvocars.com/realms/volvocars/protocol/openid-connect/auth?"
        ));
        let q: std::collections::HashMap<_, _> = u.query_pairs().into_owned().collect();
        assert_eq!(q["client_id"], "vid-dcr-x");
        assert_eq!(q["response_type"], "code");
        assert_eq!(q["code_challenge_method"], "S256");
        assert_eq!(q["code_challenge"], pending.pkce.challenge);
        assert_eq!(q["state"], pending.state);
        assert_eq!(q["nonce"], pending.nonce);
        assert_eq!(q["prompt"], "login");
        assert!(q["scope"].starts_with("openid conve:vehicle_relation"));
        assert!(!q["scope"].contains("offline_access"));
        assert_eq!(
            q["redirect_uri"],
            "https://volvo.roussel-zeter.eu/redirect/"
        );
        assert_eq!(pending.redirect_uri, q["redirect_uri"]);
        assert!(!pending.state.is_empty());
        assert_ne!(pending.state, pending.nonce);
    }

    #[test]
    fn legacy_client_id_is_refused() {
        let c = Config {
            client_id: "dc-x".into(),
            ..Config::default()
        };
        assert!(matches!(
            build_authorize_url(&c, None),
            Err(AuthError::LegacyClientId)
        ));
    }

    #[test]
    fn callback_with_wrong_state_is_rejected() {
        let p = pending_fixture("S1");
        assert!(matches!(
            parse_callback("volvo-companion://oauth/callback?code=c&state=S2", &p),
            Err(AuthError::StateMismatch)
        ));
        assert!(matches!(
            parse_callback("volvo-companion://oauth/callback?code=c", &p),
            Err(AuthError::StateMismatch)
        ));
    }

    #[test]
    fn callback_happy_and_error_paths() {
        let p = pending_fixture("S1");
        assert_eq!(
            parse_callback("volvo-companion://oauth/callback?code=abc&state=S1", &p).unwrap(),
            "abc"
        );
        assert_eq!(
            parse_callback(
                "https://volvo.roussel-zeter.eu/redirect/?code=abc&state=S1",
                &p
            )
            .unwrap(),
            "abc"
        );
        assert!(matches!(
            parse_callback(
                "volvo-companion://oauth/callback?error=invalid_scope&error_description=x&state=S1",
                &p
            ),
            Err(AuthError::OAuth { .. })
        ));
    }
}
