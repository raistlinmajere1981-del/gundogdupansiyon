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
site_dirs='assets inc odalar restoran galeri iletisim'
site_files='.htaccess 404.php robots.txt sitemap.xml'
for name in $site_dirs $site_files; do
  [[ -e "$repo/$name" && ! -L "$repo/$name" ]] || { echo "Eksik veya symlink site girdisi: $name" >&2; exit 1; }
done
[[ -z "$(find "$repo/assets" "$repo/inc" "$repo/odalar" "$repo/restoran" "$repo/galeri" "$repo/iletisim" -type l -print -quit)" ]] || { echo 'Site paketinde symlink bulundu.' >&2; exit 1; }
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
for name in assets inc odalar restoran galeri iletisim .htaccess 404.php robots.txt sitemap.xml index.php; do
  [[ ! -L "$root/$name" ]] || { echo "Uzak site girdisi symlink: $name" >&2; exit 1; }
done
if [[ -e "$root/index.php" ]] && ! grep -q 'gundogdu-site' "$root/index.php"; then
  echo 'Farklı siteye ait index.php bulundu. Durduruldu.' >&2; exit 1
fi
if [[ -e "$root/index.html" ]] && ! grep -qi 'alwaysdata' "$root/index.html"; then
  echo 'Bilinmeyen index.html bulundu. Durduruldu.' >&2; exit 1
fi
if [[ -e "$root/.htaccess" ]] && ! grep -q 'gundogdu-site' "$root/.htaccess"; then
  echo 'Bilinmeyen kök .htaccess bulundu. Durduruldu.' >&2; exit 1
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
ACTIVATE
code="$(curl -LsS -o /dev/null -w '%{http_code}' --max-time 15 "$site")"
[[ "$code" == 200 ]] || { echo "Canlı HTTP $code" >&2; exit 1; }
echo "Site yayınlandı: $site"
