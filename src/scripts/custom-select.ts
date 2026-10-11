interface SelectState {
  root: HTMLElement;
  close: (restoreFocus?: boolean) => void;
}
const dropdowns: SelectState[] = [];

document.querySelectorAll<HTMLElement>("[data-select]").forEach((root) => {
  const trigger = root.querySelector<HTMLButtonElement>("[data-select-trigger]")!;
  const list = root.querySelector<HTMLElement>("[data-select-list]")!;
  const input = root.querySelector<HTMLInputElement>("[data-select-input]")!;
  const value = root.querySelector<HTMLElement>("[data-select-value]")!;
  const valueIcon = root.querySelector<HTMLElement>("[data-select-value-icon]")!;
  const options = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="option"]'));
  const enabled = options.filter((option) => !option.disabled);
  let closeTimer: number | undefined;
  let search = "";
  let lastTyped = 0;
  const isOpen = () => trigger.getAttribute("aria-expanded") === "true";
  const close = (restoreFocus = false) => {
    if (!isOpen()) return;
    trigger.setAttribute("aria-expanded", "false");
    list.classList.remove("is-open");
    list.classList.add("is-closing");
    if (restoreFocus) trigger.focus();
    list.inert = true;
    search = "";
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      list.hidden = true;
      list.classList.remove("is-closing");
    }, 150);
  };
  const open = (where: "selected" | "first" | "last" = "selected") => {
    if (trigger.disabled || !enabled.length) return;
    window.clearTimeout(closeTimer);
    dropdowns.forEach((item) => item.root !== root && item.close());
    list.hidden = false;
    list.inert = false;
    list.classList.remove("is-closing");
    trigger.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => {
      if (isOpen()) list.classList.add("is-open");
    });
    const selected = enabled.find((option) => option.getAttribute("aria-selected") === "true");
    (where === "first" ? enabled[0] : where === "last" ? enabled.at(-1) : (selected ?? enabled[0]))?.focus();
  };
  const render = (option: HTMLButtonElement) => {
    options.forEach((item) => {
      item.setAttribute("aria-selected", String(item === option));
      item.querySelector("[data-option-check]")?.toggleAttribute("hidden", item !== option);
    });
    input.value = option.dataset.value ?? "";
    value.textContent = option.dataset.label ?? "";
    valueIcon.replaceChildren(...Array.from(option.querySelector("[data-option-icon]")?.childNodes ?? []).map((node) => node.cloneNode(true)));
    valueIcon.hidden = !valueIcon.childNodes.length;
  };
  const initial = enabled.find((option) => option.getAttribute("aria-selected") === "true");
  const choose = (option: HTMLButtonElement) => {
    if (option.disabled || !isOpen()) return;
    render(option);
    close(true);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const typeAhead = (event: KeyboardEvent) => {
    if (event.key.length !== 1 || event.key === " " || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
    event.preventDefault();
    const now = performance.now();
    search = now - lastTyped > 700 ? event.key : search + event.key;
    lastTyped = now;
    const repeated = Array.from(search).every((letter) => letter.toLocaleLowerCase() === search[0].toLocaleLowerCase());
    const query = (repeated ? search[0] : search).toLocaleLowerCase();
    const index = enabled.indexOf(document.activeElement as HTMLButtonElement);
    const start = query.length === 1 ? index + 1 : Math.max(index, 0);
    const match = Array.from({ length: enabled.length }, (_, offset) => enabled[(start + offset) % enabled.length]).find((option) => option.dataset.label?.toLocaleLowerCase().startsWith(query));
    if (match) {
      if (!isOpen()) open();
      match.focus();
    }
  };
  trigger.addEventListener("click", () => (isOpen() ? close(true) : open()));
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      open(event.key === "ArrowDown" ? "first" : "last");
    } else typeAhead(event);
  });
  list.addEventListener("keydown", (event) => {
    const index = enabled.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      enabled[(index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length]?.focus();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (document.activeElement instanceof HTMLButtonElement && options.includes(document.activeElement)) choose(document.activeElement);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      (event.key === "Home" ? enabled[0] : enabled.at(-1))?.focus();
    } else if (event.key === "Tab") close(true);
    else typeAhead(event);
  });
  options.forEach((option) => option.addEventListener("click", () => choose(option)));
  root.addEventListener("focusout", (event) => {
    if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) close();
  });
  input.form?.addEventListener("reset", (event) => {
    queueMicrotask(() => {
      if (event.defaultPrevented) return;
      close();
      if (initial) render(initial);
    });
  });
  dropdowns.push({ root, close });
});
document.addEventListener("pointerdown", (event) => {
  if (!(event.target instanceof Node)) return;
  dropdowns.forEach((item) => {
    if (!item.root.contains(event.target as Node)) item.close();
  });
});
