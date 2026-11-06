//! Debug-only offline demo: `VLV_DEMO=1 cargo run` seeds a fake car so the
//! dashboard renders without signing in.

use std::time::Instant;

use serde_json::json;

use crate::api::models::VehicleListItem;
use crate::app::AppState;
use crate::state::cache::Resource;
use crate::ui::data::VehicleData;

const VIN: &str = "YV1DEMO";

pub fn enabled() -> bool {
    std::env::var("VLV_DEMO").as_deref() == Ok("1")
}

pub fn seed(state: &mut AppState) {
    let v = |s: &str| json!({ "value": s });
    let fixtures = [
        (
            Resource::Details,
            json!({"data": {"vin": VIN, "modelYear": 2022, "gearbox": "AUTOMATIC",
                "fuelType": "PETROL/ELECTRIC", "externalColour": "Crystal White",
                "descriptions": {"model": "XC40"}}}),
        ),
        (
            Resource::Doors,
            json!({"data": {"centralLock": v("LOCKED"), "frontLeftDoor": v("CLOSED"),
                "frontRightDoor": v("CLOSED"), "rearLeftDoor": v("CLOSED"),
                "rearRightDoor": v("CLOSED"), "hood": v("CLOSED"),
                "tailgate": v("CLOSED"), "tankLid": v("CLOSED")}}),
        ),
        (
            Resource::Windows,
            json!({"data": {"frontLeftWindow": v("OPEN"), "frontRightWindow": v("CLOSED"),
                "rearLeftWindow": v("CLOSED"), "rearRightWindow": v("CLOSED"),
                "sunroof": v("UNSPECIFIED")}}),
        ),
        (
            Resource::Tyres,
            json!({"data": {"frontLeft": v("NO_WARNING"), "frontRight": v("NO_WARNING"),
                "rearLeft": v("LOW_SOFT"), "rearRight": v("NO_WARNING")}}),
        ),
        (
            Resource::Odometer,
            json!({"data": {"odometer": {"value": 35813, "unit": "km"}}}),
        ),
        (
            Resource::Fuel,
            json!({"data": {"fuelAmount": {"value": "35.5", "unit": "l"}}}),
        ),
        (
            Resource::Diagnostics,
            json!({"data": {"serviceWarning": v("NO_WARNING"),
                "distanceToService": {"value": 5000, "unit": "km"},
                "washerFluidLevelWarning": v("NO_WARNING")}}),
        ),
        (
            Resource::Accessibility,
            json!({"data": {"availabilityStatus": {"value": "AVAILABLE"}}}),
        ),
        (
            Resource::EngineStatus,
            json!({"data": {"engineStatus": v("STOPPED")}}),
        ),
        (
            Resource::EnergyState,
            json!({"batteryChargeLevel": {"status": "OK", "value": 44, "unit": "percentage"},
                "electricRange": {"status": "OK", "value": 18, "unit": "km"},
                "chargingStatus": {"status": "OK", "value": "IDLE"}}),
        ),
    ];
    let mut data = VehicleData::default();
    for (resource, body) in fixtures {
        data.apply(resource, Ok(body), Instant::now());
    }
    state.signed_in = true;
    state.garage = vec![VehicleListItem {
        vin: Some(VIN.into()),
    }];
    state.selected_vin = Some(VIN.into());
    state.vehicles.insert(VIN.into(), data);
}
