<?php
require dirname(__DIR__, 2) . '/inc/site.php';
page_top('odalar/oda', 'Oda detayları', 'Oda detayları ve konaklama bilgileri.');
?><section class="shell detail-heading"><a class="text-link" href="/odalar/">← <?= esc(site_text('Odalar')) ?></a><h1><?= esc(site_text('Oda detayları')) ?></h1></section>
<section class="room-detail-overview" data-room-detail>
  <div class="shell">
    <div class="room-detail-loading" data-room-detail-loading><?= esc(site_text('Oda bilgileri hazırlanıyor…')) ?></div>

    <div data-room-detail-content hidden>
      <div class="breadcrumb"><a href="/odalar/"><?= esc(site_text('Odalar')) ?></a><span>›</span><span data-room-name><?= esc(site_text('Oda')) ?></span></div>
      <div class="room-detail-grid">
        <div class="room-detail-media">
          <img data-room-cover alt="" hidden>
          <div class="room-detail-media-placeholder" data-room-cover-placeholder>
            <strong><?= esc(site_text('Oda fotoğrafı hazırlanıyor')) ?></strong>
            <span><?= esc(site_text('Bu odanın fotoğrafları henüz hazır değil.')) ?></span>
          </div>
        </div>

        <div class="room-detail-copy">
          <p class="eyebrow"><?= esc(site_text('Oda özellikleri')) ?></p>
          <h2><?= esc(site_text('Konaklama detayları')) ?></h2>
          <p class="lead" data-room-description></p>

          <div class="room-stats" aria-label="<?= esc(site_text('Temel oda bilgileri')) ?>">
            <div><span class="amenity-icon" aria-hidden="true">◎</span><strong data-room-capacity></strong></div>
            <div><span class="amenity-icon" aria-hidden="true">⌁</span><strong data-room-bed></strong></div>
          </div>

          <p class="room-detail-floor" data-room-floor></p>
          <p class="room-detail-price" data-room-price hidden></p>

          <div class="room-amenities">
            <p class="room-amenities-title"><?= esc(site_text('Oda olanakları')) ?></p>
            <div class="amenity-grid amenity-grid-room" data-room-feature-list>
              <div class="room-catalog-loading"><?= esc(site_text('Oda özellikleri hazırlanıyor…')) ?></div>
            </div>
          </div>

          <p class="room-price-note" data-room-price-note></p>
          <button
            type="button"
            class="button button-primary"
            data-room-reserve
            data-ya-action="accommodation.reserve" hidden
          ><?= esc(site_text('Rezervasyon / Bilgi Al')) ?></button>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section media-experiences" data-room-media-section hidden>
  <div class="shell">
    <div class="section-heading">
      <p class="eyebrow"><?= esc(site_text('Odayı keşfet')) ?></p>
      <h2><?= esc(site_text('Fotoğraf, video ve panoramik görünüm')) ?></h2>
      <p><?= esc(site_text('Odanıza yakından bakın: fotoğraflar, panoramalar ve kısa bir oda turu.')) ?></p>
    </div>

    <div class="experience-grid">
      <button
        class="experience-card"
        type="button"
        data-room-media-card="panorama_360"
        data-open-panorama
        hidden
      >
        <span class="experience-media">
          <img data-room-media-preview alt="">
          <span class="media-kind">360°</span>
        </span>
        <strong><?= esc(site_text('360° oda deneyimi')) ?></strong>
        <small><?= esc(site_text('Odanın içinde serbest bakış')) ?></small>
      </button>

      <button
        class="experience-card"
        type="button"
        data-room-media-card="panorama_180"
        data-open-panorama
        hidden
      >
        <span class="experience-media">
          <img data-room-media-preview alt="">
          <span class="media-kind">180°</span>
        </span>
        <strong><?= esc(site_text('180° panoramik görünüm')) ?></strong>
        <small><?= esc(site_text('Geniş açılı görünümü inceleyin')) ?></small>
      </button>

      <button
        class="experience-card"
        type="button"
        data-room-media-card="video"
        data-open-video
        hidden
      >
        <span class="experience-media">
          <img data-room-media-preview alt="">
          <span class="media-kind media-kind-play">▶</span>
        </span>
        <strong><?= esc(site_text('Oda videosu')) ?></strong>
        <small><?= esc(site_text('Kısa oda turu')) ?></small>
      </button>
    </div>

    <div class="normal-gallery" data-room-photo-gallery hidden></div>
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
    <strong data-room-video-title><?= esc(site_text('Oda videosu')) ?></strong>
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
<script src="/assets/js/rooms.js" defer></script>
<script src="/assets/js/room-media.js" defer></script>
<?php page_bottom(); ?>
