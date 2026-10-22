<?php
declare(strict_types=1);
require dirname(__DIR__) . '/inc/site.php';
page_top('odalar', 'Odalar & Konaklama', 'Gideros’ta konaklamayı planlayın. Yayınlanan oda seçeneklerini ve güncel konaklama bilgilerini inceleyin.');
subhero('GİDEROS’TA KONAKLAMA', 'Gününüz <em>yavaş başlasın.</em>', 'Gideros’ta bir sabaha uyanma fikriyle başlayın. Konaklamanıza dair yayınlanan tüm ayrıntılar burada.', 1);
rooms_section(true);
$b=business();
if (txt($b['policy_note'] ?? '') || txt($b['payment_note'] ?? '')): ?>
<section class="shell section stay-notes"><p class="eyebrow">KONAKLAMANIZDAN ÖNCE</p><h2>Bilmenizde fayda var.</h2><?php if (txt($b['policy_note'] ?? '')): ?><h3>Konaklama koşulları</h3><p><?= nl2br(esc($b['policy_note'])) ?></p><?php endif; ?><?php if (txt($b['payment_note'] ?? '')): ?><h3>Ödeme bilgileri</h3><p><?= nl2br(esc($b['payment_note'])) ?></p><?php endif; ?></section>
<?php endif; ?>
<section class="shell planning-note"><?= icon('calendar') ?><div><h3>Önce bir tarih hayal edin.</h3><p>Yayınlanan fiyatlar bilgilendirme amaçlıdır. Rezervasyon talebi, işletme tarafından onaylandıktan sonra kesinleşir.</p></div><?php booking_link('Ziyaretinizi planlayın', 'rooms', 'button button-outline'); ?></section>
<?php reservation_section(); page_bottom(); ?>
