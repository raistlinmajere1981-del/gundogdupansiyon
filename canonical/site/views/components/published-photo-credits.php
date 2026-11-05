<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }
$catalog = require __DIR__ . '/photo-credit-catalog.php';
$credits = [];
foreach (array_merge($view['publication']['rooms'], $view['publication']['tables']) as $record) {
    foreach (records($record['media'] ?? []) as $media) {
        if (!published($media) || !in_array($media['kind'] ?? '', ['cover', 'photo', 'panorama_180', 'panorama_360', 'video'], true)
            || media_url($media['url'] ?? '', $site['module_path']) === '') continue;
        // External visitor URLs carry no inferred license, even with a familiar title.
        if (!str_starts_with(media_url($media['url'] ?? '', $site['module_path']), $site['module_path'] . '/')) continue;
        $title = text($media['title'] ?? '');
        if (isset($catalog[$title])) $credits[$title] = $catalog[$title];
    }
}
?>
<?php if ($credits !== []): ?>
<p>Temsili demo görselleri işletmenin kendi fotoğrafları değildir. Aşağıdaki bilgiler yalnız eşleşen yayınlı demo görsellerine aittir.</p>
<ul class="published-photo-credits">
<?php foreach ($credits as $credit): ?>
<li><a href="<?= e($credit['sourceUrl']) ?>" target="_blank" rel="noopener noreferrer"><?= e($credit['title']) ?></a> · <?= e($credit['author']) ?> · <?php if ($credit['licenseUrl'] !== ''): ?><a href="<?= e($credit['licenseUrl']) ?>" target="_blank" rel="noopener noreferrer"><?= e($credit['license']) ?></a><?php else: ?><?= e($credit['license']) ?><?php endif; ?><br><?= e($credit['modification']) ?></li>
<?php endforeach; ?>
</ul>
<?php endif; ?>
