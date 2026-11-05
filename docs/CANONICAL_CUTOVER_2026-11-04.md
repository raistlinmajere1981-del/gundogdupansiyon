# Gündoğdu canonical cutover — local checkpoint, 2026-11-04

Chunk 4B is a **local root/assets/routes checkpoint, not release or live acceptance**.
No deployment, remote read, release, commit/push, DB/data reset, old scene migration,
backfill or deletion of previous test records was performed. Birdesengor, Teknikel
and the upstream template were not modified. Main milestone/audit documents were
read without editing them. No subagents or OpenCode were used.

## Active ownership and preservation

- Actual root `index.php` carries `gundogdu-site`, validates allowed scalar query
  parameters (2,048-byte limit, no control characters) and requires
  `canonical/public/index.php`. Independent `inc/site.php`, `assets/js/site.js`,
  language/effects scripts and the old widget are no longer loaded.
- Ten thin physical wrappers enter the same root: `/odalar/`, `/odalar/oda/`,
  `/restoran/`, `/restoran/masa/`, `/qr-menu/`, `/hakkimizda/`, `/iletisim/`,
  `/galeri/`, `/duyurular/`, `/yorumlar/`. Unchanged common `core/legacy.php` owns
  the single 302 redirect, route-specific safe `id`/`category`/`lang` forwarding
  and destination publication gates. Root query routes do not redirect again.
- `.htaccess` denies canonical/private source, preserved independent runtime,
  old Pannellum, scripts/tests and dot paths. Fallback explicitly excludes
  `/yardimci-asistan` and preserves physical wrappers. Sitemap goes through the
  canonical source. The old `404.php` cannot start the independent layout.
- `router.php` is local-only and excluded from the package. It serves allowed
  public assets, enters the actual root for aliases/unknown pages and returns
  503 for module requests. It has no live proxy and never forwards writes.
  Synthetic browser API/POST interception is owned by the test fixture proxy.
- Original media, brand, fonts, source/attribution and independent code remain
  locally. Previously dirty root/deploy/detail files replaced for this cutover
  are preserved byte-for-byte in
  `.test-artifacts/cutover-before-1793824977/`; that directory also contains
  `dirty-before.patch` and `status-before.txt`. Other existing dirty work was
  left in place. The previous full canonical installation is retained at
  `.test-artifacts/canonical-updates/before-1793824977680/`.
- Gideros/Makalp/CC BY-SA attribution links and font licenses remain active in
  the canonical site theme. Existing canonical OFL text copies have different
  whitespace from the original source files; both copies were preserved and
  tests check equivalent license text, exact original source hashes and exact
  active mirror hashes. Photos/fonts/brand binaries retain provenance hashes.

## Explicit update, assets and language

Initial unmodified read-only planner, with incoming/installed arguments:
**13 changes, 0 conflicts, 0 missing catalog keys**, common baseline 70 → 76.
The first invocation without arguments returned usage only and made no writes.

`scripts/update-canonical.mjs --check|--apply <incoming-template>` reuses the
Teknikel staged three-way implementation and the upstream planner/manifest
helpers. It refuses source tampering, symlinks (including owned trees/manifests),
unknown common files, baseline conflicts and shared source-key changes. Apply
stages the installation, fences source/current/owned bytes, verifies hashes,
keeps the previous installation, and swaps directories with rollback on rename
failure. Config/views/locales/site assets were unchanged by the common update;
subsequent intentional site-owned changes are API fixture-origin override,
favicon and source-catalog metadata/merge. There is no independent core fork.
Final planner has **zero changes/conflicts**. Template version remains **0.6.1**.

**76/76** common hashes equal upstream. The vendor has **19/19 exact modules**,
matching upstream, EfektAtolyesi source, Admin snapshot and provenance fingerprint
`078c2ac168547a04e1ec5716239100e7fcd910dc67a1eb703878c80577a0f39f`.

`scripts/sync-public-assets.mjs --check|--apply` mirrors **60 files**:
19 core, 21 site, 20 vendor files (19 modules + provenance). Vendor mirroring is
scoped to `vendor/effect-engine`, the complete incoming vendor namespace; the
retired local `vendor/pannellum` is preserved, blocked and excluded from deploy.
Unknown incoming vendor namespaces require review. SHA-256 inventories, symlink
refusal, staging, pre-swap drift checks, per-directory rename and rollback are
explicit. Cross-directory crash atomicity is not claimed. No build implicitly
repairs assets.

The sole runtime source endpoint is `/?resource=translation-source`, ID
**gundogdu-site**, **1,272 entries / 218,821 UTF-8 bytes** (exact PHP response,
under 2,048 entries and 512 KB). All original `assets/i18n/tr.json` keys/hashes
were merged into the site-owned canonical Turkish source. Runtime target
languages come only from published `target_languages`; unpublished languages,
stale source hashes and language-OFF cookies/query values fall back to Turkish.
No hardcoded English catalog or second language/widget owner was introduced.

