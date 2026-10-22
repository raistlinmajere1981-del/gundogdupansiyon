<?php
declare(strict_types=1);
require dirname(__DIR__) . '/inc/site.php';
page_top('galeri', 'Fotoğraf Defteri', 'Gideros Koyu’ndan ilham alan Gündoğdu fotoğraf galerisi.');
?>
<section class="gallery-intro shell"><p class="eyebrow">GÜNDOĞDU FOTOĞRAF DEFTERİ</p><h1>Biraz yeşil.<br>Biraz mavi. <em>Biraz huzur.</em></h1><p class="lede">Gideros’a küçük bir pencere açın.</p></section>
<?php gallery_section(true); ?>
<?php reservation_section(); page_bottom(); ?>
