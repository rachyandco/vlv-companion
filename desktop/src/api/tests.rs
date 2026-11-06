use super::client::VolvoClient;
use super::commands::*;
use super::error::{ApiError, ErrorKind};

#[test]
fn bucket_table_matches_phone() {
    assert_eq!(bucket_of("DELIVERED"), Bucket::Success);
    assert_eq!(bucket_of("CAR_IN_SLEEP_MODE"), Bucket::Pending);
    assert_eq!(
        bucket_of("NOT_ALLOWED_PRIVACY_ENABLED"),
        Bucket::UserActionable
    );
    assert_eq!(bucket_of("CAR_ERROR"), Bucket::Failure);
    assert_eq!(bucket_of("SOMETHING_NEW"), Bucket::Failure);
}
#[test]
fn friendly_messages() {
    assert_eq!(
        friendly_message("UNABLE_TO_LOCK_DOOR_OPEN", None),
        "A door is open — close it and try again."
    );
    assert_eq!(
        friendly_message("WEIRD_STATE", Some("fallback")),
        "fallback"
    );
    assert_eq!(friendly_message("WEIRD_STATE", None), "weird state");
}
#[test]
fn api_names_map_to_paths() {
    assert_eq!(
        CommandName::from_api_name("HONK_AND_FLASH"),
        Some(CommandName::HonkFlash)
    );
    assert_eq!(CommandName::HonkFlash.path(), "honk-flash");
    assert_eq!(CommandName::from_api_name("SEND_NAVI_POI"), None);
}
#[test]
fn error_kinds() {
    assert_eq!(
        ApiError::Http {
            status: 401,
            code: None,
            message: "x".into()
        }
        .kind(),
        ErrorKind::Session
    );
    assert_eq!(
        ApiError::Http {
            status: 403,
            code: None,
            message: "Client not allowed to access Location API".into()
        }
        .kind(),
        ErrorKind::Api
    );
    assert_eq!(ApiError::Network("dns".into()).kind(), ErrorKind::Transient);
}
#[tokio::test]
async fn get_sets_headers_and_parses_error_envelope() {
    let server = httpmock::MockServer::start();
    server.mock(|w, t| { w.method("GET").path("/connected-vehicle/v2/vehicles").header("authorization", "Bearer T").header("vcc-api-key", "K").header("accept", "application/json");
        t.status(403).json_body(serde_json::json!({"error":{"message":"Forbidden","description":"Client not allowed to access Location API"}})); });
    let c = VolvoClient::new(reqwest::Client::new(), server.base_url(), "K".into());
    let e = c
        .get::<serde_json::Value>("/connected-vehicle/v2/vehicles", "T")
        .await
        .unwrap_err();
    match e {
        ApiError::Http {
            status, message, ..
        } => {
            assert_eq!(status, 403);
            assert!(message.contains("not allowed"));
        }
        _ => panic!(),
    }
}
