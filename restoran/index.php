<?php
declare(strict_types=1);
require dirname(__DIR__) . '/inc/site.php';
page_top('restoran', 'Restoran & Sofrada Buluşma', 'Gideros’ta sofrada buluşalım. Yayınlanan restoran menüsünü ve masa seçeneklerini keşfedin, ziyaretinizi planlayın.');
subhero('GÜNDOĞDU RESTORAN', 'Sohbet uzasın.<br><em>Zaman yavaşlasın.</em>', 'Güzel bir manzara, birlikte geçirilen zaman. Restoran ziyaretinizi Gideros’un ritminde planlayın.');
$items=menu_items();
?>
<section class="section shell" id="menu"><div class="section-heading"><div><p class="eyebrow">SOFRAMIZDAN</p><h2>Bugün, <em>menümüzde.</em></h2></div><div class="section-aside"><p>Güncel lezzetler ve fiyatlar,<br>doğrudan işletmemizin yayınladığı menüden.</p></div></div>
<a class="text-link" href="/qr-menu/" data-menu-link hidden>QR Menü →</a><div data-public-menu><?php if (!$items): ?><div class="unpublished menu-placeholder"><?= icon('plate') ?><div><h3>Güncel menümüz</h3><p>Güncel yemek seçenekleri ve fiyatlar şu anda görüntülenemiyor. Restoran ziyaretinizle ilgili bilgi almak için iletişim seçeneklerini inceleyebilirsiniz.</p><a class="text-link" href="/iletisim/">İletişim seçenekleri <?= icon('arrow') ?></a></div></div>
<?php endif; ?></div></section>
<section class="section shell table-section"><div class="section-heading"><div><p class="eyebrow">BİRLİKTE GEÇEN ZAMAN</p><h2>Sofrada <em>yer açalım.</em></h2></div><div class="section-aside"><a class="text-link" href="/iletisim/">İletişim seçenekleri →</a></div></div>
<div data-public-tables><?php $tables = catalog('tables'); if (!$tables): ?><p class="table-empty">Güncel masa seçenekleri şu anda görüntülenemiyor. Ziyaret planınız için güncel iletişim kanallarımızı kullanabilirsiniz.</p><?php endif; ?></div></section>
<?php reservation_section(); page_bottom(); ?>
