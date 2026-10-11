import { normalizeSearch, searchEntries, type SearchEntry } from "@/lib/search";

const dialog = document.querySelector<HTMLDialogElement>("#docs-search")!;
const input = dialog.querySelector<HTMLInputElement>("input")!;
const list = dialog.querySelector<HTMLElement>("[role=listbox]")!;
const status = dialog.querySelector<HTMLElement>("[data-search-status]")!;
const heading = dialog.querySelector<HTMLElement>("[data-search-heading]")!;
const empty = dialog.querySelector<HTMLElement>("[data-search-empty]")!;
const entries: SearchEntry[] = JSON.parse(document.querySelector("#docs-search-index")!.textContent!);
const storageKey = "lamaui-search-recent";
let recent: string[] = [];
try {
  const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
  if (Array.isArray(saved)) recent = saved.filter((value): value is string => typeof value === "string" && entries.some((entry) => entry.href === value)).slice(0, 5);
} catch {}
let results: SearchEntry[] = [];
let selected = 0;
let returnFocus: HTMLElement | null = null;
const triggers = document.querySelectorAll<HTMLButtonElement>("[data-search-open]");
const shortcut = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘ K" : "Ctrl K";
document.querySelectorAll("[data-search-shortcut]").forEach((element) => {
  element.textContent = shortcut;
});

function select(index: number, scroll = true) {
  selected = index;
  const options = list.querySelectorAll<HTMLAnchorElement>("[role=option]");
  options.forEach((option, i) => option.setAttribute("aria-selected", String(i === selected)));
  const active = options[selected];
  if (active) {
    input.setAttribute("aria-activedescendant", active.id);
    if (scroll) active.scrollIntoView({ block: "nearest" });
  } else input.removeAttribute("aria-activedescendant");
}

function highlight(element: HTMLElement, text: string) {
  const tokens = normalizeSearch(input.value).split(" ").filter(Boolean);
  // Match literal query fragments only; all text is inserted as text nodes.
  const parts = tokens.length ? text.split(new RegExp(`(${tokens.join("|")})`, "ig")) : [text];
  for (const part of parts) {
    if (tokens.includes(part.toLowerCase())) {
      const mark = document.createElement("mark");
      mark.className = "bg-transparent text-accent";
      mark.textContent = part;
      element.append(mark);
    } else element.append(document.createTextNode(part));
  }
}

function render() {
  const query = normalizeSearch(input.value);
  if (query) results = searchEntries(entries, query, location.pathname);
  else {
    const history = recent.map((href) => entries.find((entry) => entry.href === href)!);
    const current = entries.find((entry) => entry.href === location.pathname);
    const suggested = [current, entries[0], entries[1], ...entries.filter((entry) => !entry.section && ["Button", "Input", "Dialog", "Card"].includes(entry.component))].filter((entry): entry is SearchEntry => Boolean(entry));
    results = [...new Map([...history, ...suggested].map((entry) => [entry.href, entry])).values()].slice(0, 8);
  }
  heading.textContent = query ? "Results" : recent.length ? "Recent & suggested" : "Suggested";
  status.textContent = `${results.length}${query && results.length === 10 ? "+" : ""} results`;
  empty.hidden = results.length !== 0;
  list.replaceChildren();
  results.forEach((entry, index) => {
    const option = document.createElement("a");
    option.href = entry.href;
    option.id = `docs-search-result-${index}`;
    option.role = "option";
    option.tabIndex = -1;
    option.className = "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-label no-underline aria-selected:bg-accent-subtle hover:bg-surface-hover";
    const content = document.createElement("div");
    content.className = "min-w-0 flex-1";
    const title = document.createElement("div");
    title.className = "text-sm font-semibold";
    highlight(title, entry.title);
    const description = document.createElement("div");
    description.className = "mt-1 truncate text-xs text-muted-label";
    description.textContent = `${entry.group} · ${entry.description}`;
    content.append(title, description);
    const arrow = document.createElement("span");
    arrow.className = "text-sm text-muted-label group-aria-selected:text-accent";
    arrow.ariaHidden = "true";
    arrow.textContent = "↵";
    option.append(content, arrow);
    option.addEventListener("pointermove", () => select(index, false));
    option.addEventListener("mousedown", (event) => {
      if (event.button === 0) event.preventDefault();
    });
    option.addEventListener("click", () => {
      recent = [entry.href, ...recent.filter((href) => href !== entry.href)].slice(0, 5);
      try {
        localStorage.setItem(storageKey, JSON.stringify(recent));
      } catch {}
      dialog.close();
    });
    list.append(option);
  });
  select(0, false);
}
function open(trigger?: HTMLElement) {
  if (dialog.open) return;
  // Leave another active modal in control of its focus and shortcuts.
  if (document.querySelector("dialog[open]")) return;
  returnFocus = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  input.value = "";
  render();
  dialog.showModal();
  triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "true"));
  input.setAttribute("aria-expanded", "true");
  input.focus();
}
triggers.forEach((trigger) => trigger.addEventListener("click", () => open(trigger)));
dialog.querySelector("[data-search-close]")!.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener("close", () => {
  triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
  input.setAttribute("aria-expanded", "false");
  returnFocus?.focus({ preventScroll: true });
});
dialog.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const close = dialog.querySelector<HTMLButtonElement>("[data-search-close]")!;
  if (event.shiftKey && document.activeElement === input) {
    event.preventDefault();
    close.focus();
  } else if (!event.shiftKey && document.activeElement === close) {
    event.preventDefault();
    input.focus();
  }
});
input.addEventListener("input", render);
input.addEventListener("keydown", (event) => {
  if (event.isComposing) return;
  if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) && results.length) {
    // Home and End retain normal text editing unless combined with Alt.
    if ((event.key === "Home" || event.key === "End") && !event.altKey) return;
    event.preventDefault();
    select(event.key === "Home" ? 0 : event.key === "End" ? results.length - 1 : (selected + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length);
  } else if (event.key === "Enter" && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    list.querySelector<HTMLAnchorElement>(`#docs-search-result-${selected}`)?.click();
  }
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "k" && !event.isComposing) {
    event.preventDefault();
    if (event.repeat) return;
    if (dialog.open) dialog.close();
    else open();
  }
});
