<?php
// Local front controller only; use public/ as the document root in every hosting.
declare(strict_types=1);
$public = realpath(__DIR__ . '/../public');
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
if (preg_match('~(?:^|/)\.|[\\\\\x00-\x1f\x7f]~', $path)) { http_response_code(404); return true; }
$file = realpath($public . $path);
if ($file !== false && str_starts_with($file, $public . '/') && is_file($file)) return false;
require $public . '/index.php';
return true;
