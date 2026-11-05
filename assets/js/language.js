/* Gundogdu owns UI copy and display selection. Published translations are the only dictionary. */
(() => {
  'use strict';
  const COOKIE = 'gundogdu_site_language';
  const SOURCE_ID = 'gundogdu-site';
  const FLAGS = {tr: '/assets/flags/tr.svg', en: '/assets/flags/en.svg'};
  const EXCLUDED = 'script,style,noscript,[data-public-about],[data-public-rooms],[data-public-tables],[data-public-menu],[data-public-gallery],[data-public-news],[data-public-contact],[data-public-contact-extra],[data-public-content],.map-card,[data-business-structured-data],#widget-config,#yardimci-asistan-widget,[data-no-translate],input,textarea,select';
  const WIDGET_EXCLUDED = 'script,style,noscript,#widget-config,[data-no-translate],input,textarea,select';
  let language = 'tr';
  let locale = 'tr-TR';
  let direction = 'ltr';
  let messages = new Map();
  let available = [];
  let lastLocalization = null;
  const originals = new Map();
  const script = document.currentScript;
  const sourceUrl = script instanceof HTMLScriptElement && script.src
    ? new URL('../i18n/tr.json', script.src)
    : new URL('/assets/i18n/tr.json', location.href);
  let sourcePromise;
  const source = () => (sourcePromise ??= fetch(sourceUrl, {credentials: 'same-origin', cache: 'no-cache'})
    .then(response => response.ok && /application\/json\b/i.test(response.headers.get('content-type') || '') ? response.json() : null)
    .catch(() => null));
  const text = (value, values = {}) => {
    const key = String(value);
    const translated = language === 'tr' ? key : messages.get(key) ?? key;
    return translated.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
  };
  const html = (value, values = {}) => text(value, values).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const localize = (payload, endpoint) => {
    const metadata = payload?.localization;
    if (language === 'tr' || metadata?.version !== 1 || metadata.source_language !== 'tr' || !Array.isArray(metadata.target_languages) || !metadata.target_languages.includes(language)) return payload;
    const row = (kind, record, id, fields) => {
      const result = {...record}, translated = metadata.translations?.[kind]?.[id]?.[language] ?? {};
      for (const field of fields) if (typeof translated[field] === 'string' && translated[field].trim()) result[field] = translated[field];
      return result;
    };
    const result = {...payload};
    const lists = {
      rooms: [['rooms','room','id',['name','description','bed_info','price_note']]],
      tables: [['tables','table','id',['name','description','area']]],
      menu: [['categories','menu_category','id',['name','description']],['items','menu_product','id',['name','description']]],
      catalog: [['categories','catalog_category','id',['name']],['products','catalog_product','product_id',['name','description']]],
      marketing: [['publications','marketing','id',['title','text']]]
    };
    for (const [list, kind, id, fields] of lists[endpoint] ?? []) {
      result[list] = (Array.isArray(payload[list]) ? payload[list] : []).filter(record => record && typeof record === 'object' && !Array.isArray(record)).map(record => row(kind, record, record[id], fields));
    }
    if (endpoint === 'business' && payload.business && typeof payload.business === 'object' && !Array.isArray(payload.business)) {
      const id = Object.keys(metadata.translations?.business ?? {})[0];
      result.business = row('business', payload.business, id, ['description','about_text','directions_note','policy_note','payment_note']);
      result.business.gallery = (Array.isArray(payload.business.gallery) ? payload.business.gallery : []).filter(record => record && typeof record === 'object').map(record => row('gallery', record, record.id, ['title']));
    }
    return result;
  };
  const codes = metadata => {
    if (!metadata || metadata.version !== 1 || metadata.source_language !== 'tr' || !Array.isArray(metadata.languages) || !Array.isArray(metadata.target_languages)) return [];
    const declared = new Map();
    for (const item of metadata.languages) {
      const code = typeof item?.code === 'string' ? item.code : '';
      if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(code) || declared.has(code)) continue;
      declared.set(code, {
        code,
        name: String(item.nativeName || item.name || code),
        locale: String(item.locale || code),
        direction: item.direction === 'rtl' ? 'rtl' : 'ltr'
      });
    }
    const wanted = ['tr', ...metadata.target_languages.filter(code => typeof code === 'string' && code !== 'tr')];
    return [...new Set(wanted)].filter(code => code === 'tr' || declared.has(code)).map(code => declared.get(code) || {code: 'tr', name: 'Türkçe', locale: 'tr-TR', direction: 'ltr'});
  };
  const cookieLanguage = () => document.cookie.split('; ').find(row => row.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1) || '';
  const requested = () => {
    const query = new URLSearchParams(location.search).get('lang') || '';
    const wanted = query || decodeURIComponent(cookieLanguage()) || 'tr';
    return available.some(item => item.code === wanted) ? wanted : 'tr';
  };
  const remember = (node, value, attribute = '') => {
    const key = node;
    if (!originals.has(key)) originals.set(key, new Map());
    const values = originals.get(key);
    if (!values.has(attribute)) values.set(attribute, value);
  };
  const restore = () => {
    for (const [node, values] of originals) {
      for (const [attribute, value] of values) {
        if (attribute) { if (node.isConnected) node.setAttribute(attribute, value); }
        else if (node.isConnected) node.nodeValue = value;
      }
    }
    originals.clear();
  };
  const translateAttributes = (root, excluded) => {
    root.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(node => {
      if (node.closest(excluded)) return;
      for (const attribute of ['aria-label','title','placeholder','alt']) {
        const value = node.getAttribute(attribute);
        const translated = value && messages.get(value.trim());
        if (!translated || translated === value) continue;
        remember(node, value, attribute);
        node.setAttribute(attribute, translated);
      }
    });
  };
  const translateTree = (root, excluded) => {
    if (language === 'tr' || !messages.size || !root) return;
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walk.nextNode())) {
      if (node.parentElement?.closest(excluded)) continue;
      const value = node.nodeValue || '';
      const key = value.trim();
      const translated = key && messages.get(key);
      if (!translated || translated === key) continue;
      remember(node, value);
      const leading = value.match(/^\s*/)?.[0] || '';
      const trailing = value.match(/\s*$/)?.[0] || '';
      node.nodeValue = leading + translated + trailing;
    }
    translateAttributes(root, excluded);
  };
  const translate = (root = document.documentElement) => translateTree(root, EXCLUDED);
  const translateWidget = (root = document.querySelector('#yardimci-asistan-widget')) => translateTree(root, WIDGET_EXCLUDED);
  const updateDocument = () => {
    document.documentElement.lang = language;
    if (direction === 'rtl') document.documentElement.dir = 'rtl';
    else document.documentElement.removeAttribute('dir');
    document.documentElement.dataset.siteLanguage = language;
  };
  const updatePicker = () => {
    const picker = document.querySelector('[data-flag-language]');
    if (!picker) return;
    const enabled = available.length >= 2;
    picker.hidden = !enabled;
    picker.open = false;
    if (!enabled) { picker.setAttribute('inert', ''); return; }
    picker.removeAttribute('inert');
    const label = text('Dil değiştir');
    picker.querySelector('summary')?.setAttribute('aria-label', label);
    picker.querySelector('summary')?.setAttribute('title', label);
    const active = available.find(item => item.code === language) || available[0];
    const cloth = picker.querySelector('[data-language-active]');
    if (cloth) cloth.replaceChildren(...flag(active.code));
    const form = picker.querySelector('[data-language-choices]');
    if (!form) return;
    form.setAttribute('aria-label', label);
    const nodes = [];
    for (const [key, value] of new URLSearchParams(location.search)) {
      if (key === 'lang') continue;
      const input = document.createElement('input'); input.type = 'hidden'; input.name = key; input.value = value; nodes.push(input);
    }
    for (const item of available) {
      const button = document.createElement('button');
      button.type = 'submit'; button.name = 'lang'; button.value = item.code; button.lang = item.code;
      button.className = 'flag-language__choice' + (item.code === language ? ' is-current' : '');
      button.setAttribute('aria-label', item.name);
      button.setAttribute('aria-pressed', String(item.code === language));
      const flagNode = document.createElement('span'); flagNode.className = 'flag-language__cloth'; flagNode.append(...flag(item.code));
      const name = document.createElement('span'); name.className = 'flag-language__name'; name.textContent = item.name;
      button.append(flagNode, name); nodes.push(button);
    }
    form.replaceChildren(...nodes);
    form.onsubmit = event => {
      event.preventDefault();
      const code = event.submitter?.value;
      if (typeof code === 'string' && available.some(item => item.code === code)) choose(code);
    };
  };
  const flag = code => {
    if (!FLAGS[code]) { const text = document.createElement('span'); text.className = 'flag-language__code'; text.textContent = code.toUpperCase(); return [text]; }
    const image = document.createElement('img'); image.src = FLAGS[code]; image.alt = ''; image.width = 34; image.height = 24; image.setAttribute('aria-hidden', 'true');
    return [image];
  };
  const save = code => {
    document.cookie = COOKIE + '=' + encodeURIComponent(code) + '; Path=/; Max-Age=31536000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  };
  const choose = code => {
    if (!available.some(item => item.code === code)) code = 'tr';
    save(code);
    const url = new URL(location.href);
    if (code === 'tr') url.searchParams.delete('lang'); else url.searchParams.set('lang', code);
    history.replaceState(null, '', url);
    location.reload();
  };
  const applyLocalization = async metadata => {
    lastLocalization = metadata;
    const catalog = await source();
    available = codes(metadata);
    language = available.length >= 2 ? requested() : 'tr';
    const selected = available.find(item => item.code === language);
    locale = selected?.locale || (language === 'en' ? 'en-GB' : 'tr-TR');
    direction = selected?.direction || 'ltr';
    messages = new Map();
    if (language !== 'tr' && catalog && catalog.version === 1 && catalog.id === SOURCE_ID && catalog.source_language === 'tr'
      && metadata?.site_catalog?.id === catalog.id && metadata.site_catalog.entries && typeof metadata.site_catalog.entries === 'object') {
      const siteText = metadata.translations?.site_text;
      for (const [key, current] of Object.entries(catalog.entries || {})) {
        const published = metadata.site_catalog.entries[key];
        if (!published || published.text !== current.text || published.hash !== current.hash || typeof current.text !== 'string') continue;
        const translated = siteText?.[catalog.id + ':' + key]?.[language]?.text;
        if (typeof translated !== 'string' || !translated.trim() || translated.trim() === current.text) continue;
        const placeholders = value => [...String(value).matchAll(/\{[a-zA-Z0-9_]+\}/g)].map(match => match[0]).sort().join('|');
        if (placeholders(translated) !== placeholders(current.text)) continue;
        messages.set(current.text, translated.trim());
      }
    }
    restore();
    updateDocument();
    updatePicker();
    translate(document.documentElement);
    return {language, locale, direction, messages: [...messages.keys()]};
  };
  translate(document.documentElement);
  window.GundogduLanguage = {
    get language() { return language; },
    get locale() { return locale; },
    get direction() { return direction; },
    text, html, localize, translate, translateWidget, applyLocalization,
    get availableLanguages() { return available; },
    get localization() { return lastLocalization; }
  };
})();
