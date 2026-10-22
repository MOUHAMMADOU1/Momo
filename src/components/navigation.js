/* Navigation : état au défilement, menu mobile animé, lien actif */

export function initNavigation() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');
  const waFloat = document.getElementById('wa-float');
  const toTop = document.getElementById('to-top');
  if (!nav) return;

  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.classList.toggle('menu-open', open);
  };

  toggle?.addEventListener('click', () => {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu?.classList.contains('is-open')) {
      setMenu(false);
      toggle?.focus();
    }
  });

  /* Pas de menu ouvert sur un écran large */
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  /* Fond de barre et boutons flottants selon la position */
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 24);
    waFloat?.classList.toggle('is-visible', y > 520);
    toTop?.classList.toggle('is-visible', y > 900);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Lien actif selon la section visible */
  const links = [...document.querySelectorAll('.nav__links a[data-nav]')];
  const sections = links
    .map((a) => document.getElementById(a.dataset.nav))
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = links.find((a) => a.dataset.nav === entry.target.id);
          if (link) link.classList.toggle('is-active', entry.isIntersecting);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => observer.observe(s));
  }

  /* Retour en haut */
  toTop?.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
}
