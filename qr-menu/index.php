<?php
require dirname(__DIR__) . '/inc/site.php';
page_top('qr-menu', 'QR Menü', 'Yayınlanan menü, ürünler ve fiyatlar.');
?>
<section class="shell section" data-qr-menu-root><p class="eyebrow">GÜNDOĞDU RESTORAN</p><h1>QR Menü</h1><p data-qr-menu-status role="status">Menü hazırlanıyor.</p><div class="gallery-tabs" data-qr-menu-tabs aria-label="Menü kategorileri"></div><div data-qr-menu-list></div><p class="fine-print" data-qr-menu-updated></p></section>
<script src="/assets/js/qr-menu.js" defer></script>
<?php page_bottom(); ?>
