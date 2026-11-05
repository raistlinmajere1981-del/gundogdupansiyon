<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }
?>
<footer class="site-footer"><div class="shell gd-footer-layout">
  <div class="footer-top"><a class="site-name" href="<?= e(page_url($site, 'home')) ?>"><img src="<?= e(asset($site, 'site/brand/mark.svg')) ?>" width="48" height="48" alt=""><span><?= e($view['publication']['name'] ?: t($site, 'site.title')) ?></span></a><nav class="footer-navigation" aria-label="<?= e(t($site, 'nav.footer')) ?>"><?php render_navigation($view, $site); ?></nav></div>
  <div class="gd-footer-lower">
  <?php render_view('components/social-links', ['publication' => $view['publication'], 'social_variant' => 'footer'], $site); ?>
    <div class="gd-footer-fineprint">
  <details class="photo-credits" id="photo-credits"><summary><?= e(t($site, 'theme.gundogdu.photo.credits')) ?></summary>
    <p><a href="https://commons.wikimedia.org/wiki/File:Gideros_Bay1.jpg" target="_blank" rel="noopener noreferrer"><?= e(t($site, 'theme.gundogdu.photo.source1')) ?></a> · <a href="https://commons.wikimedia.org/wiki/File:Gideros_Bay2.jpg" target="_blank" rel="noopener noreferrer"><?= e(t($site, 'theme.gundogdu.photo.source2')) ?></a></p>
    <p><?= e(t($site, 'theme.gundogdu.photo.author')) ?> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer"><?= e(t($site, 'theme.gundogdu.photo.license')) ?></a></p>
    <p><?= e(t($site, 'theme.gundogdu.photo.changes')) ?></p><p><?= e(t($site, 'theme.gundogdu.photo.notice')) ?></p><p><?= e(t($site, 'theme.gundogdu.footer.mark')) ?></p>
    <?php render_view('components/page-hero-credits', $view, $site); ?>
    <?php render_view('components/published-photo-credits', $view, $site); ?>
    <?php render_view('components/demo-menu-photo-credits', $view, $site); ?>
  </details>
  <?php if ($view['publication']['name'] !== ''): ?><small class="gd-footer-copyright">© <?= e(date('Y')) ?> <span class="gd-footer-company"><?= e($view['publication']['name']) ?></span></small><?php endif; ?>
    </div>
  </div>
</div></footer>
