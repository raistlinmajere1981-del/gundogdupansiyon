<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }
render_view('components/page-header', ['title' => $view['title'], 'eyebrow' => t($site, 'page.announcements'), 'lede' => t($site, 'announcements.lede')], $site); ?>
<div class="collection announcements">
<?php foreach ($view['publication']['announcements'] as $item):
$images = array_values(array_filter(records($item['images'] ?? []), static fn (array $image): bool => published($image) && media_url($image['url'] ?? '', $site['module_path']) !== ''));
$fullText = text($item['text'] ?? '');
$excerpt = excerpt_text($fullText, 280);
$truncated = $excerpt !== preg_replace('/\s+/u', ' ', $fullText);
?>
<article class="content-card announcement-card">
  <?php if ($images !== []): ?><div class="announcement-media">
    <?php foreach ($images as $image): ?><a href="<?= e(media_url($image['url'], $site['module_path'])) ?>" target="_blank" rel="noopener"><img src="<?= e(media_url($image['url'], $site['module_path'])) ?>" alt="<?= e(text($image['altText'] ?? '') ?: $item['title']) ?>" loading="lazy" decoding="async"></a><?php endforeach; ?>
  </div><?php endif; ?>
  <div class="announcement-body">
    <h2><?= e($item['title']) ?></h2>
    <?php if ($truncated): ?><p class="announcement-excerpt"><?= e($excerpt) ?></p><details class="announcement-text"><summary><?= e(t($site, 'theme.gundogdu.more')) ?></summary><p><?= nl2br(e($fullText)) ?></p></details>
    <?php else: ?><p><?= nl2br(e($fullText)) ?></p><?php endif; ?>
  </div>
</article>
<?php endforeach; ?>
</div>
