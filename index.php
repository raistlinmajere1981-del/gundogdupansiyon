<?php // gundogdu-site
// Transport adapter only. Canonical owns pages, publication, language and widgets.
declare(strict_types=1);
$allowed = ['page', 'lang', 'category', 'id', 'resource', 'table'];
foreach ($_GET as $key => $value) {
    if (!in_array($key, $allowed, true) || !is_string($value) || strlen($value) > 2048 || preg_match('/[\x00-\x1f\x7f]/', $value)) {
        http_response_code(400); exit;
    }
}
$templateRoot = __DIR__ . '/canonical';
require $templateRoot . '/public/index.php';
