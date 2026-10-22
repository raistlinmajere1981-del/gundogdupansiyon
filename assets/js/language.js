/* Gundogdu owns UI copy and display selection. Public source objects remain untouched. */
(() => {
  const language = document.documentElement.lang === 'en' ? 'en' : 'tr';
  const locale = language === 'en' ? 'en-GB' : 'tr-TR';
  const words = window.GundogduEnglish || {};
  const text = (source, values = {}) => (language === 'en' ? words[source] ?? source : source)
    .replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(values, key) ? String(values[key]) : match);
  const html = (source, values = {}) => text(source, values).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const localize = (source, endpoint) => {
    const metadata = source?.localization;
    if (language === 'tr' || metadata?.version !== 1 || metadata.source_language !== 'tr' || !Array.isArray(metadata.target_languages) || !metadata.target_languages.includes(language)) return source;
    const row = (kind, record, id, fields) => {
      const result = {...record}, translated = metadata.translations?.[kind]?.[id]?.[language] ?? {};
      for (const field of fields) if (typeof translated[field] === 'string' && translated[field].trim()) result[field] = translated[field];
      return result;
    };
    const result = {...source};
    const lists = {
      rooms: [['rooms','room','id',['name','description','bed_info','price_note']]],
      tables: [['tables','table','id',['name','description','area']]],
      menu: [['categories','menu_category','id',['name','description']],['items','menu_product','id',['name','description']]],
      catalog: [['categories','catalog_category','id',['name']],['products','catalog_product','product_id',['name','description']]],
      marketing: [['publications','marketing','id',['title','text']]]
    };
    for (const [list,kind,id,fields] of lists[endpoint] ?? []) {
      result[list] = (Array.isArray(source[list]) ? source[list] : []).filter(record => record && typeof record === 'object' && !Array.isArray(record)).map(record => row(kind,record,record[id],fields));
    }
    if (endpoint === 'business' && source.business && typeof source.business === 'object' && !Array.isArray(source.business)) {
      const id = Object.keys(metadata.translations?.business ?? {})[0];
      result.business = row('business',source.business,id,['description','about_text','directions_note','policy_note','payment_note']);
      result.business.gallery = (Array.isArray(source.business.gallery) ? source.business.gallery : []).filter(record => record && typeof record === 'object').map(record => row('gallery',record,record.id,['title']));
    }
    return result;
  };
  const translate = (root = document.body) => {
    if (language !== 'en') return;
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walk.nextNode())) {
      if (node.parentElement.closest('script,style,[data-public-content],#yardimci-asistan-widget')) continue;
      const key = node.textContent.trim();
      if (words[key]) node.textContent = node.textContent.replace(key, words[key]);
    }
    root.querySelectorAll('[aria-label], [title], meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach(node => {
      for (const attr of ['aria-label','title','content']) {
        const value = node.getAttribute(attr); if (words[value]) node.setAttribute(attr,words[value]);
      }
    });
  };
  translate(document.documentElement);
  window.GundogduLanguage = {language,locale,text,html,localize,translate};
})();