`effects` remains `[]`. Old root scenes and private preserved-effects records
remain untouched and inactive; no migration/backfill was attempted. Invalid
scene JSON, inactive scenes and invalid active engine projects keep the static
photo in the actual common adapter.

## Local package and future deploy path

`scripts/package-site.mjs --check|--stage` verifies the manifest and root identity,
checks the public mirror, allowlists wrappers/common files/site views/locales and
known site asset types, and stages **178 files** with SHA256SUMS plus
`gundogdu-release.json` (identity, version, template-manifest hash, file hashes).
It excludes `inc`, independent JS/CSS/widget/language/effects/Pannellum, scenes
archived under `site/preserved-effects`, tests/router, backend/web-module,
customer data, DBs and secret/config storage. Original files are not deleted.

`bash scripts/deploy-site.sh --dry-run` is entirely local: narrow tests, PHP
rendering, route probes, package staging, checksum verification and packaged PHP
lint. It exits before any SSH/rsync/curl. Latest successful dry-run package:
`.test-artifacts/site-package-jIic9g/`; prior dry-run packages are retained.

`--yes` is future work only; it was **never invoked**. Its implemented checks
require known root identity, expected API 2.2.1, existing public module, no
symlinks in managed destinations, staged hashes/PHP/receipt allowlist and clean
installed baseline. It retains backups, transfers only the package, activates
entry/access policy last and checks root/source/assets/publication-aware routes.
No blind `rsync --delete`, customer data sync or automatic pruning. Activation
is per-file, not a full-site transaction or automatic health rollback. Remote
behavior remains untested; do not deploy before the remaining gates below.
The embedded remote PHP validator was linted and exercised locally against a
staged package and this root. That found an unnecessary `.gitkeep` packaging
mismatch; it was excluded, and the local simulation then passed.

## Evidence and remaining gates

Passed locally:

- `node --test --test-isolation=none tests/canonical-cutover.test.mjs tests/canonical-effects.test.mjs`
  — **13/13**: common/vendor/provenance/asset hashes, originals and attribution,
  active entry/wrappers, deploy exclusion, three-way read-only/conflict/add/
  replace/remove/owned preservation, corrupt source/catalog/symlink rejection,
  asset drift detection and invalid-effect/static/reduced-motion behavior.
- `php tests/canonical-entry.php` — actual root includes canonical, independent
  layout inactive, nine published page layouts, ON/OFF/unavailable gates,
  source identity/limits/original keys, published locale and stale hash fallback,
  independently gated common widget and published room/table 180/360 SSR.
- `python3 tests/canonical-routes.py` — ten actual physical wrappers, safe query
  forwarding/rejection, single redirects and actual root source GET/POST;
  source discovery does not boot business/AI. PHP CLI probe observes common
  response headers without a server. An initial Node subprocess probe hit
  sandbox `spawnSync EPERM`; the runner was replaced with Python, not counted
  as a passing Node result.
- Manifest, final update plan, all 60 mirror hashes, package integrity, local
  deploy dry-run, packaged PHP lint, Node/shell syntax and `git diff --check`.

**Browser NOT run:** `node tests/canonical-live-entry.mjs` stopped at the first
HTTP listen with sandbox **EPERM**; no retry. Its syntax passes. Host command:

```sh
cd /home/raistlin/YardimciWorkspace/gundogdu_web
node tests/canonical-live-entry.mjs
```

This isolated test targets actual root/router at **390/1440 px**, ten aliases,
query/publication gates, published locale, single widget, AI-OFF request POST
(intercepted locally), widget Escape/focus, inline room/table panorama/media,
invalid effects, private/legacy denial and overflow. No host browser success,
screenshot, WebGL interaction or visual fit is claimed here.

**Known parity gap: panorama fullscreen/Escape/close.** Common
`core/panorama.mjs` supports inline 180° bounded yaw, 360° yaw, pointer/arrows
and static fallback. Unlike the preserved independent Pannellum implementation,
it has no fullscreen dialog, explicit close action or Escape-to-close/focus
return. Published panorama URLs/types are preserved through common SSR, but
old fullscreen accessibility parity is **not complete**. Fix this in the common
upstream owner in a separately authorized writable-source chunk, then update
its release manifest, consume with the explicit updater, resync assets and add
host assertions for Escape/close/focus and WebGL loss. Do not reintroduce a
per-site panorama implementation to conceal the gap.

Also pending: host browser/visual acceptance (including the above gap), Apache
`.htaccess`/MJS MIME/private-path/API-exclusion acceptance, real published
media/locale/request compatibility, full media lifecycle and wider 320/768/RTL
checks. Old broad local check/browser/source scripts still describe the
independent DOM and were preserved; no broad-suite green result is claimed.
No full verify/pre-main/release suite, broad npm tests, live deployment or new
release was run. Data/test-effect disposal remains a later separate action.
