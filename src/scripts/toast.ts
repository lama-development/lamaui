export {};

const syncToastStack = (region: HTMLElement | null) => {
  if (!region) return;
  const toasts = Array.from(region.querySelectorAll<HTMLElement>(":scope > [data-toast]:not(.hidden)"));
  toasts.forEach((toast, position) => {
    const index = toasts.length - position - 1;
    toast.style.setProperty("--toast-stack-index", String(Math.min(index, 3)));
    toast.style.zIndex = String(toasts.length - index);
    toast.toggleAttribute("inert", index > 0);
    toast.toggleAttribute("data-toast-covered", index > 3);
  });
};
const hideToast = (toast: HTMLElement | null) => {
  if (!toast || toast.classList.contains("hidden")) return;
  const region = toast.closest<HTMLElement>("[data-toast-region]");
  toast.classList.remove("is-open");
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    toast.removeEventListener("transitionend", finishAfterOpacity);
    if (toast.hasAttribute("data-toast-transient")) toast.remove();
    else {
      toast.classList.remove("grid");
      toast.classList.add("hidden");
    }
    syncToastStack(region);
  };
  const finishAfterOpacity = (event: TransitionEvent) => {
    if (event.target === toast && event.propertyName === "opacity") finish();
  };
  toast.addEventListener("transitionend", finishAfterOpacity);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
  window.setTimeout(finish, 400);
};
document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const opener = event.target.closest<HTMLElement>("[data-toast-open]");
  if (opener) {
    const source = document.getElementById(opener.dataset.toastOpen ?? "");
    const region = source?.closest<HTMLElement>("[data-toast-region]");
    if (!source || !region) return;
    const toast = source.cloneNode(true) as HTMLElement;
    toast.removeAttribute("id");
    toast.dataset.toastTransient = "true";
    toast.classList.remove("hidden");
    toast.classList.add("grid");
    region.append(toast);
    syncToastStack(region);
    requestAnimationFrame(() => toast.classList.add("is-open"));
    if (toast.getAttribute("role") !== "alert") window.setTimeout(() => hideToast(toast), 5000);
    return;
  }
  const closer = event.target.closest<HTMLElement>("[data-toast-close]");
  if (closer) hideToast(closer.closest<HTMLElement>("[data-toast]"));
});
document.addEventListener("toast:dismiss", (event) => hideToast((event.target as Element | null)?.closest<HTMLElement>("[data-toast]") ?? null));
document.addEventListener("toast:added", (event) => syncToastStack((event.target as Element | null)?.closest<HTMLElement>("[data-toast-region]") ?? null));
