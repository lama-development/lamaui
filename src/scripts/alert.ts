export {};

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const alert = event.target.closest("[data-dismiss]")?.closest<HTMLElement>('[role="alert"],[role="status"]');
  if (!alert) return;
  if (alert.hasAttribute("data-dismiss-hide")) alert.hidden = true;
  else alert.remove();
});
