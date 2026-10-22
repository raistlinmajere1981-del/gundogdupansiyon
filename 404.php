<?php
declare(strict_types=1);
require __DIR__ . '/inc/site.php';
http_response_code(404);
page_top('404', 'Sayfa bulunamadı', 'Aradığınız sayfa bulunamadı. Gündoğdu ana sayfasına dönün.');
?><section class="section shell error-page"><p class="eyebrow">404 · KÜÇÜK BİR SAPAK</p><h1>Yol yeniden <em>koya çıksın.</em></h1><p>Aradığınız sayfayı bulamadık.</p><a class="button" href="/">Ana sayfaya dönün <?= icon('arrow') ?></a></section><?php page_bottom(); ?>
