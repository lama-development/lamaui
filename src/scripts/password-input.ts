export {};

document.querySelectorAll<HTMLButtonElement>("[data-password-toggle]").forEach((button) =>
  button.addEventListener("click", () => {
    const input = button.closest("[data-password]")?.querySelector<HTMLInputElement>("[data-password-input]");
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.querySelector("[data-password-show]")?.toggleAttribute("hidden", show);
    button.querySelector("[data-password-hide]")?.toggleAttribute("hidden", !show);
    const label = `${show ? "Hide" : "Show"} password`;
    button.setAttribute("aria-label", label);
    button.title = label;
  })
);
