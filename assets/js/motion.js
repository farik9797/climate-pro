/* Лёгкий параллакс рекламных секций: только transform, отключается при reduced motion и на телефоне. */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  mm.add('(min-width: 60rem)', () => {
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      const shift = Number(el.dataset.parallax) || -24;
      gsap.to(el, { y: shift, ease: 'none', scrollTrigger: { trigger: el.closest('section') || el, start: 'top top', end: 'bottom top', scrub: true } });
    });
    document.querySelectorAll('[data-parallax-pic] img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img.closest('[data-parallax-pic]'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });
})();
