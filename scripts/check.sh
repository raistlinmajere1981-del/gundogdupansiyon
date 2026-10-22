#!/usr/bin/env bash
set -Eeuo pipefail
repo="$(cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$repo"
for path in index.php 404.php router.php inc/data.php inc/site.php odalar/index.php restoran/index.php galeri/index.php iletisim/index.php; do php -l "$path"; done
while IFS= read -r -d '' path; do node --check "$path"; done < <(find assets/js assets/assistant scripts -type f \( -name '*.js' -o -name '*.mjs' \) -print0)
for path in scripts/*.sh; do bash -n "$path"; done
git diff --check
echo 'gundogdu-static-checks-ok'
