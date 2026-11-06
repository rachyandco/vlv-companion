use std::collections::BTreeMap;

/// Volvo's default climatisation cycle, in milliseconds.
pub const CLIMATE_DURATION_MS: i64 = 30 * 60_000;

/// True while a user-started climatisation is still expected to be running.
/// A start time in the future (clock skew) is treated as inactive.
#[allow(dead_code)] // used by the UI task
pub fn is_active(started_at_ms: Option<i64>, now_ms: i64) -> bool {
    match started_at_ms {
        None => false,
        Some(s) => s <= now_ms && now_ms - s < CLIMATE_DURATION_MS,
    }
}

/// Milliseconds left in the cycle, clamped to `[0, CLIMATE_DURATION_MS]`.
#[allow(dead_code)] // used by the UI task
pub fn remaining_ms(started_at_ms: Option<i64>, now_ms: i64) -> i64 {
    match started_at_ms {
        None => 0,
        Some(s) if s > now_ms => 0,
        Some(s) => (CLIMATE_DURATION_MS - (now_ms - s)).clamp(0, CLIMATE_DURATION_MS),
    }
}

/// Drops entries older than one cycle or dated in the future (the phone's rehydrate rules).
pub fn purge(map: &mut BTreeMap<String, i64>, now_ms: i64) {
    let cutoff = now_ms - CLIMATE_DURATION_MS;
    map.retain(|_, s| *s > cutoff && *s <= now_ms);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn climate_math_matches_phone() {
        assert!(is_active(Some(1_000), 1_000 + CLIMATE_DURATION_MS - 1));
        assert!(!is_active(Some(1_000), 1_000 + CLIMATE_DURATION_MS));
        assert!(!is_active(Some(2_000), 1_000));
        assert_eq!(remaining_ms(Some(2_000), 1_000), 0);
        let mut m = BTreeMap::from([
            ("A".to_string(), 1_000i64),
            ("B".to_string(), 10_000_000i64),
        ]);
        purge(&mut m, 5_000_000);
        assert_eq!(m.len(), 0);
    }
}
