import Lenis from 'lenis';

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });

  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // `:not(.skip-link)` matters: hijacking the skip link scrolls the page without
  // moving focus to <main>, so a keyboard user lands back in the nav on the next
  // Tab, which defeats the whole point of the link.
  const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]:not(.skip-link)');

  anchors.forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      // leave modified clicks to the browser so open-in-new-tab still works
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }

      const href = anchor.getAttribute('href')!;
      const target = document.getElementById(href.slice(1));
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target, { offset: -56 });
      // preventDefault also drops the hash, which breaks shareable links and the
      // back button, so put it back by hand
      history.pushState(null, '', href);
    });
  });
}
