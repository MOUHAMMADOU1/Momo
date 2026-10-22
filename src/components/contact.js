/* =========================================================
   Formulaire → message WhatsApp
   - valide les champs
   - affiche un aperçu et une confirmation avant d'ouvrir WhatsApp
   - ne dit jamais que la demande est envoyée : c'est l'utilisateur
     qui envoie le message depuis WhatsApp
   ========================================================= */

/* Numéro au format international, sans « + » ni espaces */
export const WHATSAPP_NUMBER = '2290197650741';

const FIELDS = {
  name: { id: 'f-name', error: 'f-name-error', label: 'Indiquez votre nom.' },
  contact: { id: 'f-contact', error: 'f-contact-error', label: 'Indiquez un téléphone ou un e-mail.' },
  type: { id: 'f-type', error: 'f-type-error', label: 'Choisissez un type de problème.' },
  description: { id: 'f-desc', error: 'f-desc-error', label: 'Décrivez brièvement le problème.' }
};

export function buildMessage({ name, contact, type, description }) {
  return [
    'Bonjour Momo Tech, je souhaite une assistance.',
    '',
    `Nom : ${name}`,
    `Contact : ${contact}`,
    `Type de problème : ${type}`,
    `Description : ${description}`,
    '',
    'Message préparé depuis le site Momo Tech.'
  ].join('\n');
}

export function buildWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function initContact() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const dialog = document.getElementById('confirm-dialog');
  const preview = document.getElementById('confirm-preview');
  const openLink = document.getElementById('confirm-open');
  const cancel = document.getElementById('confirm-cancel');
  if (!form) return;

  let pendingMessage = '';

  const readValues = () => ({
    name: form.elements.name.value.trim(),
    contact: form.elements.contact.value.trim(),
    type: form.elements.type.value.trim(),
    description: form.elements.description.value.trim()
  });

  const setError = (key, message) => {
    const field = FIELDS[key];
    const input = document.getElementById(field.id);
    const err = document.getElementById(field.error);
    err.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  };

  const validate = (values) => {
    let valid = true;
    Object.keys(FIELDS).forEach((key) => {
      const ok = values[key].length > 0;
      setError(key, ok ? '' : FIELDS[key].label);
      if (!ok) valid = false;
    });
    return valid;
  };

  form.addEventListener('input', (e) => {
    const key = Object.keys(FIELDS).find((k) => FIELDS[k].id === e.target.id);
    if (key && e.target.value.trim()) setError(key, '');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const values = readValues();
    status.textContent = '';
    status.classList.remove('is-success');

    if (!validate(values)) {
      const first = Object.keys(FIELDS).find((k) => !values[k]);
      document.getElementById(FIELDS[first].id)?.focus();
      return;
    }

    pendingMessage = buildMessage(values);
    preview.textContent = pendingMessage;
    openLink.href = buildWhatsAppUrl(pendingMessage);

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      openLink.focus();
    } else {
      window.open(buildWhatsAppUrl(pendingMessage), '_blank', 'noopener');
      status.textContent = 'Si WhatsApp ne s\'est pas ouvert, copiez votre message et envoyez-le manuellement.';
    }
  });

  cancel?.addEventListener('click', () => {
    dialog.close();
    document.getElementById(FIELDS.name.id)?.focus();
  });

  /* Le clic sur « Ouvrir WhatsApp » ouvre un nouvel onglet ; on ferme la fenêtre de confirmation */
  openLink?.addEventListener('click', () => {
    dialog.close();
    status.classList.remove('is-success');
    status.textContent =
      'WhatsApp s\'ouvre dans un nouvel onglet. Si rien ne s\'est ouvert, utilisez le bouton de copie ci-dessous.';
  });

  /* Copie de secours du message */
  if (navigator.clipboard) {
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn--ghost';
    copyBtn.textContent = 'Copier le message';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pendingMessage);
        copyBtn.textContent = 'Message copié';
      } catch (err) {
        copyBtn.textContent = 'Copie impossible, sélectionnez le texte';
      }
    });
    dialog.querySelector('.confirm__actions')?.prepend(copyBtn);
  }

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}
