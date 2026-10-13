import "./components";

const catalog = document.querySelector<HTMLElement>("[data-catalog]");

if (catalog) {
  const navigation = catalog.querySelector<HTMLElement>("[data-catalog-nav]")!;
  const scroller = navigation.querySelector<HTMLElement>(".lamaui-tabs-scroll")!;
  const highlight = navigation.querySelector<HTMLElement>(".lamaui-tab-highlight")!;
  const links = Array.from(navigation.querySelectorAll<HTMLAnchorElement>("[data-catalog-link]"));
  const groups = Array.from(catalog.querySelectorAll<HTMLElement>("[data-catalog-group]"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = window.matchMedia("(max-width: 860px)");
  let currentSection = "";
  let frame = 0;

  const moveHighlight = (link: HTMLAnchorElement, animate = true) => {
    const previous = highlight.style.transition;
    if (!animate) highlight.style.transition = "none";
    highlight.style.transform = `translateX(${link.offsetLeft}px)`;
    highlight.style.width = `${link.offsetWidth}px`;
    if (!animate) {
      void highlight.offsetWidth;
      highlight.style.transition = previous;
    }
  };

  const revealActiveLink = (link: HTMLAnchorElement) => {
    if (!mobile.matches) return;
    const linkRect = link.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    if (linkRect.left >= scrollerRect.left && linkRect.right <= scrollerRect.right) return;
    scroller.scrollBy({
      left: linkRect.left + linkRect.width / 2 - (scrollerRect.left + scrollerRect.width / 2),
      behavior: reducedMotion.matches ? "instant" : "smooth"
    });
  };

  const activate = (section: string, animate = true) => {
    if (section === currentSection) return;
    const active = links.find((link) => link.dataset.catalogLink === section) ?? links[0];
    currentSection = active.dataset.catalogLink!;
    links.forEach((link) => {
      if (link === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    moveHighlight(active, animate);
    revealActiveLink(active);
  };

  const sectionAtReadingLine = () => {
    const readingLine = mobile.matches ? Math.max(0, scroller.getBoundingClientRect().bottom) + 24 : 104;
    let section = groups[0]?.dataset.catalogGroup ?? "";
    for (const group of groups) {
      if (group.getBoundingClientRect().top > readingLine) break;
      section = group.dataset.catalogGroup!;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) section = groups.at(-1)?.dataset.catalogGroup ?? section;
    activate(section);
  };

  const scheduleUpdate = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      sectionAtReadingLine();
    });
  };

  links.forEach((link) => link.addEventListener("click", () => activate(link.dataset.catalogLink!)));
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  window.addEventListener("pageshow", scheduleUpdate);

  const resizeObserver = new ResizeObserver(() => {
    const active = links.find((link) => link.getAttribute("aria-current") === "location");
    if (active) moveHighlight(active, false);
    scheduleUpdate();
  });
  resizeObserver.observe(navigation);
  links.forEach((link) => resizeObserver.observe(link));

  const legacyCategory = new URL(location.href).searchParams.get("category");
  const legacyTarget = groups.find((group) => group.dataset.catalogGroup === legacyCategory);
  if (legacyTarget && (!location.hash || location.hash === "#catalog")) {
    const url = new URL(location.href);
    url.searchParams.delete("category");
    url.searchParams.delete("q");
    url.hash = legacyTarget.id;
    history.replaceState(null, "", url);
    requestAnimationFrame(() => legacyTarget.scrollIntoView());
  }

  const hashSection = links.find((link) => link.hash === location.hash)?.dataset.catalogLink;
  activate(hashSection ?? groups[0]?.dataset.catalogGroup ?? "", false);
  requestAnimationFrame(scheduleUpdate);
}
