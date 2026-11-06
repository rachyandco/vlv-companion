use std::time::{Duration, Instant};

const IDLE_AFTER: Duration = Duration::from_secs(300);
const ACTIVE_TICK: Duration = Duration::from_secs(60);
const IDLE_TICK: Duration = Duration::from_secs(300);

/// Snapshot of user activity used to pick the refresh cadence.
#[derive(Clone, Copy, Debug)]
pub struct Activity {
    pub last_input: Instant,
    pub focused: bool,
    pub minimised: bool,
}

/// Refresh interval for the current activity, or `None` when minimised.
/// An unfocused window counts as idle.
pub fn tick_interval(a: &Activity, now: Instant) -> Option<Duration> {
    if a.minimised {
        return None;
    }
    if !a.focused || now.saturating_duration_since(a.last_input) >= IDLE_AFTER {
        Some(IDLE_TICK)
    } else {
        Some(ACTIVE_TICK)
    }
}

#[derive(Default, Debug)]
pub struct Scheduler {
    pub last_tick: Option<Instant>,
}

impl Scheduler {
    /// True when a tick is due; records `now` as the last tick in that case.
    pub fn should_tick(&mut self, a: &Activity, now: Instant) -> bool {
        let Some(interval) = tick_interval(a, now) else {
            return false;
        };
        let due = match self.last_tick {
            None => true,
            Some(last) => now.saturating_duration_since(last) >= interval,
        };
        if due {
            self.last_tick = Some(now);
        }
        due
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn tick_interval_rules() {
        let now = Instant::now();
        let a = Activity {
            last_input: now,
            focused: true,
            minimised: false,
        };
        assert_eq!(tick_interval(&a, now), Some(Duration::from_secs(60)));
        assert_eq!(
            tick_interval(&a, now + Duration::from_secs(300)),
            Some(Duration::from_secs(300))
        );
        assert_eq!(
            tick_interval(
                &Activity {
                    focused: false,
                    ..a
                },
                now
            ),
            Some(Duration::from_secs(300))
        );
        assert_eq!(
            tick_interval(
                &Activity {
                    minimised: true,
                    ..a
                },
                now
            ),
            None
        );
    }
    #[test]
    fn scheduler_ticks_once_per_interval() {
        let now = Instant::now();
        let a = Activity {
            last_input: now,
            focused: true,
            minimised: false,
        };
        let mut s = Scheduler::default();
        assert!(s.should_tick(&a, now));
        assert!(!s.should_tick(&a, now + Duration::from_secs(59)));
        assert!(s.should_tick(&a, now + Duration::from_secs(60)));
    }
}
