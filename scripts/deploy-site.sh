#!/usr/bin/env bash
# Site-only package. --dry-run is entirely local; this script never syncs the API.
set -Eeuo pipefail

[[ $# -eq 1 ]] || { echo 'Exactly one explicit mode is required.' >&2; exit 2; }
case "${1:-}" in
  --dry-run) dry=true ;;
  --yes) dry=false ;;
  *) echo 'Usage: bash scripts/deploy-site.sh --dry-run | --yes' >&2; exit 2 ;;
esac
repo="$(cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$repo"
node scripts/sync-public-assets.mjs --check
node tests/canonical-cutover.test.mjs
node tests/canonical-effects.test.mjs
node --test tests/gundogdu-page-heroes.mjs
php tests/canonical-entry.php
python3 tests/canonical-routes.py
package="$(node scripts/package-site.mjs --stage)"
(cd "$package" && sha256sum -c SHA256SUMS >/dev/null)
while IFS= read -r -d '' file; do php -l "$file" >/dev/null; done < <(find "$package" -type f -name '*.php' -print0)
if [[ "$dry" == true ]]; then
  echo "LOCAL_ONLY_DRY_RUN_PASS $package (no remote reads or writes; browser/HTTPS acceptance still required)"
  exit 0
fi
# Fail closed until exact-hash remote retirement + origin/authentication preflight
# has an independently reviewed executor. Local test readiness is separate.
echo 'DEPLOY BLOCKER: legacy retirement is preview-only; remote activation disabled.' >&2
exit 4
host='yardimciasistangunduodu@ssh-yardimciasistangunduodu.alwaysdata.net'
root='/home/yardimciasistangunduodu/www'
backup='/home/yardimciasistangunduodu/backups'
url='https://yardimciasistangunduodu.alwaysdata.net'
ssh_opts=(-o BatchMode=yes -o ConnectTimeout=12 -o StrictHostKeyChecking=yes)
ssh_rsync='ssh -o BatchMode=yes -o ConnectTimeout=12 -o StrictHostKeyChecking=yes'
for bin in ssh rsync curl; do command -v "$bin" >/dev/null; done
# Strict independent equality to the current central product policy; no fixed version.
version="$(curl --proto '=https' -fsS --max-time 15 "$url/yardimci-asistan/api/version.php" | node ../YardimciAsistan/scripts/site-release-target.mjs --verify-backend)"
stamp="$(date -u +%Y%m%dT%H%M%SZ)-$$"
ssh "${ssh_opts[@]}" "$host" bash -s -- "$root" "$backup" "$stamp" <<'REMOTE_PREP'
set -Eeuo pipefail
root="$1"; backup="$2"; stamp="$3"
for path in /home/yardimciasistangunduodu "$root" "$backup" "$root/yardimci-asistan"; do [[ -d "$path" && ! -L "$path" ]]; done
[[ "$stamp" =~ ^20[0-9]{6}T[0-9]{6}Z-[0-9]+$ ]]
[[ -f "$root/index.php" && ! -L "$root/index.php" && -f "$root/.htaccess" && ! -L "$root/.htaccess" ]]
grep -Fq 'gundogdu-site' "$root/index.php"
grep -Fq '# gundogdu-site' "$root/.htaccess"
for name in canonical assets/core assets/site assets/vendor/effect-engine; do
  [[ ! -L "$root/$name" ]]
  if [[ -d "$root/$name" ]]; then [[ -z "$(find "$root/$name" -type l -print -quit)" ]]; fi
