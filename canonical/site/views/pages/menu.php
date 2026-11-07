<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }

// Gündoğdu's compact restaurant-menu presentation consumes the existing menu
// publication unchanged. Never trust prices or items from these DOM attributes
// when accepting the order; the web module remains authoritative.
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
$isOrdering = ($view['publication']['features']['table_orders'] ?? false) === true
    && ($view['table_token'] ?? '') !== '';
$categories = array_values(array_filter($view['publication']['categories'], static function (array $category) use ($view): bool {
    foreach ($view['publication']['menu'] as $item) {
        if ($item['category_id'] === $category['id']) return true;
    }
    return false;
}));
$initialCategory = $view['menu_category'] !== ''
    && in_array($view['menu_category'], array_column($categories, 'id'), true)
    ? $view['menu_category'] : '';
?>
<?php render_view('components/page-header', ['title' => $view['title'], 'eyebrow' => t($site, 'page.menu'), 'lede' => t($site, 'menu.lede')], $site); ?>
<div class="gd-menu-workspace<?= $isOrdering ? ' gd-menu-workspace--ordering' : '' ?>" data-gd-menu-workspace>
  <div class="gd-menu-catalog">
    <div class="gd-menu-catalog-heading">
      <div>
        <p class="gd-menu-kicker"><?= e(t($site, 'theme.gundogdu.menu.kicker')) ?></p>
        <h2><?= e(t($site, 'theme.gundogdu.menu.title')) ?></h2>
      </div>
      <span class="gd-menu-count" data-gd-visible-count aria-live="polite"></span>
    </div>
    <form class="menu-filter gd-menu-filter" method="get" action="<?= e($site['base_path'] . '/') ?>" data-gd-menu-filter>
      <input type="hidden" name="page" value="menu">
      <input type="hidden" name="lang" value="<?= e($site['language']['code']) ?>">
      <?php if (($view['table_token'] ?? '') !== ''): ?><input type="hidden" name="table" value="<?= e($view['table_token']) ?>"><?php endif; ?>
      <label for="menu-category"><?= e(t($site, 'menu.category')) ?></label>
      <select id="menu-category" name="category" data-menu-category data-initial-category="<?= e($initialCategory) ?>">
        <option value=""><?= e(t($site, 'menu.all')) ?></option>
        <?php foreach ($categories as $category): ?>
          <option value="<?= e($category['id']) ?>"<?= $initialCategory === $category['id'] ? ' selected' : '' ?>><?= e($category['name']) ?></option>
        <?php endforeach; ?>
      </select>
      <noscript><button type="submit"><?= e(t($site, 'menu.apply')) ?></button></noscript>
    </form>
    <div class="gd-menu-category-results" data-gd-menu-results>
      <?php foreach ($categories as $category):
          $items = array_values(array_filter($view['publication']['menu'], static fn(array $item): bool => $item['category_id'] === $category['id']));
          if ($items === []) continue; ?>
      <section class="menu-category gd-menu-category" data-gd-category-id="<?= e($category['id']) ?>">
        <header class="gd-menu-category-heading">
          <h2><?= e($category['name']) ?></h2>
          <?php if (text($category['description'] ?? '') !== ''): ?><p><?= e($category['description']) ?></p><?php endif; ?>
        </header>
        <ul class="menu-list gd-menu-product-grid">
          <?php foreach ($items as $record): ?>
          <li class="gd-menu-product"
              data-menu-entry-id="<?= e($record['id']) ?>"
              data-menu-name="<?= e($record['name']) ?>"
              data-menu-price="<?= e($record['price'] ?? '') ?>"
              data-menu-currency="<?= e($record['currency'] ?? '') ?>">
            <div class="gd-menu-product-main">
              <?php $image = $menuPhotoSrc($record['image_url'] ?? ''); ?>
              <?php if ($image !== ''): ?>
              <button type="button" class="gd-media-button gd-menu-product-photo" data-gd-media-trigger
                      aria-label="<?= e($record['name']) ?>">
                <img class="menu-image" src="<?= e($image) ?>" alt="<?= e($record['name']) ?>" loading="lazy" decoding="async">
              </button>
              <?php endif; ?>
              <div class="gd-menu-product-copy">
                <h3><?= e($record['name']) ?></h3>
                <?php if (($record['is_featured'] ?? false) === true): ?>
                  <span class="menu-featured"><?= e(t($site, 'menu.featured')) ?></span>
                <?php endif; ?>
                <?php if (text($record['description'] ?? '') !== ''): ?><p><?= e($record['description']) ?></p><?php endif; ?>
                <?php foreach (['allergens', 'tags'] as $field):
                    $values = array_values(array_filter($record[$field] ?? [], static fn(mixed $v): bool => text($v) !== ''));
                    if ($values === []) continue; ?>
                  <p class="menu-<?= e($field) ?>"><strong><?= e(t($site, 'menu.' . $field)) ?>:</strong> <?= e(implode(', ', $values)) ?></p>
                <?php endforeach; ?>
              </div>
            </div>
            <?php $price = price_text($site, $record['price'] ?? null, $record['currency'] ?? ''); ?>
            <?php if ($price !== ''): ?>
              <span class="gd-menu-product-price" data-format-currency="<?= e($record['price']) ?>"
                    data-currency="<?= e($record['currency']) ?>"><?= e($price) ?></span>
            <?php endif; ?>
          </li>
          <?php endforeach; ?>
        </ul>
      </section>
      <?php endforeach; ?>
    </div>
  </div>
  <?php if ($isOrdering): ?>
  <aside class="gd-menu-order-rail" aria-label="<?= e(t($site, 'table_order.cart_title')) ?>">
    <button type="button" class="gd-mobile-cart-scrim" data-gd-cart-scrim
            aria-label="<?= e(t($site, 'theme.gundogdu.menu.close_cart')) ?>" hidden></button>
    <button type="button" class="gd-mobile-cart-launcher" data-gd-cart-toggle
            aria-controls="gd-order-panel" aria-expanded="false">
      <span class="gd-mobile-cart-label">
        <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.8H19a2 2 0 0 0 2-1.6L22 8H7M10 21h.01M19 21h.01"/></svg>
        <?= e(t($site, 'table_order.cart_title')) ?>
        <span class="gd-mobile-cart-count" data-gd-cart-count>0</span>
      </span>
      <span class="gd-mobile-cart-total" data-gd-cart-total></span>
      <span class="gd-mobile-cart-chevron" aria-hidden="true">⌃</span>
    </button>
    <section class="menu-table-order gd-menu-order-panel" id="gd-order-panel" data-table-order
             data-table-token="<?= e($view['table_token']) ?>">
      <div class="gd-menu-order-heading">
        <p class="gd-menu-kicker"><?= e(t($site, 'theme.gundogdu.menu.table_label')) ?></p>
        <h2><?= e(t($site, 'table_order.cart_title')) ?></h2>
      </div>
      <p data-table-order-status role="status"></p>
      <div class="gd-menu-order-items" data-table-order-cart></div>
      <div class="gd-menu-order-footer">
        <label for="table-order-note"><?= e(t($site, 'table_order.note')) ?></label>
        <textarea id="table-order-note" data-table-order-note maxlength="500" rows="2"></textarea>
        <p data-table-order-total></p>
        <button type="button" data-table-order-submit disabled><?= e(t($site, 'table_order.submit')) ?></button>
        <p class="gd-qr-order-notice"><?= e(t($site, 'theme.gundogdu.qr.notice')) ?></p>
      </div>
    </section>
  </aside>
  <?php endif; ?>
</div>
