const menuSelector = "details[data-animated-menu]";
const closeEvent = "lamaui:close-menu";
const closeTimers = new WeakMap<HTMLDetailsElement, number>();

function panelFor(details: HTMLDetailsElement) {
  return details.querySelector<HTMLElement>(":scope > .t-dropdown");
}

function closeDuration() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dropdown-close-dur")) || 150;
}

export function openDetailsMenu(details: HTMLDetailsElement) {
  const panel = panelFor(details);
  if (!panel) return;
  window.clearTimeout(closeTimers.get(details));
  details.open = true;
  panel.classList.remove("is-closing");
  details.querySelector("summary")?.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add("is-open")));
}

export function closeDetailsMenu(details: HTMLDetailsElement, restoreFocus = false) {
  const panel = panelFor(details);
  if (!details.open || !panel || panel.classList.contains("is-closing")) return;
  panel.classList.remove("is-open");
  panel.classList.add("is-closing");
  details.querySelector("summary")?.setAttribute("aria-expanded", "false");
  window.clearTimeout(closeTimers.get(details));
  closeTimers.set(
    details,
    window.setTimeout(() => {
      details.open = false;
      panel.classList.remove("is-closing");
      closeTimers.delete(details);
    }, closeDuration())
  );
  if (restoreFocus) details.querySelector<HTMLElement>("summary")?.focus();
}

document.querySelectorAll<HTMLDetailsElement>(menuSelector).forEach((details) => {
  const summary = details.querySelector<HTMLElement>("summary");
  summary?.setAttribute("aria-expanded", String(details.open));
  summary?.addEventListener("click", (event) => {
    event.preventDefault();
    if (details.open) closeDetailsMenu(details);
    else openDetailsMenu(details);
  });
  details.addEventListener(closeEvent, (event) => closeDetailsMenu(details, (event as CustomEvent<boolean>).detail));
  details.addEventListener("focusout", (event) => {
    if (event.relatedTarget instanceof Node && !details.contains(event.relatedTarget)) closeDetailsMenu(details);
  });
});

document.addEventListener("pointerdown", (event) => {
  if (!(event.target instanceof Node)) return;
  document.querySelectorAll<HTMLDetailsElement>(menuSelector).forEach((details) => {
    if (!details.contains(event.target as Node)) closeDetailsMenu(details);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll<HTMLDetailsElement>(menuSelector).forEach((details) => closeDetailsMenu(details, details.open));
});

export function requestDetailsMenuClose(details: HTMLDetailsElement, restoreFocus = false) {
  details.dispatchEvent(new CustomEvent<boolean>(closeEvent, { detail: restoreFocus }));
}
