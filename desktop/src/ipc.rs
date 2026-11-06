use std::io::{self, BufRead, BufReader, Read, Write};
use std::os::unix::fs::{MetadataExt, PermissionsExt};
use std::os::unix::net::{UnixListener, UnixStream};
use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::time::Duration;

pub fn socket_path_in(runtime_dir: Option<&Path>, uid: u32) -> PathBuf {
    match runtime_dir {
        Some(d) => d.join("vlv-companion.sock"),
        None => PathBuf::from(format!("/tmp/vlv-companion-{uid}.sock")),
    }
}

pub fn socket_path() -> PathBuf {
    let uid = std::fs::metadata("/proc/self")
        .map(|m| m.uid())
        .unwrap_or(0);
    let dir = std::env::var_os("XDG_RUNTIME_DIR").map(PathBuf::from);
    socket_path_in(dir.as_deref().filter(|d| !d.as_os_str().is_empty()), uid)
}

/// Sends `url` to a running instance. Returns false on any failure.
pub fn try_forward(path: &Path, url: &str) -> bool {
    let attempt = || -> io::Result<()> {
        let mut stream = UnixStream::connect(path)?;
        stream.set_write_timeout(Some(Duration::from_secs(2)))?;
        stream.write_all(url.as_bytes())?;
        stream.write_all(b"\n")?;
        stream.flush()
    };
    attempt().is_ok()
}

pub struct Listener {
    inner: UnixListener,
}

impl Listener {
    pub fn bind(path: &Path) -> io::Result<Listener> {
        if UnixStream::connect(path).is_ok() {
            return Err(io::Error::new(
                io::ErrorKind::AddrInUse,
                "another instance is listening",
            ));
        }
        let _ = std::fs::remove_file(path);
        let inner = UnixListener::bind(path)?;
        std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600))?;
        Ok(Listener { inner })
    }

    pub fn into_receiver(self) -> mpsc::Receiver<String> {
        let (tx, rx) = mpsc::channel();
        let spawned = std::thread::Builder::new()
            .name("vlv-ipc".into())
            .spawn(move || {
                for conn in self.inner.incoming() {
                    let Ok(conn) = conn else { break };
                    let _ = conn.set_read_timeout(Some(Duration::from_secs(5)));
                    let mut line = String::new();
                    if BufReader::new(conn.take(8192)).read_line(&mut line).is_ok() {
                        let line = line.trim_end_matches(['\r', '\n']).to_string();
                        if !line.is_empty() && tx.send(line).is_err() {
                            break;
                        }
                    }
                }
            });
        if let Err(e) = spawned {
            eprintln!("failed to start IPC thread: {e}");
        }
        rx
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn socket_path_falls_back_without_runtime_dir() {
        assert_eq!(
            socket_path_in(Some(Path::new("/run/user/1000")), 1000),
            PathBuf::from("/run/user/1000/vlv-companion.sock")
        );
        assert_eq!(
            socket_path_in(None, 1000),
            PathBuf::from("/tmp/vlv-companion-1000.sock")
        );
    }

    #[test]
    fn forward_round_trip() {
        let dir = tempfile::tempdir().unwrap();
        let p = dir.path().join("s.sock");
        let rx = Listener::bind(&p).unwrap().into_receiver();
        assert!(try_forward(
            &p,
            "volvo-companion://oauth/callback?code=1&state=2"
        ));
        assert_eq!(
            rx.recv_timeout(std::time::Duration::from_secs(2)).unwrap(),
            "volvo-companion://oauth/callback?code=1&state=2"
        );
    }

    #[test]
    fn bind_refuses_when_listener_alive() {
        let dir = tempfile::tempdir().unwrap();
        let p = dir.path().join("s.sock");
        let rx = Listener::bind(&p).unwrap().into_receiver();
        let err = Listener::bind(&p).err().expect("second bind must fail");
        assert_eq!(err.kind(), io::ErrorKind::AddrInUse);
        assert!(try_forward(&p, "volvo-companion://x"));
        assert_eq!(
            rx.recv_timeout(Duration::from_secs(2)).unwrap(),
            "volvo-companion://x"
        );
    }

    #[test]
    fn forward_without_listener_is_false() {
        let dir = tempfile::tempdir().unwrap();
        assert!(!try_forward(&dir.path().join("none.sock"), "x"));
    }
}
