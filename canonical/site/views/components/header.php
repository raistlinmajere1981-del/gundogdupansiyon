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
      <nav id="main-navigation" class="main-navigation" aria-label="<?= e(t($site, 'nav.main')) ?>"><?php render_navigation($view, $site); ?></nav>
    </div>
  </div>
</header>
