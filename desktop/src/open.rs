//! Hand-off to the desktop's default handlers through `xdg-open`.

use std::io;
use std::process::{Child, Command};
use std::thread;
use std::time::Duration;

/// Spawn `xdg-open target` and wait up to ~300 ms for it to fail. A spawn
/// error or an early non-zero exit is reported as `false`; a child still
/// running after the grace period is assumed to have succeeded and is left
/// detached (it is reaped on a background thread).
fn launch(target: &str) -> bool {
    let Ok(mut child) = Command::new("xdg-open").arg(target).spawn() else {
        return false;
    };
    for _ in 0..6 {
        match child.try_wait() {
            Ok(Some(status)) => return status.success(),
            Ok(None) => thread::sleep(Duration::from_millis(50)),
            Err(_) => return false,
        }
    }
    reap(child);
    true
}

fn reap(mut child: Child) {
    thread::spawn(move || {
        let _ = child.wait();
    });
}

/// Open `geo:lat,lon`, falling back to an OpenStreetMap URL.
pub fn geo(lat: f64, lon: f64) -> io::Result<()> {
    if launch(&format!("geo:{lat},{lon}")) {
        return Ok(());
    }
    url(&format!(
        "https://www.openstreetmap.org/?mlat={lat}&mlon={lon}#map=16/{lat}/{lon}"
    ))
}

pub fn url(u: &str) -> io::Result<()> {
    Command::new("xdg-open").arg(u).spawn().map(reap)
}
