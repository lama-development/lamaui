import { accentPresets } from "../lib/accents";

const validAccent = (value: string | null) => accentPresets.some((preset) => preset.value === value);

const syncAccent = (value: string | null) => {
  const accent = validAccent(value) ? value! : "lime";
  document.documentElement.dataset.accent = accent;
  document.querySelectorAll<HTMLButtonElement>("[data-accent-choice]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.accentChoice === accent));
  });
  const preset = accentPresets.find((item) => item.value === accent)!;
  document.querySelectorAll<HTMLButtonElement>("[data-accent-trigger]").forEach((button) => {
    button.setAttribute("aria-label", `Choose accent color, current: ${preset.label}`);
    button.title = `Accent color: ${preset.label}`;
  });
};

const initializeAccentPickers = () => {
  let savedAccent: string | null = null;
  try {
    savedAccent = localStorage.getItem("lamaui-accent");
  } catch {}
  syncAccent(savedAccent);

  document.querySelectorAll<HTMLElement>("[data-accent-picker]:not([data-accent-initialized])").forEach((root) => {
    root.dataset.accentInitialized = "true";
    const trigger = root.querySelector<HTMLButtonElement>("[data-accent-trigger]")!;
    const dock = root.querySelector<HTMLElement>("[data-accent-dock]")!;
    const choices = Array.from(dock.querySelectorAll<HTMLButtonElement>("[data-accent-choice]"));
    let pendingFocusClose: number | undefined;
    let hideTimer: number | undefined;
    let positionFrame = 0;
    let pointerInside = false;
    const positionDock = () => {
      const preferred = root.dataset.accentPlacement ?? "top";
      const opposite: Record<string, string> = { top: "bottom", bottom: "top", left: "right", right: "left" };
      const placements = [...new Set([preferred, opposite[preferred], "top", "bottom", "right", "left"])];
      const bounds = root.getBoundingClientRect();
      const viewport = window.visualViewport;
      const left = (viewport?.offsetLeft ?? 0) + 8;
      const top = (viewport?.offsetTop ?? 0) + 8;
      const right = left + (viewport?.width ?? document.documentElement.clientWidth) - 16;
      const bottom = top + (viewport?.height ?? window.innerHeight) - 16;
      dock.style.maxWidth = `${Math.max(0, right - left)}px`;
      dock.style.maxHeight = `${Math.max(0, bottom - top)}px`;
      const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
      let best: { placement: string; x: number; y: number; overflow: number } | undefined;
      for (const placement of placements) {
        root.dataset.placement = placement;
        const width = dock.offsetWidth;
        const height = dock.offsetHeight;
        let x = bounds.right - width;
        let y = placement === "bottom" ? bounds.bottom + 8 : bounds.top - height - 8;
        if (placement === "left" || placement === "right") {
          x = placement === "left" ? bounds.left - width - 8 : bounds.right + 8;
          y = clamp(bounds.top, top, bottom - height);
        } else x = clamp(x, left, right - width);
        const overflow = Math.max(0, left - x) + Math.max(0, x + width - right) + Math.max(0, top - y) + Math.max(0, y + height - bottom);
        if (!best || overflow < best.overflow) best = { placement, x: clamp(x, left, right - width), y: clamp(y, top, bottom - height), overflow };
        if (overflow === 0) break;
      }
      if (!best) return;
      root.dataset.placement = best.placement;
      dock.style.left = `${best.x - bounds.left - root.clientLeft}px`;
      dock.style.top = `${best.y - bounds.top - root.clientTop}px`;
    };
    const schedulePosition = () => {
      if (root.dataset.open !== "true" || positionFrame) return;
      positionFrame = requestAnimationFrame(() => {
        positionFrame = 0;
        if (root.dataset.open === "true") positionDock();
      });
    };
    const setOpen = (open: boolean, restoreFocus = false) => {
      window.clearTimeout(pendingFocusClose);
      pendingFocusClose = undefined;
      window.clearTimeout(hideTimer);
      if (open) {
        dock.hidden = false;
        positionDock();
      } else cancelAnimationFrame(positionFrame);
      positionFrame = 0;
      trigger.setAttribute("aria-expanded", String(open));
      root.dataset.open = String(open);
      dock.inert = !open;
      if (!open && !dock.hidden) {
        const durations = getComputedStyle(dock)
          .transitionDuration.split(",")
          .map((value) => parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000));
        const duration = Math.max(0, ...durations);
        // Remove closed palettes from scroll overflow after their exit motion.
        if (duration === 0) dock.hidden = true;
        else
          hideTimer = window.setTimeout(() => {
            dock.hidden = true;
          }, duration + 20);
      }
      if (restoreFocus) trigger.focus();
    };
    const openWithFocus = () => {
      setOpen(true);
      (choices.find((button) => button.getAttribute("aria-pressed") === "true") ?? choices[0]).focus();
    };

    trigger.addEventListener("click", () => {
      if (root.dataset.open === "true") setOpen(false);
      else openWithFocus();
    });
    root.addEventListener("pointerdown", () => {
      pointerInside = true;
    });
    root.addEventListener("click", () => {
      pointerInside = false;
    });
    root.addEventListener("pointercancel", () => {
      pointerInside = false;
    });
    root.addEventListener("keydown", (event) => {
      pointerInside = false;
      if (event.key === "Escape" && root.dataset.open === "true") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false, true);
      } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        if (root.dataset.open !== "true") return openWithFocus();
        const index = choices.indexOf(document.activeElement as HTMLButtonElement);
        const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
        const next = event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1 : (index + step + choices.length) % choices.length;
        choices[next].focus();
      }
    });
    choices.forEach((button) => {
      button.addEventListener("click", () => {
        const accent = button.dataset.accentChoice!;
        syncAccent(accent);
        try {
          localStorage.setItem("lamaui-accent", accent);
        } catch {}
        setOpen(false, true);
      });
    });
    document.addEventListener("pointerdown", (event) => {
      if (!root.contains(event.target as Node)) {
        pointerInside = false;
        setOpen(false);
      }
    });
    root.addEventListener("focusout", (event) => {
      // Safari can move focus to an ancestor while clicking a non-focusable
      // button. Let the in-progress pointer activation reach its click handler.
      if (pointerInside) return;
      if (event.relatedTarget instanceof Node) {
        if (!root.contains(event.relatedTarget)) setOpen(false);
        return;
      }

      // Mobile Safari commonly omits relatedTarget while tapping a button. If
      // the dock becomes inert before the following click, the choice is lost.
      window.clearTimeout(pendingFocusClose);
      pendingFocusClose = window.setTimeout(() => {
        pendingFocusClose = undefined;
        if (!root.matches(":focus-within")) setOpen(false);
      });
    });
    window.addEventListener("resize", schedulePosition, { passive: true });
    document.addEventListener("scroll", schedulePosition, { capture: true, passive: true });
    window.visualViewport?.addEventListener("resize", schedulePosition, { passive: true });
    window.visualViewport?.addEventListener("scroll", schedulePosition, { passive: true });
    window.addEventListener("blur", () => {
      pointerInside = false;
      setOpen(false);
    });
  });
};

initializeAccentPickers();
document.addEventListener("astro:page-load", initializeAccentPickers);
window.addEventListener("storage", (event) => {
  if (event.key === "lamaui-accent" || event.key === null) syncAccent(event.newValue);
});
