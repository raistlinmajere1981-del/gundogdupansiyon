(() => {
  'use strict';
  const {text:t, locale, localize} = window.GundogduLanguage;
  const endpoints = ['business', 'rooms', 'tables', 'menu', 'marketing'];
  const canonicalOrigin = 'https://yardimciasistangunduodu.alwaysdata.net';
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const text = value => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  const rows = value => Array.isArray(value) && value.every(object);
  const enabled = payload => payload?.enabled === undefined || payload.enabled === true;
  const namedRows = value => rows(value) && value.every(row => text(row.id) && text(row.name));
  const number = value => (typeof value === 'number' || typeof value === 'string' && value.trim() !== '') && Number.isFinite(Number(value));
  const el = (tag, className = '', content = '') => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text(content);
    return node;
  };
  const icon = name => document.querySelector('#public-icons')?.content.querySelector(`[data-icon="${name}"] svg`)?.cloneNode(true) || el('span');
  const https = value => {
    const raw = text(value);
    if (!raw || /[\s\x00-\x1f\x7f]/.test(raw)) return '';
    try { const url = new URL(raw); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; }
  };
  const media = value => {
    let raw = text(value);
    for (const origin of [canonicalOrigin, location.origin]) if (raw.startsWith(origin + '/')) raw = raw.slice(origin.length);
    return /^\/yardimci-asistan\/media\/[A-Za-z0-9_./-]+$/.test(raw) && !/(?:^|\/)\.{1,2}(?:\/|$)/.test(raw) ? raw : '';
  };
  // Only menu product images may use canonical published JPEG/PNG/WebP data URLs.
  // No SVG/HTML data payloads, arbitrary protocols or oversized inline images.
  const menuImageUrl = value => {
    const raw = text(value);
    if (/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(raw) && raw.length <= 5000000) return raw;
    return media(raw);
  };
  function link(label, href, className = 'text-link', external = false) {
    const node = el('a', className, label); node.href = href;
    if (external) { node.target = '_blank'; node.rel = 'noopener'; }
    return node;
  }
  function image(url, alt, width, height) {
    const node = el('img'); node.src = url; node.alt = text(alt); node.width = width; node.height = height; node.loading = 'lazy'; return node;
  }
  function photoButton(url, caption, className = '') {
    const node = el('button', className); node.type = 'button'; node.dataset.lightbox = url; node.dataset.caption = caption;
    node.setAttribute('aria-label', t('{0} fotoğrafını büyüt', {0:caption})); return node;
  }
  function price(amount, currency, divisor = 1) {
    if (!number(amount) || Number(amount) < 0 || !/^[A-Z]{3}$/.test(text(currency))) return '';
    return (Number(amount) / divisor).toLocaleString(locale, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ' + (currency === 'TRY' ? '₺' : currency);
  }
  function contact(b) {
    const phone = text(b.phone), digits = phone.replace(/[\s().-]+/g, ''), wa = text(b.whatsapp).replace(/[\s()+.-]+/g, '');
    const c = {phone, tel: /^\+?[0-9]{5,20}$/.test(digits) ? 'tel:' + digits : '', address: text(b.address), note: text(b.directions_note),
      whatsapp: b.whatsapp_enabled === true && /^[1-9][0-9]{6,14}$/.test(wa) ? 'https://wa.me/' + wa : '',
      email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(text(b.email)) ? text(b.email) : '', map: '', embed: '', attribution: false};
    if (number(b.latitude) && number(b.longitude) && Math.abs(Number(b.latitude)) <= 90 && Math.abs(Number(b.longitude)) <= 180) {
      c.lat = Number(b.latitude); c.lon = Number(b.longitude);
      const bbox = [c.lon - .009, c.lat - .006, c.lon + .009, c.lat + .006].map(n => n.toFixed(6)).join(',');
      c.map = `https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lon}#map=16/${c.lat}/${c.lon}`;
      c.embed = 'https://www.openstreetmap.org/export/embed.html?bbox=' + encodeURIComponent(bbox) + '&layer=mapnik&marker=' + encodeURIComponent(c.lat.toFixed(6) + ',' + c.lon.toFixed(6));
      c.attribution = true;
    } else if (c.address) c.map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.address);
    c.map = https(b.map_url) || c.map;
    const google = https(b.googleMapsEmbedUrl);
    if (b.mapDisplayMode === 'google_maps_embed' && google) {
      const url = new URL(google);
      if (['google.com', 'www.google.com', 'google.com.tr', 'www.google.com.tr'].includes(url.hostname) && /^\/maps\/embed(?:\/|$)/.test(url.pathname)) {
        c.embed = google; c.attribution = false;
      }
    }
    return c;
  }
  function model(payloads) {
    const p = Object.fromEntries(endpoints.map((key, i) => [key, payloads[i]]));
    const b = enabled(p.business) && object(p.business?.business) && Array.isArray(p.business.business.public_surfaces)
      && p.business.business.public_surfaces.every(value => typeof value === 'string') && typeof p.business.business.requests_enabled === 'boolean' ? p.business.business : {};
    const has = surface => b.public_surfaces?.includes(surface) === true;
    const catalog = kind => has(kind === 'rooms' ? 'rooms' : 'restaurant') && p[kind]?.enabled === true && namedRows(p[kind][kind]) ? p[kind][kind] : [];
    const rooms = catalog('rooms'), tables = catalog('tables');
    // The canonical public menu API omits enabled on 200; disabled publications return 404.
    const menuVisible = Boolean(p.menu && enabled(p.menu) && (has('menu') || has('qr_menu')));
    const menu = menuVisible && namedRows(p.menu?.categories) && namedRows(p.menu?.items) ? p.menu : {categories: [], items: []};
    const news = b.public_surfaces && enabled(p.marketing) && rows(p.marketing?.publications) ? p.marketing.publications.filter(item => text(item.id) && text(item.title) && item.published === true && item.placement === 'homepage_feature' && (!item.channel || item.channel === 'website')).slice(0, 6) : [];
    const gallery = rows(b.gallery) ? b.gallery.map(photo => ({url: media(photo.url), title: text(photo.title) || t('İşletmeden bir kare')})).filter(photo => photo.url).slice(0, 80) : [];
    return {business: b, rooms, tables, menu, news, gallery, contact: contact(b), menuUnavailable: !p.menu, menuEnabled: menuVisible,
      stayEnabled: b.requests_enabled === true && has('accommodation') && rooms.length > 0,
      tableEnabled: b.requests_enabled === true && has('food_service') && tables.length > 0};
  }
  // Each slot starts with real server-rendered, branded fallback content. No persisted snapshot.
  const fallback = new Map();
  const slots = '[data-public-rooms], [data-public-menu], [data-public-tables], [data-public-gallery], [data-public-contact], [data-public-contact-extra], .map-card';
  document.querySelectorAll(slots).forEach(node => fallback.set(node, [...node.childNodes].map(child => child.cloneNode(true))));
  const restore = node => node.replaceChildren(...fallback.get(node).map(child => child.cloneNode(true)));
  const about = document.querySelector('[data-public-about]'), aboutFallback = about?.textContent;
  const galleryHeading = document.querySelector('#fotograflar h2'), galleryAside = document.querySelector('#fotograflar .section-aside p');
  const headingFallback = galleryHeading?.cloneNode(true), asideFallback = galleryAside?.textContent;
  function booking(label, kind, row, enabled) {
    const node = link(enabled ? label : t('Bilgi alın'), enabled ? '/iletisim/#rezervasyon' : '/iletisim/');
    if (enabled) {
      node.dataset.yaAction = kind === 'rooms' ? 'accommodation.reserve' : 'food.reserve';
      node.dataset.yaResourceType = kind === 'rooms' ? 'room' : 'table';
      node.dataset.yaResourceId = text(row.id); node.dataset.yaResourceName = text(row.name);
    }
    node.append(icon('arrow')); return node;
  }
  function render(m) {
    const {business: b, contact: c} = m;
    fallback.forEach((_, node) => restore(node));
    if (about) about.textContent = text(b.about_text) || aboutFallback;
    document.querySelectorAll('[data-public-rooms]').forEach(slot => {
      const rooms = slot.dataset.full === 'true' ? m.rooms : m.rooms.slice(0, 3);
      if (!rooms.length) return;
      const grid = el('div', 'room-grid');
      for (const room of rooms) {
        const card = el('article', 'room-card'), body = el('div', 'room-body');
        const cover = rows(room.media) ? room.media.find(photo => ['cover', 'photo'].includes(photo.kind) && media(photo.url)) : null;
        if (cover) { const button = link('', '/odalar/oda/?id=' + encodeURIComponent(room.id), 'room-image'); button.append(image(media(cover.url), room.name, 600, 420)); card.append(button); }
        else { const placeholder = el('div', 'room-image placeholder-photo'); placeholder.append(icon('bed'), el('span', '', t('Oda fotoğrafı henüz yayınlanmadı'))); card.append(placeholder); }
        body.append(el('p', 'eyebrow', number(room.capacity) && Number(room.capacity) > 0 ? text(room.capacity) + ' ' + t('KİŞİ') : t('KONAKLAMA')), (() => { const h = el('h3'); h.append(link(room.name, '/odalar/oda/?id=' + encodeURIComponent(room.id), '')); return h; })(), el('p', 'public-multiline', room.description));
        if (text(room.bed_info)) body.append(el('p', 'room-meta', room.bed_info));
        const cost = price(room.nightly_price_minor, room.currency, 100);
        if (cost) { const node = el('p', 'price', cost); node.append(el('small', '', t(' / gece'))); body.append(node); }
        if (text(room.price_note)) body.append(el('p', 'fine-print', room.price_note));
        body.append(booking(t('Konaklamayı planlayın'), 'rooms', room, m.stayEnabled)); card.append(body); grid.append(card);
      }
      slot.replaceChildren(grid);
    });
    document.querySelectorAll('[data-public-tables]').forEach(slot => {
      if (!m.tables.length) return;
      const grid = el('div', 'table-grid');
      for (const table of m.tables) {
        const card = el('article', 'table-card');
        const anchor = link('', '/restoran/masa/?id=' + encodeURIComponent(table.id), 'table-detail-link');
        const photos = (Array.isArray(table.media) ? table.media : []).filter(p => p && media(p.url));
        const cover = ['cover','photo'].map(kind => photos.filter(p => p.kind === kind).sort((a,b) => Number(a.sort_order || 0)-Number(b.sort_order || 0))[0]).find(Boolean);
        const placeholder = el('span', 'table-image placeholder-photo', t('Masa fotoğrafı henüz yayınlanmadı'));
        if (cover) {
          const photo = image(media(cover.url), table.name, 600, 420);
          photo.className = 'table-image';
          photo.addEventListener('error', () => photo.replaceWith(placeholder), {once:true});
          anchor.append(photo);
        } else anchor.append(placeholder);
        const body = el('div', 'table-body');
        body.append(el('h3', '', table.name), el('p', 'public-multiline', table.description), el('p', 'room-meta', [text(table.area), number(table.capacity) && Number(table.capacity) > 0 ? text(table.capacity) + ' ' + t('kişi') : ''].filter(Boolean).join(' · ')), el('span', 'text-link', t('Masa detayları')));
        anchor.append(body); card.append(anchor); grid.append(card);
      }
      slot.replaceChildren(grid);
    });
    document.querySelectorAll('[data-public-menu]').forEach(slot => {
      const groups = [];
      for (const category of m.menu.categories) {
        const items = m.menu.items.filter(item => item.category_id === category.id && (item.is_available === undefined || item.is_available === true));
        if (!items.length) continue;
        const group = el('div', 'menu-category'), grid = el('div', 'menu-grid'); group.append(el('h3', '', category.name));
        if (text(category.description)) group.append(el('p', '', category.description));
        for (const item of items) {
          const card = el('article', 'menu-item'), copy = el('div'), url = media(item.image_url);
          if (url) card.append(image(url, item.name, 100, 100));
          copy.append(el('h4', '', item.name), el('p', '', item.description)); card.append(copy);
          const cost = price(item.price, item.currency); if (cost) card.append(el('strong', 'menu-price', cost)); grid.append(card);
        }
        group.append(grid); groups.push(group);
      }
      if (groups.length) slot.replaceChildren(...groups);
    });
    const news = document.querySelector('[data-public-news]');
    if (news) {
      news.querySelector('.news-grid')?.remove(); news.hidden = m.news.length === 0;
      if (m.news.length) {
        const grid = el('div', 'news-grid');
        for (const publication of m.news) {
          const card = el('article'), cover = rows(publication.images) ? publication.images.find(item => media(item.url)) : null;
          if (cover) card.append(image(media(cover.url), cover.altText, 700, 420));
          card.append(el('h3', '', publication.title), el('p', 'public-multiline', publication.text)); grid.append(card);
        }
        news.append(grid);
      }
    }
    document.querySelectorAll('[data-public-gallery]').forEach(grid => {
      grid.replaceChildren(el('p', 'gallery-note', t('İşletme fotoğrafları henüz yayınlanmadı.')));
      if (m.gallery.length) {
        grid.replaceChildren();
        const figures = m.gallery.slice(0, grid.dataset.full === 'true' ? 80 : 4).map(photo => {
          const figure = el('figure', 'gallery-item'), button = photoButton(photo.url, photo.title), expand = el('span', 'gallery-expand'), caption = el('figcaption');
          figure.dataset.galleryKind = 'business'; expand.append(icon('plus')); button.append(image(photo.url, photo.title, 900, 650), expand);
          caption.append(el('span', '', photo.title), el('small', '', t('İŞLETMEDEN'))); figure.append(button, caption); return figure;
        });
        grid.prepend(...figures);
      }
    });
    if (galleryHeading) { galleryHeading.replaceChildren(...[...headingFallback.childNodes].map(node => node.cloneNode(true))); if (m.gallery.length) galleryHeading.textContent = t('Gündoğdu’dan kareler.'); }
    if (galleryAside) galleryAside.textContent = m.gallery.length ? t('İşletmemizin yayınladığı fotoğraflar.') : asideFallback;
    document.querySelectorAll('[data-gallery-filter]').forEach(button => {
      button.hidden = button.dataset.galleryFilter === 'business' && !m.gallery.length;
      const active = button.dataset.galleryFilter === 'all'; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active));
    });
    const galleryNote = document.querySelector('.gallery-note'); if (galleryNote) galleryNote.hidden = m.gallery.length > 0;
    document.querySelectorAll('[data-public-contact]').forEach(list => {
      const entries = [];
      for (const [label, value, href, symbol] of [['TELEFON', c.phone, c.tel, 'phone'], ['E-POSTA', c.email, c.email ? 'mailto:' + c.email : '', 'mail'], ['WHATSAPP', 'Mesaj gönderin', c.whatsapp, 'phone'], ['ADRES', c.address, '', 'pin']]) {
        if (label === 'ADRES' ? !value : !href) continue;
        const row = href ? link('', href, '', label === 'WHATSAPP') : el('div'), copy = el('span');
        copy.append(el('small', '', t(label)), el('strong', '', value)); row.append(icon(symbol), copy); if (href) row.append(icon('arrow')); entries.push(row);
      }
      if (entries.length) list.replaceChildren(...entries);
    });
    document.querySelectorAll('[data-public-contact-extra]').forEach(extra => {
      extra.replaceChildren();
      if (c.note) extra.append(el('p', 'fine-print public-multiline', c.note));
      if (c.map) { const node = link(t('Yol tarifi alın'), c.map, 'text-link', true); node.append(icon('arrow')); extra.append(node); }
      const socials = el('div', 'social-links');
      if (rows(b.social_links)) for (const social of b.social_links) { const url = https(social.url); if (url) socials.append(link((text(social.platform) || 'Sosyal medya') + ' ↗', url, '', true)); }
      extra.append(socials);
    });
    document.querySelectorAll('.map-card').forEach(card => {
      if (!c.embed) return;
      const frame = el('iframe'); frame.title = 'İşletmenin yayınlanmış harita konumu'; frame.src = c.embed; frame.loading = 'lazy'; frame.referrerPolicy = 'no-referrer'; frame.allowFullscreen = true;
      card.replaceChildren(frame);
      if (c.attribution) card.append(link(t('© OpenStreetMap katkıda bulunanlar'), 'https://www.openstreetmap.org/copyright', 'map-attribution', true));
    });
    const policies = document.querySelector('[data-public-policies]');
    if (policies) {
      const copy = policies.querySelector('div'); copy.replaceChildren();
      for (const [key, label] of [['policy_note', 'Konaklama koşulları'], ['payment_note', 'Ödeme bilgileri']]) if (text(b[key])) copy.append(el('h3', '', label), el('p', 'public-multiline', b[key]));
      policies.hidden = !copy.childNodes.length;
    }
    document.body.dataset.stayEnabled = String(m.stayEnabled); document.body.dataset.tableEnabled = String(m.tableEnabled);
    document.querySelectorAll('[data-booking-kind]').forEach(node => { node.dataset.yaAction = node.dataset.bookingKind === 'rooms' && m.stayEnabled ? 'accommodation.reserve' : node.dataset.bookingKind === 'tables' && m.tableEnabled ? 'food.reserve' : 'home'; });
    const enabled = m.stayEnabled || m.tableEnabled;
    document.querySelectorAll('[data-reservation-copy]').forEach(node => { node.textContent = t(enabled ? 'Tarihlerinizi seçin, ziyaret talebinizi birlikte planlayalım.' : 'Ziyaretinizi planlamak için güncel seçenekleri keşfedin.'); });
    document.querySelectorAll('[data-visit-copy]').forEach(node => { node.textContent = t(enabled ? 'Asistandan tarih ve kişi bilgilerini iletebilirsiniz. Talebiniz, işletme onayı ile kesinleşir.' : 'Online oda ve masa talebi şu anda açık değil. Yayınlanan iletişim kanalları üzerinden bilgi alabilirsiniz.'); });
    const structured = {'@context': 'https://schema.org', '@type': 'LodgingBusiness', name: 'Gündoğdu Pansiyon & Restoran', url: canonicalOrigin, logo: canonicalOrigin + '/assets/brand/mark.svg'};
    if (c.tel) structured.telephone = c.tel.slice(4);
    if (c.address) structured.address = {'@type': 'PostalAddress', streetAddress: c.address};
    if (c.lat !== undefined) structured.geo = {'@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lon};
    if (c.map) structured.hasMap = c.map;
    if (rows(b.social_links)) { const urls = b.social_links.map(social => https(social.url)).filter(Boolean); if (urls.length) structured.sameAs = urls; }
    if (m.gallery.length) structured.image = m.gallery.map(photo => canonicalOrigin + photo.url);
    if (text(b.description)) { structured.description = b.description; document.querySelector('meta[name=description]')?.setAttribute('content', b.description); }
    const seo = document.querySelector('[data-business-structured-data]'); if (seo) seo.textContent = JSON.stringify(structured);
    document.querySelectorAll('[data-menu-link]').forEach(node => { node.hidden = !m.menuEnabled; });
    document.dispatchEvent(new CustomEvent('gundogdu:public-data', {detail: m}));
  }
  async function read(name, signal) {
    try {
      const response = await fetch('/yardimci-asistan/api/' + name + '.php', {method: 'GET', headers: {Accept: 'application/json'}, credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal});
      if (response.status !== 200 || !/application\/json\b/i.test(response.headers.get('content-type') || '')) return null;
      const reader = response.body.getReader(); const chunks = []; let size = 0;
      while (true) {
        const {done, value} = await reader.read(); if (done) break;
        size += value.byteLength; if (size > 2097152) { await reader.cancel(); return null; } chunks.push(value);
      }
      const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const payload = JSON.parse(new TextDecoder().decode(bytes)); return object(payload) && payload.ok === true ? payload : null;
    } catch { return null; }
  }
  let inFlight, lastSnapshot;
  function load({quiet = false} = {}) {
    if (inFlight) return inFlight;
    if (!quiet) { render(model([])); document.body.dataset.publicState = 'loading'; }
    inFlight = (async () => {
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 7000);
      try { const m = model(await Promise.all(endpoints.map(async name => localize(await read(name, controller.signal), name)))); const snapshot = JSON.stringify(m); if (!quiet || snapshot !== lastSnapshot) render(m); lastSnapshot = snapshot; document.body.dataset.publicState = 'ready'; return m; }
      finally { clearTimeout(timeout); inFlight = null; }
    })();
    return inFlight;
  }
  window.GundogduPublicData = {load, mediaUrl: media, menuImageUrl};
})();
