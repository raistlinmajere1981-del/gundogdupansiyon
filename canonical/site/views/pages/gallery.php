<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }
 render_view('components/page-header', ['title' => $view['title'], 'eyebrow' => t($site, 'page.gallery'), 'lede' => t($site, 'gallery.lede')], $site); ?>
<div class="collection gallery">
  <?php foreach ($view['publication']['gallery'] as $image): ?>
  <figure><button type="button" class="gd-media-button" data-gd-media-trigger><img src="<?= e($image['url']) ?>" alt="<?= e($image['title']) ?>" loading="lazy" decoding="async"></button>
    <?php if ($image['title'] !== ''): ?><figcaption><?= e($image['title']) ?></figcaption><?php endif; ?>
  </figure>
  <?php endforeach; ?>
</div>
