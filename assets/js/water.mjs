import { createOverlay } from './canvas/core.mjs';
import { giderosScene } from './canvas/gideros.mjs';
const image = document.querySelector('.hero-photo');
const button = document.querySelector('.motion-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let overlay = null, paused = false;
function start() {
  if (!image || overlay || reduced.matches || navigator.connection?.saveData
      || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2)
      || (navigator.deviceMemory > 0 && navigator.deviceMemory <= 2)) return;
  try {
    overlay = createOverlay(image, giderosScene());
    image.dataset.water = 'animated'; button.hidden = false;
    window.gundogduWater = { inspect: () => overlay?.inspect() };
  } catch {
    image.dataset.water = 'static'; button.hidden = true;
  }
}
if (image) {
  if (image.complete) start(); else image.addEventListener('load', start, { once: true });
  reduced.addEventListener('change', () => {
    if (!reduced.matches) start();
    button.hidden = reduced.matches || !overlay;
  });
  image.addEventListener('water-static-fallback', () => { button.hidden = true; });
}
button?.addEventListener('click', () => {
  paused = !paused; overlay?.setEnabled(!paused);
  button.setAttribute('aria-pressed', String(paused));
  button.textContent = paused ? 'Dalga hareketini başlat' : 'Dalga hareketini durdur';
});
