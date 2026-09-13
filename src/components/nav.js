export function initNav({ onLocaleChange, onThemeChange, getLocale, getTheme } = {}) {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu-mobile');
  const header = document.getElementById('site-header');
  const languageToggle = document.getElementById('language-toggle');
  const themeToggle = document.getElementById('theme-toggle');

  toggle?.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('flex');
    menu.classList.toggle('hidden');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  menu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (!menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        menu.classList.remove('flex');
        toggle?.setAttribute('aria-expanded', 'false');
      }
    });
  });

  languageToggle?.addEventListener('click', () => {
    onLocaleChange?.(getLocale?.() === 'fr' ? 'en' : 'fr');
  });

  themeToggle?.addEventListener('click', () => {
    onThemeChange?.(getTheme?.() === 'light' ? 'dark' : 'light');
  });

  if (header) {
    let lastState = false;
    const onScroll = () => {
      const scrolled = window.scrollY > 24;
      if (scrolled !== lastState) {
        header.classList.toggle('bg-void/80', scrolled);
        header.classList.toggle('backdrop-blur-md', scrolled);
        header.classList.toggle('border-line', scrolled);
        lastState = scrolled;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}
