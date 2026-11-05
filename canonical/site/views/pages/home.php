<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }
$publication = $view['publication'];
render_view('components/hero', $view, $site);
?>
<?php if (count($view['pages']) === 1): $key = $view['status'] === 'ok' ? 'empty' : 'unavailable'; ?>
<section class="shell home-section empty-state" role="status"><h2><?= e(t($site, 'state.' . $key . '.title')) ?></h2><p><?= e(t($site, 'state.' . $key . '.text')) ?></p></section>
<?php endif; ?>

<?php if (isset($view['pages']['about'])): ?>
<section class="shell home-section about-preview split" aria-labelledby="about-title"><div><p class="eyebrow"><?= e(t($site, 'page.about')) ?></p><h2 id="about-title"><?= e(t($site, 'theme.gundogdu.about.title')) ?></h2></div><div><?php if ($publication['about'] !== ''): ?><p class="prose"><?= nl2br(e($publication['about'])) ?></p><?php endif; ?><a class="text-link" href="<?= e(page_url($site, 'about')) ?>"><?= e(t($site, 'theme.gundogdu.about.more')) ?> <span aria-hidden="true">↗</span></a></div></section>
<?php endif; ?>

<?php if (isset($view['pages']['rooms'])): ?>
<section class="shell home-section" id="rooms-preview" aria-labelledby="rooms-title"><div class="section-heading"><div><p class="eyebrow"><?= e(t($site, 'page.rooms')) ?></p><h2 id="rooms-title"><?= e(t($site, 'theme.gundogdu.rooms.title')) ?></h2></div><a class="text-link" href="<?= e(page_url($site, 'rooms')) ?>"><?= e(t($site, 'theme.gundogdu.rooms.all')) ?> <span aria-hidden="true">↗</span></a></div><div class="collection"><?php foreach (array_slice($publication['rooms'], 0, 3) as $record) render_view('components/resource-card', ['record' => $record, 'rooms' => $publication['rooms']], $site); ?></div></section>
<?php endif; ?>

<?php if (isset($view['pages']['restaurant']) || isset($view['pages']['menu'])): ?>
<section class="restaurant-preview" aria-labelledby="restaurant-title"><div class="shell split"><div><p class="eyebrow"><?= e(t($site, isset($view['pages']['restaurant']) ? 'page.restaurant' : 'page.menu')) ?></p><h2 id="restaurant-title"><?= e(t($site, 'theme.gundogdu.restaurant.title')) ?></h2></div><div><p><?= e(t($site, 'theme.gundogdu.restaurant.text')) ?></p><div class="action-row"><?php if (isset($view['pages']['restaurant'])): ?><a class="button" href="<?= e(page_url($site, 'restaurant')) ?>"><?= e(t($site, 'theme.gundogdu.restaurant.tables')) ?></a><?php endif; ?><?php if (isset($view['pages']['menu'])): ?><a class="button secondary" href="<?= e(page_url($site, 'menu')) ?>"><?= e(t($site, 'theme.gundogdu.hero.menu')) ?></a><?php endif; ?></div></div></div></section>
<?php endif; ?>

<section class="region-section" aria-labelledby="region-title"><div class="shell region-grid"><div><p class="eyebrow"><?= e(t($site, 'theme.gundogdu.region.eyebrow')) ?></p><h2 id="region-title"><?= e(t($site, 'theme.gundogdu.region.title')) ?></h2><p><?= e(t($site, 'theme.gundogdu.region.text')) ?></p></div><div class="gd-region-decoration" aria-hidden="true"><span></span><span></span><span></span></div></div></section>

<?php if (isset($view['pages']['gallery'])): ?>
<section class="shell home-section" id="gallery-preview" aria-labelledby="gallery-title"><div class="section-heading"><h2 id="gallery-title"><?= e(t($site, 'theme.gundogdu.gallery.title')) ?></h2><a class="text-link" href="<?= e(page_url($site, 'gallery')) ?>"><?= e(t($site, 'theme.gundogdu.gallery.all')) ?> <span aria-hidden="true">↗</span></a></div><div class="collection gallery"><?php foreach (array_slice($publication['gallery'], 0, 3) as $image): ?><figure><img src="<?= e($image['url']) ?>" alt="<?= e($image['title']) ?>" loading="lazy" decoding="async"><?php if ($image['title'] !== ''): ?><figcaption><?= e($image['title']) ?></figcaption><?php endif; ?></figure><?php endforeach; ?></div></section>
<?php endif; ?>

