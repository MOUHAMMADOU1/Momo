/* =========================================================
   Animations au défilement : GSAP + ScrollTrigger
   - apparition des blocs (CSS + IntersectionObserver, légère)
   - titres animés mot par mot
   - expérience immersive (épinglée, pilotée par le défilement)
   - ligne lumineuse et étapes de la méthode
   - synchronisation avec la scène 3D
   ========================================================= */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Découpe un titre en mots animés, en conservant les balises internes (ex. <em>) */
function splitWords(root) {
  let index = 0;
  const wrap = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }
          const outer = document.createElement('span');
          outer.className = 'split-word';
          const inner = document.createElement('span');
          inner.textContent = part;
          inner.style.setProperty('--i', index++);
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        wrap(child);
      }
    });
  };
  wrap(root);
}

export function initScrollAnimations({ onSceneChange, onScroll } = {}) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Titres animés mot par mot */
  document.querySelectorAll('[data-split]').forEach(splitWords);

  /* Apparitions à l'entrée dans l'écran (CSS), déclenchées par IntersectionObserver */
  const revealTargets = document.querySelectorAll('[data-reveal], [data-split]');
  if ('IntersectionObserver' in window && !reduce) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* Filets lumineux des sections */
  document.querySelectorAll('.section').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 85%',
      once: true,
      onEnter: () => section.classList.add('is-entered')
    });
  });

  /* Cartes de services : halo qui suit le pointeur */
  document.querySelectorAll('.service-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* Progression de lecture et bouton retour en haut */
  const progressBar = document.getElementById('scroll-progress-bar');
  const toTopFill = document.getElementById('to-top-fill');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const p = self.progress.toFixed(4);
      progressBar?.style.setProperty('--progress', p);
      toTopFill?.style.setProperty('--progress', p);
      onScroll?.(self.progress);
    }
  });

  /* Changement de scène 3D selon la section au centre de l'écran */
  document.querySelectorAll('[data-scene]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        if (self.isActive) onSceneChange?.(section.dataset.scene);
      }
    });
  });

  /* Expérience immersive : section épinglée pilotée par le défilement */
  const experience = document.querySelector('.experience');
  const values = [...document.querySelectorAll('.value')];
  const readoutFill = document.getElementById('readout-fill');
  const readoutValue = document.getElementById('readout-value');
  const readoutModule = document.getElementById('readout-module');
  const beams = [...document.querySelectorAll('.beam')];

  if (experience) {
    ScrollTrigger.create({
      trigger: experience,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const p = self.progress;
        const index = Math.min(values.length - 1, Math.floor(p * values.length));
        values.forEach((v, i) => v.classList.toggle('is-active', i === index));
        readoutFill?.style.setProperty('--scan', p.toFixed(3));
        if (readoutValue) readoutValue.textContent = String(Math.round(p * 100));
        if (readoutModule) readoutModule.textContent = `Module 0${index + 1} / 0${values.length}`;
        beams.forEach((beam, i) => {
          beam.style.setProperty('--beam', clamp(p * 1.4 - i * 0.12, 0, 1).toFixed(3));
        });
      }
    });
  }

  /* Méthode : ligne lumineuse qui se remplit et étapes qui s'allument */
  const stepsWrap = document.getElementById('steps');
  const stepsFill = document.getElementById('steps-line-fill');
  if (stepsWrap && stepsFill) {
    ScrollTrigger.create({
      trigger: stepsWrap,
      start: 'top 60%',
      end: 'bottom 60%',
      onUpdate: (self) => stepsFill.style.setProperty('--line', self.progress.toFixed(3))
    });
  }
  document.querySelectorAll('[data-step]').forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 60%',
      onEnter: () => step.classList.add('is-lit'),
      onLeaveBack: () => step.classList.remove('is-lit')
    });
  });

  /* Recalcule les positions une fois les polices et images chargées */
  window.addEventListener('load', () => ScrollTrigger.refresh());

  return {
    refresh: () => ScrollTrigger.refresh()
  };
}
