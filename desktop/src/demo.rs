//! Debug-only offline demo: `VLV_DEMO=1 cargo run` seeds a fake car so the
//! dashboard renders without signing in. `VLV_DEMO_TILES=1` also turns on
//! OpenStreetMap tiles in memory (nothing is saved).

use std::time::Instant;

use serde_json::json;

use crate::api::models::VehicleListItem;
use crate::app::AppState;
use crate::state::cache::Resource;
use crate::ui::data::VehicleData;
use crate::ui::map::OSM_TEMPLATE;

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
                "chargerConnectionStatus": {"status": "OK", "value": "CONNECTED"},
                "chargingStatus": {"status": "OK", "value": "CHARGING"},
                "chargingType": {"status": "OK", "value": "AC"},
                "chargingPower": {"status": "OK", "value": 3600, "unit": "watts"},
                "targetBatteryChargeLevel": {"status": "OK", "value": 90},
                "estimatedChargingTimeToTargetBatteryChargeLevel": {"status": "OK", "value": 145},
                "chargingCurrentLimit": {"status": "ERROR", "code": "NOT_SUPPORTED"}}),
        ),
        (
            Resource::EnergyCaps,
            json!({"getEnergyState": {"isSupported": true,
                "chargerConnectionStatus": {"isSupported": true},
                "chargingSystemStatus": {"isSupported": true},
                "chargingType": {"isSupported": true},
                "chargingPower": {"isSupported": true},
                "targetBatteryChargeLevel": {"isSupported": true},
                "estimatedChargingTimeToTargetBatteryChargeLevel": {"isSupported": true},
                "chargingCurrentLimit": {"isSupported": false}}}),
        ),
        (
            Resource::Location,
            json!({"data": {"type": "Feature",
                "geometry": {"type": "Point", "coordinates": [6.1432, 46.2044, 0.0]},
                "properties": {"heading": "90", "timestamp": "2026-11-06T08:42:00Z"}}}),
        ),
        (
            Resource::EngineDiag,
            json!({"data": {"oilLevelWarning": v("NO_WARNING"),
                "engineCoolantLevelWarning": v("NO_WARNING")}}),
        ),
        (
            Resource::Brakes,
            json!({"data": {"brakeFluidLevelWarning": v("NO_WARNING")}}),
        ),
        (
            Resource::Warnings,
            json!({"data": {"brakeLightCenterWarning": v("NO_WARNING"),
                "hazardLightsWarning": v("NO_WARNING"),
                "turnIndicationRearLeftWarning": v("FAILURE"),
                "fogLightRearWarning": v("UNSPECIFIED")}}),
        ),
        (
            Resource::Statistics,
            json!({"data": {"tripMeter1": {"value": 1234.5, "unit": "km"},
                "tripMeter2": {"value": 87.2, "unit": "km"},
                "averageSpeed": {"value": 42, "unit": "km/h"},
                "averageFuelConsumption": {"value": 5.8, "unit": "l/100km"},
                "distanceToEmpty": {"value": 420, "unit": "km"}}}),
        ),
    ];
    let mut data = VehicleData::default();
    for (resource, body) in fixtures {
        data.apply(resource, Ok(body), Instant::now());
    }
    if std::env::var("VLV_DEMO_TILES").as_deref() == Ok("1") {
        state.config.tile_url_template = Some(OSM_TEMPLATE.into());
    }
    state.signed_in = true;
    state.garage = vec![VehicleListItem {
        vin: Some(VIN.into()),
    }];
    state.selected_vin = Some(VIN.into());
    state.vehicles.insert(VIN.into(), data);
}