<?php foreach (['announcements', 'reviews'] as $page): if (!isset($view['pages'][$page])) continue; ?>
<section class="shell home-section" id="<?= e($page) ?>-preview" aria-labelledby="<?= e($page) ?>-title"><div class="section-heading"><h2 id="<?= e($page) ?>-title"><?= e(t($site, 'page.' . $page)) ?></h2><a class="text-link" href="<?= e(page_url($site, $page)) ?>"><?= e(t($site, 'theme.gundogdu.more')) ?> <span aria-hidden="true">↗</span></a></div><div class="collection">
<?php foreach (array_slice($publication[$page], 0, 3) as $record): ?><article class="content-card"><?php if ($page === 'announcements'): ?><?php foreach (records($record['images'] ?? []) as $image): $url = media_url($image['url'] ?? '', $site['module_path']); if ($url === '' || !published($image)) continue; ?><img class="announcement-preview-image" src="<?= e($url) ?>" alt="<?= e(text($image['altText'] ?? '')) ?>" loading="lazy" decoding="async"><?php break; endforeach; ?><h3><a href="<?= e(page_url($site, 'announcements')) ?>"><?= e($record['title']) ?></a></h3><p><?= e(excerpt_text($record['text'] ?? '', 150)) ?></p><?php else: ?><blockquote><?= nl2br(e(text($record['text'] ?? ''))) ?></blockquote><p><?= e(text($record['author'] ?? '') ?: t($site, 'content.review.author')) ?></p><?php endif; ?></article><?php endforeach; ?>
</div></section>
<?php endforeach; ?>

<?php $general = $publication['features']['requests'] && in_array('general_info', $publication['info']['request_types'] ?? [], true);
if (isset($view['pages']['contact']) || $general || $publication['features']['room_requests'] || $publication['features']['table_requests']): ?>
<section class="shell home-section visit-plan split" aria-labelledby="plan-title"><div><p class="eyebrow"><?= e(t($site, 'theme.gundogdu.support.title')) ?></p><h2 id="plan-title"><?= e(t($site, 'theme.gundogdu.plan.title')) ?></h2><?php if ($publication['features']['room_requests'] || $publication['features']['table_requests']): ?><p><?= e(t($site, 'theme.gundogdu.plan.text')) ?></p><?php endif; ?></div><div>
<?php if (isset($view['pages']['contact'])): ?><?php if ($publication['contact']['address'] !== ''): ?><p><?= nl2br(e($publication['contact']['address'])) ?></p><?php endif; ?><a class="text-link" href="<?= e(page_url($site, 'contact')) ?>"><?= e(t($site, 'theme.gundogdu.plan.contact')) ?> <span aria-hidden="true">↗</span></a><?php endif; ?>
<div class="action-row">
<?php foreach (['room_requests' => ['accommodation.reserve', 'room'], 'table_requests' => ['food.reserve', 'table']] as $feature => [$intent, $label]): if (!$publication['features'][$feature]) continue; ?><button class="button" type="button" data-ya-action="<?= e($intent) ?>" data-theme-widget-trigger hidden><?= e(t($site, 'theme.gundogdu.plan.' . $label)) ?></button><?php endforeach; ?>
<?php if ($general): ?><button class="button secondary" type="button" data-ya-action="request.general" data-theme-widget-trigger hidden><?= e(t($site, 'theme.gundogdu.plan.general')) ?></button><?php endif; ?>
</div></div></section>
<?php endif; ?>

<?php $otherPages = array_intersect_key($view['pages'], array_flip(['catalog', 'account'])); if ($otherPages): ?>
<nav class="shell home-section page-grid" aria-label="<?= e(t($site, 'nav.main')) ?>"><?php foreach ($otherPages as $id => $page): ?><a class="page-link" href="<?= e(page_url($site, $id)) ?>"><?= e(t($site, $page['key'])) ?></a><?php endforeach; ?></nav>
<?php endif; ?>
