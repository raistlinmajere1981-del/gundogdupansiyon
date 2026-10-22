<?php
declare(strict_types=1);
// UI language does not depend on a same-host server HTTP request.
function site_language(): string {
    return ($_GET['lang'] ?? $_COOKIE['gundogdu_language'] ?? 'tr') === 'en' ? 'en' : 'tr';
}
function site_words(): array {
    static $words;
    return $words ??= json_decode(file_get_contents(dirname(__DIR__) . '/assets/i18n/en.json'), true, 512, JSON_THROW_ON_ERROR);
}
function site_text(string $source): string {
    return site_language() === 'en' ? (site_words()[$source] ?? $source) : $source;
}
if (isset($_GET['lang']) && in_array($_GET['lang'], ['tr','en'], true)) {
    setcookie('gundogdu_language', site_language(), ['expires'=>time()+31536000,'path'=>'/','httponly'=>true,'samesite'=>'Lax','secure'=>(($_SERVER['HTTPS'] ?? '') === 'on')]);
}

// Translate text nodes only; attributes and API records have explicit owners.
ob_start(static function (string $html): string {
    if (site_language() !== 'en') return $html;
    return preg_replace_callback('~(<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>|<[^>]*>)|([^<]+)~si', static function ($m): string {
        if (!empty($m[1])) return $m[1];
        $source = html_entity_decode(trim($m[2]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $translated = site_text($source);
        return $translated === $source ? $m[2] : str_replace(trim($m[2]), htmlspecialchars($translated, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'), $m[2]);
    }, $html);
});
