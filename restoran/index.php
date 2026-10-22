<?php
declare(strict_types=1);
require dirname(__DIR__) . '/inc/site.php';
page_top('restoran', 'Restoran & Sofrada Buluşma', 'Gideros’ta sofrada buluşalım. Yayınlanan restoran menüsünü ve masa seçeneklerini keşfedin, ziyaretinizi planlayın.');
subhero('GÜNDOĞDU RESTORAN', 'Sohbet uzasın.<br><em>Zaman yavaşlasın.</em>', 'Güzel bir manzara, birlikte geçirilen zaman. Restoran ziyaretinizi Gideros’un ritminde planlayın.');
$items=menu_items();
?>
<section class="section shell table-section"><div class="section-heading"><div><p class="eyebrow">BİRLİKTE GEÇEN ZAMAN</p><h2>Sofrada <em>yer açalım.</em></h2></div><div class="section-aside"><a class="text-link" href="/iletisim/">İletişim seçenekleri →</a></div></div>
<div data-public-tables><?php $tables = catalog('tables'); if (!$tables): ?><p class="table-empty">Güncel masa seçenekleri şu anda görüntülenemiyor. Ziyaret planınız için güncel iletişim kanallarımızı kullanabilirsiniz.</p><?php endif; ?></div></section>
<?php reservation_section(); page_bottom(); ?>
