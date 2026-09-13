import { getLocalizedContent } from '../data/content.js';

export function initContactForm({ getLocale = () => 'en' } = {}) {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('contact-status');
  if (!form) return;

  form.querySelectorAll('[data-contact-action]').forEach((button) => button.addEventListener('click', () => {
    const formData = new FormData(form);
    const payload = {
      name: formData.get('name')?.toString().trim(),
      email: formData.get('email')?.toString().trim(),
      message: formData.get('message')?.toString().trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      setStatus(statusEl, getLocalizedContent(getLocale()).translations.contact.required, 'error');
      return;
    }

    if (button.dataset.contactAction === 'whatsapp') {
      const text = `Hello Apex Meca! My name is ${payload.name} (${payload.email}). Project details: ${payload.message}`;
      window.open(`https://wa.me/212681368537?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      setStatus(statusEl, 'WhatsApp message prepared.', 'success');
    } else {
      const subject = `New Project Inquiry from ${payload.name}`;
      const body = `Name: ${payload.name}\nEmail: ${payload.email}\n\nProject Details:\n${payload.message}`;
      window.location.href = `mailto:haytam2004sallahi@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus(statusEl, 'Email draft prepared.', 'success');
    }
  }));
}

function setStatus(el, text, kind) {
  if (!el) return;
  el.textContent = text;
  el.className =
    kind === 'success'
      ? 'text-sm mt-3 text-accent-bright'
      : 'text-sm mt-3 text-red-400';
}
