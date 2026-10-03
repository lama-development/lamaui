import { copyEffectShape } from "./effect-shape";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function ripple(event: PointerEvent | MouseEvent) {
  if (reducedMotion.matches || !(event.target instanceof Element)) return;
  const control = event.target.closest<HTMLElement>(
    'button, a[href], summary, [role="tab"], input[type="checkbox"], input[type="radio"], label.lui-choice, label.lui-switch'
  );
  if (!control || control.closest('[disabled], [aria-disabled="true"], [inert]')) return;
  const target = control.matches("label")
    ? control.querySelector<HTMLInputElement>("input")
    : control;
  if (!target || target.matches(":disabled")) return;
  const surface = target.matches('[role="switch"]')
    ? target.closest("label")?.querySelector<HTMLElement>("[data-switch-thumb]")
    : target;
  if (!surface) return;
  const rect = surface.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const choice = target.matches('input[type="checkbox"], input[type="radio"]');
  const keyboard = event.type === "click";
  const x = choice || keyboard ? rect.width / 2 : event.clientX - rect.left;
  const y = choice || keyboard ? rect.height / 2 : event.clientY - rect.top;
  const radius = choice ? 20 : Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
  const styles = getComputedStyle(target);
  const layer = document.createElement("span");
  layer.setAttribute("aria-hidden", "true");
  Object.assign(layer.style, {
    position: "fixed", left: `${rect.left}px`, top: `${rect.top}px`,
    width: `${rect.width}px`, height: `${rect.height}px`,
    borderRadius: choice ? "50%" : styles.borderRadius,
    overflow: choice ? "visible" : "hidden", pointerEvents: "none", zIndex: "9999"
  });
  if (!choice) copyEffectShape(layer, styles);
  const circle = document.createElement("span");
  Object.assign(circle.style, {
    position: "absolute", left: `${x - radius}px`, top: `${y - radius}px`,
    width: `${radius * 2}px`, height: `${radius * 2}px`, borderRadius: "50%",
    backgroundColor: choice ? "var(--accent)" : styles.color,
    pointerEvents: "none", transition: "none"
  });
  layer.append(circle);
  (target.closest("dialog[open]") ?? document.body).append(layer);
  const animation = circle.animate(
    [{ transform: "scale(0)", opacity: 0.16 }, { transform: "scale(1)", opacity: 0 }],
    { duration: 450, easing: "cubic-bezier(0.2, 0, 0, 1)" }
  );
  const cleanup = () => {
    layer.remove();
    document.removeEventListener("scroll", cleanup, true);
  };
  document.addEventListener("scroll", cleanup, { capture: true, once: true });
  animation.addEventListener("finish", cleanup, { once: true });
}

document.addEventListener("pointerdown", (event) => {
  if (event.button === 0 && event.isPrimary) ripple(event);
});
document.addEventListener("click", (event) => {
  if (event.detail === 0) ripple(event);
});
