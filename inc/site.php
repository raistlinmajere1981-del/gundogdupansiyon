<?php
declare(strict_types=1);
require_once __DIR__ . '/data.php';

function icon(string $name, string $class = ''): string {
    $paths = [
        'arrow'=>'<path d="M4 12h16m-6-6 6 6-6 6"/>',
        'pin'=>'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
        'sun'=>'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
        'leaf'=>'<path d="M20 3C9 2 2 8 5 15s15 7 15-12ZM4 21 16 9"/>',
        'wave'=>'<path d="M2 8c4-5 6 5 10 0s6 5 10 0M2 15c4-5 6 5 10 0s6 5 10 0"/>',
        'bed'=>'<path d="M3 19V7m18 12V7M3 14h18M5 14V9h14v5M3 17h18"/><path d="M7 9V6h10v3"/>',
        'plate'=>'<circle cx="13" cy="12" r="7"/><path d="M2 3v6m3-6v6M2 7h3M3.5 9v12M23 3v18M23 3c-3 2-3 8 0 8"/>',
        'phone'=>'<path d="m7 3 3 5-3 3a16 16 0 0 0 6 6l3-3 5 3-1 4C10 23 1 14 3 4Z"/>',
        'mail'=>'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>',
        'calendar'=>'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18m-14 4h3m4 0h3"/>',
        'plus'=>'<path d="M12 4v16M4 12h16"/>',
        'close'=>'<path d="m6 6 12 12M6 18 18 6"/>',
        'menu'=>'<path d="M4 7h16M4 16h16"/>'
    ];
    return '<svg class="icon ' . esc($class) . '" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . ($paths[$name] ?? $paths['arrow']) . '</svg>';
}
function booking_link(string $label = 'Ziyaretinizi planlayın', string $kind = '', string $class = 'button'): void {
    $intent = $kind === 'rooms' && can_reserve('rooms') ? 'accommodation.reserve' : ($kind === 'tables' && can_reserve('tables') ? 'food.reserve' : 'home');
    ?><a class="<?= esc($class) ?>" href="/iletisim/#rezervasyon" data-booking-kind="<?= esc($kind) ?>" data-ya-action="<?= esc($intent) ?>"><?= esc($label) ?><?= icon('arrow') ?></a><?php
}
function page_top(string $page, string $title, string $description): void {
    $GLOBALS['site_page'] = $page;
    $path = $page === 'home' ? '/' : '/' . $page . '/';
    header('Content-Type: text/html; charset=utf-8'); header('Cache-Control: no-cache'); header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    ?><!doctype html>
<html lang="tr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= esc($title) ?> · <?= esc(brand_name()) ?></title>
<meta name="description" content="<?= esc($description) ?>"><meta name="theme-color" content="#244c45">
<link rel="canonical" href="<?= esc(SITE_ORIGIN . $path) ?>"><link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website"><meta property="og:locale" content="tr_TR"><meta property="og:site_name" content="<?= esc(brand_name()) ?>">
<meta property="og:title" content="<?= esc($title . ' · ' . brand_name()) ?>"><meta property="og:description" content="<?= esc($description) ?>">
<meta property="og:url" content="<?= esc(SITE_ORIGIN . $path) ?>"><meta property="og:image" content="<?= esc(SITE_ORIGIN) ?>/assets/img/social.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Gideros Koyu · Makalp · CC BY-SA 3.0">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/assets/fonts/cormorant-500-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="<?= esc(asset('css/site.css')) ?>"><link rel="stylesheet" href="<?= esc(asset('css/widget-theme.css')) ?>">
<script type="application/ld+json" data-business-structured-data><?= json_html(structured_data()) ?></script>
</head><body data-page="<?= esc($page) ?>" data-site="gundogdu" data-stay-enabled="<?= can_reserve('rooms') ? 'true' : 'false' ?>" data-table-enabled="<?= can_reserve('tables') ? 'true' : 'false' ?>">
<a class="skip-link" href="#icerik">İçeriğe geç</a>
<header class="site-header"><div class="header-inner">
<a class="brand" href="/" aria-label="<?= esc(brand_name()) ?> ana sayfa"><img src="/assets/brand/mark.svg" width="57" height="52" alt=""><span class="brand-copy"><strong>Gündoğdu</strong><small>PANSİYON &amp; RESTORAN</small></span></a>
<nav class="desktop-nav" aria-label="Ana gezinme"><?php nav_links($page); ?></nav>
<?php booking_link('Rezervasyon', '', 'button header-booking'); ?>
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Menüyü aç"><?= icon('menu') ?></button>
</div><nav id="mobile-nav" class="mobile-nav" aria-label="Mobil gezinme" hidden><?php nav_links($page); booking_link('Ziyaretinizi planlayın'); ?></nav></header>
<main id="icerik" tabindex="-1">
<?php
}
function nav_links(string $current): void {
    foreach (['odalar'=>'Odalar','restoran'=>'Restoran','galeri'=>'Galeri','iletisim'=>'İletişim'] as $key=>$name): ?>
    <a href="/<?= esc($key) ?>/"<?= $current === $key ? ' aria-current="page"' : '' ?>><?= esc($name) ?></a>
    <?php endforeach;
}
function photo(int $number, string $class = '', bool $priority = false, string $alt = ''): void {
    $largest = $number === 1 ? 1818 : 1275;
    $alt = $alt ?: ($number === 1 ? 'Ormanlarla çevrili Gideros Koyu’nun panoramik görünümü' : 'Gideros Koyu’nun yeşil kıyıları ve durgun suyu');
    ?><img class="<?= esc($class) ?>" src="/assets/img/gideros-<?= $number ?>-<?= $largest ?>.webp" srcset="/assets/img/gideros-<?= $number ?>-720.webp 720w, /assets/img/gideros-<?= $number ?>-<?= $largest ?>.webp <?= $largest ?>w" sizes="<?= $class === 'hero-photo' ? '100vw' : '(max-width: 760px) 100vw, 55vw' ?>" width="<?= $largest ?>" height="<?= $number === 1 ? 1228 : 941 ?>" alt="<?= esc($alt) ?>" <?= $priority ? 'fetchpriority="high"' : 'loading="lazy"' ?> decoding="async"><?php
}
function photo_credit(): void { ?>
<a class="photo-credit" href="/galeri/#kaynaklar">Gideros Koyu · Makalp / CC BY-SA 3.0 <?= icon('arrow') ?></a>
<?php }
function subhero(string $eyebrow, string $title, string $text, int $number = 2): void { ?>
<section class="subhero"><div class="shell"><p class="eyebrow"><?= esc($eyebrow) ?></p><h1><?= $title ?></h1><p class="lede"><?= esc($text) ?></p></div><figure><?php photo($number, '', true); ?><figcaption>Gideros Koyu · Bölge fotoğrafı</figcaption></figure></section>
<?php }
function rooms_section(bool $full = false): void {
    $rooms = catalog('rooms'); ?>
<section class="section shell" id="konaklama"><div class="section-heading"><div><p class="eyebrow">KONAKLAMA</p><h2>Biraz dinlenin.<br><em>Doğaya uyanın.</em></h2></div><div class="section-aside"><p>Günün telaşına küçük bir ara.<br>Gideros’ta yeni bir sabaha yer açın.</p><?php if (!$full): ?><a class="text-link" href="/odalar/">Odaları keşfedin <?= icon('arrow') ?></a><?php endif; ?></div></div>
<div data-public-rooms data-full="<?= $full ? 'true' : 'false' ?>"><?php if (!$rooms): ?>
<div class="unpublished stay-placeholder"><div class="line-art"><?= icon('bed') ?><span class="art-sun"></span></div><div><p class="eyebrow">KONAKLAMANIZ İÇİN</p><h3>Size uygun bir mola.</h3><p>Güncel oda seçenekleri şu anda görüntülenemiyor. Güncel bilgi ve ziyaret planınız için iletişim seçeneklerini inceleyebilirsiniz.</p><a class="text-link" href="/iletisim/">İletişime geçin <?= icon('arrow') ?></a></div><span class="vertical-note" aria-hidden="true">YAVAŞLA · NEFES AL · DİNLEN</span></div>
<?php else: ?><div class="room-grid">
<?php foreach (($full ? $rooms : array_slice($rooms, 0, 3)) as $room):
    $cover = ''; foreach (records($room['media'] ?? []) as $media) { if (in_array($media['kind'] ?? '', ['cover','photo'], true) && media_url($media['url'] ?? '') !== '') { $cover = media_url($media['url']); break; } }
    $price = money($room['nightly_price_minor'] ?? null, $room['currency'] ?? '', 100);
    ?><article class="room-card"><?php if ($cover): ?><button class="room-image" type="button" data-lightbox="<?= esc($cover) ?>" data-caption="<?= esc($room['name'] ?? '') ?>" aria-label="<?= esc($room['name'] ?? '') ?> fotoğrafını büyüt"><img src="<?= esc($cover) ?>" alt="<?= esc($room['name'] ?? '') ?>" loading="lazy" width="600" height="420"></button><?php else: ?><div class="room-image placeholder-photo"><?= icon('bed') ?><span>Oda fotoğrafı henüz yayınlanmadı</span></div><?php endif; ?>
    <div class="room-body"><p class="eyebrow"><?= is_numeric($room['capacity'] ?? null) && (int) $room['capacity'] > 0 ? esc($room['capacity']) . ' KİŞİ' : 'KONAKLAMA' ?></p><h3><?= esc($room['name'] ?? '') ?></h3><p><?= nl2br(esc($room['description'] ?? '')) ?></p><?php if (txt($room['bed_info'] ?? '')): ?><p class="room-meta"><?= esc($room['bed_info']) ?></p><?php endif; ?>
    <?php if ($price): ?><p class="price"><?= esc($price) ?><small> / gece</small></p><?php endif; ?><?php if (txt($room['price_note'] ?? '')): ?><p class="fine-print"><?= esc($room['price_note']) ?></p><?php endif; ?>
    <?php if (can_reserve('rooms')): ?><a href="/iletisim/#rezervasyon" class="text-link" data-ya-action="accommodation.reserve" data-ya-resource-type="room" data-ya-resource-id="<?= esc($room['id'] ?? '') ?>" data-ya-resource-name="<?= esc($room['name'] ?? '') ?>">Konaklamayı planlayın <?= icon('arrow') ?></a><?php else: ?><a class="text-link" href="/iletisim/">Bilgi alın <?= icon('arrow') ?></a><?php endif; ?></div></article>
<?php endforeach; ?></div><?php endif; ?></div>
</section><?php
}
function gallery_section(bool $full = false): void {
    $published = published_gallery(); $photos = $published ?: scenic_gallery(); ?>
<section class="section shell" id="fotograflar"><div class="section-heading"><div><p class="eyebrow">FOTOĞRAF DEFTERİ</p><h2><?= $published ? 'Gündoğdu’dan kareler.' : 'Bazı manzaralar,<br><em>insana iyi gelir.</em>' ?></h2></div><div class="section-aside"><p><?= $published ? 'İşletmemizin yayınladığı fotoğraflar.' : 'Gideros’un yeşiline ve mavisine bir pencere.' ?></p><?php if (!$full): ?><a class="text-link" href="/galeri/">Galeriye göz atın <?= icon('arrow') ?></a><?php endif; ?></div></div>
<?php if ($full): ?><div class="gallery-tabs" role="group" aria-label="Fotoğraf seçimi"><button class="chip is-active" type="button" data-gallery-filter="all" aria-pressed="true">Tümü</button><button class="chip" type="button" data-gallery-filter="scenic" aria-pressed="false">Gideros Koyu</button><button class="chip" type="button" data-gallery-filter="business" aria-pressed="false" hidden>İşletmeden</button></div><?php $photos = array_merge($published, scenic_gallery()); endif; ?>
<div class="gallery-grid" data-public-gallery data-full="<?= $full ? 'true' : 'false' ?>"><?php foreach (array_slice($photos, 0, $full ? 82 : 4) as $i=>$photo): ?><figure class="gallery-item" data-gallery-kind="<?= $photo['published'] ? 'business' : 'scenic' ?>"><button type="button" data-lightbox="<?= esc($photo['url']) ?>" data-caption="<?= esc($photo['title']) ?><?= $photo['published'] ? '' : ' · Bölge fotoğrafı, Makalp · CC BY-SA 3.0' ?>" aria-label="<?= esc($photo['title']) ?> fotoğrafını büyüt"><img src="<?= esc($photo['url']) ?>" alt="<?= esc($photo['title']) ?>" width="900" height="650" loading="lazy"><span class="gallery-expand"><?= icon('plus') ?></span></button><figcaption><span><?= esc($photo['title']) ?></span><small><?= $photo['published'] ? 'İŞLETMEDEN' : 'GİDEROS KOYU' ?></small></figcaption></figure><?php endforeach; ?></div>
<?php if (!$published): ?><p class="gallery-note">Bu kareler Gideros Koyu’na aittir; pansiyonun oda veya restoran fotoğrafları değildir. İşletme fotoğrafları yayınlandığında burada yer alacaktır.</p><?php endif; ?>
</section><?php
}
function contact_section(bool $full = false): void { $c = contact(); ?>
<section class="section shell contact-section" id="konum"><div><p class="eyebrow">YOLUMUZ GİDEROS’A DÜŞSÜN</p><h2>Bir merhaba<br><em>ile başlasın.</em></h2><p class="contact-intro">Konaklama ve restoran ziyaretinizi planlamak için yayınlanan iletişim kanallarımızdan bize ulaşabilirsiniz.</p>
<div class="contact-list" data-public-contact>
<?php if ($c['tel']): ?><a href="<?= esc($c['tel']) ?>"><?= icon('phone') ?><span><small>TELEFON</small><strong><?= esc($c['phone']) ?></strong></span><?= icon('arrow') ?></a><?php endif; ?>
<?php if ($c['email']): ?><a href="mailto:<?= esc($c['email']) ?>"><?= icon('mail') ?><span><small>E-POSTA</small><strong><?= esc($c['email']) ?></strong></span><?= icon('arrow') ?></a><?php endif; ?>
<?php if ($c['whatsapp']): ?><a href="<?= esc($c['whatsapp']) ?>" target="_blank" rel="noopener"><?= icon('phone') ?><span><small>WHATSAPP</small><strong>Mesaj gönderin</strong></span><?= icon('arrow') ?></a><?php endif; ?>
<?php if ($c['address']): ?><div><?= icon('pin') ?><span><small>ADRES</small><strong><?= esc($c['address']) ?></strong></span></div><?php endif; ?>
<?php if (!$c['tel'] && !$c['email'] && !$c['whatsapp'] && !$c['address']): ?><div class="contact-empty"><?= icon('mail') ?><span><strong>İletişim bilgileri şu anda görüntülenemiyor.</strong><small>Güncel bilgiler için daha sonra tekrar ziyaret edebilirsiniz.</small></span></div><?php endif; ?>
</div><div data-public-contact-extra><?php if ($c['note']): ?><p class="fine-print"><?= nl2br(esc($c['note'])) ?></p><?php endif; ?>
<?php if ($c['map']): ?><a class="text-link" href="<?= esc($c['map']) ?>" target="_blank" rel="noopener">Yol tarifi alın <?= icon('arrow') ?></a><?php endif; ?>
<div class="social-links"><?php foreach (records(business()['social_links'] ?? []) as $social): $url=safe_link($social['url'] ?? ''); if (!$url) continue; ?><a href="<?= esc($url) ?>" target="_blank" rel="noopener"><?= esc(txt($social['platform'] ?? '') ?: 'Sosyal medya') ?> ↗</a><?php endforeach; ?></div></div>
</div><div class="map-card"><?php if ($c['embed']): ?><iframe title="İşletmenin yayınlanmış harita konumu" src="<?= esc($c['embed']) ?>" loading="lazy" referrerpolicy="no-referrer" allowfullscreen></iframe><?php if ($c['attribution']): ?><a class="map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap katkıda bulunanlar</a><?php endif; ?><?php else: ?>
<div class="map-illustration" aria-hidden="true"><svg viewBox="0 0 500 420" fill="none"><path d="M-20 180C90 120 105 210 170 180S270 50 360 90s70 100 160 60M-20 200c110-60 125 30 190 0S270 70 360 110s70 100 160 60M-20 220c110-60 125 30 190 0S270 90 360 130s70 100 160 60M-20 240c110-60 125 30 190 0S270 110 360 150s70 100 160 60M-20 260c110-60 125 30 190 0S270 130 360 170s70 100 160 60M-20 280c110-60 125 30 190 0S270 150 360 190s70 100 160 60M-20 300c110-60 125 30 190 0S270 170 360 210s70 100 160 60" stroke="currentColor" stroke-width="1"/></svg><img src="/assets/brand/mark.svg" alt="" width="74" height="68"></div><div class="map-empty"><p class="eyebrow">GİDEROS’UN KIYISINDA</p><h3>Yolunuz açık olsun.</h3><p>Güncel işletme konumu şu anda görüntülenemiyor.</p><small>Çizim temsilidir; işletme konumunu göstermez.</small></div>
<?php endif; ?></div></section><?php
}
function reservation_section(): void { ?>
<section class="reservation-band" id="rezervasyon"><div class="shell"><img src="/assets/brand/mark-light.svg" width="70" height="64" alt=""><div><p class="eyebrow">KENDİNİZE BİR MOLA AYIRIN</p><h2>Bir sonraki güzel anınız, <em>Gideros’ta.</em></h2><p data-reservation-copy><?= can_reserve('rooms') || can_reserve('tables') ? 'Tarihlerinizi seçin, ziyaret talebinizi birlikte planlayalım.' : 'Ziyaretinizi planlamak için güncel seçenekleri keşfedin.' ?></p></div><?php booking_link('Ziyaretinizi planlayın', '', 'button button-sand'); ?></div></section>
<?php }
function page_bottom(): void {
    $b=business(); $c=contact();
    $widget = ['businessName'=>brand_name(),'logoUrl'=>'/assets/brand/mark.svg','apiBaseUrl'=>'/yardimci-asistan',
        'primaryColor'=>'#244C45','accentColor'=>'#C29562','profileId'=>'','publicSurfaces'=>[],
        'aiEnabled'=>($b['ai_enabled'] ?? false) === true,'requestsEnabled'=>($b['requests_enabled'] ?? false) === true,
        'whatsappEnabled'=>$c['whatsapp'] !== '', 'whatsappPhone'=>$c['whatsapp'] ? txt($b['whatsapp'] ?? '') : '',
        'address'=>$c['address'],'mapUrl'=>$c['map']];
    if (can_reserve('rooms')) $widget['publicSurfaces'][]='accommodation';
    if (can_reserve('tables')) $widget['publicSurfaces'][]='food_service';
    if ($c['map']) $widget['publicSurfaces'][]='directions';
    ?></main><footer class="site-footer"><div class="shell footer-main"><a class="brand" href="/"><img src="/assets/brand/mark.svg" width="57" height="52" alt=""><span class="brand-copy"><strong>Gündoğdu</strong><small>PANSİYON &amp; RESTORAN</small></span></a><p>Denizin sesi, ormanın nefesi.<br>Gideros’ta küçük bir mola.</p><nav aria-label="Alt gezinme"><?php nav_links(''); ?></nav></div><div class="shell footer-bottom"><small>© <?= date('Y') ?> <?= esc(brand_name()) ?></small><a href="/galeri/#kaynaklar">Fotoğraf kaynakları &amp; kullanım</a><span>Gideros · Cide</span></div></footer>
<dialog class="lightbox" aria-label="Fotoğraf görüntüleyici"><button class="lightbox-close" type="button" aria-label="Fotoğrafı kapat"><?= icon('close') ?></button><figure><img alt=""><figcaption></figcaption></figure><div class="lightbox-nav"><button type="button" data-photo-prev aria-label="Önceki fotoğraf">←</button><span data-photo-count></span><button type="button" data-photo-next aria-label="Sonraki fotoğraf">→</button></div></dialog>
<template id="public-icons"><?php foreach (['bed','plate','arrow','plus','phone','mail','pin'] as $name): ?><span data-icon="<?= esc($name) ?>"><?= icon($name) ?></span><?php endforeach; ?></template>
<script type="application/json" id="widget-config"><?= json_html($widget) ?></script>
<script src="<?= esc(asset('assistant/widget.js')) ?>" data-api-base-url="/yardimci-asistan" data-logo-url="/assets/brand/mark.svg" data-ai-enabled="false" data-whatsapp-enabled="false" defer></script>
<script src="<?= esc(asset('js/public-data.js')) ?>" defer></script>
<script src="<?= esc(asset('js/site.js')) ?>" defer></script><script type="module" src="<?= esc(asset('js/water.mjs')) ?>"></script>
</body></html><?php
}
