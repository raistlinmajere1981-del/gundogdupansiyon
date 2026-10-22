(() => {
  'use strict';
  const {text:t} = window.GundogduLanguage;
  const menu = document.querySelector('#mobile-nav');
  const toggle = document.querySelector('.menu-toggle');
  const setMenu = (open) => {
    if (!menu || !toggle) return;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? t('Menüyü kapat') : t('Menüyü aç'));
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
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-lightbox]');
    if (!button || !lightbox) return;
    photoTrigger = button; displayPhoto(photoButtons().indexOf(button)); lightbox.showModal();
  });
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
  const configNode = document.querySelector('#widget-config');
  let config = JSON.parse(configNode?.textContent || '{}');
  const widget = window.YardimciAsistanWidget;
  let stayEnabled = false, tableEnabled = false, widgetOpener = null;
  const allowed = type => type === 'pension_reservation' ? stayEnabled : type === 'restaurant_reservation' ? tableEnabled : true;
  // Capture only rejects unpublished actions. Canonical handlers alone open and submit.
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-ya-action], [data-ya-open], [data-ya-request-type]');
    if (!trigger) return;
    if (!trigger.closest('#yardimci-asistan-widget')) widgetOpener = trigger;
    const type = trigger.dataset.yaRequestType || (trigger.dataset.yaAction === 'accommodation.reserve' ? 'pension_reservation' : trigger.dataset.yaAction === 'food.reserve' ? 'restaurant_reservation' : '');
    if (type && !allowed(type)) {
      event.preventDefault(); event.stopImmediatePropagation(); widget?.open({intent: 'home'});
    }
  }, true);
  document.addEventListener('submit', event => {
    if (!event.target.matches('#yardimci-asistan-widget [data-ya-form]')) return;
    const type = new FormData(event.target).get('request_type');
    if (!allowed(type) || !stayEnabled && !tableEnabled) { event.preventDefault(); event.stopImmediatePropagation(); widget?.open({intent: 'home'}); }
  }, true);
  let root = document.querySelector('#yardimci-asistan-widget'), observedRoot = null;
  const present = () => {
    if (!root) return;
    const launcher = root.querySelector('.ya-widget-launcher-copy');
    if (launcher?.querySelector('strong')?.textContent !== t('Ziyaret planınız') && launcher) {
      launcher.querySelector('strong').textContent = t('Ziyaret planınız');
      launcher.querySelector('small').textContent = 'Gündoğdu · Yardımcı Asistan';
    }
    const opener = root.querySelector('[data-ya-open]');
    if (opener?.getAttribute('aria-label') !== t('Ziyaret planı asistanını aç')) opener?.setAttribute('aria-label', t('Ziyaret planı asistanını aç'));
    root.querySelectorAll('[data-ya-request-type]').forEach(button => {
      const hidden = !allowed(button.dataset.yaRequestType); if (button.hidden !== hidden) button.hidden = hidden;
    });
    const home = root.querySelector('.ya-widget-home'), title = root.querySelector('#ya-widget-title');
    if (title?.lastChild?.nodeType === Node.TEXT_NODE && title.lastChild.textContent !== config.businessName) title.lastChild.textContent = config.businessName;
    const message = !stayEnabled && !tableEnabled ? t('Online konaklama ve masa talebi şu anda açık değil. Yayınlanan iletişim seçeneklerini kullanabilirsiniz.') : !stayEnabled ? t('Online konaklama talebi şu anda açık değil.') : !tableEnabled ? t('Online masa talebi şu anda açık değil.') : '';
    let note = home?.querySelector('.site-widget-note');
    if (home && message) {
      if (!note) { note = document.createElement('p'); note.className = 'site-widget-note'; home.append(note); }
      if (note.textContent !== message) note.textContent = message;
    } else note?.remove();
  };
  // Observe children only and write only changed values, so skin mutations settle.
  const observe = () => {
    root = document.querySelector('#yardimci-asistan-widget');
    if (root && root !== observedRoot) { new MutationObserver(present).observe(root, {childList: true, subtree: true}); observedRoot = root; }
  };
  observe();
  document.addEventListener('gundogdu:public-data', event => {
    if (lightbox?.open) lightbox.close();
    const m = event.detail, b = m.business, c = m.contact;
    stayEnabled = m.stayEnabled; tableEnabled = m.tableEnabled;
    config = {...config, businessName: 'Gündoğdu Pansiyon & Restoran', profileId: '',
      publicSurfaces: [...(stayEnabled ? ['accommodation'] : []), ...(tableEnabled ? ['food_service'] : []), ...(c.map ? ['directions'] : [])],
      requestsEnabled: stayEnabled || tableEnabled, aiEnabled: b.ai_enabled === true,
      whatsappEnabled: Boolean(c.whatsapp), whatsappPhone: c.whatsapp ? c.whatsapp.slice('https://wa.me/'.length) : '', address: c.address, mapUrl: c.map};
    if (configNode) configNode.textContent = JSON.stringify(config);
    widget?.init(config); observe(); present();
  });
  const hydrate = (options) => window.GundogduPublicData?.load(options);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => hydrate(), {once: true});
  else hydrate();
  window.addEventListener('pageshow', event => { if (event.persisted) hydrate(); });
  present();
  setInterval(() => { if (document.visibilityState === 'visible' && !root?.querySelector('.ya-widget-panel') && !document.querySelector('dialog[open]')) hydrate({quiet:true}); }, 15000);
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
