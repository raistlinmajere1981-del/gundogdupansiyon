import { createOverlay } from './canvas/core.mjs';
import { giderosScene } from './canvas/gideros.mjs';
import { photoTransform } from './canvas/coordinates.mjs';
const image = document.querySelector('.hero-photo');
const button = document.querySelector('.motion-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const t = source => window.GundogduLanguage?.text(source) || source;
// Temporary test release. Set false to restore the retained natural scene params.
const diagnostic = true;
const scene = giderosScene({diagnostic});
let overlay = null, paused = false, guideOn = false, guide, guideButton;
try { paused = localStorage.getItem('gundogdu-waves') === 'off'; } catch {}
function present() {
  const active = overlay && !overlay.inspect().disposed && !reduced.matches;
  button?.setAttribute('aria-pressed', String(active && !paused));
  if (button) button.textContent = (diagnostic ? 'TEST · MAX · ' : '') + t(paused ? 'Dalga: Kapalı · Aç' : 'Dalga: Açık · Kapat');
  if (guide) guide.toggleAttribute('hidden', !active || paused || !guideOn);
  if (guideButton) { guideButton.hidden = !active || paused; guideButton.setAttribute('aria-pressed', String(guideOn)); }
  if (image && active) image.dataset.water = paused ? 'paused' : 'animated';
}
function makeGuide() {
  const ns = 'http://www.w3.org/2000/svg';
  guide = document.createElementNS(ns, 'svg');
  guide.classList.add('wave-guide'); guide.setAttribute('aria-hidden', 'true');
  const polygon = (points, color, closed = true) => {
    const shape = document.createElementNS(ns, closed ? 'polygon' : 'polyline');
    shape.setAttribute('points', points.map(p => p.join(',')).join(' '));
    shape.setAttribute('fill', closed ? color + '18' : 'none');
    shape.setAttribute('stroke', color); shape.setAttribute('stroke-width', '2');
    shape.setAttribute('vector-effect', 'non-scaling-stroke'); guide.append(shape);
  };
  const [surface, foam] = scene.effects.map(effect => effect.params);
  surface.areas.forEach(area => polygon(area, '#5ceaff'));
  polygon(foam.safeArea, '#ffd36a'); polygon(foam.shoreLine, '#ff937f', false);
  image.parentElement.append(guide);
  guideButton = document.createElement('button'); guideButton.type = 'button';
  guideButton.className = 'wave-guide-toggle';
  guideButton.textContent = t('Etki alanları') + ' · ' + t('Mavi: yüzey · Sarı: köpük · Mercan: kıyı');
  guideButton.addEventListener('click', () => { guideOn = !guideOn; present(); });
  button.after(guideButton);
  const resize = () => {
    const box = image.getBoundingClientRect(), style = getComputedStyle(image);
    const transform = photoTransform({width:box.width,height:box.height,crop:{x:0,y:0,...scene.photo},fit:style.objectFit,objectPosition:style.objectPosition,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight});
    const v = transform.view; guide.setAttribute('viewBox', `${v.x} ${v.y} ${v.width} ${v.height}`);
    guide.setAttribute('preserveAspectRatio','none');
  };
  new ResizeObserver(resize).observe(image); image.addEventListener('load',resize); resize();
}
function start() {
  if (!image || overlay || reduced.matches || navigator.connection?.saveData
      || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2)
      || (navigator.deviceMemory > 0 && navigator.deviceMemory <= 2)) {
    if (image && !overlay) image.dataset.water = 'static';
    return;
  }
  try {
    overlay = createOverlay(image, scene);
    // Keep the effect readable above the dark photographic shade, below hero copy.
    overlay.canvas.style.zIndex = '3';
    if (diagnostic) makeGuide();
    overlay.setEnabled(!paused); present(); button.hidden = false;
    window.gundogduWater = { inspect: () => ({...overlay.inspect(), diagnostic, guideOn}) };
  } catch (error) {
    console.error('Gideros overlay:', error);
    overlay?.destroy();
    image.dataset.water = 'static'; button.hidden = true;
    if (guide) guide.setAttribute('hidden', '');
    if (guideButton) guideButton.hidden = true;
  }
}
if (image) {
  if (image.complete) start(); else image.addEventListener('load', start, { once: true });
  reduced.addEventListener('change', () => {
    if (!reduced.matches) start();
    button.hidden = reduced.matches || !overlay || overlay.inspect().disposed;
    present();
  });
  image.addEventListener('water-static-fallback', () => { button.hidden = true; present(); });
}
button?.addEventListener('click', () => {
  paused = !paused; overlay?.setEnabled(!paused);
  try { localStorage.setItem('gundogdu-waves', paused ? 'off' : 'on'); } catch {}
  present();
});
