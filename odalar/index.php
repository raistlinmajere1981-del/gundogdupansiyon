<?php
declare(strict_types=1);
require dirname(__DIR__) . '/inc/site.php';
page_top('odalar', 'Odalar & Konaklama', 'Gideros’ta konaklamayı planlayın. Yayınlanan oda seçeneklerini ve güncel konaklama bilgilerini inceleyin.');
subhero('GİDEROS’TA KONAKLAMA', 'Gününüz <em>yavaş başlasın.</em>', 'Gideros’ta bir sabaha uyanma fikriyle başlayın. Konaklamanıza dair yayınlanan tüm ayrıntılar burada.', 1);
rooms_section(true);
?>
<section class="shell section stay-notes" data-public-policies hidden><p class="eyebrow">KONAKLAMANIZDAN ÖNCE</p><h2>Bilmenizde fayda var.</h2><div></div></section>
<section class="shell planning-note"><?= icon('calendar') ?><div><h3>Önce bir tarih hayal edin.</h3><p>Yayınlanan fiyatlar bilgilendirme amaçlıdır. Rezervasyon talebi, işletme tarafından onaylandıktan sonra kesinleşir.</p></div><?php booking_link('Ziyaretinizi planlayın', 'rooms', 'button button-outline'); ?></section>
<?php reservation_section(); page_bottom(); ?>
