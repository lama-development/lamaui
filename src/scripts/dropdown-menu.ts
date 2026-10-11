import { openDetailsMenu, closeDetailsMenu } from "./details-menu";

document.querySelectorAll<HTMLDetailsElement>("[data-dropdown-menu]").forEach((details) => {
  const trigger = details.querySelector<HTMLElement>("summary")!;
  const menu = details.querySelector<HTMLElement>('[role="menu"]')!;
  const items = () => Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]')).filter((item) => !item.matches(':disabled, [aria-disabled="true"], [hidden]'));
  const open = (last = false) => {
    menu.inert = false;
    openDetailsMenu(details);
    const enabled = items();
    (last ? enabled.at(-1) : enabled[0])?.focus();
  };

  trigger.addEventListener("click", () => {
    if (trigger.getAttribute("aria-expanded") === "true") open();
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      open(event.key === "ArrowUp");
    }
  });
  menu.addEventListener("keydown", (event) => {
    const enabled = items();
    const index = enabled.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      enabled[(index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      (event.key === "Home" ? enabled[0] : enabled.at(-1))?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeDetailsMenu(details, true);
    } else if (event.key === "Tab") {
      // Continue from the trigger in document order when leaving the menu.
      closeDetailsMenu(details, true);
      menu.inert = true;
    } else if (event.key === " " && document.activeElement instanceof HTMLAnchorElement) {
      event.preventDefault();
      document.activeElement.click();
    }
  });
  menu.addEventListener("click", (event) => {
    const item = event.target instanceof Element ? event.target.closest<HTMLElement>('[role="menuitem"]') : null;
    if (!item) return;
    if (item.matches(':disabled, [aria-disabled="true"]')) {
      event.preventDefault();
      return;
    }
    closeDetailsMenu(details, true);
  });
});
