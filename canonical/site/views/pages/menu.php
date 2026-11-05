<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }


// Business-public menu payloads may contain safe photo bytes as a base64 data
// URI. Only raster image MIME types, strict base64 and a bounded payload are
// accepted here. Other site media continues through the canonical URL filter.
$menuPhotoSrc = static function (mixed $value) use ($site): string {
    if (is_string($value)) {
        $value = trim($value);
        if (strlen($value) <= 450000
            && preg_match('~^data:image/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$~D', $value)) {
            return $value;
        }
    }
    return media_url($value, $site['module_path']);
};
?>
<?php render_view('components/page-header', ['title' => $view['title'], 'eyebrow' => t($site, 'page.menu'), 'lede' => t($site, 'menu.lede')], $site); ?>
<form class="menu-filter" method="get" action="<?= e($site['base_path'] . '/') ?>">
  <input type="hidden" name="page" value="menu"><input type="hidden" name="lang" value="<?= e($site['language']['code']) ?>">
  <label for="menu-category"><?= e(t($site, 'menu.category')) ?></label>
  <select id="menu-category" name="category" data-menu-category>
    <option value=""><?= e(t($site, 'menu.all')) ?></option>
    <?php foreach ($view['menu_categories'] as $category): ?><option value="<?= e($category['id']) ?>"<?= $view['menu_category'] === $category['id'] ? ' selected' : '' ?>><?= e($category['name']) ?></option><?php endforeach; ?>
  </select><button type="submit"><?= e(t($site, 'menu.apply')) ?></button>
</form>
<?php foreach ($view['publication']['categories'] as $category):
    if ($view['menu_category'] !== '' && $view['menu_category'] !== $category['id']) continue;
    $items = array_filter($view['publication']['menu'], static fn (array $item): bool => $item['category_id'] === $category['id']);
    if ($items === []) continue; ?>
<section class="menu-category"><h2><?= e($category['name']) ?></h2>
  <?php if (text($category['description'] ?? '') !== ''): ?><p><?= e($category['description']) ?></p><?php endif; ?>
  <ul class="menu-list"><?php foreach ($items as $record): ?>
    <li><div>
      <?php $image = $menuPhotoSrc($record['image_url'] ?? ''); if ($image !== ''): ?><img class="menu-image" src="<?= e($image) ?>" alt="<?= e($record['name']) ?>" loading="lazy" decoding="async"><?php endif; ?>
      <h3><?= e($record['name']) ?></h3>
      <?php if (($record['is_featured'] ?? false) === true): ?><span class="menu-featured"><?= e(t($site, 'menu.featured')) ?></span><?php endif; ?>
      <?php if (text($record['description'] ?? '') !== ''): ?><p><?= e($record['description']) ?></p><?php endif; ?>
      <?php foreach (['allergens', 'tags'] as $field): $values = array_values(array_filter($record[$field] ?? [], static fn (mixed $v): bool => text($v) !== '')); if ($values === []) continue; ?>
      <p class="menu-<?= e($field) ?>"><strong><?= e(t($site, 'menu.' . $field)) ?>:</strong> <?= e(implode(', ', $values)) ?></p>
      <?php endforeach; ?>
    </div>
    <?php $price = price_text($site, $record['price'] ?? null, $record['currency'] ?? ''); if ($price !== ''): ?><span data-format-currency="<?= e($record['price']) ?>" data-currency="<?= e($record['currency']) ?>"><?= e($price) ?></span><?php endif; ?></li>
  <?php endforeach; ?></ul>
</section>
<?php endforeach; ?>