done
# Require the existing public module; it is never part of this package.
[[ -f "$root/yardimci-asistan/api/business.php" && ! -L "$root/yardimci-asistan/api/business.php" ]]
mkdir -m 700 "$root/.gundogdu-stage-$stamp"
REMOTE_PREP
rsync -az --chmod=D755,F644 -e "$ssh_rsync" "$package/" "$host:$root/.gundogdu-stage-$stamp/"
ssh "${ssh_opts[@]}" "$host" bash -s -- "$root" "$backup" "$stamp" <<'REMOTE_ACTIVATE'
set -Eeuo pipefail
root="$1"; backup="$2"; stamp="$3"; stage="$root/.gundogdu-stage-$stamp"; slot="$backup/gundogdu-site-$stamp"
cd "$stage"
sha256sum -c SHA256SUMS >/dev/null
while IFS= read -r -d '' file; do php -l "$file" >/dev/null; done < <(find . -type f -name '*.php' -print0)
# Refuse symlink ancestors, unknown paths, API/private files and foreign manifests.
php -r '
$target=json_decode(file_get_contents("canonical/template-manifest.json"),true,512,JSON_THROW_ON_ERROR);
$r=json_decode(file_get_contents("gundogdu-release.json"),true,512,JSON_THROW_ON_ERROR);
if(($r["identity"]??null)!=="gundogdu-site" || ($r["template_version"]??null)!==($target["template_version"]??null)) exit(2);
$root=$argv[1];
foreach(array_keys($r["files"]) as $p) {
 if(str_contains($p,"..") || !preg_match("~^[A-Za-z0-9_./-]+$~D",$p)) exit(3);
 $m=json_decode(file_get_contents("canonical/template-manifest.json"),true,512,JSON_THROW_ON_ERROR);
 $route=preg_match("~^(?:odalar(?:/oda)?|restoran(?:/masa)?|qr-menu|hakkimizda|iletisim|galeri|duyurular|yorumlar)/index\\.php$~D",$p);
 $common=str_starts_with($p,"canonical/") && isset($m["common"][substr($p,10)]);
 $owned=preg_match("~^canonical/site/(?:config\\.php|\\.htaccess|README\\.md|views/(?:[a-z-]+/)*[a-z-]+\\.php)$~D",$p);
 $asset=preg_match("~^(?:canonical/public/)?assets/(?:core|site|vendor)/[A-Za-z0-9_./-]+$~D",$p);
 if(!in_array($p,["index.php",".htaccess","canonical/template-manifest.json","canonical/locales/tr.json"],true) && !$route && !$common && !$owned && !$asset) exit(3);
 $cursor=$root; foreach(explode("/",$p) as $part) { $cursor.="/".$part; if(is_link($cursor)) exit(4); }
}
$m="$root/canonical/template-manifest.json";
if(is_dir("$root/canonical")) {
 if(!is_file($m)) exit(5); $old=json_decode(file_get_contents($m),true);
 if(($old["format"]??null)!==1 || !preg_match("~^\\d+\\.\\d+\\.\\d+$~D",$old["template_version"]??"")) exit(6);
 foreach($old["common"] as $p=>$h) if(!is_file("$root/canonical/$p") || hash_file("sha256","$root/canonical/$p")!==$h) exit(7);
}
' "$root"
mkdir -m 700 "$slot"
# Preserve complete previous namespace trees; no deletion or pruning of backups.
for name in canonical assets/core assets/site assets/vendor/effect-engine; do
  if [[ -e "$root/$name" ]]; then mkdir -p "$slot/$(dirname "$name")"; cp -a "$root/$name" "$slot/$name"; fi
done
# Per-file atomic activation, entry and access policy last. No global --delete.
# Full cross-directory atomicity/automatic health rollback is not claimed.
while IFS= read -r line; do
  path="${line#*  }"
  case "$path" in index.php|.htaccess|gundogdu-release.json) continue ;; esac
  mkdir -p "$root/$(dirname "$path")"
  if [[ -f "$root/$path" ]]; then mkdir -p "$slot/$(dirname "$path")"; cp -p "$root/$path" "$slot/$path"; fi
  mv -f "$stage/$path" "$root/$path"
done < SHA256SUMS
cp -p "$root/index.php" "$root/.htaccess" "$slot/"
mv -f "$stage/.htaccess" "$root/.htaccess"
mv -f "$stage/index.php" "$root/index.php"
mv -f "$stage/gundogdu-release.json" "$root/gundogdu-release.json"
printf 'Backup: %s\n' "$slot"
REMOTE_ACTIVATE
# Publication-closed pages correctly return 404; static/source/root must succeed.
for path in / '/?resource=translation-source' /assets/core/site.mjs /assets/core/widget.js /assets/site/theme.css /assets/site/brand/mark.svg /assets/vendor/effect-engine/provenance.json; do
  curl -fLsS --max-time 20 "$url$path" >/dev/null
done
for path in /odalar/oda/ /restoran/masa/ /galeri/ /odalar/ /restoran/ /qr-menu/ /iletisim/ /yorumlar/ /duyurular/ /hakkimizda/; do
  status="$(curl -LsS --max-time 20 -o /dev/null -w '%{http_code}' "$url$path")"
  [[ "$status" == 200 || "$status" == 404 ]] || { echo "Health failed HTTP $status: $path (backup retained)" >&2; exit 1; }
done
for path in /canonical/site/config.php /assets/assistant/widget.js /inc/site.php; do
  status="$(curl -sS --max-time 20 -o /dev/null -w '%{http_code}' "$url$path")"
  [[ "$status" == 403 || "$status" == 404 ]] || exit 1
done
curl -fsS --max-time 15 "$url/?resource=translation-source" | php -r '$j=json_decode(stream_get_contents(STDIN),true);if(($j["id"]??null)!=="gundogdu-site" || ($j["source_language"]??null)!=="tr")exit(1);'
echo "GUNDOGDU_SITE_DEPLOY_PASS $url (API untouched; backup retained)"
