<?php // gundogdu-site
declare(strict_types=1);
require __DIR__ . '/inc/site.php';
page_top('home', 'Gideros’ta hayat yavaşlar', 'Gideros Koyu’nun doğal güzelliğinde küçük bir mola. Gündoğdu Pansiyon & Restoran’da konaklama ve restoran ziyaretinizi planlayın.');
?>
<section class="hero" aria-labelledby="hero-title">
<div class="hero-landscape"><?php photo(1, 'hero-photo', true); ?></div><div class="hero-shade"></div>
<div class="hero-content shell"><p class="eyebrow"><span></span> GİDEROS KOYU · CİDE</p><h1 id="hero-title">Gideros’ta,<br>hayat <em>yavaşlar.</em></h1><p>Denizin sesi, ormanın nefesi.<br>Karadeniz’in saklı bir köşesinde, kendinize bir mola.</p><div class="hero-actions"><a class="button button-paper" href="/odalar/">Konaklamayı keşfedin <?= icon('arrow') ?></a><a class="hero-text-link" href="#hikayemiz">Gündoğdu’ya hoş geldiniz <span>↓</span></a></div></div>
<div class="hero-bottom shell"><span class="hero-location"><?= icon('pin') ?> Mavinin yeşile sığındığı yer.</span><?php photo_credit(); ?></div>
<button class="motion-toggle" type="button" aria-pressed="false" hidden>Dalga hareketini durdur</button>
</section>
<div class="slow-strip"><div class="shell"><span><?= icon('wave') ?> Denizin ritminde</span><span><?= icon('leaf') ?> Doğanın içinde</span><span><?= icon('sun') ?> Kendinize ayırdığınız zamanda</span></div></div>
<section class="section shell intro-section" id="hikayemiz"><div><p class="eyebrow">GÜNDOĞDU’YA HOŞ GELDİNİZ</p><h2>Bazen en güzel plan,<br><em>biraz yavaşlamaktır.</em></h2></div><div class="intro-copy"><span class="section-number" aria-hidden="true">01 / BİR KIYI MOLASI</span><p class="lede"><?= nl2br(esc(txt(business()['about_text'] ?? '') ?: 'Bir yanı orman, bir yanı deniz. Gideros Koyu’nun doğal güzelliğinde, gündelik telaşa küçük bir ara vermeye davetlisiniz.')) ?></p><p>Gündoğdu Pansiyon &amp; Restoran ile Gideros’ta konaklamayı ve sofrada buluşmayı planlayın. Güncel seçeneklerimizi yayınlandıkça burada keşfedin.</p><a class="text-link" href="/iletisim/">Tanışalım <?= icon('arrow') ?></a></div></section>
<?php
$campaigns = records(public_snapshot()['marketing']['publications'] ?? []);
if ($campaigns): ?>
<section class="section shell news-section"><p class="eyebrow">GÜNDOĞDU’DAN HABERLER</p><div class="news-grid"><?php foreach (array_slice($campaigns, 0, 6) as $news): if (($news['published'] ?? false) !== true || ($news['placement'] ?? '') !== 'homepage_feature') continue; ?><article><?php $image = records($news['images'] ?? [])[0] ?? []; $url=media_url($image['url'] ?? ''); if ($url): ?><img src="<?= esc($url) ?>" alt="<?= esc($image['altText'] ?? '') ?>" loading="lazy" width="700" height="420"><?php endif; ?><h3><?= esc($news['title'] ?? '') ?></h3><p><?= nl2br(esc($news['text'] ?? '')) ?></p></article><?php endforeach; ?></div></section>
<?php endif;
rooms_section();
?>
<section class="restaurant-story"><div class="restaurant-visual"><?php photo(2); ?><span class="image-note">Gideros Koyu · Bölge fotoğrafı</span></div><div class="restaurant-copy"><p class="eyebrow">SOFRADA BULUŞALIM</p><h2>Manzaraya bir sandalye,<br><em>gününüze bir mola.</em></h2><p>Gideros’un mavisine bakarken sohbet biraz uzasın. Gündoğdu’da restoran ziyaretinizi planlayın, güncel menü ve masa seçeneklerimizi keşfedin.</p><a class="text-link" href="/restoran/">Restoranı keşfedin <?= icon('arrow') ?></a><div class="story-footnote"><?= icon('plate') ?><span>Güncel menü ve hizmet ayrıntıları,<br>işletme yayınlarıyla paylaşılır.</span></div></div></section>
<section class="nature-section" id="gideros"><div class="shell nature-inner"><div class="nature-copy"><p class="eyebrow">BİR YERDEN DAHA FAZLASI</p><h2>Yeşilin bittiği yerde,<br><em>mavi başlar.</em></h2><p>Cide’nin ormanlarla çevrili doğal koyu Gideros. Kıyıdaki ağaçlar, suya düşen ışık ve açık denize uzanan dar bir geçit… Burada manzaranın kendisi başlı başına bir davet.</p><a class="text-link light-link" href="/galeri/">Koyu keşfedin <?= icon('arrow') ?></a><a class="nature-source" href="https://cide.bel.tr/foto/gideros" target="_blank" rel="noopener">Gideros hakkında · Cide Belediyesi ↗</a></div><figure class="nature-figure"><?php photo(1); ?><figcaption><span>GİDEROS KOYU</span><span>Cide, Kastamonu</span></figcaption></figure></div></section>
<?php gallery_section(); contact_section(); reservation_section(); page_bottom(); ?>
