#!/usr/bin/env bash
set -euo pipefail
site_root="$(cd -- "$(dirname -- "$0")/.." && pwd)"
exec node "$site_root/scripts/install-effect-scene.mjs" "$@"
