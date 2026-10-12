export {};

const $ = (selector: string, root: ParentNode = document) => root.querySelector<HTMLElement>(selector);

document.querySelectorAll<HTMLButtonElement>("[data-copy-code]").forEach((button) =>
  button.addEventListener("click", async () => {
    const block = button.closest<HTMLElement>("[data-code-block]");
    const code = $("code", block ?? document)?.textContent ?? "";
    const label = $("[data-copy-label]", button);
    const defaultIcon = $("[data-copy-default]", button);
    const successIcon = $("[data-copy-success]", button);
    const tooltip = $("[data-tooltip-label]", button.closest("[data-tooltip]") ?? document);
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

document.querySelectorAll<HTMLButtonElement>("[data-code-wrap]").forEach((button) =>
  button.addEventListener("click", () => {
    const block = button.closest<HTMLElement>("[data-code-block]");
    if (!block) return;
    const wrapped = !block.classList.contains("is-wrapped");
    block.classList.toggle("is-wrapped", wrapped);
    button.setAttribute("aria-pressed", String(wrapped));
    button.setAttribute("aria-label", wrapped ? "Unwrap lines" : "Wrap lines");
    const tooltip = $("[data-tooltip-label]", button.closest("[data-tooltip]") ?? document);
    if (tooltip) tooltip.textContent = wrapped ? "Unwrap lines" : "Wrap lines";
    $("[data-wrap-off]", button)?.toggleAttribute("hidden", wrapped);
    $("[data-wrap-on]", button)?.toggleAttribute("hidden", !wrapped);
  })
);
