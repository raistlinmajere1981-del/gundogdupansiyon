<?php
declare(strict_types=1);

const SITE_ORIGIN = 'https://yardimciasistangunduodu.alwaysdata.net';
const PUBLIC_ENDPOINTS = ['business', 'rooms', 'tables', 'menu', 'marketing'];

function esc(mixed $value): string { return htmlspecialchars(txt($value), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function txt(mixed $value): string { return is_string($value) || is_numeric($value) ? trim((string) $value) : ''; }
function records(mixed $value): array { return is_array($value) ? array_values(array_filter($value, 'is_array')) : []; }
function strings(mixed $value): array { return is_array($value) ? array_values(array_filter($value, 'is_string')) : []; }
function safe_link(mixed $value): string {
    $url = txt($value);
    if (preg_match('/[\x00-\x20\x7f]/', $url) || !filter_var($url, FILTER_VALIDATE_URL)) return '';
    $parts = parse_url($url);
    return ($parts['scheme'] ?? '') === 'https' && !isset($parts['user']) && !isset($parts['pass']) ? $url : '';
}
function media_url(mixed $value): string {
    $url = txt($value);
    if (str_starts_with($url, SITE_ORIGIN . '/')) $url = substr($url, strlen(SITE_ORIGIN));
    // Only canonical, same-origin published media. Never load a local path or arbitrary host.
    if (!preg_match('#^/yardimci-asistan/media/[A-Za-z0-9_./-]+$#D', $url)) return '';
    $decoded = rawurldecode($url);
    return preg_match('#(?:^|/)\.\.?(/|$)|[\\\\\x00-\x20]#', $decoded) ? '' : $url;
}
function asset(string $path): string {
    $file = dirname(__DIR__) . '/assets/' . $path;
    return '/assets/' . $path . (is_file($file) ? '?v=' . filemtime($file) : '');
}
function public_origin(): string {
    $origin = getenv('GUNDOGDU_PUBLIC_API_ORIGIN') ?: SITE_ORIGIN;
    return preg_match('#^https?://[a-zA-Z0-9.:-]+$#D', $origin) ? rtrim($origin, '/') : SITE_ORIGIN;
}

/** SSR never calls the site's own PHP pool. Browser GETs own all published data. */
function public_snapshot(): array { return array_fill_keys(PUBLIC_ENDPOINTS, []); }

/** Local preview proxy only; GUNDOGDU_PUBLIC_API_ORIGIN remains a fixture override. */
function preview_public_get(string $name): array {
    if (!in_array($name, PUBLIC_ENDPOINTS, true) || !function_exists('curl_init')) return [];
    $body = ''; $handle = curl_init(public_origin() . '/yardimci-asistan/api/' . $name . '.php');
    curl_setopt_array($handle, [CURLOPT_HTTPHEADER=>['Accept: application/json'], CURLOPT_CONNECTTIMEOUT_MS=>650,
        CURLOPT_TIMEOUT_MS=>1800, CURLOPT_FOLLOWLOCATION=>false, CURLOPT_PROTOCOLS=>CURLPROTO_HTTP | CURLPROTO_HTTPS,
        CURLOPT_WRITEFUNCTION=>static function ($handle, string $chunk) use (&$body): int {
            if (strlen($body) + strlen($chunk) > 2097152) return 0;
            $body .= $chunk; return strlen($chunk);
        }]);
    curl_exec($handle);
    $valid = curl_errno($handle) === 0 && curl_getinfo($handle, CURLINFO_RESPONSE_CODE) === 200;
    curl_close($handle);
    $payload = $valid ? json_decode($body, true, 64) : null;
    return is_array($payload) && ($payload['ok'] ?? false) === true ? $payload : [];
}
function business(): array { $value = public_snapshot()['business']['business'] ?? []; return is_array($value) ? $value : []; }
function brand_name(): string { return txt(business()['display_name'] ?? business()['name'] ?? '') ?: 'Gündoğdu'; }
function has_surface(string $surface): bool { return in_array($surface, strings(business()['public_surfaces'] ?? []), true); }
function catalog(string $kind): array {
    if (!in_array($kind, ['rooms', 'tables'], true)) return [];
    $payload = public_snapshot()[$kind];
    return has_surface($kind === 'rooms' ? 'rooms' : 'restaurant') && ($payload['enabled'] ?? false) === true ? records($payload[$kind] ?? []) : [];
}
function can_reserve(string $kind): bool {
    return (business()['requests_enabled'] ?? false) === true && catalog($kind) !== []
        && has_surface($kind === 'rooms' ? 'accommodation' : 'food_service');
}
function menu_items(): array {
    if (!has_surface('qr_menu') && !has_surface('menu')) return [];
    $payload = public_snapshot()['menu'];
    $ids = array_column(records($payload['categories'] ?? []), 'id');
    return array_values(array_filter(records($payload['items'] ?? []), static fn(array $item): bool =>
        ($item['is_available'] ?? true) === true && in_array($item['category_id'] ?? null, $ids, true)));
}
function published_gallery(): array {
    $result = [];
    foreach (records(business()['gallery'] ?? []) as $photo) {
        $url = media_url($photo['url'] ?? '');
        if ($url !== '') $result[] = ['url' => $url, 'title' => txt($photo['title'] ?? '') ?: 'İşletmeden bir kare', 'published' => true];
    }
    return array_slice($result, 0, 80);
}
function scenic_gallery(): array {
    return [
        ['url'=>'/assets/img/gideros-1-1200.webp', 'title'=>'Ormanın kucakladığı koy', 'published'=>false, 'source'=>'https://commons.wikimedia.org/wiki/File:Gideros_Bay1.jpg'],
        ['url'=>'/assets/img/gideros-2-1275.webp', 'title'=>'Yeşilden maviye', 'published'=>false, 'source'=>'https://commons.wikimedia.org/wiki/File:Gideros_Bay2.jpg']
    ];
}
function contact(): array {
    $b = business(); $phone = txt($b['phone'] ?? ''); $digits = preg_replace('/[\s().-]+/', '', $phone);
    $wa = preg_replace('/[\s()+.-]+/', '', txt($b['whatsapp'] ?? ''));
    $lat = $b['latitude'] ?? null; $lon = $b['longitude'] ?? null;
    $valid = is_numeric($lat) && is_numeric($lon) && is_finite((float) $lat) && is_finite((float) $lon) && abs((float) $lat) <= 90 && abs((float) $lon) <= 180;
    $address = txt($b['address'] ?? ''); $map = ''; $embed = ''; $attribution = false;
    if ($valid) {
        $point = sprintf('%.6F,%.6F', $lat, $lon);
        $bbox = sprintf('%.6F,%.6F,%.6F,%.6F', $lon-.009, $lat-.006, $lon+.009, $lat+.006);
        $map = 'https://www.openstreetmap.org/?mlat=' . $lat . '&mlon=' . $lon . '#map=16/' . $lat . '/' . $lon;
        $embed = 'https://www.openstreetmap.org/export/embed.html?bbox=' . rawurlencode($bbox) . '&layer=mapnik&marker=' . rawurlencode($point);
        $attribution = true;
    } elseif ($address !== '') $map = 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode($address);
    $publishedMap = safe_link($b['map_url'] ?? '');
    if ($publishedMap !== '') $map = $publishedMap;
    if (($b['mapDisplayMode'] ?? '') === 'google_maps_embed') {
        $google = safe_link($b['googleMapsEmbedUrl'] ?? '');
        if (in_array(parse_url($google, PHP_URL_HOST), ['google.com','www.google.com','google.com.tr','www.google.com.tr'], true)
            && preg_match('#^/maps/embed(?:\?|/|$)#', substr($google, strpos($google, '/maps/') ?: strlen($google)))) { $embed = $google; $attribution = false; }
    }
    return ['phone'=>$phone, 'tel'=>preg_match('/^\+?[0-9]{5,20}$/D', $digits) ? 'tel:' . $digits : '',
        'whatsapp'=>(($b['whatsapp_enabled'] ?? false) === true && preg_match('/^[1-9][0-9]{6,14}$/D', $wa)) ? 'https://wa.me/' . $wa : '',
        'email'=>filter_var(txt($b['email'] ?? ''), FILTER_VALIDATE_EMAIL) ? txt($b['email']) : '',
        'address'=>$address, 'note'=>txt($b['directions_note'] ?? ''), 'map'=>$map, 'embed'=>$embed, 'attribution'=>$attribution,
        'lat'=>$valid ? (float) $lat : null, 'lon'=>$valid ? (float) $lon : null];
}
function structured_data(): array {
    $c = contact();
    $data = ['@context'=>'https://schema.org','@type'=>'LodgingBusiness','name'=>brand_name(),'url'=>SITE_ORIGIN,
        'logo'=>SITE_ORIGIN . '/assets/brand/mark.svg'];
    if ($c['tel'] !== '') $data['telephone'] = substr($c['tel'], 4);
    if ($c['address'] !== '') $data['address'] = ['@type'=>'PostalAddress','streetAddress'=>$c['address']];
    if ($c['lat'] !== null) $data['geo'] = ['@type'=>'GeoCoordinates','latitude'=>$c['lat'],'longitude'=>$c['lon']];
    if ($c['map'] !== '') $data['hasMap'] = $c['map'];
    $socials = array_values(array_filter(array_map(static fn(array $s): string => safe_link($s['url'] ?? ''), records(business()['social_links'] ?? []))));
    if ($socials) $data['sameAs'] = $socials;
    $photos = published_gallery();
    if ($photos) $data['image'] = array_map(static fn(array $p): string => SITE_ORIGIN . $p['url'], $photos);
    return $data;
}
function money(mixed $amount, mixed $currency = 'TRY', int $divisor = 1): string {
    if (!is_numeric($amount) || (float) $amount < 0 || !is_finite((float) $amount)) return '';
    $currency = txt($currency); if (!preg_match('/^[A-Z]{3}$/D', $currency)) return '';
    return number_format((float) $amount / $divisor, 2, ',', '.') . ' ' . ($currency === 'TRY' ? '₺' : $currency);
}
function json_html(mixed $value): string { return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_INVALID_UTF8_SUBSTITUTE) ?: '{}'; }
