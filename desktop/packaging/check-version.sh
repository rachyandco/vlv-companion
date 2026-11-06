#!/usr/bin/env bash
# Fail unless desktop/Cargo.toml's package version equals the release tag
# (without its leading "v"). Usage: check-version.sh TAG
set -euo pipefail

tag="${1:?usage: check-version.sh TAG}"
cargo_toml="$(dirname "$0")/../Cargo.toml"
want="${tag#v}"
have="$(grep -m1 '^version' "$cargo_toml" | sed -E 's/^version[[:space:]]*=[[:space:]]*"([^"]*)".*/\1/')"

if [ "$have" != "$want" ]; then
  echo "::error::desktop/Cargo.toml version ${have} does not match tag ${tag}"
  exit 1
fi
echo "desktop/Cargo.toml version ${have} matches tag ${tag}"
