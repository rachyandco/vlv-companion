use std::collections::HashMap;
use std::time::{Duration, Instant};

/// A vehicle-scoped Volvo API resource the desktop caches.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub enum Resource {
    Details,
    Doors,
    Windows,
    Fuel,
    Odometer,
    Tyres,
    Diagnostics,
    Accessibility,
    EngineStatus,
    EngineDiag,
    Brakes,
    Warnings,
    Statistics,
    CommandList,
    EnergyState,
    EnergyCaps,
    Location,
}

impl Resource {
    pub const ALL: [Resource; 17] = [
        Resource::Details,
        Resource::Doors,
        Resource::Windows,
        Resource::Fuel,
        Resource::Odometer,
        Resource::Tyres,
        Resource::Diagnostics,
        Resource::Accessibility,
        Resource::EngineStatus,
        Resource::EngineDiag,
        Resource::Brakes,
        Resource::Warnings,
        Resource::Statistics,
        Resource::CommandList,
        Resource::EnergyState,
        Resource::EnergyCaps,
        Resource::Location,
    ];

    /// How long a cached value stays fresh before it is due again.
    pub fn stale_after(&self) -> Duration {
        let secs = match self {
            Resource::Doors
            | Resource::Windows
            | Resource::Accessibility
            | Resource::EngineStatus => 30,
            Resource::Fuel | Resource::Location | Resource::EnergyState => 60,
            Resource::Odometer
            | Resource::Tyres
            | Resource::Diagnostics
            | Resource::Statistics
            | Resource::Brakes
            | Resource::EngineDiag
            | Resource::Warnings => 300,
            Resource::Details => 3600,
            Resource::EnergyCaps | Resource::CommandList => 86_400,
        };
        Duration::from_secs(secs)
    }

    /// Full API path for this resource on the given VIN.
    pub fn path(&self, vin: &str) -> String {
        match self {
            Resource::Details => format!("/connected-vehicle/v2/vehicles/{vin}"),
            Resource::Doors => format!("/connected-vehicle/v2/vehicles/{vin}/doors"),
            Resource::Windows => format!("/connected-vehicle/v2/vehicles/{vin}/windows"),
            Resource::Fuel => format!("/connected-vehicle/v2/vehicles/{vin}/fuel"),
            Resource::Odometer => format!("/connected-vehicle/v2/vehicles/{vin}/odometer"),
            Resource::Tyres => format!("/connected-vehicle/v2/vehicles/{vin}/tyres"),
            Resource::Diagnostics => format!("/connected-vehicle/v2/vehicles/{vin}/diagnostics"),
            Resource::Accessibility => {
                format!("/connected-vehicle/v2/vehicles/{vin}/command-accessibility")
            }
            Resource::EngineStatus => format!("/connected-vehicle/v2/vehicles/{vin}/engine-status"),
            Resource::EngineDiag => format!("/connected-vehicle/v2/vehicles/{vin}/engine"),
            Resource::Brakes => format!("/connected-vehicle/v2/vehicles/{vin}/brakes"),
            Resource::Warnings => format!("/connected-vehicle/v2/vehicles/{vin}/warnings"),
            Resource::Statistics => format!("/connected-vehicle/v2/vehicles/{vin}/statistics"),
            Resource::CommandList => format!("/connected-vehicle/v2/vehicles/{vin}/commands"),
            Resource::EnergyState => format!("/energy/v2/vehicles/{vin}/state"),
            Resource::EnergyCaps => format!("/energy/v2/vehicles/{vin}/capabilities"),
            Resource::Location => format!("/location/v1/vehicles/{vin}/location"),
        }
    }
}

/// One cached response, or the error string from the last failed fetch.
#[derive(Debug)]
pub struct Entry {
    #[allow(dead_code)] // read by the UI task
    pub value: Result<serde_json::Value, String>,
    pub fetched_at: Instant,
}

#[derive(Default, Debug)]
pub struct VehicleCache {
    pub entries: HashMap<Resource, Entry>,
}

impl VehicleCache {
    /// A missing entry counts as stale.
    pub fn is_stale(&self, r: Resource, now: Instant) -> bool {
        match self.entries.get(&r) {
            None => true,
            Some(e) => now.saturating_duration_since(e.fetched_at) >= r.stale_after(),
        }
    }

    /// Resources to refresh, in `Resource::ALL` order. `force` returns all of them.
    pub fn due(&self, now: Instant, force: bool) -> Vec<Resource> {
        Resource::ALL
            .into_iter()
            .filter(|r| force || self.is_stale(*r, now))
            .collect()
    }

    pub fn put(&mut self, r: Resource, value: Result<serde_json::Value, String>, now: Instant) {
        self.entries.insert(
            r,
            Entry {
                value,
                fetched_at: now,
            },
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn stale_times_match_spec() {
        assert_eq!(Resource::Doors.stale_after(), Duration::from_secs(30));
        assert_eq!(Resource::Details.stale_after(), Duration::from_secs(3600));
        assert_eq!(
            Resource::CommandList.stale_after(),
            Duration::from_secs(86_400)
        );
    }
    #[test]
    fn paths() {
        assert_eq!(
            Resource::Location.path("V"),
            "/location/v1/vehicles/V/location"
        );
        assert_eq!(
            Resource::Details.path("V"),
            "/connected-vehicle/v2/vehicles/V"
        );
    }
    #[test]
    fn due_returns_missing_and_stale_only() {
        let t0 = Instant::now();
        let mut c = VehicleCache::default();
        c.put(Resource::Doors, Ok(serde_json::json!({})), t0);
        let due = c.due(t0 + Duration::from_secs(10), false);
        assert!(!due.contains(&Resource::Doors));
        assert!(due.contains(&Resource::Windows));
        assert!(c
            .due(t0 + Duration::from_secs(31), false)
            .contains(&Resource::Doors));
        assert_eq!(c.due(t0, true).len(), Resource::ALL.len());
    }
}
