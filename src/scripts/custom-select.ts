// @ts-nocheck
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const dropdowns = [];
$$("[data-select]").forEach((root) => {
  const trigger = $("[data-select-trigger]", root),
    list = $("[data-select-list]", root),
    input = $("[data-select-input]", root),
    value = $("[data-select-value]", root),
    valueIcon = $("[data-select-value-icon]", root),
    options = $$('[role="option"]', root);
  let closeTimer;
  const close = (focus = false) => {
    if (list.hidden) return;
    list.classList.remove("is-open");
    list.classList.add("is-closing");
    trigger.setAttribute("aria-expanded", "false");
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      list.hidden = true;
      list.classList.remove("is-closing");
    }, 150);
    if (focus) trigger.focus();
  };
  const open = (where = "selected") => {
    clearTimeout(closeTimer);
    dropdowns.forEach((item) => item.root !== root && item.close());
    list.hidden = false;
    list.classList.remove("is-closing");
    requestAnimationFrame(() => list.classList.add("is-open"));
    trigger.setAttribute("aria-expanded", "true");
    const enabled = options.filter((option) => !option.disabled),
      selected = options.find((option) => option.getAttribute("aria-selected") === "true");
    requestAnimationFrame(() => (where === "first" ? enabled[0] : where === "last" ? enabled.at(-1) : selected || enabled[0])?.focus());
  };
  const choose = (option) => {
    if (option.disabled) return;
    options.forEach((item) => {
      item.setAttribute("aria-selected", String(item === option));
      item.querySelector("[data-option-check]")?.toggleAttribute("hidden", item !== option);
    });
    input.value = option.dataset.value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    value.classList.add("is-swapping");
    setTimeout(() => {
      value.textContent = options.find((item) => item.dataset.value === input.value)?.dataset.label || option.dataset.label;
      value.classList.remove("is-swapping");
    }, 80);
    if (valueIcon) valueIcon.innerHTML = option.querySelector("[data-option-icon]")?.innerHTML || "";
    close(true);
  };
  trigger?.addEventListener("click", () => (list.hidden ? open() : close(true)));
  trigger?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      open(event.key === "ArrowDown" ? "first" : "last");
    }
  });
  list?.addEventListener("keydown", (event) => {
    const enabled = options.filter((option) => !option.disabled),
      index = enabled.indexOf(document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      enabled[(index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length]?.focus();
    } else if ((event.key === "Enter" || event.key === " ") && document.activeElement.matches('[role="option"]')) {
      event.preventDefault();
      choose(document.activeElement);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      (event.key === "Home" ? enabled[0] : enabled.at(-1))?.focus();
    } else if (event.key === "Tab") {
      close(true);
    }
  });
  options.forEach((option) => option.addEventListener("click", () => choose(option)));
  root.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget)) close();
  });
  dropdowns.push({ root, close });
});
document.addEventListener("pointerdown", (event) =>
  dropdowns.forEach((item) => {
    if (!item.root.contains(event.target)) item.close();
  })
);
