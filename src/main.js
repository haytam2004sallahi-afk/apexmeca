import './style.css';

import { initSmoothScroll } from './lib/lenis.js';
import { initNav } from './components/nav.js';
import { initHeroIntro, initScrollReveals } from './components/animations.js';
import { initPortfolio } from './components/portfolio.js';
import { initContactForm } from './components/contactForm.js';
import { HeroScene } from './three/hero-scene.js';
import { getLocalizedContent } from './data/content.js';
import { supabase } from './lib/supabaseClient.js';

function getNestedValue(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object);
}

function renderTranslations(translations, locale) {
  document.documentElement.lang = locale;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const value = getNestedValue(translations, element.dataset.i18n);
    if (value) element.textContent = value;
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    const value = getNestedValue(translations, element.dataset.i18nAriaLabel);
    if (value) element.setAttribute('aria-label', value);
  });
}

function renderServices(services, translations) {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  grid.innerHTML = services.map(
    (s) => `
    <div class="glass glow-hover rounded-lg p-6 flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <span class="font-mono text-xs text-accent-bright/80">${s.code}</span>
        <span class="status-pill ${s.status === 'active' ? 'status-pill--active' : 'status-pill--soon'}">
          ${s.status === 'active' ? translations.status.active : translations.status.soon}
        </span>
      </div>
      <h3 class="font-display text-lg mb-2">${s.title}</h3>
      <p class="text-muted text-sm leading-relaxed flex-1">${s.description}</p>
      <div class="flex flex-wrap gap-1.5 mt-5">
        ${s.tags.map((t) => `<span class="text-[11px] text-muted border border-line rounded px-2 py-1">${t}</span>`).join('')}
      </div>
    </div>`
  ).join('');
}

function renderSoftware(software, translations) {
  const grid = document.getElementById('toolset-grid');
  if (!grid) return;
  grid.innerHTML = software.map(
    (sw) => `
    <div class="glass glow-hover rounded-lg p-6 flex flex-col items-center text-center gap-4">
      <div class="w-14 h-14 flex items-center justify-center rounded-md bg-elevated border border-line">
        <img src="${sw.logo}" alt="${sw.name} logo" class="w-8 h-8 object-contain opacity-90" onerror="this.style.display='none'" />
      </div>
      <div>
        <p class="font-display text-sm">${sw.name}</p>
        <span class="status-pill ${sw.status === 'active' ? 'status-pill--active' : 'status-pill--soon'} mt-2 inline-block">
          ${sw.status === 'active' ? translations.status.active : translations.status.soon}
        </span>
      </div>
    </div>`
  ).join('');
}

function renderExperience(experience) {
  const list = document.getElementById('experience-timeline');
  if (!list) return;
  list.innerHTML = experience.map(
    (e) => `
    <div class="relative">
      <span class="absolute -left-[34px] top-1 w-2.5 h-2.5 rounded-full bg-accent-bright"></span>
      <p class="font-mono text-xs text-accent-bright/80 mb-1">${e.year || e.period || ''}</p>
      <h3 class="font-display text-base mb-1">${e.title}</h3>
      <p class="text-muted text-sm leading-relaxed">${e.description}</p>
    </div>`
  ).join('');
}

async function loadManagedContent(content) {
  const [{ data: experience }, { data: skills }, { data: services }, { data: software }, { data: socialLinks }] = await Promise.all([
    supabase.from('experience').select('*').order('sort_order', { ascending: false }).order('year', { ascending: false }),
    supabase.from('skills').select('*').order('name'),
    supabase.from('services').select('*').order('sort_order'),
    supabase.from('software').select('*').order('sort_order'),
    supabase.from('social_links').select('*').order('sort_order'),
  ]);
  if (experience?.length) renderExperience(experience);
  if (services?.length) renderServices(services, content.translations);
  if (software?.length || skills?.length) {
    renderSoftware((software?.length ? software : skills).map((skill) => ({
      name: skill.name,
      logo: skill.logo_url || skill.logo,
      status: skill.status || 'active',
    })), content.translations);
  }
  socialLinks?.forEach((link) => {
    const element = document.querySelector(`[data-social="${link.slug}"]`);
    if (element && link.url) element.href = link.url;
  });
  const subtext = socialLinks?.find((link) => link.subtext)?.subtext;
  if (subtext) document.getElementById('contact-subtext').textContent = subtext;
  return {
    experience: experience?.length ? experience : content.experience,
    services: services?.length ? services : content.services,
    software: software?.length ? software : content.software,
  };
}

function initHeroCanvas() {
  const wrap = document.getElementById('hero-canvas-wrap') || document.getElementById('hero-3d-canvas');
  if (!wrap) return;
  const scene = new HeroScene(wrap);
  window.addEventListener('beforeunload', () => scene.destroy());
}

document.addEventListener('DOMContentLoaded', () => {
  let locale = localStorage.getItem('apex-meca-locale') || 'en';
  let theme = localStorage.getItem('apex-meca-theme') || 'dark';
  const localized = getLocalizedContent(locale);
  let managedContent = null;

  const track = (eventType, target) => {
    supabase.from('analytics_events').insert({ event_type: eventType, target, path: window.location.pathname }).then(() => {});
  };
  track('page_view', window.location.pathname);
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-social], [data-id], a[href^="#contact"]');
    if (target) track('click', target.dataset.social || target.dataset.id || target.getAttribute('href'));
  });

  function applyLocale(nextLocale) {
    locale = nextLocale === 'fr' ? 'fr' : 'en';
    localStorage.setItem('apex-meca-locale', locale);
    const content = getLocalizedContent(locale);
    renderTranslations(content.translations, locale);
    renderServices(managedContent?.services || content.services, content.translations);
    renderSoftware(managedContent?.software || content.software, content.translations);
    renderExperience(managedContent?.experience || content.experience);
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
      languageToggle.textContent = content.translations.controls.language;
      languageToggle.setAttribute('aria-label', content.translations.controls.languageLabel);
    }
    applyTheme(theme);
    window.dispatchEvent(new CustomEvent('apex:locale-change', { detail: { locale } }));
  }

  function applyTheme(nextTheme) {
    theme = nextTheme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('apex-meca-theme', theme);
    const toggle = document.getElementById('theme-toggle');
    const labels = getLocalizedContent(locale).translations.controls;
    if (toggle) {
      toggle.textContent = theme === 'dark' ? '◐' : '●';
      toggle.setAttribute('aria-label', theme === 'dark' ? labels.themeLight : labels.themeDark);
    }
  }

  renderTranslations(localized.translations, locale);
  renderServices(localized.services, localized.translations);
  renderSoftware(localized.software, localized.translations);
  renderExperience(localized.experience);
  applyTheme(theme);

  initNav({
    getLocale: () => locale,
    getTheme: () => theme,
    onLocaleChange: applyLocale,
    onThemeChange: applyTheme,
  });
  initSmoothScroll();
  initHeroCanvas();
  initHeroIntro();
  initScrollReveals();
  initPortfolio({ getLocale: () => locale });
  initContactForm({ getLocale: () => locale });
  loadManagedContent(localized).then((managed) => { managedContent = managed; }).catch(() => {
    // Keep the bundled CV and software data when the optional admin tables are unavailable.
  });
});