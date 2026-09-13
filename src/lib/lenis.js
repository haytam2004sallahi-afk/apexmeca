import Lenis from 'lenis';
import gsap from 'gsap';

/**
 * Initializes Lenis smooth scrolling and syncs it with GSAP's ticker so
 * ScrollTrigger-driven animations stay perfectly in step with the scroll.
 * No-ops (native scroll) if the user prefers reduced motion.
 */
export function initSmoothScroll() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return null;

  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.3,
  });

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
