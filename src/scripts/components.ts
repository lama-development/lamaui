// @ts-nocheck
// Shared browser behavior extracted from DocsLayout; import once in your layout.
import "./browser-theme";
import "./ripple";
import "./hover";
import "./surfaces";
import "./drawer";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const tooltipRoots = $$("[data-tooltip]");
let activeTooltip, tooltipTimer;
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
const openTooltip = (root) => {
  const trigger = $("button,a,[tabindex]", root),
    tooltip = $("[role=tooltip]", root);
  if (!trigger || !tooltip) return;
  if (activeTooltip && activeTooltip !== root) closeTooltip(activeTooltip);
  const rect = trigger.getBoundingClientRect();
  if (typeof tooltip.showPopover === "function" && !tooltip.matches(":popover-open")) tooltip.showPopover();
  const tooltipRect = tooltip.getBoundingClientRect(),
    roomAbove = rect.top >= tooltipRect.height + 12,
    roomBelow = window.innerHeight - rect.bottom >= tooltipRect.height + 12,
    prefersAbove = root.dataset.tooltipPosition !== "bottom",
    above = prefersAbove ? roomAbove || !roomBelow : !roomBelow && roomAbove,
    halfWidth = tooltipRect.width / 2,
    center = Math.min(window.innerWidth - halfWidth - 8, Math.max(halfWidth + 8, rect.left + rect.width / 2));
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
  const trigger = $("button,a,[tabindex]", root),
    tooltip = $("[role=tooltip]", root);
  if (!trigger || !tooltip) return;
  tooltip.id ||= `lamaui-tooltip-${index + 1}`;
  trigger.setAttribute("aria-describedby", tooltip.id);
  root.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") openTooltip(root);
  });
  root.addEventListener("pointerleave", () => closeTooltip(root));
  root.addEventListener("focusin", () => {
    requestAnimationFrame(() => {
      if (trigger.matches(":focus-visible")) openTooltip(root);
    });
  });
  root.addEventListener("focusout", () => closeTooltip(root));
  trigger.addEventListener("click", () => {
    window.clearTimeout(tooltipTimer);
    tooltipTimer = window.setTimeout(() => closeTooltip(root), 900);
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeTooltip();
});
window.addEventListener("scroll", () => closeTooltip(), { passive: true });
$$("[data-copy-code]").forEach((button) =>
  button.addEventListener("click", async () => {
    const block = button.closest("[data-code-block]"),
      code = $("code", block)?.textContent ?? "",
      label = $("[data-copy-label]", button),
      defaultIcon = $("[data-copy-default]", button),
      successIcon = $("[data-copy-success]", button);
    const tooltip = $("[data-tooltip-label]", button.closest("[data-tooltip]"));
    try {
      await navigator.clipboard.writeText(code);
      defaultIcon?.toggleAttribute("hidden", true);
      successIcon?.toggleAttribute("hidden", false);
      if (label) label.textContent = "Copied";
      button.setAttribute("aria-label", "Code copied");
      if (tooltip) tooltip.textContent = "Copied";
      window.setTimeout(() => {
        defaultIcon?.toggleAttribute("hidden", false);
        successIcon?.toggleAttribute("hidden", true);
        if (label) label.textContent = "Copy";
        button.setAttribute("aria-label", "Copy code");
        if (tooltip) tooltip.textContent = "Copy code";
      }, 1800);
    } catch {
      if (label) label.textContent = "Copy failed";
      if (tooltip) tooltip.textContent = "Copy failed";
    }
  })
);
$$("[data-code-wrap]").forEach((button) =>
  button.addEventListener("click", () => {
    const block = button.closest("[data-code-block]"),
      wrapped = !block.classList.contains("is-wrapped");
    block.classList.toggle("is-wrapped", wrapped);
    button.setAttribute("aria-pressed", String(wrapped));
    button.setAttribute("aria-label", wrapped ? "Unwrap lines" : "Wrap lines");
    const tooltip = $("[data-tooltip-label]", button.closest("[data-tooltip]"));
    if (tooltip) tooltip.textContent = wrapped ? "Unwrap lines" : "Wrap lines";
    $("[data-wrap-off]", button)?.toggleAttribute("hidden", wrapped);
    $("[data-wrap-on]", button)?.toggleAttribute("hidden", !wrapped);
  })
);
$$("[data-toggle]").forEach((button) => button.addEventListener("click", () => button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"))));
$$("[data-toggle-group]").forEach((group) =>
  group.addEventListener("click", (event) => {
    const button = event.target.closest("[data-toggle]");
    if (!button) return;
    $$("[data-toggle]", group).forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  })
);
$$("[data-password-toggle]").forEach((button) =>
  button.addEventListener("click", () => {
    const input = button.closest("[data-password]").querySelector("[data-password-input]");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    $("[data-password-show]", button)?.toggleAttribute("hidden", show);
    $("[data-password-hide]", button)?.toggleAttribute("hidden", !show);
    button.setAttribute("aria-label", `${show ? "Hide" : "Show"} password`);
    button.title = `${show ? "Hide" : "Show"} password`;
  })
);
$$("[data-slider]").forEach((slider) => {
  const output = $("[data-slider-output]", slider.closest("label"));
  const update = () => {
    const min = Number(slider.min),
      max = Number(slider.max),
      value = Number(slider.value),
      progress = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
    slider.style.setProperty("--slider-progress", `${progress}%`);
    if (output) output.value = slider.value;
  };
  slider.addEventListener("input", update);
  slider.form?.addEventListener("reset", () => requestAnimationFrame(update));
  update();
});
$$("[data-tabs]").forEach((root) => {
  const tabs = $$('[role="tab"]', root).filter((tab) => tab.closest("[data-tabs]") === root),
    panels = $$('[role="tabpanel"]', root).filter((panel) => panel.closest("[data-tabs]") === root);
  const highlight = $(".lamaui-tab-highlight", root);
  const moveHighlight = (tab, animate = true) => {
    if (!highlight || !tab) return;
    const previous = highlight.style.transition;
    if (!animate) highlight.style.transition = "none";
    highlight.style.transform = `translateX(${tab.offsetLeft}px)`;
    highlight.style.width = `${tab.offsetWidth}px`;
    if (!animate) {
      void highlight.offsetWidth;
      highlight.style.transition = previous;
    }
  };
  const activate = (tab) => {
    if (!tab || tab.disabled) return;
    const changed = tab.getAttribute("aria-selected") !== "true";
    tabs.forEach((item) => {
      item.setAttribute("aria-selected", String(item === tab));
      item.tabIndex = item === tab ? 0 : -1;
    });
    panels.forEach((panel) => (panel.hidden = panel.dataset.tabPanel !== tab.dataset.tab));
    moveHighlight(tab);
    if (changed && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const panel = panels.find((item) => !item.hidden);
      if (panel) {
        panel.getAnimations().forEach((animation) => animation.cancel());
        const styles = getComputedStyle(root);
        panel.animate(
          [
            { opacity: 0, transform: "translateY(8px)", filter: "blur(2px)" },
            { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }
          ],
          { duration: parseFloat(styles.getPropertyValue("--duration-normal")), easing: styles.getPropertyValue("--ease-standard").trim() }
        );
      }
    }
    tab.focus();
  };
  tabs.forEach((tab) => tab.addEventListener("click", () => activate(tab)));
  root.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !tabs.includes(document.activeElement)) return;
    event.preventDefault();
    const enabled = tabs.filter((tab) => !tab.disabled);
    const index = enabled.indexOf(document.activeElement);
    activate(enabled[event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length]);
  });
  const snapHighlight = () =>
    moveHighlight(
      tabs.find((tab) => tab.getAttribute("aria-selected") === "true"),
      false
    );
  // Align panel visibility with the selected tab without moving focus on load.
  const selected = tabs.find((tab) => !tab.disabled && tab.getAttribute("aria-selected") === "true") || tabs.find((tab) => !tab.disabled);
  tabs.forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab === selected));
    tab.tabIndex = tab === selected ? 0 : -1;
  });
  panels.forEach((panel) => (panel.hidden = panel.dataset.tabPanel !== selected?.dataset.tab));
  snapHighlight();
  // Panel height changes must not interrupt the indicator's transition.
  const resizeObserver = new ResizeObserver(snapHighlight);
  if (highlight?.parentElement) resizeObserver.observe(highlight.parentElement);
  tabs.forEach((tab) => resizeObserver.observe(tab));
});
$$("[data-dialog-open]").forEach((button) =>
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.dialogOpen);
    if (!dialog?.hasAttribute("data-drawer")) dialog?.showModal();
  })
);
$$("[data-dialog-close]").forEach((button) =>
  button.addEventListener("click", () => {
    const dialog = button.closest("dialog");
    if (!dialog?.hasAttribute("data-drawer")) dialog?.close();
  })
);
$$("dialog").forEach((dialog) =>
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && !dialog.hasAttribute("data-drawer")) dialog.close();
  })
);
const syncToastStack = (region) => {
  if (!region) return;
  const toasts = $$(":scope > [data-toast]:not(.hidden)", region);
  toasts.forEach((toast, position) => {
    const index = toasts.length - position - 1;
    toast.style.setProperty("--toast-stack-index", Math.min(index, 3));
    toast.style.zIndex = String(toasts.length - index);
    toast.toggleAttribute("inert", index > 0);
    toast.toggleAttribute("data-toast-covered", index > 3);
  });
};
const hideToast = (toast) => {
  if (!toast || toast.classList.contains("hidden")) return;
  const region = toast.closest("[data-toast-region]");
  toast.classList.remove("is-open");
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    toast.removeEventListener("transitionend", finishAfterOpacity);
    if (toast.hasAttribute("data-toast-transient")) toast.remove();
    else {
      toast.classList.remove("grid");
      toast.classList.add("hidden");
    }
    syncToastStack(region);
  };
  const finishAfterOpacity = (event) => {
    if (event.target === toast && event.propertyName === "opacity") finish();
  };
  toast.addEventListener("transitionend", finishAfterOpacity);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
  window.setTimeout(finish, 400);
};
$$("[data-toast-open]").forEach((button) =>
  button.addEventListener("click", () => {
    const source = document.getElementById(button.dataset.toastOpen);
    const region = source?.closest("[data-toast-region]");
    if (!source || !region) return;
    const toast = source.cloneNode(true);
    toast.removeAttribute("id");
    toast.dataset.toastTransient = "true";
    toast.classList.remove("hidden");
    toast.classList.add("grid");
    region.append(toast);
    syncToastStack(region);
    requestAnimationFrame(() => toast.classList.add("is-open"));
    if (toast.getAttribute("role") !== "alert") toast._hideTimer = window.setTimeout(() => hideToast(toast), 5000);
  })
);
document.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest("[data-toast-close]") : null;
  if (button) hideToast(button.closest("[data-toast]"));
});
document.addEventListener("toast:dismiss", (event) => hideToast(event.target?.closest?.("[data-toast]")));
document.addEventListener("toast:added", (event) => syncToastStack(event.target?.closest?.("[data-toast-region]")));
document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const alert = event.target.closest("[data-dismiss]")?.closest('[role="alert"],[role="status"]');
  if (!alert) return;
  if (alert.hasAttribute("data-dismiss-hide")) alert.hidden = true;
  else alert.remove();
});
