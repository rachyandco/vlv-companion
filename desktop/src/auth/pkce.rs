use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use rand::RngExt;
use sha2::{Digest, Sha256};

#[derive(Debug, Clone)]
pub struct Pkce {
    pub verifier: String,
    pub challenge: String,
}

const UNRESERVED: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

pub fn random_string(len: usize) -> String {
    let mut rng = rand::rng();
    (0..len)
        .map(|_| UNRESERVED[rng.random_range(0..UNRESERVED.len())] as char)
        .collect()
}

pub fn challenge_s256(verifier: &str) -> String {
    URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()))
}

impl Pkce {
    pub fn generate() -> Pkce {
        let verifier = random_string(64);
        let challenge = challenge_s256(&verifier);
        Pkce {
            verifier,
            challenge,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rfc7636_challenge_vector() {
        assert_eq!(
            challenge_s256("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
            "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
        );
    }

    #[test]
    fn generated_verifier_is_valid() {
        let p = Pkce::generate();
        assert!((43..=128).contains(&p.verifier.len()));
        assert_eq!(p.challenge, challenge_s256(&p.verifier));
    }
}
