export {};

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const opener = event.target.closest<HTMLElement>("[data-dialog-open]");
  if (opener) {
    const dialog = document.getElementById(opener.dataset.dialogOpen ?? "");
    if (dialog instanceof HTMLDialogElement && !dialog.hasAttribute("data-drawer")) dialog.showModal();
    return;
  }
  const closer = event.target.closest<HTMLElement>("[data-dialog-close]");
  const dialog = closer?.closest<HTMLDialogElement>("dialog");
  if (dialog && !dialog.hasAttribute("data-drawer")) dialog.close();
});

document.querySelectorAll<HTMLDialogElement>("dialog:not([data-drawer])").forEach((dialog) =>
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  })
);
