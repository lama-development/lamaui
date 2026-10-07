const header = document.querySelector<HTMLElement>(".docs-mobile-header");

if (header) {
  const mobile = window.matchMedia("(max-width: 860px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hideThreshold = 24;
  const revealThreshold = 8;
  let previousY = 0;
  let travel = 0;
  let direction = 0;
  let frame = 0;
  let headerHeight = header.getBoundingClientRect().height;

  // Ignore rubber-band movement at both ends of the page.
  const scrollPosition = () => Math.min(Math.max(0, document.documentElement.scrollHeight - window.innerHeight), Math.max(0, window.scrollY));
  const show = () => header.removeAttribute("data-scroll-hidden");
  const reset = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    previousY = scrollPosition();
    travel = 0;
    direction = 0;
    show();
  };

  const update = () => {
    frame = 0;
    const y = scrollPosition();
    const delta = y - previousY;
    previousY = y;

    // Touch focus must not pin the bar after closing the navigation drawer.
    const keyboardFocus = header.querySelector(":focus-visible") !== null;
    if (!mobile.matches || reducedMotion.matches || y <= headerHeight || document.body.classList.contains("docs-navigation-open") || keyboardFocus) {
      travel = 0;
      direction = 0;
      show();
      return;
    }
    if (delta === 0) return;

    const nextDirection = Math.sign(delta);
    if (nextDirection !== direction) travel = 0;
    direction = nextDirection;
    travel += Math.abs(delta);

    // CSS owns the animation, including reversal from its current position.
    // Small scroll fluctuations never leave the navbar halfway off screen.
    if (direction > 0 && travel >= hideThreshold) header.setAttribute("data-scroll-hidden", "");
    else if (direction < 0 && travel >= revealThreshold) show();
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    },
    { passive: true }
  );
  window.addEventListener("pageshow", reset);
  mobile.addEventListener("change", reset);
  reducedMotion.addEventListener("change", reset);
  header.addEventListener("focusin", reset);
  new ResizeObserver(() => {
    headerHeight = header.getBoundingClientRect().height;
    reset();
  }).observe(header);
  new MutationObserver(reset).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  reset();
}
