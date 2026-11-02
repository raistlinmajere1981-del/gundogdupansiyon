#!/usr/bin/env bash
set -Eeuo pipefail
case "${1:-}" in
  --dry-run) dry=true ;;
  --yes) dry=false ;;
  *) echo 'Kullanım: bash scripts/deploy-site.sh --dry-run | --yes' >&2; exit 2 ;;
esac
repo="$(cd -- "$(dirname -- "$0")/.." && pwd)"
host='yardimciasistangunduodu@ssh-yardimciasistangunduodu.alwaysdata.net'
root='/home/yardimciasistangunduodu/www'
site='https://yardimciasistangunduodu.alwaysdata.net/'
ssh_opts=(-o BatchMode=yes -o ConnectTimeout=12 -o StrictHostKeyChecking=yes)
ssh_rsync='ssh -o BatchMode=yes -o ConnectTimeout=12 -o StrictHostKeyChecking=yes'
[[ -s "$repo/index.php" ]] && grep -q 'gundogdu-site' "$repo/index.php" || {
  echo 'Site henüz tasarlanmadı: işaretli index.php bulunamadı. Yayın yapılmadı.' >&2; exit 1;
}
for c in php ssh rsync curl; do command -v "$c" >/dev/null || { echo "Eksik: $c" >&2; exit 1; }; done
# restoran includes the published /restoran/masa/ detail page.
site_dirs='assets inc odalar restoran galeri iletisim qr-menu'
site_files='.htaccess 404.php robots.txt sitemap.xml'
for name in $site_dirs $site_files; do
  [[ -e "$repo/$name" && ! -L "$repo/$name" ]] || { echo "Eksik veya symlink site girdisi: $name" >&2; exit 1; }
done
[[ -z "$(find "$repo/assets" "$repo/inc" "$repo/odalar" "$repo/restoran" "$repo/galeri" "$repo/iletisim" "$repo/qr-menu" -type l -print -quit)" ]] || { echo 'Site paketinde symlink bulundu.' >&2; exit 1; }
while IFS= read -r -d '' file; do php -l "$file" >/dev/null; done < <(
  find "$repo" -name .git -prune -o -name .deploy -prune -o -type f -name '*.php' -print0
)
ssh "${ssh_opts[@]}" "$host" bash -s -- "$root" <<'CHECK'
set -Eeuo pipefail
root="$1"
[[ -d "$root" && ! -L "$root" ]]
command -v rsync >/dev/null
php -r 'exit(PHP_VERSION_ID >= 80000 && function_exists("curl_multi_init") ? 0 : 1);' || {
  echo 'Hosting PHP 8+ ve cURL eklentisi gerektiriyor.' >&2; exit 1;
}
for name in assets inc odalar restoran galeri iletisim qr-menu .htaccess 404.php robots.txt sitemap.xml index.php; do
  [[ ! -L "$root/$name" ]] || { echo "Uzak site girdisi symlink: $name" >&2; exit 1; }
done
# The original Gündoğdu staging site used the shared canonical PHP adapter.
# Accept only this verified, site-origin-bound adapter for the one-time takeover;
# no arbitrary foreign index.php is ever eligible.
legacy=false
if [[ -e "$root/index.php" ]] && ! grep -q 'gundogdu-site' "$root/index.php"; then
  if [[ "$(sha256sum "$root/index.php" | cut -d' ' -f1)" == 'a290a964d3399e51fdcf033c05bae7760bf8878396ee57a40bcd95375a856fea' ]] \
      && [[ -f "$root/site/config.php" ]] \
      && grep -Fq 'https://yardimciasistangunduodu.alwaysdata.net' "$root/site/config.php"; then
    legacy=true
    echo 'Gündoğdu ortak şablon adaptöründen özel siteye güvenli geçiş doğrulandı.'
  else
    echo 'Farklı siteye ait index.php bulundu. Durduruldu.' >&2; exit 1
  fi
fi
if [[ -e "$root/index.html" ]] && ! grep -qi 'alwaysdata' "$root/index.html"; then
  echo 'Bilinmeyen index.html bulundu. Durduruldu.' >&2; exit 1
fi
if [[ -e "$root/.htaccess" ]] && ! grep -q 'gundogdu-site' "$root/.htaccess"; then
  if [[ "$legacy" != true ]] || [[ "$(sha256sum "$root/.htaccess" | cut -d' ' -f1)" != '9fc4c75b0fd55205d5ce7a34dc5d803bfd5ed92aa4eeb8730758d3c977c0a0b0' ]]; then
    echo 'Bilinmeyen kök .htaccess bulundu. Durduruldu.' >&2; exit 1
  fi
fi
CHECK
for name in $site_dirs; do
  [[ -d "$repo/$name" ]] || continue
  if [[ "$dry" == true ]]; then flags='-azni'; else flags='-azi'; fi
  rsync "$flags" --omit-dir-times --chmod=D755,F644 -e "$ssh_rsync" "$repo/$name/" "$host:$root/$name/"
done
if [[ "$dry" == true ]]; then flags='-azni'; else flags='-azi'; fi
for name in $site_files; do
  rsync "$flags" --chmod=F644 -e "$ssh_rsync" "$repo/$name" "$host:$root/$name"
done
if [[ "$dry" == true ]]; then
  rsync -azni -e "$ssh_rsync" "$repo/index.php" "$host:$root/index.php"
  echo 'Ön kontrol tamamlandı. Sunucuda dosya değiştirilmedi.'
  exit 0
fi
stage="$root/.gundogdu-index-$(date -u +%Y%m%dT%H%M%SZ)-$$.php"
rsync -az -e "$ssh_rsync" "$repo/index.php" "$host:$stage"
ssh "${ssh_opts[@]}" "$host" bash -s -- "$root" "$stage" <<'ACTIVATE'
set -Eeuo pipefail
root="$1"; stage="$2"
[[ -s "$stage" && ! -L "$stage" ]]
php -l "$stage" >/dev/null
mv "$stage" "$root/index.php"
if [[ -e "$root/index.html" ]] && grep -qi 'alwaysdata' "$root/index.html"; then
  rm "$root/index.html"
fi
# Only the retired pre-Studio Gideros motor. Never delete the shared engine or scenes.
if [[ -d "$root/assets/js/canvas" && ! -L "$root/assets/js/canvas" ]]; then
  rm -rf -- "$root/assets/js/canvas"
fi
if [[ ! -L "$root/assets/js/water.mjs" ]]; then
  rm -f -- "$root/assets/js/water.mjs"
fi
ACTIVATE
code="$(curl -LsS -o /dev/null -w '%{http_code}' --max-time 15 "$site")"
[[ "$code" == 200 ]] || { echo "Canlı HTTP $code" >&2; exit 1; }
echo "Site yayınlandı: $site"
