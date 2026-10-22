(() => {
  'use strict';
  const menu = document.querySelector('#mobile-nav');
  const toggle = document.querySelector('.menu-toggle');
  const setMenu = (open) => {
    if (!menu || !toggle) return;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  };
  toggle?.addEventListener('click', () => setMenu(menu.hidden));
  menu?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) setMenu(false); });
  matchMedia('(min-width: 801px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
  const lightbox = document.querySelector('.lightbox');
  let activePhoto = 0, photoTrigger = null;
  const photoButtons = () => [...document.querySelectorAll('[data-lightbox]')].filter(button => !button.closest('[hidden]'));
  function displayPhoto(index) {
    const photos = photoButtons();
    activePhoto = (index + photos.length) % photos.length;
    const button = photos[activePhoto];
    if (!button) return;
    lightbox.querySelector('img').src = button.dataset.lightbox;
    lightbox.querySelector('img').alt = button.dataset.caption || '';
    lightbox.querySelector('figcaption').textContent = button.dataset.caption || '';
    lightbox.querySelector('[data-photo-count]').textContent = (activePhoto + 1) + ' / ' + photos.length;
  }
  document.querySelectorAll('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
    photoTrigger = button; displayPhoto(photoButtons().indexOf(button)); lightbox.showModal();
  }));
  lightbox?.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox?.querySelector('[data-photo-prev]').addEventListener('click', () => displayPhoto(activePhoto - 1));
  lightbox?.querySelector('[data-photo-next]').addEventListener('click', () => displayPhoto(activePhoto + 1));
  lightbox?.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
  lightbox?.addEventListener('close', () => photoTrigger?.focus());
  document.querySelectorAll('[data-gallery-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-gallery-filter]').forEach(item => {
      const selected = item === button; item.classList.toggle('is-active', selected); item.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-gallery-kind]').forEach(item => { item.hidden = button.dataset.galleryFilter !== 'all' && item.dataset.galleryKind !== button.dataset.galleryFilter; });
  }));
  const config = JSON.parse(document.querySelector('#widget-config')?.textContent || '{}');
  const widget = window.YardimciAsistanWidget;
  widget?.init(config);
  const stayEnabled = document.body.dataset.stayEnabled === 'true';
  const tableEnabled = document.body.dataset.tableEnabled === 'true';
  let widgetOpener = null;
  // Presentation only; dates, validation, idempotency and submission remain canonical.
  const allowed = type => type === 'pension_reservation' ? stayEnabled : type === 'restaurant_reservation' ? tableEnabled : true;
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-ya-action], [data-ya-open], [data-ya-request-type]');
    if (!trigger) return;
    if (!trigger.closest('#yardimci-asistan-widget')) widgetOpener = trigger;
    if (trigger.dataset.yaRequestType && !allowed(trigger.dataset.yaRequestType)) {
      event.preventDefault(); event.stopImmediatePropagation(); widget?.open({ intent: 'home' });
    }
  }, true);
  const root = document.querySelector('#yardimci-asistan-widget');
  if (root) {
    const present = () => {
      const launcher = root.querySelector('.ya-widget-launcher-copy');
      if (launcher && launcher.querySelector('strong').textContent !== 'Ziyaret planınız') {
        launcher.querySelector('strong').textContent = 'Ziyaret planınız';
        launcher.querySelector('small').textContent = 'Gündoğdu · Yardımcı Asistan';
      }
      root.querySelector('[data-ya-open]')?.setAttribute('aria-label', 'Ziyaret planı asistanını aç');
      root.querySelectorAll('[data-ya-request-type]').forEach(button => { button.hidden = !allowed(button.dataset.yaRequestType); });
      const home = root.querySelector('.ya-widget-home');
      const title = root.querySelector('#ya-widget-title');
      if (title?.lastChild?.nodeType === Node.TEXT_NODE && title.lastChild.textContent !== config.businessName) title.lastChild.textContent = config.businessName;
      if (home && !home.querySelector('.site-widget-note') && (!stayEnabled || !tableEnabled)) {
        const note = document.createElement('p'); note.className = 'site-widget-note';
        note.textContent = !stayEnabled && !tableEnabled ? 'Online konaklama ve masa talebi şu anda açık değil. Yayınlanan iletişim seçeneklerini kullanabilirsiniz.' : !stayEnabled ? 'Online konaklama talebi şu anda açık değil.' : 'Online masa talebi şu anda açık değil.';
        home.append(note);
      }
    };
    new MutationObserver(present).observe(root, { childList: true, subtree: true });
    present();
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (toggle?.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
      if (root?.querySelector('.ya-widget-panel')) { widget?.close(); setTimeout(() => widgetOpener?.focus(), 180); }
    }
    if (lightbox?.open && event.key === 'ArrowRight') displayPhoto(activePhoto + 1);
    if (lightbox?.open && event.key === 'ArrowLeft') displayPhoto(activePhoto - 1);
    const panel = root?.querySelector('.ya-widget-panel');
    if (event.key === 'Tab' && panel && panel.contains(document.activeElement)) {
      const focusable = [...panel.querySelectorAll('button:not([disabled]), a[href], input:not([type=hidden]), textarea, select')].filter(el => el.getClientRects().length);
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0]?.focus(); }
    }
  });
})();
