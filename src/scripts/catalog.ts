import "./components";

const catalog = document.querySelector<HTMLElement>("[data-catalog]");

if (catalog) {
  const tabs = Array.from(catalog.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const groups = Array.from(catalog.querySelectorAll<HTMLElement>("[data-catalog-group]"));
  const all = catalog.querySelector<HTMLElement>('[data-category-slot="all"]')!;
  const status = catalog.querySelector<HTMLElement>("[data-catalog-status]")!;
  let currentCategory: string | undefined;

  const update = () => {
    const selected = tabs.find((tab) => tab.getAttribute("aria-selected") === "true")!;
    const category = selected.dataset.tab!;
    if (category === currentCategory) return;
    currentCategory = category;

    // Keep one copy of every preview and restore the original order for All.
    all.replaceChildren(...groups);
    const group = groups.find((item) => item.dataset.catalogGroup === category);
    if (group) catalog.querySelector(`[data-category-slot="${category}"]`)!.append(group);
    const count = (group ?? all).querySelectorAll("[data-catalog-card]").length;
    status.textContent = `${count} ${count === 1 ? "component" : "components"}${group ? ` in ${selected.textContent!.trim()}` : ""}`;

    const url = new URL(location.href);
    if (category === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", category);
    url.searchParams.delete("q");
    history.replaceState(null, "", url);
  };

  // The shared Tabs runtime handles selection first, including arrow keys.
  catalog.addEventListener("click", update);
  catalog.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLElement && event.target.matches('[role="tab"]')) update();
  });

  const category = new URLSearchParams(location.search).get("category");
  const initial = tabs.find((tab) => tab.dataset.tab === category);
  if (initial && initial.getAttribute("aria-selected") !== "true") {
    initial.click();
    initial.blur();
  } else update();
  window.addEventListener("pageshow", update);
}
