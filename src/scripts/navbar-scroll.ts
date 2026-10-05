const header = document.querySelector<HTMLElement>(".docs-mobile-header");

if (header) {
  const mobile = window.matchMedia("(max-width: 860px)");
  let previousY = window.scrollY;
  let offset = 0;
  let frame = 0;

  const show = () => {
    offset = 0;
    header.style.removeProperty("--navbar-scroll-offset");
    header.removeAttribute("data-scroll-hidden");
  };
  const reset = () => {
    show();
    previousY = window.scrollY;
  };

  const update = () => {
    frame = 0;
    // Clamp rubber-band overscroll so Safari's bounce cannot reverse direction.
    const maximumY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const y = Math.min(maximumY, Math.max(0, window.scrollY));
    const delta = y - previousY;
    previousY = y;

    if (!mobile.matches || y <= 0 || document.body.classList.contains("docs-navigation-open") || header.contains(document.activeElement)) {
      show();
      return;
    }

    if (!delta) return;
    // Move one pixel per scrolled pixel, including slow drags and inertial scrolling.
    // Keep partial positions rather than snapping after a direction threshold.
    // Leave the bottom border at the viewport edge when the header is tucked away.
    const hiddenOffset = Math.max(0, header.offsetHeight - 1);
    offset = Math.min(hiddenOffset, y, Math.max(0, offset + delta));
    header.style.setProperty("--navbar-scroll-offset", `${-offset}px`);
    header.toggleAttribute("data-scroll-hidden", offset >= hiddenOffset);
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    },
    { passive: true }
  );
  window.addEventListener("resize", reset);
  window.addEventListener("pageshow", reset);
  mobile.addEventListener("change", reset);
  header.addEventListener("focusin", reset);
  new MutationObserver(reset).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  reset();
}
