<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }
?>
<section class="gundogdu-hero" aria-labelledby="hero-title">
  <img class="hero-photo" src="<?= e(asset($site, 'site/img/gideros-1-1818.webp')) ?>" srcset="<?= e(asset($site, 'site/img/gideros-1-720.webp')) ?> 720w, <?= e(asset($site, 'site/img/gideros-1-1200.webp')) ?> 1200w, <?= e(asset($site, 'site/img/gideros-1-1818.webp')) ?> 1818w" sizes="100vw" width="1818" height="1228" alt="<?= e(t($site, 'theme.gundogdu.photo.alt1')) ?>" fetchpriority="high">
  <div class="shell hero-copy">
    <p class="eyebrow"><?= e(t($site, 'theme.gundogdu.hero.eyebrow')) ?></p>
    <h1 id="hero-title"><?= e(t($site, 'theme.gundogdu.hero.title')) ?></h1>
    <p class="hero-intro"><?= e(t($site, 'theme.gundogdu.hero.text')) ?></p>
    <div class="hero-actions">
      <?php if (isset($view['pages']['rooms'])): ?><a class="button" href="<?= e(page_url($site, 'rooms')) ?>"><?= e(t($site, 'theme.gundogdu.hero.rooms')) ?> <span aria-hidden="true">↗</span></a><?php endif; ?>
      <?php if (isset($view['pages']['menu'])): ?><a class="button secondary" href="<?= e(page_url($site, 'menu')) ?>"><?= e(t($site, 'theme.gundogdu.hero.menu')) ?></a><?php endif; ?>
      <?php if (!isset($view['pages']['rooms']) && !isset($view['pages']['menu'])): ?>
        <?php if (isset($view['pages']['contact'])): ?><a class="button" href="<?= e(page_url($site, 'contact')) ?>"><?= e(t($site, 'theme.gundogdu.hero.contact')) ?></a>
        <?php elseif (in_array('general_info', $view['publication']['info']['request_types'] ?? [], true) && $view['publication']['features']['requests']): ?><button class="button" type="button" data-ya-action="request.general" data-theme-widget-trigger hidden><?= e(t($site, 'theme.gundogdu.hero.request')) ?></button><?php endif; ?>
      <?php endif; ?>
    </div>
  </div>
</section>
