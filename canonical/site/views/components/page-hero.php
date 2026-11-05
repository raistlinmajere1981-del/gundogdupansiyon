<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }
$page = $view['page'] ?? ''; ?>
<?php if ($page === 'rooms'): ?>
<div class="gd-page-hero gd-page-hero--rooms" data-gd-page-hero="rooms" aria-hidden="true">
  <img src="<?= e(asset($site, 'site/img/gideros-2-1275.webp')) ?>" width="1275" height="941" alt="" fetchpriority="high" decoding="async">
</div>
<?php elseif ($page === 'restaurant'): ?>
<div class="gd-page-hero gd-page-hero--restaurant" data-gd-page-hero="restaurant" aria-hidden="true">
  <img src="<?= e(asset($site, 'site/img/hero-restaurant.webp')) ?>" width="696" height="455" alt="" fetchpriority="high" decoding="async">
</div>
<?php elseif ($page === 'menu'): ?>
<div class="gd-page-hero gd-page-hero--menu" data-gd-page-hero="menu" aria-hidden="true">
  <img src="<?= e(asset($site, 'site/img/hero-menu.webp')) ?>" width="604" height="402" alt="" fetchpriority="high" decoding="async">
</div>
<?php elseif ($page === 'about'): ?>
<div class="gd-page-hero gd-page-hero--about" data-gd-page-hero="about" aria-hidden="true">
  <img src="<?= e(asset($site, 'site/img/hero-about.webp')) ?>" width="1600" height="1063" alt="" fetchpriority="high" decoding="async">
</div>
<?php elseif ($page === 'gallery'): ?>
<div class="gd-page-hero gd-page-hero--gallery" data-gd-page-hero="gallery" aria-hidden="true">
  <img src="<?= e(asset($site, 'site/img/hero-gallery.webp')) ?>" width="1600" height="1051" alt="" fetchpriority="high" decoding="async">
</div>
<?php elseif ($page === 'announcements'): ?>
<div class="gd-page-hero gd-page-hero--announcements" data-gd-page-hero="announcements" aria-hidden="true">
  <img src="<?= e(asset($site, 'site/img/hero-announcements.webp')) ?>" width="696" height="500" alt="" fetchpriority="high" decoding="async">
</div>
<?php elseif ($page === 'reviews'): ?>
<div class="gd-page-hero gd-page-hero--reviews" data-gd-page-hero="reviews" aria-hidden="true">
  <img src="<?= e(asset($site, 'site/img/hero-reviews.webp')) ?>" width="1280" height="960" alt="" fetchpriority="high" decoding="async">
</div>
<?php elseif ($page === 'contact'): ?>
<div class="gd-page-hero gd-page-hero--contact" data-gd-page-hero="contact" aria-hidden="true">
  <img src="<?= e(asset($site, 'site/img/hero-contact.webp')) ?>" width="697" height="499" alt="" fetchpriority="high" decoding="async">
</div>
<?php endif; ?>
