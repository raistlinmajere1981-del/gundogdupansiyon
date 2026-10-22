<?php
// Local preview only; never in the deploy allowlist.
declare(strict_types=1);
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
if (preg_match('#^/(?:\.|inc/|scripts/|docs/)|\.\.|\\\\#', $path)) { http_response_code(404); exit; }
if (str_starts_with($path, '/yardimci-asistan/')) {
    if (getenv('GUNDOGDU_FIXTURE_MODULE') === '1' && is_file(__DIR__ . $path)) return false;
    require __DIR__ . '/inc/data.php';
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && media_url($path) !== '') {
        $body = ''; $handle = curl_init(public_origin() . $path);
        curl_setopt_array($handle, [CURLOPT_TIMEOUT_MS=>4000, CURLOPT_FOLLOWLOCATION=>false,
            CURLOPT_WRITEFUNCTION=>static function ($handle, string $chunk) use (&$body): int {
                if (strlen($body) + strlen($chunk) > 10485760) return 0;
                $body .= $chunk; return strlen($chunk);
            }]);
        curl_exec($handle); $type=curl_getinfo($handle, CURLINFO_CONTENT_TYPE); $code=curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        if ($code === 200 && in_array($type, ['image/jpeg','image/png','image/webp'], true) && curl_errno($handle) === 0) {
            header('Content-Type: ' . $type); header('X-Content-Type-Options: nosniff'); echo $body;
        } else http_response_code(404);
        curl_close($handle); exit;
    }
    // Local preview never forwards customer writes to the live module.
    if ($_SERVER['REQUEST_METHOD'] !== 'GET' || !preg_match('#^/yardimci-asistan/api/(business|rooms|tables|menu|marketing)\.php$#D', $path)) {
        http_response_code(503); header('Content-Type: application/json'); echo '{"ok":false,"message":"Yerel önizlemede işlem gönderimi kapalı."}'; exit;
    }
    $name = basename($path, '.php'); $payload = public_snapshot()[$name];
    header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
    if (!$payload) http_response_code(503);
    echo json_html($payload ?: ['ok'=>false]); exit;
}
if ($path !== '/' && is_file(__DIR__ . $path)) return false;
if (is_dir(__DIR__ . $path) && is_file(__DIR__ . rtrim($path, '/') . '/index.php')) {
    require __DIR__ . rtrim($path, '/') . '/index.php'; return true;
}
require __DIR__ . '/404.php';
