export interface SearchEntry {
  title: string;
  component: string;
  group: string;
  href: string;
  description: string;
  keywords: string;
  section?: string;
}

export const normalizeSearch = (text: string) =>
  text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const synonyms: Record<string, string> = {
  dialog: "modal popup confirmation",
  drawer: "sheet panel slide",
  "dropdown-menu": "context menu actions",
  "custom-select": "combobox listbox dropdown options",
  select: "dropdown options",
  switch: "boolean toggle setting",
  spinner: "loading busy",
  skeleton: "loading placeholder",
  chip: "badge status",
  breadcrumb: "breadcrumbs path",
  "accent-picker": "color colour palette",
  "theme-picker": "dark light appearance",
  input: "text field textbox",
  "search-input": "find query",
  toast: "notification snackbar",
  "toast-region": "notification stack",
  "password-input": "secret visibility",
  "number-input": "numeric quantity",
  stack: "vertical flex column spacing",
  inline: "horizontal flex row wrapping",
  grid: "columns responsive layout",
  surface: "elevation background panel",
  tooltip: "hint help hover",
  progress: "completion loading bar",
  "radio-group": "single choice options",
  "button-group": "group actions toolbar"
};
export const searchAliases = (slug: string) => synonyms[slug] ?? "";

// A bounded edit distance keeps small typos useful without unrelated fuzzy matches.
function typoMatch(a: string, b: string): boolean {
  const limit = a.length > 6 ? 2 : 1;
  if (a.length < 4 || Math.abs(a.length - b.length) > limit) return false;
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + Number(a[i - 1] !== b[j - 1]));
    row = next;
  }
  return row[b.length] <= limit;
}

export function searchEntries(entries: SearchEntry[], query: string, currentPath = ""): SearchEntry[] {
  const normalized = normalizeSearch(query).slice(0, 160);
  if (!normalized) return [];
  const tokens = normalized.split(" ").slice(0, 12);
  const ranked = entries
    .map((entry, index) => {
      const title = normalizeSearch(entry.title);
      const component = normalizeSearch(entry.component);
      const primary = `${component} ${title}`.split(" ");
      const secondary = normalizeSearch(`${entry.group} ${entry.keywords}`).split(" ");
      const body = normalizeSearch(entry.description).split(" ");
      let score = entry.section ? 0 : 5;
      for (const token of tokens) {
        const initials = component
          .split(" ")
          .map((word) => word[0])
          .join("");
        const match = primary.includes(token) ? 40 : primary.some((word) => word.startsWith(token)) ? 28 : component.replaceAll(" ", "").includes(token) ? 24 : token.length > 1 && initials === token ? 22 : secondary.includes(token) ? 18 : secondary.some((word) => word.startsWith(token)) ? 12 : body.includes(token) ? 8 : body.some((word) => word.startsWith(token)) ? 5 : primary.some((word) => typoMatch(token, word)) ? 10 : 0;
        if (!match) return { entry, score: -1, index };
        score += match;
      }
      if (component.replaceAll(" ", "") === normalized.replaceAll(" ", "")) score += 60;
      if (title === normalized) score += 30;
      if (entry.section && tokens.some((token) => normalizeSearch(entry.section!).split(" ").includes(token))) score += 35;
      if (entry.href.split("#")[0] === currentPath) score += 2;
      return { entry, score, index };
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const sectionQuery = tokens.some((token) => /^(props?|api|reference|attributes?|defaults?|setup|styles?|runtime|integration|dependencies|examples?|variants?|demo|accessibility|keyboard|focus|aria|responsive|motion|slots?|children|types?|interfaces?|usage|import|install|start)$/.test(token));
  const matchedComponents = new Set(ranked.filter((item) => !item.entry.section).map((item) => item.entry.component));
  return ranked
    .filter(({ entry }) => sectionQuery || !entry.section || !matchedComponents.has(entry.component))
    .slice(0, 10)
    .map((item) => item.entry);
}
