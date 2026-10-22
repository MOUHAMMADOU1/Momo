/* =========================================================
   Point d'entrée Momo Tech
   ========================================================= */
import './style.css';
import { initNavigation } from './components/navigation.js';
import { initServices } from './components/services.js';
import { initContact } from './components/contact.js';
import { initScrollAnimations } from './animations/scroll-animations.js';
import { createLaptopScene } from './scenes/laptop-scene.js';

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPower =
  window.matchMedia('(max-width: 860px)').matches ||
  (navigator.hardwareConcurrency || 8) <= 2 ||
  (navigator.deviceMemory || 8) <= 2;

/* Sécurité : si une partie échoue, le site reste lisible */
function safe(label, fn) {
  try {
    return fn();
  } catch (err) {
    console.error(`[Momo Tech] ${label} :`, err);
    return null;
  }
}

/* Préchargement discret */
const preloader = document.getElementById('preloader');
const preloaderBar = document.getElementById('preloader-bar');
const hidePreloader = () => {
  preloader?.classList.add('is-done');
};
requestAnimationFrame(() => {
  if (preloaderBar) preloaderBar.style.width = '70%';
});
window.addEventListener('load', () => {
  if (preloaderBar) preloaderBar.style.width = '100%';
  setTimeout(hidePreloader, reduceMotion ? 0 : 650);
});
setTimeout(hidePreloader, 3500);

/* Interface */
safe('navigation', initNavigation);
safe('services', initServices);
safe('contact', initContact);

/* Scène 3D */
const canvas = document.getElementById('scene-canvas');
let scene = null;
if (canvas) {
  scene = safe('scène 3D', () =>
    createLaptopScene(canvas, { reducedMotion: reduceMotion, lowPower })
  );
}
if (!scene) {
  root.classList.add('no-webgl');
} else {
  scene.start();
  document.querySelector('.stage')?.classList.add('scene-ready');
}

/* Pointeur : parallaxe douce, désactivée si mouvements réduits */
if (scene && !reduceMotion) {
  let px = 0;
  let py = 0;
  let pending = false;
  window.addEventListener(
    'pointermove',
    (e) => {
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = (e.clientY / window.innerHeight) * 2 - 1;
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          scene.setPointer(px, py);
        });
      }
    },
    { passive: true }
  );
}

/* Animations au défilement, liées à la scène 3D */
safe('animations', () =>
  initScrollAnimations({
    onSceneChange: (key) => scene?.setScene(key),
    onScroll: (p) => scene?.setScroll(p)
  })
);

/* Année du pied de page */
const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

root.classList.add('app-ready');
