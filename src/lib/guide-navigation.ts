import { components } from "./components";

// Deliberate relationships help readers choose or compose components. Catalog
// order remains separate so Previous/Next can still traverse the whole library.
const connections: [string, string, string][] = [
  ["accordion", "tabs", "Compare expanding sections with tabbed panels."],
  ["accordion", "card", "Keep essential content visible inside a card."],
  ["button", "icon-button", "Use labeled icon-only actions in tight spaces."],
  ["button", "split-button", "Pair a primary action with related options."],
  ["button", "button-group", "Keep related actions visible in one group."],
  ["icon-button", "icon", "Import and size SVGs for icon-only actions."],
  ["icon-button", "tooltip", "Add a visual hint to a clearly labeled action."],
  ["toggle", "toggle-group", "Coordinate pressed states into one selection."],
  ["toggle", "switch", "Use switches for settings that apply at once."],
  ["input", "form-field", "Add labels, help text, and errors to fields."],
  ["input", "textarea", "Use a larger field for multi-line text."],
  ["input", "number-input", "Set limits and steps for numeric input."],
  ["input", "search-input", "Add a search type and a leading search icon."],
  ["input", "password-input", "Let people show or hide a password entry."],
  ["form-field", "label", "Connect a visible label to its form control."],
  ["select", "custom-select", "Compare native selects and custom listboxes."],
  ["select", "radio-group", "Show a short list of single-choice options."],
  ["checkbox", "radio-group", "Choose independent or single-choice options."],
  ["checkbox", "switch", "Compare form choices and immediate settings."],
  ["slider", "number-input", "Offer a range slider or exact numeric entry."],
  ["dialog", "drawer", "Choose a centered dialog or an edge panel."],
  ["dialog", "popover", "Compare modal tasks and anchored content."],
  ["popover", "dropdown-menu", "Add menu keyboard navigation to action lists."],
  ["popover", "tooltip", "Choose interactive content or a brief hint."],
  ["tabs", "tab-panel", "Connect each tab to its matching content panel."],
  ["tabs", "toggle-group", "Switch content panels or change a stored value."],
  ["breadcrumb", "pagination", "Navigate a hierarchy or a paged result set."],
  ["pagination", "table", "Page through a collection of structured rows."],
  ["stepper", "progress", "Show named steps or numeric task progress."],
  ["alert", "toast", "Compare inline messages and brief notifications."],
  ["toast", "toast-region", "Group and stack notifications in one region."],
  ["spinner", "skeleton", "Show loading activity or placeholder content."],
  ["spinner", "progress", "Use a spinner for work with unknown progress."],
  ["avatar", "avatar-group", "Show several people in a compact avatar group."],
  ["chip", "tag", "Compare status labels and removable tags."],
  ["card", "surface", "Group related content on a themed surface."],
  ["table", "description-list", "Compare table rows with term-value pairs."],
  ["code-block", "inline-code", "Choose a code example or a token in prose."],
  ["container", "section", "Combine content width and section spacing."],
  ["stack", "inline", "Arrange content vertically or in a row."],
  ["stack", "grid", "Choose a single flow or responsive columns."],
  ["divider", "stack", "Separate groups with spacing or a divider."],
  ["theme-picker", "accent-picker", "Choose controls for theme and accent color."]
];

export function relatedComponents(slug: string) {
  const current = components.find((component) => component.slug === slug);
  if (!current) throw new Error(`Unknown component: ${slug}`);
  const related = connections.filter(([from, to]) => from === slug || to === slug).map(([from, to, reason]) => ({ slug: from === slug ? to : from, reason }));
  const suggestions = related.length ? related : components.filter((component) => component.groupSlug === current.groupSlug && component.slug !== slug).map((component) => ({ slug: component.slug, reason: component.description }));
  return suggestions.slice(0, 3).map((suggestion) => {
    const component = components.find((component) => component.slug === suggestion.slug);
    if (!component) throw new Error(`Unknown related component: ${suggestion.slug}`);
    return { ...component, reason: suggestion.reason };
  });
}

export const guideCautions: Record<string, string> = {
  dialog: "Match `data-dialog-open` to a unique Dialog `id` on the page.",
  drawer: "Match `data-dialog-open` to a unique Drawer `id`. The same drawer becomes a bottom sheet on narrow screens.",
  tooltip: "Keep labels and errors visible. Use Tooltip for short hints; use Popover for content with links or buttons.",
  "icon-button": 'Provide a descriptive `label`, such as "Copy project link". A Tooltip does not replace its accessible name.',
  "custom-select": "Use distinct instance IDs and option values. Add a `name` to submit the selection with a form; prefer Select when native browser behavior is enough.",
  "dropdown-menu": 'Menu actions need `role="menuitem"` and `tabindex="-1"`. Use `type="button"` to avoid submitting a surrounding form.',
  tabs: "Match each TabPanel `tabsId` to the Tabs `id`, and its `id` to the matching tab ID.",
  toast: "Give each Toast a unique `id` inside ToastRegion. Keep errors that require action visible with Alert or FormField too.",
  "form-field": 'Match the control `id` to the FormField `id`. For `id="email"`, set `aria-describedby="email-message"` on the control. Set `invalid` when showing an error.',
  icon: "Use trusted SVG imports for `src`, never user-submitted markup. Set IconButton `label` for icon-only actions."
};
