//! Thin Volvo HTTP client. It never refreshes tokens; a 401 is reported as
//! `ApiError::Http { status: 401, .. }` and the worker decides what to do.

use serde::de::DeserializeOwned;

use super::error::{from_response, ApiError};

pub struct VolvoClient {
    http: reqwest::Client,
    base: String,
    vcc_api_key: String,
}

impl VolvoClient {
    pub fn new(http: reqwest::Client, base: String, vcc_api_key: String) -> Self {
        Self {
            http,
            base,
            vcc_api_key,
        }
    }

    fn decorate(&self, rb: reqwest::RequestBuilder, token: &str) -> reqwest::RequestBuilder {
        rb.header("authorization", format!("Bearer {token}"))
            .header("vcc-api-key", &self.vcc_api_key)
            .header("accept", "application/json")
            .header(
                "user-agent",
                concat!(
                    "VlvCompanion/",
                    env!("CARGO_PKG_VERSION"),
                    " (linux-desktop)"
                ),
            )
    }

    pub async fn get<T: DeserializeOwned>(&self, path: &str, token: &str) -> Result<T, ApiError> {
        let rb = self.decorate(self.http.get(format!("{}{}", self.base, path)), token);
        self.send(rb).await
    }

    pub async fn post_json<T: DeserializeOwned>(
        &self,
        path: &str,
        token: &str,
        body: &serde_json::Value,
    ) -> Result<T, ApiError> {
        let rb = self
            .decorate(self.http.post(format!("{}{}", self.base, path)), token)
            .json(body);
        self.send(rb).await
    }

    async fn send<T: DeserializeOwned>(&self, rb: reqwest::RequestBuilder) -> Result<T, ApiError> {
        let resp = rb
            .send()
            .await
            .map_err(|e| ApiError::Network(e.to_string()))?;
        let status = resp.status();
        let reason = status.canonical_reason().unwrap_or("").to_owned();
        let text = resp
            .text()
            .await
            .map_err(|e| ApiError::Network(e.to_string()))?;
        if !status.is_success() {
            return Err(from_response(status.as_u16(), &reason, &text));
        }
        serde_json::from_str(&text).map_err(|e| ApiError::Http {
            status: 200,
            code: Some("decode".into()),
            message: e.to_string(),
        })
    }
}
