export {};

document.querySelectorAll<HTMLElement>("[data-tabs]").forEach((root) => {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]')).filter((tab) => tab.closest("[data-tabs]") === root);
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]')).filter((panel) => panel.closest("[data-tabs]") === root);
  const highlight = root.querySelector<HTMLElement>(".lamaui-tab-highlight");
  const moveHighlight = (tab: HTMLElement | undefined, animate = true) => {
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
  const activate = (tab: HTMLButtonElement | undefined) => {
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
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !tabs.includes(document.activeElement as HTMLButtonElement)) return;
    event.preventDefault();
    const enabled = tabs.filter((tab) => !tab.disabled);
    const index = enabled.indexOf(document.activeElement as HTMLButtonElement);
    activate(enabled[event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length]);
  });
  const selected = tabs.find((tab) => !tab.disabled && tab.getAttribute("aria-selected") === "true") || tabs.find((tab) => !tab.disabled);
  tabs.forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab === selected));
    tab.tabIndex = tab === selected ? 0 : -1;
  });
  panels.forEach((panel) => (panel.hidden = panel.dataset.tabPanel !== selected?.dataset.tab));
  moveHighlight(selected, false);
  const resizeObserver = new ResizeObserver(() =>
    moveHighlight(
      tabs.find((tab) => tab.getAttribute("aria-selected") === "true"),
      false
    )
  );
  if (highlight?.parentElement) resizeObserver.observe(highlight.parentElement);
  tabs.forEach((tab) => resizeObserver.observe(tab));
});
