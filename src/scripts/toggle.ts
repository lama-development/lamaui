export {};

document.querySelectorAll<HTMLButtonElement>("[data-toggle]").forEach((button) => button.addEventListener("click", () => button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"))));

document.querySelectorAll<HTMLElement>("[data-toggle-group]").forEach((group) =>
  group.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>("[data-toggle]");
    if (!button) return;
    group.querySelectorAll<HTMLButtonElement>("[data-toggle]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  })
);
