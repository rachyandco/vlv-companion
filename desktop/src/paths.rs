use std::path::{Path, PathBuf};

use directories::ProjectDirs;

#[derive(Debug, Clone)]
pub struct Paths {
    pub config_dir: PathBuf,
    pub state_dir: PathBuf,
    pub cache_dir: PathBuf,
}

impl Paths {
    pub fn from_env() -> Paths {
        match ProjectDirs::from("eu", "roussel-zeter", "vlv-companion") {
            Some(d) => Paths {
                config_dir: d.config_dir().to_path_buf(),
                state_dir: d
                    .state_dir()
                    .unwrap_or_else(|| d.data_local_dir())
                    .to_path_buf(),
                cache_dir: d.cache_dir().to_path_buf(),
            },
            None => Paths::in_dir(&std::env::temp_dir().join("vlv-companion")),
        }
    }

    pub fn in_dir(base: &Path) -> Paths {
        Paths {
            config_dir: base.join("config"),
            state_dir: base.join("state"),
            cache_dir: base.join("cache"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn in_dir_nests_under_base() {
        let p = Paths::in_dir(Path::new("/x"));
        assert_eq!(p.config_dir, Path::new("/x/config"));
        assert_eq!(p.state_dir, Path::new("/x/state"));
        assert_eq!(p.cache_dir, Path::new("/x/cache"));
    }
}
