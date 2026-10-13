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
    const setOpen = (open: boolean, restoreFocus = false) => {
      trigger.setAttribute("aria-expanded", String(open));
      root.dataset.open = String(open);
      dock.inert = !open;
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
    root.addEventListener("keydown", (event) => {
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
      if (!root.contains(event.target as Node)) setOpen(false);
    });
    root.addEventListener("focusout", (event) => {
      if (!root.contains(event.relatedTarget as Node | null)) setOpen(false);
    });
  });
};

initializeAccentPickers();
document.addEventListener("astro:page-load", initializeAccentPickers);
window.addEventListener("storage", (event) => {
  if (event.key === "lamaui-accent" || event.key === null) syncAccent(event.newValue);
});
