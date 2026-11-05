<?php
// Isolated local preview: module HTTP requests never reach the live backend.
declare(strict_types=1);
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
if (preg_match('~(?:^|/)\.|[\\\\\x00-\x1f\x7f]~', $path)
    || preg_match('~^/(?:canonical|inc|scripts|tests|docs|config|storage|core|site|public|locales|tools)(?:/|$)~', $path)
    || preg_match('~^/assets/(?:js|css|assistant|i18n|effect-engine|effects|vendor/pannellum)(?:/|$)~', $path)) {
    http_response_code(404); return true;
}
if ($path === '/yardimci-asistan' || str_starts_with($path, '/yardimci-asistan/')) {
    http_response_code(503); header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo '{"ok":false,"message":"Isolated preview: use a synthetic fixture proxy."}';
    return true;
}
$file = realpath(__DIR__ . $path);
if ($file !== false && str_starts_with($file, __DIR__ . '/') && is_file($file)) {
    if (str_starts_with($path, '/assets/') && !str_ends_with($path, '.php') && !is_link(__DIR__ . $path)) return false;
    if ($path === '/index.php' || preg_match('~^/(?:odalar(?:/oda)?|restoran(?:/masa)?|qr-menu|hakkimizda|iletisim|galeri|duyurular|yorumlar)/index\.php$~D', $path)) {
        require $file; return true;
    }
}
// Canonical handles aliases, unknown paths and all publication gates.
require __DIR__ . '/index.php';
return true;
