import Lenis from 'lenis';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Lenis drives real document scroll, so the native scroll() timelines on the
// sunset layers keep working.
if (!reduced) {
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const id = anchor.getAttribute('href')!.slice(1);
      const target = id ? document.getElementById(id) : document.body;
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -56 });
    });
  });
}

// reveal fallback where scroll-driven animations are unsupported (Safari)
const reveals = document.querySelectorAll('.reveal');
if (!CSS.supports('animation-timeline: view()')) {
  if (reduced) {
    reveals.forEach((el) => el.classList.add('seen'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('seen');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
    reveals.forEach((el) => observer.observe(el));
  }
}
