// This module runs only while Astro builds the documentation.
import ts from "typescript";
import docsIconSource from "@icons/docs.ts?raw";
import sharedTypeSource from "@shared-types/index.ts?raw";
const sharedTypeFile = ts.createSourceFile("types.ts", sharedTypeSource, ts.ScriptTarget.Latest, true);
const sharedTypes = new Map(sharedTypeFile.statements.filter(ts.isTypeAliasDeclaration).map((node) => [node.name.text, node.type.getText(sharedTypeFile)]));
const docsIcons = new Map(Array.from(docsIconSource.matchAll(/export \{ default as (\w+) \} from "([^"]+)";/g), (match) => [match[1], match[2]]));
const sources = import.meta.glob<string>("../components/{ui,forms,navigation,data-display,feedback,overlays,layout}/*.astro", { query: "?raw", import: "default", eager: true });
const sourceFor = (name: string) => {
  const match = Object.entries(sources).find(([path]) => path.endsWith(`/${name}.astro`));
  if (!match) throw new Error(`Missing component source: ${name}`);
  return { path: match[0].replace("../", "@/"), source: match[1] };
};
const descriptions: Record<string, string> = {
  id: "Unique identifier for this instance and its associated controls.",
  name: "Name of the submitted form field.",
  class: "Additional classes on the component’s outer element.",
  label: "Text identifying the control or content group.",
  title: "Heading displayed above the content.",
  description: "Supporting text displayed below the heading or label.",
  variant: "Visual emphasis or semantic status.",
  size: "Size preset for the component.",
  type: "Native input or button behavior.",
  href: "Navigation destination.",
  disabled: "Makes the control unavailable.",
  checked: "Initial checked state of the native checkbox.",
  pressed: "Initial aria-pressed state.",
  loading: "Shows progress and prevents repeated activation.",
  fullWidth: "Makes the control fill its container.",
  icon: "Decorative SVG markup imported with ?raw; accepts any Phosphor icon.",
  iconOnly: "Visually hides the label while preserving it as the icon-only trigger’s accessible name.",
  iconPosition: "Places the icon before or after the label.",
  options: "Available choices; see the item type below.",
  value: "Initial field value or displayed measurement.",
  min: "Minimum accepted value.",
  max: "Maximum accepted value.",
  step: "Increment between valid values.",
  invalid: "Sets aria-invalid and displays the error style; supply associated error text separately.",
  placeholder: "Hint displayed before a value is entered or selected.",
  rows: "Initial textarea height in text rows.",
  help: "Supporting text connected to the field.",
  error: "Validation message, replacing help text.",
  required: "Displays a required marker; set required on the native field separately.",
  for: "ID of the label’s associated form control.",
  inline: "Arranges choices in a wrapping horizontal row.",
  placement: "Opens the list above or below the trigger.",
  align: "Alignment of content within its container.",
  items: "Ordered content records; see the item type below.",
  tabs: "Tab definitions; pair each ID with a TabPanel.",
  active: "Initial active tab ID, or initial visibility on a TabPanel.",
  tabsId: "ID of the parent Tabs instance.",
  current: "One-based current page or step number.",
  total: "Total number of available pages.",
  steps: "Steps in display order; see the Step type below.",
  src: "Image URL. Omit to display initials.",
  alt: "Accessible image description, or label for the initials.",
  initials: "Fallback initials displayed without a photo.",
  status: "Optional presence indicator; communicate essential presence in text as well.",
  columns: "Number of responsive columns, or the table’s column definitions.",
  caption: "Accessible table description, visually hidden.",
  hoverable: "Highlights rows on hover.",
  striped: "Alternates row backgrounds.",
  columnBorders: "Shows vertical borders between table cells.",
  density: "Cell spacing preset.",
  emptyMessage: "Message displayed when the table has no rows.",
  showValue: "Displays the label and percentage above the progress bar.",
  width: "CSS width of the placeholder.",
  height: "CSS height of the placeholder.",
  radius: "CSS border radius of the placeholder.",
  vertical: "Renders a vertical separator; its parent must provide height.",
  dot: "Adds a decorative status dot.",
  removable: "Shows a button that removes the tag from the DOM.",
  removeLabel: "Accessible name for the remove button; include the tag’s name.",
  code: "Source text to highlight and copy.",
  language: "Shiki language identifier used for highlighting.",
  text: "Short tooltip description.",
  position: "Preferred alignment or side of the panel.",
  wrap: "Allows inline code to wrap onto multiple lines.",
  dismissible: "Shows the dismiss button.",
  color: "Custom CSS foreground color, overriding the status token.",
  background: "Custom CSS background color.",
  borderColor: "Custom CSS border color.",
  decorative: "Hides the spinner from assistive technology when nearby text already announces loading.",
  padding: "Internal or vertical spacing preset.",
  interactive: "Adds hover styling; does not add link or button semantics.",
  as: "HTML element used as the wrapper.",
  gap: "Spacing between children using the theme’s spacing scale.",
  justify: "Horizontal distribution of children.",
  level: "Explicit surface level, overriding relative lift.",
  lift: "Elevation relative to the nearest surface, capped at level 8.",
  menuLabel: "Accessible name for the secondary menu trigger.",
  download: "Downloads the link destination; optionally supplies a filename.",
  side: "Desktop edge for the drawer; narrow screens use a bottom sheet.",
  key: "Property key read from each row.",
  rowHeader: "Renders this column’s cells as row headers.",
  term: "Term displayed in the description list.",
  detail: "Value associated with the term.",
  attributes: "Additional HTML attributes forwarded to this option’s link or button."
};
export interface PropRow extends Record<string, string> {
  name: string;
  type: string;
  default: string;
  description: string;
}
function membersOf(node: ts.Node): ts.TypeElement[] {
  if (ts.isInterfaceDeclaration(node) || ts.isTypeLiteralNode(node)) return Array.from(node.members);
  if (ts.isTypeAliasDeclaration(node)) return membersOf(node.type);
  if (ts.isIntersectionTypeNode(node)) return node.types.flatMap(membersOf);
  return [];
}
export interface ComponentReference {
  path: string;
  props: PropRow[];
  types: { name: string; props: PropRow[] }[];
  forwardsAttributes: boolean;
  source: string;
}
export function componentReference(name: string, overrides: Record<string, string> = {}): ComponentReference {
  const { path, source } = sourceFor(name);
  const script = source.split("---")[1];
  const file = ts.createSourceFile(`${name}.ts`, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const defaults = new Map<string, string>();
  if (name === "Tabs") defaults.set("active", "First enabled tab");
  file.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (!ts.isObjectBindingPattern(declaration.name) || declaration.initializer?.getText(file) !== "Astro.props") continue;
      for (const binding of declaration.name.elements) {
        if (binding.dotDotDotToken) continue;
        const key = (binding.propertyName ?? binding.name).getText(file);
        if (binding.initializer) defaults.set(key, binding.initializer.getText(file));
      }
    }
  });
  const rowsFor = (node: ts.Node, includeDefaults = true): PropRow[] =>
    membersOf(node)
      .filter(ts.isPropertySignature)
      .map((property) => {
        const key = property.name.getText(file).replace(/^['"]|['"]$/g, "");
        const description = overrides[key] ?? descriptions[key];
        if (!description) throw new Error(`Document the ${name}.${key} prop`);
        return { name: key, type: (property.type?.getText(file) ?? "unknown").replace(/\b(Variant|Size|Status)\b/g, (alias) => `(${sharedTypes.get(alias) ?? alias})`), default: (includeDefaults ? defaults.get(key) : undefined) ?? (property.questionToken ? "—" : "Required"), description };
      });
  const declarations = file.statements.filter((node) => ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node));
  const props = declarations.find((node) => node.name.text === "Props");
  if (!props) throw new Error(`Missing Props for ${name}`);
  let rows = rowsFor(props);
  // These wrappers forward the remaining props to Input or Button.
  const base = name === "IconButton" ? "Button" : ["SearchInput", "PasswordInput", "NumberInput"].includes(name) ? "Input" : undefined;
  if (base) {
    const inherited = componentReference(base).props.filter((row) => !rows.some((own) => own.name === row.name));
    rows = [...rows, ...inherited];
    if (name === "IconButton") rows = rows.map((row) => (row.name === "type" ? { ...row, default: '"button"' } : row.name === "disabled" ? { ...row, default: "false" } : row));
    if (base === "Input") rows = rows.filter((row) => row.name !== "type");
  }
  return { path, props: rows, types: declarations.filter((node) => node.name.text !== "Props" && membersOf(node).length).map((node) => ({ name: node.name.text, props: rowsFor(node, false) })), forwardsAttributes: source.includes("...rest}") || name === "NumberInput", source };
}
export function withImports(code: string) {
  const normalized = code
    .replace(/import\s+\{([^}]+)\}\s+from\s+["']@icons\/docs["'];?/g, (_, names: string) =>
      names
        .split(",")
        .map((name) => name.trim())
        .map((name) => {
          const path = docsIcons.get(name);
          if (!path) throw new Error(`Missing documentation icon export: ${name}`);
          return `import ${name} from "${path}";`;
        })
        .join("\n")
    )
    .replace(/import\s+[A-Z][A-Za-z]+\s+from\s+["']@\/components\/[^"']+["'];?\r?\n?/g, "")
    .replaceAll('from "@/lib/styles"', 'from "lamaui/styles"')
    .replaceAll("from '@/lib/styles'", "from 'lamaui/styles'");
  const tags = [...new Set(Array.from(normalized.matchAll(/<([A-Z][A-Za-z]+)(?:\s|\/|>)/g), (match) => match[1]))];
  const knownTags = tags.filter((name) => Object.keys(sources).some((path) => path.endsWith(`/${name}.astro`)));
  const packageImports = knownTags.filter((name) => !new RegExp(`import[^{\n]*(?:\\b${name}\\b)[^\n]*from\\s+["']lamaui["']`).test(normalized));
  let frontmatter = "";
  let body = normalized;
  if (normalized.trimStart().startsWith("---")) {
    const start = normalized.indexOf("---");
    const end = normalized.indexOf("\n---", start + 3);
    if (end >= 0) {
      frontmatter = normalized.slice(start + 3, end).trim();
      body = normalized.slice(end + 4).trimStart();
    }
  } else {
    const firstTag = normalized.search(/<(?:[A-Za-z]|!)/);
    if (firstTag < 0) return normalized;
    frontmatter = normalized.slice(0, firstTag).trim();
    body = normalized.slice(firstTag);
  }
  const packageLine = packageImports.length ? `import { ${packageImports.join(", ")} } from "lamaui";` : "";
  return `---\n${[packageLine, frontmatter].filter(Boolean).join("\n")}\n---\n\n${body}`;
}
