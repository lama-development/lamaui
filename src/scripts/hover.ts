import { copyEffectShape } from "./effect-shape";

// A bounded circular wash adds depth without moving content or intercepting clicks.
const hoverEnabled = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
const selector = '[class*="hover:bg-"], .lui-interactive, .docs-nav-group a';
const active = new Map<HTMLElement, { layer: HTMLElement; circle: HTMLElement }>();

function leave(target: HTMLElement, immediately = false) {
  const state = active.get(target);
  if (!state) return;
  active.delete(target);
  if (immediately) {
    state.layer.remove();
    return;
  }
  const opacity = getComputedStyle(state.layer).opacity;
  // Keep the expansion running while the wash softly disappears.
  state.layer.animate([{ opacity }, { opacity: 0 }], {
    duration: 240, easing: "ease-out", fill: "forwards"
  }).addEventListener("finish", () => state.layer.remove(), { once: true });
}

document.addEventListener("pointerover", (event) => {
  if (!hoverEnabled.matches || event.pointerType !== "mouse" || !(event.target instanceof Element)) return;
  const target = event.target.closest<HTMLElement>(selector);
  if (!target || active.has(target) || target.matches('.lui-icon, input, :disabled, [aria-disabled="true"]')) return;
  if (target.closest("[inert]")) return;
  if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return;
  const rect = target.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
  const styles = getComputedStyle(target);
  const layer = document.createElement("span");
  layer.setAttribute("aria-hidden", "true");
  Object.assign(layer.style, {
    position: "fixed", left: `${rect.left}px`, top: `${rect.top}px`,
    width: `${rect.width}px`, height: `${rect.height}px`,
    borderRadius: styles.borderRadius, overflow: "hidden",
    pointerEvents: "none", zIndex: "9998", transition: "none"
  });
  copyEffectShape(layer, styles);
  const circle = document.createElement("span");
  Object.assign(circle.style, {
    position: "absolute", left: `${x - radius}px`, top: `${y - radius}px`,
    width: `${radius * 2}px`, height: `${radius * 2}px`, borderRadius: "50%",
    background: styles.color, opacity: "0.045", pointerEvents: "none", transition: "none"
  });
  layer.append(circle);
  (target.closest("dialog[open]") ?? document.body).append(layer);
  active.set(target, { layer, circle });
  circle.animate([
    { transform: "scale(0)", opacity: 0 },
    { transform: "scale(1)", opacity: 0.045 }
  ], { duration: 360, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "forwards" });
});

document.addEventListener("pointerout", (event) => {
  for (const target of active.keys()) {
    if (event.target instanceof Node && target.contains(event.target)
      && !(event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) leave(target);
  }
});

function clear() {
  for (const target of active.keys()) leave(target, true);
}
document.addEventListener("scroll", clear, { capture: true, passive: true });
window.addEventListener("resize", clear);
window.addEventListener("blur", clear);
hoverEnabled.addEventListener("change", clear);
