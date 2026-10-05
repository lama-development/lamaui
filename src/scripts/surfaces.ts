const resolveSurfaces = (root: ParentNode = document) => {
  root.querySelectorAll<HTMLElement>("[data-surface-lift]").forEach((surface) => {
    const lift = Number(surface.dataset.surfaceLift || 1);
    const parent = surface.parentElement?.closest<HTMLElement>("[data-surface-level]");
    const substrate = Number(parent?.dataset.surfaceLevel || 1);
    surface.dataset.surfaceLevel = String(Math.min(8, Math.max(1, substrate + lift)));
  });
};

resolveSurfaces();
document.addEventListener("astro:page-load", () => resolveSurfaces());
