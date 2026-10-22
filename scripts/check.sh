#!/usr/bin/env bash
set -Eeuo pipefail
repo="$(cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$repo"
for path in index.php 404.php router.php inc/data.php inc/site.php odalar/index.php restoran/index.php galeri/index.php iletisim/index.php scripts/fixtures/public-api.php; do php -l "$path"; done
while IFS= read -r -d '' path; do node --check "$path"; done < <(find assets/js assets/assistant scripts -type f \( -name '*.js' -o -name '*.mjs' \) -print0)
for path in scripts/*.sh; do bash -n "$path"; done
# Repository operations are deliberately excluded; this check is source-only.
python3 - <<'PY_CHECK'
from pathlib import Path
paths = [*Path('inc').glob('*.php'), *Path('assets/js').glob('*.js'), *Path('scripts').glob('*'), Path('index.php')]
for path in paths:
    if path.is_file():
        for number, line in enumerate(path.read_text().splitlines(), 1):
            if line.endswith((' ', '\t')):
                raise SystemExit(f'{path}:{number}: trailing whitespace')
PY_CHECK
echo 'gundogdu-static-checks-ok'
