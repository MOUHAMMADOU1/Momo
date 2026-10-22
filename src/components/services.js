/* Boutons « Demander une intervention » : préremplissent le formulaire */

export function initServices() {
  const select = document.getElementById('f-type');
  const name = document.getElementById('f-name');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-service]').forEach((button) => {
    button.addEventListener('click', () => {
      const label = button.dataset.service;
      if (select) {
        const option = [...select.options].find((o) => o.value === label);
        select.value = option ? option.value : 'Autre';
      }
      document.getElementById('contact')?.scrollIntoView({
        behavior: reduce ? 'auto' : 'smooth',
        block: 'start'
      });
      setTimeout(() => name?.focus({ preventScroll: true }), reduce ? 0 : 700);
    });
  });
}
