<?php
declare(strict_types=1);
require dirname(__DIR__) . '/inc/site.php';
page_top('galeri', 'Fotoğraf Defteri', 'Gideros Koyu’ndan gerçek manzaralar ve işletmemizin yayınladığı fotoğraflar. Fotoğraf kaynakları ve kullanım bilgileri.');
?>
<section class="gallery-intro shell"><p class="eyebrow">GÜNDOĞDU FOTOĞRAF DEFTERİ</p><h1>Biraz yeşil.<br>Biraz mavi. <em>Biraz huzur.</em></h1><p class="lede">Gideros’a küçük bir pencere açın.</p></section>
<?php gallery_section(true); ?>
<section class="section shell photo-sources" id="kaynaklar"><p class="eyebrow">FOTOĞRAFLARIN HİKÂYESİ</p><h2>Manzara gerçek.<br><em>Kaynağı da burada.</em></h2><p>Bu sitedeki iki bölge fotoğrafı Gideros Koyu’nda 30 Haziran 2007’de Makalp tarafından çekilmiştir. İşletmeye ait güncel bir görünüm veya oda ve restoran görseli olarak sunulmaz.</p><div class="source-grid"><?php foreach (scenic_gallery() as $i=>$photo): ?><article><h3>Gideros Bay<?= $i+1 ?></h3><p>Fotoğraf: Makalp · Wikimedia Commons</p><a href="<?= esc($photo['source']) ?>" target="_blank" rel="noopener">Orijinal fotoğraf ve kaynak ↗</a><p><a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="license noopener">CC BY-SA 3.0</a> lisansı ile kullanılır. WebP boyutlandırmaları, ekran kırpmaları ve ilk fotoğraftan sosyal paylaşım kırpması hazırlanmıştır. Bu fotoğraf türevleri aynı lisansla sunulur; renk veya içerik değiştirilmemiştir.</p></article><?php endforeach; ?></div><p>İşletme tarafından yayınlanan görseller ayrıca “İşletmeden” olarak işaretlenir. Bölge fotoğrafları için yapılan atıf, fotoğrafçının işletmeyi onayladığı anlamına gelmez.</p></section>
<?php reservation_section(); page_bottom(); ?>
