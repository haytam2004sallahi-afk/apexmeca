import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initHeroIntro() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('#hero-eyebrow', { opacity: 0, y: 12, duration: 0.6 })
    .from('#hero-heading .line', { opacity: 0, y: 28, duration: 0.8, stagger: 0.12 }, '-=0.3')
    .from('#hero-sub', { opacity: 0, y: 16, duration: 0.7 }, '-=0.4')
    .from('#hero-cta', { opacity: 0, y: 16, duration: 0.6 }, '-=0.45')
    .from('#hero-canvas-wrap', { opacity: 0, scale: 0.94, duration: 1 }, '-=0.9');
  return tl;
}

export function initScrollReveals() {
  const sections = document.querySelectorAll('[data-reveal]');
  sections.forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 24,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });
  });

  const rows = document.querySelectorAll('[data-reveal-stagger]');
  rows.forEach((row) => {
    const items = row.children;
    gsap.from(items, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: row,
        start: 'top 88%',
        once: true,
      },
    });
  });
}
