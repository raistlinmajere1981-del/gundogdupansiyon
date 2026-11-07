<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }
$codes = $site['language']['catalogs'];
$active = $site['language']['code'];
$languageLink = static function (string $code) use ($view, $site): string {
    return $site['base_path'] . '/?' . http_build_query(array_merge(language_query_fields($view), ['lang' => $code]));
};
$flag = static function (string $code) use ($site): string {
    return in_array($code, ['tr', 'en'], true) ? asset($site, 'site/brand/flag-' . $code . '.svg') : '';
};
// Owner-only demo site: use the actual B3 table token from a private, non-versioned
// server file. This deliberately enables real requests via the public demo link.
$demoQrPath = getenv('YA_GUNDOGDU_DEMO_QR_PATH') ?: '/home/yardimciasistangunduodu/.gundogdu-demo-table-token';
$demoQrToken = '';
if (is_file($demoQrPath) && !is_link($demoQrPath)) {
    $candidate = trim((string) file_get_contents($demoQrPath));
    if (preg_match('/^[A-Za-z0-9_-]{24}$/D', $candidate)) $demoQrToken = $candidate;
}
$demoOrderVisible = ($view['publication']['features']['table_orders'] ?? false) === true && $demoQrToken !== '';

?>
<header class="site-header">
  <div class="shell gd-header-shell">
    <div class="gd-header-top">
      <a class="site-name" href="<?= e(page_url($site, 'home')) ?>"><img src="<?= e(asset($site, 'site/brand/mark.svg')) ?>" width="44" height="44" alt=""><span><?= e($view['publication']['name'] ?: t($site, 'site.title')) ?></span></a>
      <div class="gd-header-controls">
        <?php render_view('components/social-links', ['publication' => $view['publication'], 'social_variant' => 'header'], $site); ?>
        <?php if (count($codes) > 1): ?>
        <details class="gd-language-switcher" data-language-menu>
          <summary title="<?= e(t($site, 'language.label')) ?>" aria-label="<?= e(t($site, 'language.label')) ?>: <?= e($codes[$active]['_meta']['label']) ?>">
            <?php if ($flag($active) !== ''): ?><img class="gd-language-flag" src="<?= e($flag($active)) ?>" width="30" height="20" alt=""><?php else: ?><span class="gd-language-code"><?= e(strtoupper($active)) ?></span><?php endif; ?>
            <svg class="gd-language-chevron" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="m5 7 5 5 5-5"/></svg>
          </summary>
          <nav class="gd-language-options" aria-label="<?= e(t($site, 'language.label')) ?>">
            <?php foreach ($codes as $code => $catalog): ?>
            <a href="<?= e($languageLink($code)) ?>" hreflang="<?= e($code) ?>" lang="<?= e($code) ?>"<?= $code === $active ? ' aria-current="true"' : '' ?>>
              <?php if ($flag($code) !== ''): ?><img class="gd-language-flag" src="<?= e($flag($code)) ?>" width="30" height="20" alt=""><?php else: ?><span class="gd-language-code"><?= e(strtoupper($code)) ?></span><?php endif; ?>
              <span><?= e($catalog['_meta']['label']) ?></span>
              <?php if ($code === $active): ?><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg><?php endif; ?>
            </a>
            <?php endforeach; ?>
          </nav>
        </details>
        <?php endif; ?>
      </div>
    </div>
    <div class="gd-header-bottom">
      <button type="button" class="menu-toggle" aria-expanded="true" aria-controls="main-navigation" data-menu-toggle hidden><?= e(t($site, 'nav.close')) ?></button>
      <nav id="main-navigation" class="main-navigation" aria-label="<?= e(t($site, 'nav.main')) ?>">
        <?php foreach ($view['pages'] as $pageId => $page): ?>
          <?php if (!empty($page['internal'])) continue; ?>
          <?php if ($pageId === 'menu'): ?>
            <details class="gd-qr-nav" data-qr-demo-nav>
              <summary<?= $view['page'] === 'menu' ? ' aria-current="page"' : '' ?>><?= e(t($site, $page['key'])) ?>
                <svg viewBox="0 0 20 20" width="13" height="13" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="m5 7 5 5 5-5"/></svg>
              </summary>
              <div class="gd-qr-nav-options">
                <a href="<?= e(page_url($site, 'menu')) ?>"<?= $view['page'] === 'menu' && ($view['table_token'] ?? '') === '' ? ' aria-current="page"' : '' ?>><?= e(t($site, 'theme.gundogdu.qr.view')) ?></a>
                <?php if ($demoOrderVisible): ?>
                  <a data-demo-table-order href="<?= e(page_url($site, 'menu') . '&table=' . rawurlencode($demoQrToken)) ?>"<?= ($view['table_token'] ?? '') === $demoQrToken ? ' aria-current="page"' : '' ?>><?= e(t($site, 'theme.gundogdu.qr.demo')) ?></a>
                <?php endif; ?>
              </div>
            </details>
          <?php else: ?>
            <a href="<?= e(page_url($site, $pageId)) ?>"<?= $view['page'] === $pageId ? ' aria-current="page"' : '' ?>><?= e(t($site, $page['key'])) ?></a>
          <?php endif; ?>
        <?php endforeach; ?>
      </nav>
    </div>
  </div>
</header>
