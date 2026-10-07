const mobileDrawer = window.matchMedia("(max-width: 620px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const drawers = document.querySelectorAll<HTMLDialogElement>("[data-drawer]");
let lockedScrollY = 0;
let savedBodyStyle: string | null = null;
let scrollLocked = false;

const lockScroll = () => {
  if (scrollLocked) return;
  lockedScrollY = window.scrollY;
  savedBodyStyle = document.body.getAttribute("style");
  scrollLocked = true;
  Object.assign(document.body.style, { position: "fixed", top: `${-lockedScrollY}px`, left: "0", right: "0", overflow: "hidden" });
};
const unlockScroll = () => {
  if (!scrollLocked || Array.from(drawers).some((drawer) => drawer.open)) return;
  if (savedBodyStyle === null) document.body.removeAttribute("style");
  else document.body.setAttribute("style", savedBodyStyle);
  scrollLocked = false;
  const previousBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo(0, lockedScrollY);
  document.documentElement.style.scrollBehavior = previousBehavior;
};

drawers.forEach((drawer) => {
  const dragArea = drawer.querySelector<HTMLElement>("[data-drawer-drag-zone]");
  let animation: Animation | undefined;
  let closing = false;
  let pointerId: number | undefined;
  let startY = 0;
  let initialY = 0;
  let currentY = 0;
  let startedAt = 0;
  let dragged = false;

  const stopAnimation = () => {
    const transform = getComputedStyle(drawer).transform;
    animation?.cancel();
    animation = undefined;
    drawer.style.transform = transform;
    return transform;
  };
  const offscreen = () => (mobileDrawer.matches ? "translateY(100%)" : `translateX(${drawer.dataset.drawerSide === "left" ? "-" : ""}100%)`);
  const animateTo = (transform: string, duration: number, finish?: () => void) => {
    const from = stopAnimation();
    if (reducedMotion.matches) {
      drawer.style.transform = transform;
      finish?.();
      return;
    }
    const next = drawer.animate([{ transform: from }, { transform }], { duration, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "forwards" });
    animation = next;
    next.onfinish = () => {
      drawer.style.transform = transform;
      next.cancel();
      if (animation === next) animation = undefined;
      finish?.();
    };
  };
  const close = () => {
    if (!drawer.open || closing) return;
    closing = true;
    pointerId = undefined;
    animateTo(offscreen(), 220, () => drawer.close());
  };

  dragArea?.addEventListener("pointerdown", (event) => {
    if (!mobileDrawer.matches || !drawer.open || closing || !event.isPrimary || event.button !== 0 || pointerId !== undefined) return;
    if (event.target instanceof Element && event.target.closest("button, a, input, select, textarea")) return;
    const transform = stopAnimation();
    initialY = transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
    pointerId = event.pointerId;
    startY = event.clientY;
    currentY = initialY;
    startedAt = performance.now();
    dragged = false;
    dragArea.setPointerCapture(pointerId);
  });
  dragArea?.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) return;
    currentY = Math.max(0, initialY + event.clientY - startY);
    dragged ||= Math.abs(event.clientY - startY) > 5;
    drawer.style.transform = `translateY(${currentY}px)`;
  });
  const release = (event: PointerEvent, cancelled = false) => {
    if (event.pointerId !== pointerId) return;
    pointerId = undefined;
    if (dragArea?.hasPointerCapture(event.pointerId)) dragArea.releasePointerCapture(event.pointerId);
    const distance = currentY - initialY;
    const velocity = distance / Math.max(performance.now() - startedAt, 1);
    if (!cancelled && dragged && (distance > Math.min(drawer.getBoundingClientRect().height * 0.25, 120) || velocity > 0.6)) close();
    else animateTo("translateY(0)", 220);
  };
  dragArea?.addEventListener("pointerup", (event) => release(event));
  dragArea?.addEventListener("pointercancel", (event) => release(event, true));
  dragArea?.addEventListener("lostpointercapture", (event) => release(event, true));
  drawer.querySelectorAll<HTMLElement>("[data-dialog-close]").forEach((button) => button.addEventListener("click", close));
  drawer.addEventListener("click", (event) => {
    if (event.target !== drawer) return;
    const rect = drawer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  drawer.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  drawer.addEventListener("close", () => {
    animation?.cancel();
    animation = undefined;
    closing = false;
    pointerId = undefined;
    drawer.style.removeProperty("transform");
    unlockScroll();
  });
  document.querySelectorAll<HTMLElement>("[data-dialog-open]").forEach((button) => {
    if (button.dataset.dialogOpen !== drawer.id) return;
    button.addEventListener("click", () => {
      if (drawer.open) return;
      closing = false;
      lockScroll();
      drawer.style.transform = offscreen();
      drawer.showModal();
      animateTo("translate(0, 0)", 280);
    });
  });
});
