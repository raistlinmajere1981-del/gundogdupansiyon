// Gündoğdu-owned in-page photo viewer. Reuses the live panorama canvas
// instead of starting another WebGL context or requesting fullscreen.
const photoSelector = [
  '.resource-detail-cover img', '.room-media-item img',
  '.gallery figure img', '.announcement-media img',
  '.announcement-preview-image', '.menu-list .menu-image',
  '.region-section figure img', '.gundogdu-hero .hero-photo'
].join(', ');

export function mountMediaViewer({language} = {}) {
  const main = document.getElementById('content');
  if (!main || main.dataset.gdMediaReady === '1') return;
  const photos = [...main.querySelectorAll(photoSelector)];
  const items = [];
  const seen = new Set();
  for (const img of photos) {
    const host = img.closest('[data-panorama]') || img;
    if (seen.has(host) || !img.getAttribute('src')) continue;
    seen.add(host);
    const anchor = img.closest('a');
    const button = img.closest('[data-gd-media-trigger]');
    if (anchor && anchor.contains(img)) anchor.removeAttribute('target');
    items.push({host, img, anchor, button, panorama: host !== img,
      title: img.getAttribute('alt') || host.dataset.label || ''});
  }
  if (!items.length) return;
  // Retire native fullscreen controls injected later by the shared panorama module.
  // The original WebGL canvas and its pointer/keyboard listeners stay intact.
  const panoramaObservers = [];
  for (const item of items.filter(entry => entry.panorama)) {
    const removeFullscreen = () => item.host.querySelectorAll('[data-panorama-expand]').forEach(button => button.remove());
    const observer = new MutationObserver(removeFullscreen);
    observer.observe(item.host, {childList:true});
    removeFullscreen();
    panoramaObservers.push(observer);
  }
  main.dataset.gdMediaReady = '1';
  const translate = key => language?.text('theme.gundogdu.media.' + key) || '';
  const labels = {viewer:translate('viewer'), close:translate('close'), previous:translate('previous'),
    next:translate('next'), image:translate('image')};
  const dialog = document.createElement('dialog');
  dialog.className = 'gd-media-dialog';
  dialog.setAttribute('aria-label', labels.viewer);
  const shell = document.createElement('div'); shell.className = 'gd-media-shell';
  const toolbar = document.createElement('div'); toolbar.className = 'gd-media-toolbar';
  const title = document.createElement('span'); title.className = 'gd-media-title';
  const counter = document.createElement('span'); counter.className = 'gd-media-counter';
  const previous = document.createElement('button'); previous.type = 'button';
  previous.className = 'gd-media-previous'; previous.textContent = '←';
  previous.setAttribute('aria-label', labels.previous);
  const next = document.createElement('button'); next.type = 'button';
  next.className = 'gd-media-next'; next.textContent = '→';
  next.setAttribute('aria-label', labels.next);
  const close = document.createElement('button'); close.type = 'button';
  close.className = 'gd-media-close'; close.textContent = labels.close;
  toolbar.append(title, counter, previous, next, close);
  const stage = document.createElement('div'); stage.className = 'gd-media-stage';
  shell.append(toolbar, stage); dialog.append(shell); document.body.append(dialog);
  let selected = -1, placeholder = null, restoreFocus = null;
  let pointer = null;

  function restorePanorama() {
    if (placeholder) {
      const host = stage.querySelector('[data-panorama]');
      if (host) {host.classList.remove('gd-media-panorama-active');placeholder.replaceWith(host);}
      else placeholder.remove();
      placeholder = null;
    }
    stage.replaceChildren();
  }
  function show(index) {
    if (index < 0 || index >= items.length) return;
    restorePanorama();
    selected = index;
    const item = items[index];
    title.textContent = item.title || labels.image;
    counter.textContent = items.length > 1 ? String(index + 1) + ' / ' + String(items.length) : '';
    previous.hidden = next.hidden = items.length < 2;
    if (item.panorama) {
      placeholder = document.createComment('Gündoğdu panorama location');
      item.host.before(placeholder);
      item.host.classList.add('gd-media-panorama-active');
      stage.append(item.host);
    } else {
      const displayed = item.img.cloneNode(false);
      displayed.removeAttribute('srcset');
      displayed.removeAttribute('sizes');
      displayed.src = item.img.getAttribute('src');
      displayed.alt = item.title;
      displayed.loading = 'eager';
      displayed.decoding = 'async';
      stage.append(displayed);
    }
  }
  function open(index, trigger) {
    if (!dialog.open) {
      restoreFocus = trigger;
      dialog.showModal();
      document.body.classList.add('gd-media-open');
    }
    show(index);
    close.focus({preventScroll: true});
  }
  function closeViewer() { if (dialog.open) dialog.close(); }
  close.addEventListener('click', closeViewer);
  previous.addEventListener('click', () => show((selected - 1 + items.length) % items.length));
  next.addEventListener('click', () => show((selected + 1) % items.length));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeViewer();
  });
  dialog.addEventListener('keydown', event => {
    if (event.target.closest('[data-panorama]')) return; // arrows rotate the panorama
    if (event.key === 'ArrowLeft' && items.length > 1) {event.preventDefault();show((selected - 1 + items.length) % items.length);}
    if (event.key === 'ArrowRight' && items.length > 1) {event.preventDefault();show((selected + 1) % items.length);}
  });
  dialog.addEventListener('close', () => {
    restorePanorama();
    document.body.classList.remove('gd-media-open');
    selected = -1;
    if (restoreFocus?.isConnected) restoreFocus.focus({preventScroll:true});
    restoreFocus = null;
  });
  const pointerDistance = event => {
    if (!pointer) return 0;
    return Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y);
  };
  const openFromEvent = (event, index, trigger) => {
    if (event.type === 'click' && pointer?.moved) {pointer = null;event.preventDefault();return;}
    event.preventDefault();
    pointer = null;
    open(index, trigger);
  };
  for (const [index, item] of items.entries()) {
    const target = item.panorama ? item.host : item.button || item.anchor || item.img;
    if (!item.button && !item.anchor && !item.panorama) {
      item.img.tabIndex = 0; item.img.setAttribute('role', 'button');
    }
    if (item.panorama) {item.host.tabIndex = 0; item.host.setAttribute('role','button');}
    target.classList.add('gd-media-trigger');
    if (item.panorama) {
      target.addEventListener('pointerdown', event => {pointer = {x:event.clientX,y:event.clientY,moved:false};}, true);
      target.addEventListener('pointermove', event => {if (pointer && pointerDistance(event) > 9) pointer.moved = true;}, true);
      target.addEventListener('pointercancel', () => {pointer = {moved:true};}, true);
    }
    target.addEventListener('click', event => {
      if (dialog.open || event.target.closest('.panorama-expand')) return;
      openFromEvent(event, index, item.anchor || item.host);
    });
    target.addEventListener('keydown', event => {
      if (event.target !== target || event.key !== 'Enter' && event.key !== ' ') return;
      if (item.anchor && event.key === 'Enter') return; // native anchor click
      event.preventDefault(); open(index, target);
    });
    // The old figcaption pointed at raw media in a new tab. Reuse the viewer.
    const captionLink = item.host.closest('figure')?.querySelector('figcaption a');
    if (captionLink && captionLink.getAttribute('href') === item.img.getAttribute('src')) {
      captionLink.removeAttribute('target');
      captionLink.addEventListener('click', event => openFromEvent(event, index, captionLink));
    }
  }
  window.addEventListener('pagehide', () => {closeViewer();panoramaObservers.forEach(observer => observer.disconnect());});
}

// Independent site-owned entry: do not depend on a cached shared theme module.
const context = document.getElementById('site-context');
if (context) {
  const messages = JSON.parse(context.textContent || '{}').language?.messages || {};
  mountMediaViewer({language:{text:key=>messages[key] || key}});
}
