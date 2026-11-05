<?php declare(strict_types=1); namespace YaSite;
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }
 $contact = $view['publication']['contact'];
 render_view('components/page-header', ['title' => $view['title'], 'eyebrow' => t($site, 'page.contact'), 'lede' => t($site, 'contact.lede')], $site); ?>
<div class="contact-layout">
  <section class="content-card contact-card">
    <h2><?= e(t($site, 'contact.reach_us')) ?></h2>
    <dl class="contact-list">
      <?php if ($contact['tel'] !== ''): ?><dt><?= e(t($site, 'contact.phone')) ?></dt><dd><a href="<?= e($contact['tel']) ?>"><?= e($contact['phone']) ?></a></dd><?php endif; ?>
      <?php if ($contact['email'] !== ''): ?><dt><?= e(t($site, 'contact.email')) ?></dt><dd><a href="mailto:<?= e($contact['email']) ?>"><?= e($contact['email']) ?></a></dd><?php endif; ?>
      <?php if ($contact['address'] !== ''): ?><dt><?= e(t($site, 'contact.address')) ?></dt><dd><?= nl2br(e($contact['address'])) ?></dd><?php endif; ?>
    </dl>
    <?php if ($contact['whatsapp'] !== '' || $contact['map'] !== ''): ?>
    <div class="contact-actions">
      <?php if ($contact['whatsapp'] !== ''): ?><a class="button gd-contact-button gd-contact-button--primary" href="<?= e($contact['whatsapp']) ?>" target="_blank" rel="noopener noreferrer"><span class="gd-contact-button-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8.5 8.5c.5 3.1 3 5.5 6.1 6.1l1.1-1.2 2 .8"/></svg></span><?= e(t($site, 'contact.whatsapp')) ?></a><?php endif; ?>
      <?php if ($contact['map'] !== ''): ?><a class="button secondary gd-contact-button gd-contact-button--secondary" href="<?= e($contact['map']) ?>" target="_blank" rel="noopener noreferrer"><span class="gd-contact-button-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span><?= e(t($site, $contact['map'] === $contact['embed'] ? 'contact.open_map' : 'contact.directions')) ?></a><?php endif; ?>
    </div>
    <?php endif; ?>
    <?php if (text($view['publication']['info']['directions_note'] ?? '') !== ''): ?><p class="contact-note"><?= nl2br(e($view['publication']['info']['directions_note'])) ?></p><?php endif; ?>
    <?php if ($contact['social'] !== []): ?>
    <h3><?= e(t($site, 'contact.social')) ?></h3>
    <?php render_view('components/social-links', ['publication' => $view['publication'], 'social_variant' => 'contact'], $site); ?>
    <?php endif; ?>
  </section>
  <?php if ($contact['embed'] !== ''): ?>
  <section class="contact-map content-card" aria-labelledby="contact-map-title">
    <h2 id="contact-map-title"><?= e(t($site, 'contact.map_title')) ?></h2>
    <iframe src="<?= e($contact['embed']) ?>" title="<?= e(t($site, 'contact.map_title')) ?>"
      loading="lazy" referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen></iframe>
    <?php if ($contact['mapProvider'] === 'osm'): ?>
      <small class="contact-map-attribution"><?= e(t($site, 'contact.map_attribution')) ?></small>
    <?php endif; ?>
  </section>
  <?php endif; ?>
</div>
