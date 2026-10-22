<?php
declare(strict_types=1);
require dirname(__DIR__) . '/inc/site.php';
page_top('iletisim', 'İletişim & Ziyaret Planı', 'Gündoğdu Pansiyon & Restoran’ın yayınlanan iletişim ve konum bilgileri. Konaklama ve restoran ziyaretinizi planlayın.');
?>
<section class="contact-page-intro shell"><p class="eyebrow">GÜNDOĞDU İLE TANIŞIN</p><h1>Güzel bir mola,<br><em>bir merhaba uzağınızda.</em></h1><p class="lede">Konaklama, sofrada buluşma ya da küçük bir soru.<br>Yayınlanan iletişim seçeneklerimizle yanınızdayız.</p></section>
<?php contact_section(true); ?>
<section class="shell planning-note" id="ziyaret"><?= icon('calendar') ?><div><h3>Ziyaretinizi birlikte planlayalım.</h3><p data-visit-copy><?= can_reserve('rooms') || can_reserve('tables') ? 'Asistandan tarih ve kişi bilgilerini iletebilirsiniz. Talebiniz, işletme onayı ile kesinleşir.' : 'Online oda ve masa talebi şu anda açık değil. Yayınlanan iletişim kanalları üzerinden bilgi alabilirsiniz.' ?></p></div><?php booking_link('Güncel seçenekler', '', 'button button-outline'); ?></section>
<?php reservation_section(); page_bottom(); ?>
