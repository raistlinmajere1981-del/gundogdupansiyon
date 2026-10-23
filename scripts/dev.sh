#!/usr/bin/env bash
set -Eeuo pipefail
cd -- "$(dirname -- "$0")/.."
php -r 'exit(PHP_VERSION_ID >= 80000 && function_exists("curl_init") ? 0 : 1);' || {
  echo 'PHP 8+ ve cURL gerekli.' >&2; exit 1;
}
# Multiple PHP workers avoid serializing ES module and API requests on localhost.
export PHP_CLI_SERVER_WORKERS="${PHP_CLI_SERVER_WORKERS:-4}"
echo 'Yerel önizleme: http://127.0.0.1:8077'
echo 'Yalnız public yayınlar okunur; canlıya talep/rezervasyon gönderilmez.'
exec php -S 127.0.0.1:8077 router.php
