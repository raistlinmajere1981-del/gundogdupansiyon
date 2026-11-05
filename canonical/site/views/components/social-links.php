<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }
$variant = text($view['social_variant'] ?? 'header');
$catalog = ['instagram'=>'Instagram', 'facebook'=>'Facebook', 'youtube'=>'YouTube', 'tiktok'=>'TikTok'];
$social = [];
foreach (records($view['publication']['contact']['social'] ?? []) as $item) {
    $platform = text($item['platform'] ?? '');
    $url = web_url($item['url'] ?? '');
    if (!isset($catalog[$platform]) || $url === '' || !published($item)) continue;
    $social[$platform] = ['url'=>$url, 'label'=>$catalog[$platform]];
}
if ($social === []) return;
?>
<nav class="gd-social gd-social--<?= e($variant) ?>" aria-label="<?= e(t($site, 'contact.social')) ?>">
<?php foreach ($social as $platform => $item): ?>
<a href="<?= e($item['url']) ?>" target="_blank" rel="noopener noreferrer"
   aria-label="<?= e($item['label']) ?>" title="<?= e($item['label']) ?>">
<svg class="gd-social-icon" viewBox="0 0 24 24" width="19" height="19" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
<?php if ($platform === 'instagram'): ?>
<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.6" cy="6.5" r=".8" fill="currentColor" stroke="none"/>
<?php elseif ($platform === 'facebook'): ?>
<path d="M15 21v-8h2.7l.4-3.5H15V7.3c0-1.1.35-1.9 1.85-1.9H18V2.3a17 17 0 0 0-2.4-.15C12.8 2.15 11 3.85 11 7v2.5H8.4V13H11v8"/>
<?php elseif ($platform === 'youtube'): ?>
<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none"/>
<?php else: ?>
<path d="M14 3v11.2a4.3 4.3 0 1 1-4.3-4.3M14 3c.4 3.1 2.4 4.9 5 5.1"/>
<?php endif; ?>
</svg><span class="gd-social-name"><?= e($item['label']) ?></span></a>
<?php endforeach; ?>
</nav>
