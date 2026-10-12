export {};

const $ = (selector: string, root: ParentNode = document) => root.querySelector<HTMLElement>(selector);
const tooltipRoots = Array.from(document.querySelectorAll<HTMLElement>("[data-tooltip]"));
let activeTooltip: HTMLElement | null = null;
let tooltipTimer = 0;

const closeTooltip = (root = activeTooltip) => {
  if (!root) return;
  const tooltip = $("[role=tooltip]", root);
  if (!tooltip) return;
  window.clearTimeout(tooltipTimer);
  tooltip.removeAttribute("data-open");
  tooltip.setAttribute("aria-hidden", "true");
  if (typeof tooltip.hidePopover === "function" && tooltip.matches(":popover-open")) tooltip.hidePopover();
  if (activeTooltip === root) activeTooltip = null;
};

const openTooltip = (root: HTMLElement) => {
  const trigger = $("button,a,[tabindex]", root);
  const tooltip = $("[role=tooltip]", root);
  if (!trigger || !tooltip) return;
  if (activeTooltip && activeTooltip !== root) closeTooltip(activeTooltip);
  const rect = trigger.getBoundingClientRect();
  if (typeof tooltip.showPopover === "function" && !tooltip.matches(":popover-open")) tooltip.showPopover();
  const tooltipRect = tooltip.getBoundingClientRect();
  const roomAbove = rect.top >= tooltipRect.height + 12;
  const roomBelow = window.innerHeight - rect.bottom >= tooltipRect.height + 12;
  const prefersAbove = root.dataset.tooltipPosition !== "bottom";
  const above = prefersAbove ? roomAbove || !roomBelow : !roomBelow && roomAbove;
  const halfWidth = tooltipRect.width / 2;
  const center = Math.min(window.innerWidth - halfWidth - 8, Math.max(halfWidth + 8, rect.left + rect.width / 2));
  tooltip.style.left = `${center}px`;
  tooltip.style.top = `${above ? rect.top - 8 : rect.bottom + 8}px`;
  tooltip.style.transform = above ? "translate(-50%, -100%)" : "translate(-50%, 0)";
  const arrow = $("[data-tooltip-arrow]", tooltip);
  if (arrow) {
    arrow.style.top = above ? "auto" : "-0.2rem";
    arrow.style.bottom = above ? "-0.2rem" : "auto";
  }
  tooltip.dataset.open = "true";
  tooltip.setAttribute("aria-hidden", "false");
  activeTooltip = root;
  window.clearTimeout(tooltipTimer);
};

tooltipRoots.forEach((root, index) => {
  const trigger = $("button,a,[tabindex]", root);
  const tooltip = $("[role=tooltip]", root);
  if (!trigger || !tooltip) return;
  tooltip.id ||= `lamaui-tooltip-${index + 1}`;
  trigger.setAttribute("aria-describedby", tooltip.id);
  root.addEventListener("pointerenter", (event) => {
    if ((event as PointerEvent).pointerType !== "touch") openTooltip(root);
  });
  root.addEventListener("pointerleave", () => closeTooltip(root));
  root.addEventListener("focusin", () => requestAnimationFrame(() => trigger.matches(":focus-visible") && openTooltip(root)));
  root.addEventListener("focusout", () => closeTooltip(root));
  trigger.addEventListener("click", () => {
    window.clearTimeout(tooltipTimer);
    tooltipTimer = window.setTimeout(() => closeTooltip(root), 900);
  });
});

document.addEventListener("keydown", (event) => event.key === "Escape" && closeTooltip());
window.addEventListener("scroll", () => closeTooltip(), { passive: true });
