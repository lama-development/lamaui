const mobileDrawer = window.matchMedia("(max-width: 620px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function finishClose(drawer: HTMLDialogElement) {
  if (drawer.open) drawer.close();
  drawer.classList.remove("is-closing", "is-dragging");
  drawer.style.removeProperty("--drawer-drag-y");
}

function closeDrawer(drawer: HTMLDialogElement) {
  if (!drawer.open || drawer.classList.contains("is-closing")) return;
  if (reducedMotion.matches) return finishClose(drawer);

  drawer.classList.add("is-closing");
  if (mobileDrawer.matches) drawer.style.setProperty("--drawer-drag-y", `${drawer.getBoundingClientRect().height}px`);

  let finished = false;
  const finish = (event?: TransitionEvent) => {
    if (finished || (event && (event.target !== drawer || event.propertyName !== "transform"))) return;
    finished = true;
    drawer.removeEventListener("transitionend", finish);
    finishClose(drawer);
  };
  drawer.addEventListener("transitionend", finish);
  window.setTimeout(() => finish(), 400);
}

document.querySelectorAll<HTMLDialogElement>("[data-drawer]").forEach((drawer) => {
  const handle = drawer.querySelector<HTMLElement>("[data-drawer-drag-zone]");
  let pointerId: number | undefined;
  let startY = 0;
  let currentY = 0;
  let startedAt = 0;

  const resetDrag = () => {
    pointerId = undefined;
    drawer.classList.remove("is-dragging");
    drawer.style.setProperty("--drawer-drag-y", "0px");
  };

  handle?.addEventListener("pointerdown", (event) => {
    if (!mobileDrawer.matches || !drawer.open || !event.isPrimary) return;
    pointerId = event.pointerId;
    startY = event.clientY;
    currentY = 0;
    startedAt = performance.now();
    drawer.classList.add("is-dragging");
    handle.setPointerCapture(pointerId);
  });

  handle?.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) return;
    currentY = Math.max(0, event.clientY - startY);
    drawer.style.setProperty("--drawer-drag-y", `${currentY}px`);
    event.preventDefault();
  });

  handle?.addEventListener("pointerup", (event) => {
    if (event.pointerId !== pointerId) return;
    const elapsed = Math.max(performance.now() - startedAt, 1);
    const velocity = currentY / elapsed;
    const shouldClose = currentY > Math.min(drawer.getBoundingClientRect().height * 0.28, 160) || velocity > 0.7;
    pointerId = undefined;
    drawer.classList.remove("is-dragging");
    if (shouldClose) closeDrawer(drawer);
    else drawer.style.setProperty("--drawer-drag-y", "0px");
  });

  handle?.addEventListener("pointercancel", resetDrag);
  drawer.querySelectorAll<HTMLElement>("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => closeDrawer(drawer)));
  drawer.addEventListener("click", (event) => {
    if (event.target === drawer) closeDrawer(drawer);
  });
  drawer.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDrawer(drawer);
  });
  drawer.addEventListener("close", resetDrag);
});

document.querySelectorAll<HTMLElement>("[data-dialog-open]").forEach((button) => {
  const drawer = document.getElementById(button.dataset.dialogOpen || "");
  if (!(drawer instanceof HTMLDialogElement) || !drawer.hasAttribute("data-drawer")) return;
  button.addEventListener("click", () => {
    drawer.classList.remove("is-closing");
    drawer.style.setProperty("--drawer-drag-y", "0px");
    drawer.showModal();
  });
});
