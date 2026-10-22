<?php
require dirname(__DIR__, 2) . '/inc/site.php';
page_top('restoran/masa', 'Masa detayları', 'Masa detayları ve masa bilgileri.');
?><section class="shell detail-heading table-detail-heading"><a class="text-link" href="/restoran/">← <?= esc(site_text('Restoran')) ?></a><h1><?= esc(site_text('Masa detayları')) ?></h1></section>
<section class="room-detail-overview" data-table-detail>
  <div class="shell">
    <div class="room-detail-loading" data-table-detail-loading><?= esc(site_text('Masa bilgileri hazırlanıyor…')) ?></div>

    <div data-table-detail-content hidden>
      <div class="breadcrumb"><a href="/restoran/"><?= esc(site_text('Restoran')) ?></a><span>›</span><span data-table-name><?= esc(site_text('Masa')) ?></span></div>
      <div class="room-detail-grid">
        <div class="room-detail-media">
          <img data-table-cover alt="" hidden>
          <div class="room-detail-media-placeholder" data-table-cover-placeholder>
            <strong><?= esc(site_text('Masa fotoğrafı hazırlanıyor')) ?></strong>
            <span><?= esc(site_text('Bu masanın fotoğrafları henüz hazır değil.')) ?></span>
          </div>
        </div>

        <div class="room-detail-copy">
          <p class="eyebrow"><?= esc(site_text('Masa özellikleri')) ?></p>
          <h2 data-table-name></h2>
          <p class="lead" data-table-description></p>

          <div class="room-stats" aria-label="<?= esc(site_text('Temel masa bilgileri')) ?>">
            <div data-table-capacity-item><span data-table-icon="users" aria-hidden="true"></span><strong data-table-capacity></strong></div>
            <div data-table-area-item><span data-table-icon="area" aria-hidden="true"></span><strong data-table-area></strong></div>
          </div>

          <p class="room-detail-floor table-smoking" data-table-smoking-container><span data-table-icon="smoking" aria-hidden="true"></span><span data-table-smoking></span></p>

          <div class="room-amenities">
            <p class="room-amenities-title"><?= esc(site_text('Masa olanakları')) ?></p>
            <div class="amenity-grid amenity-grid-room" data-table-feature-list>
              <div class="room-catalog-loading"><?= esc(site_text('Masa özellikleri hazırlanıyor…')) ?></div>
            </div>
          </div>

          <button
            type="button"
            class="button button-primary"
            data-table-reserve
            data-ya-resource-type="table"
            data-ya-action="food.reserve" hidden
          ><?= esc(site_text('Rezervasyon / Bilgi Al')) ?></button>
          <a class="text-link" href="/iletisim/" data-table-contact><?= esc(site_text('İletişim seçenekleri')) ?></a>
        </div>
      </div>
    </div>
  </div>
  <div class="shell"><a class="text-link" href="/iletisim/" data-table-contact-fallback><?= esc(site_text('İletişim seçenekleri')) ?></a></div>
</section>

<section class="section media-experiences" data-table-media-section hidden>
  <div class="shell">
    <div class="section-heading">
      <p class="eyebrow"><?= esc(site_text('Masayı keşfet')) ?></p>
      <h2><?= esc(site_text('Fotoğraf, video ve panoramik görünüm')) ?></h2>
      <p><?= esc(site_text('Masanıza yakından bakın: fotoğraflar, panoramalar ve kısa bir masa turu.')) ?></p>
    </div>

    <div class="experience-grid">
      <button
        class="experience-card"
        type="button"
        data-table-media-card="panorama_360"
        data-open-panorama
        hidden
      >
        <span class="experience-media">
          <img data-table-media-preview alt="">
          <span class="media-kind">360°</span>
        </span>
        <strong><?= esc(site_text('360° masa deneyimi')) ?></strong>
        <small><?= esc(site_text('Masanın içinde serbest bakış')) ?></small>
      </button>

      <button
        class="experience-card"
        type="button"
        data-table-media-card="panorama_180"
        data-open-panorama
        hidden
      >
        <span class="experience-media">
          <img data-table-media-preview alt="">
          <span class="media-kind">180°</span>
        </span>
        <strong><?= esc(site_text('180° panoramik görünüm')) ?></strong>
        <small><?= esc(site_text('Geniş açılı görünümü inceleyin')) ?></small>
      </button>

      <button
        class="experience-card"
        type="button"
        data-table-media-card="video"
        data-open-video
        hidden
      >
        <span class="experience-media">
          <img data-table-media-preview alt="">
          <span class="media-kind media-kind-play">▶</span>
        </span>
        <strong><?= esc(site_text('Masa videosu')) ?></strong>
        <small><?= esc(site_text('Kısa masa turu')) ?></small>
      </button>
    </div>

    <div class="normal-gallery" data-table-photo-gallery hidden></div>
  </div>
</section>

<dialog class="media-dialog" data-panorama-dialog>
  <button type="button" class="dialog-close" data-dialog-close aria-label="<?= esc(site_text('Kapat')) ?>">×</button>
  <div class="dialog-copy">
    <strong data-panorama-title><?= esc(site_text('Panoramik görünüm')) ?></strong>
    <span><?= esc(site_text('Fareyle sürükleyin; telefonda parmağınızla çevirebilirsiniz.')) ?></span>
  </div>
  <div id="panorama-viewer" class="panorama-viewer"></div>
</dialog>

<dialog class="media-dialog video-dialog" data-video-dialog>
  <button type="button" class="dialog-close" data-dialog-close aria-label="<?= esc(site_text('Kapat')) ?>">×</button>
  <div class="dialog-copy">
    <strong data-room-video-title><?= esc(site_text('Masa videosu')) ?></strong>
  </div>
  <video data-room-video controls preload="metadata" playsinline>
    <source data-room-video-source type="video/mp4">
  </video>
</dialog>

<dialog class="media-dialog gallery-dialog" data-gallery-dialog>
  <button type="button" class="dialog-close" data-dialog-close aria-label="<?= esc(site_text('Kapat')) ?>">×</button>
  <img data-gallery-image alt="">
</dialog>

<link rel="stylesheet" href="/assets/vendor/pannellum/pannellum.css">
<script src="/assets/vendor/pannellum/pannellum.js" defer></script>
<script src="/assets/js/tables.js" defer></script>
<script src="/assets/js/room-media.js" defer></script>
<?php page_bottom(); ?>
