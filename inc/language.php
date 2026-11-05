<?php
declare(strict_types=1);

const SITE_SOURCE_CATALOG_ID = 'gundogdu-site';
const SITE_LANGUAGE_COOKIE = 'gundogdu_site_language';
const RETIRED_SITE_LANGUAGE_COOKIE = 'gundogdu_language';

/**
 * The retired cookie was HttpOnly, so client code could never replace it. Mirror
 * its host-only origin, path "/" and HTTPS-only Secure flag to expire it safely.
 */
function retire_legacy_language_cookie(): void {
    if (headers_sent()) return;
    setcookie(RETIRED_SITE_LANGUAGE_COOKIE, '', [
        'expires' => time() - 3600,
        'path' => '/',
        'domain' => '',
        'secure' => (($_SERVER['HTTPS'] ?? '') === 'on'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

/**
 * Server rendering is always Turkish. A published target language is applied by
 * the client only after the application-owned business localization is loaded.
 */
function site_language(): string {
    return 'tr';
}

function site_text(string $source): string {
    return $source;
}

/** Build the site-owned Turkish source catalog served to the Desktop app. */
function site_source_catalog(): array {
    static $catalog;
    if (is_array($catalog)) return $catalog;
    $file = dirname(__DIR__) . '/assets/i18n/tr.json';
    $decoded = is_file($file) ? json_decode((string) file_get_contents($file), true, 512) : null;
    $source = is_array($decoded) ? $decoded : [];
    $entries = [];
    foreach (is_array($source['entries'] ?? null) ? $source['entries'] : [] as $key => $entry) {
        if (!is_string($key) || !preg_match('/^[a-zA-Z0-9_.-]{1,120}$/D', $key) || !is_array($entry)) continue;
        $text = $entry['text'] ?? null;
        if (!is_string($text) || trim($text) === '' || mb_strlen($text, 'UTF-8') > 12000
            || preg_match('/[<>\x00-\x08]/u', $text)) continue;
        $hash = hash('sha256', $text);
        if (($entry['hash'] ?? null) !== $hash) continue;
        $entries[$key] = ['text' => $text, 'hash' => $hash];
    }
    ksort($entries, SORT_STRING);
    $revision = '';
    foreach ($entries as $key => $entry) $revision .= $key . ':' . $entry['hash'] . "\n";
    $catalog = ['version' => 1, 'id' => SITE_SOURCE_CATALOG_ID, 'revision' => hash('sha256', $revision),
        'source_language' => 'tr', 'entries' => $entries];
    return $catalog;
}
