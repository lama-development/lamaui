import { copyEffectShape } from "./effect-shape";

const hoverEnabled = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
const itemSelector = '[class*="hover:bg-"], .lamaui-control, .lamaui-interactive, .lamaui-choice, .docs-nav-row, .docs-nav-group a';
const groupSelector = '[data-fluid-hover], [role="tablist"], [role="radiogroup"], [data-toggle-group], .lamaui-menu, .docs-nav';

interface FluidHoverState {
  group: HTMLElement;
  layer: HTMLElement;
  current: HTMLElement | null;
  leaveTimer?: number;
}

const states = new Map<HTMLElement, FluidHoverState>();

function eligibleItems(group: HTMLElement) {
  return Array.from(group.querySelectorAll<HTMLElement>(itemSelector)).filter((item) => !item.matches(':disabled, [aria-disabled="true"], .lamaui-choice:has(:disabled)') && !item.closest("[inert]") && item.getClientRects().length > 0);
}

function nearestItem(group: HTMLElement, x: number, y: number) {
  let nearest: HTMLElement | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const item of eligibleItems(group)) {
    const rect = item.getBoundingClientRect();
    const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
    const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
    const distance = dx * dx + dy * dy;
    if (distance < nearestDistance) {
      nearest = item;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function createState(group: HTMLElement) {
  const layer = document.createElement("span");
  layer.className = "lamaui-fluid-hover";
  layer.setAttribute("aria-hidden", "true");
  (group.closest("dialog[open]") ?? document.body).append(layer);
  const state: FluidHoverState = { group, layer, current: null };
  states.set(group, state);
  return state;
}

function move(state: FluidHoverState, item: HTMLElement) {
  if (state.current === item) return;
  state.current = item;
  const rect = item.getBoundingClientRect();
  const styles = getComputedStyle(item);
  copyEffectShape(state.layer, styles);
  Object.assign(state.layer.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    borderRadius: styles.borderRadius,
    color: styles.color
  });
  state.layer.dataset.visible = "true";
}

function hide(state: FluidHoverState, immediately = false) {
  window.clearTimeout(state.leaveTimer);
  state.current = null;
  if (immediately) {
    state.layer.remove();
    states.delete(state.group);
    return;
  }
  state.leaveTimer = window.setTimeout(() => {
    state.layer.dataset.visible = "false";
  }, 40);
}

document.addEventListener("pointermove", (event) => {
  if (!hoverEnabled.matches || event.pointerType !== "mouse" || !(event.target instanceof Element)) return;
  const group = event.target.closest<HTMLElement>(groupSelector);
  if (!group) return;
  const item = nearestItem(group, event.clientX, event.clientY);
  if (!item) return;
  const state = states.get(group) ?? createState(group);
  window.clearTimeout(state.leaveTimer);
  move(state, item);
});

document.addEventListener("pointerout", (event) => {
  if (!(event.target instanceof Node)) return;
  for (const state of states.values()) {
    if (state.group.contains(event.target) && !(event.relatedTarget instanceof Node && state.group.contains(event.relatedTarget))) hide(state);
  }
});

function clear() {
  for (const state of [...states.values()]) hide(state, true);
}

document.addEventListener("scroll", clear, { capture: true, passive: true });
window.addEventListener("resize", clear);
window.addEventListener("blur", clear);
hoverEnabled.addEventListener("change", clear);
