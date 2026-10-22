<?php
declare(strict_types=1);
require dirname(__DIR__) . '/inc/site.php';
page_top('restoran', 'Restoran & Sofrada Buluşma', 'Gideros’ta sofrada buluşalım. Yayınlanan restoran menüsünü ve masa seçeneklerini keşfedin, ziyaretinizi planlayın.');
subhero('GÜNDOĞDU RESTORAN', 'Sohbet uzasın.<br><em>Zaman yavaşlasın.</em>', 'Güzel bir manzara, birlikte geçirilen zaman. Restoran ziyaretinizi Gideros’un ritminde planlayın.');
$items=menu_items();
?>
<section class="section shell" id="menu"><div class="section-heading"><div><p class="eyebrow">SOFRAMIZDAN</p><h2>Bugün, <em>menümüzde.</em></h2></div><div class="section-aside"><p>Güncel lezzetler ve fiyatlar,<br>doğrudan işletmemizin yayınladığı menüden.</p></div></div>
<div data-public-menu><?php if (!$items): ?><div class="unpublished menu-placeholder"><?= icon('plate') ?><div><h3>Güncel menümüz</h3><p>Güncel yemek seçenekleri ve fiyatlar şu anda görüntülenemiyor. Restoran ziyaretinizle ilgili bilgi almak için iletişim seçeneklerini inceleyebilirsiniz.</p><a class="text-link" href="/iletisim/">İletişim seçenekleri <?= icon('arrow') ?></a></div></div>
<?php else:
foreach (records(public_snapshot()['menu']['categories'] ?? []) as $category):
    $categoryItems = array_filter($items, static fn(array $item): bool => ($item['category_id'] ?? null) === ($category['id'] ?? null)); if (!$categoryItems) continue; ?>
<div class="menu-category"><h3><?= esc($category['name'] ?? '') ?></h3><?php if (txt($category['description'] ?? '')): ?><p><?= esc($category['description']) ?></p><?php endif; ?><div class="menu-grid">
<?php foreach ($categoryItems as $item): $image=media_url($item['image_url'] ?? ''); $price=money($item['price'] ?? null, $item['currency'] ?? ''); ?>
<article class="menu-item"><?php if ($image): ?><img src="<?= esc($image) ?>" alt="<?= esc($item['name'] ?? '') ?>" width="100" height="100" loading="lazy"><?php endif; ?><div><h4><?= esc($item['name'] ?? '') ?></h4><p><?= esc($item['description'] ?? '') ?></p></div><?php if ($price): ?><strong class="menu-price"><?= esc($price) ?></strong><?php endif; ?></article>
<?php endforeach; ?></div></div><?php endforeach; endif; ?></div></section>
<section class="section shell table-section"><div class="section-heading"><div><p class="eyebrow">BİRLİKTE GEÇEN ZAMAN</p><h2>Sofrada <em>yer açalım.</em></h2></div><div class="section-aside"><?php booking_link('Masa seçenekleri', 'tables', 'button button-outline'); ?></div></div>
<div data-public-tables><?php $tables = catalog('tables'); if (!$tables): ?><p class="table-empty">Güncel masa seçenekleri şu anda görüntülenemiyor. Ziyaret planınız için güncel iletişim kanallarımızı kullanabilirsiniz.</p><?php else: ?><div class="table-grid"><?php foreach ($tables as $table): ?><article class="table-card"><?= icon('plate') ?><h3><?= esc($table['name'] ?? '') ?></h3><p><?= esc($table['description'] ?? '') ?></p><p class="room-meta"><?= esc($table['area'] ?? '') ?><?= is_numeric($table['capacity'] ?? null) && (int) $table['capacity'] > 0 ? ' · ' . esc($table['capacity']) . ' kişi' : '' ?></p><?php if (can_reserve('tables')): ?><a class="text-link" href="/iletisim/#rezervasyon" data-ya-action="food.reserve" data-ya-resource-type="table" data-ya-resource-id="<?= esc($table['id'] ?? '') ?>" data-ya-resource-name="<?= esc($table['name'] ?? '') ?>">Masa talebi iletin <?= icon('arrow') ?></a><?php endif; ?></article><?php endforeach; ?></div><?php endif; ?></div></section>
<?php reservation_section(); page_bottom(); ?>
