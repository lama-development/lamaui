import { guideContent } from "./guide-content";

export interface ComponentDoc {
  name: string;
  slug: string;
  description: string;
  usage: string;
}

export interface ComponentGroup {
  name: string;
  slug: string;
  icon: string;
  components: ComponentDoc[];
}

const component = (name: string, slug: string, description: string, usage?: string): ComponentDoc => {
  const example = guideContent[slug]?.usage ?? usage;
  if (!example) throw new Error(`Missing quick start for ${name}`);
  return { name, slug, description, usage: example };
};

export const componentGroups: ComponentGroup[] = [
  {
    name: "Foundations",
    slug: "foundations",
    icon: "foundations",
    components: [component("Icon", "icon", "Renders imported SVGs with consistent sizing and color.", 'import svgSettings from "@phosphor-icons/core/duotone/gear-six-duotone.svg?raw";\n<Icon src={svgSettings} size={20} />'), component("ThemePicker", "theme-picker", "Chooses System, Light, or Dark with compact icon buttons.", 'import ThemePicker from "@/components/ui/ThemePicker.astro";\n\n<ThemePicker label="Color theme" />'), component("AccentPicker", "accent-picker", "Selects and persists an accent color from named presets.")]
  },
  {
    name: "Actions",
    slug: "actions",
    icon: "actions",
    components: [
      component("Button", "button", "Triggers an action or links to another view, with optional leading or trailing icons.", 'import svgPlus from "@phosphor-icons/core/bold/plus-bold.svg?raw";\nimport Button from "@/components/ui/Button.astro";\n\n<Button variant="primary" icon={svgPlus}>Create</Button>'),
      component("SplitButton", "split-button", "Combines a primary action with a menu of closely related alternatives.", 'import svgFilePdf from "@phosphor-icons/core/duotone/file-pdf-duotone.svg?raw";\nimport svgFileMd from "@phosphor-icons/core/duotone/file-md-duotone.svg?raw";\nimport svgClipboardText from "@phosphor-icons/core/duotone/clipboard-text-duotone.svg?raw";\n<SplitButton\n  label="Download PDF"\n  icon={svgFilePdf}\n  href="/report.pdf"\n  download\n  options={[\n    { label: "Download Markdown", href: "/report.md", download: true, icon: svgFileMd },\n    { label: "Copy as text", icon: svgClipboardText }\n  ]}\n/>'),
      component("IconButton", "icon-button", "A compact action with an accessible text label.", 'import svgCopy from "@phosphor-icons/core/duotone/copy-duotone.svg?raw";\n<IconButton label="Copy"><Icon src={svgCopy} /></IconButton>'),
      component("ButtonGroup", "button-group", "Joins related actions into one control group."),
      component("Toggle", "toggle", "A button that represents an on or off state."),
      component("ToggleGroup", "toggle-group", "A coordinated set of mutually exclusive toggles.")
    ]
  },
  {
    name: "Forms",
    slug: "forms",
    icon: "forms",
    components: [
      component("Label", "label", "Labels a form control with optional required state."),
      component("FormField", "form-field", "Combines a label, control, help text, and validation message."),
      component("Input", "input", "A single-line text field with consistent focus and error states.", '<Input id="email" type="email" placeholder="name@company.com" />'),
      component("Textarea", "textarea", "A resizable multi-line text field."),
      component("Select", "select", "A styled native select for simple choices."),
      component("CustomSelect", "custom-select", "An animated, keyboard-accessible listbox with option icons.", 'import svgForms from "@phosphor-icons/core/duotone/note-pencil-duotone.svg?raw";\nimport svgCode from "@phosphor-icons/core/bold/code-bold.svg?raw";\nimport svgSearch from "@phosphor-icons/core/duotone/magnifying-glass-duotone.svg?raw";\nimport CustomSelect from "@/components/forms/CustomSelect.astro";\n\n<CustomSelect\n  id="team"\n  name="team"\n  label="Team"\n  value="design"\n  help="Choose the team that owns this project."\n  options={[\n    { value: "design", label: "Design", icon: svgForms },\n    { value: "engineering", label: "Engineering", icon: svgCode },\n    { value: "research", label: "Research", icon: svgSearch }\n  ]}\n/>'),
      component("Checkbox", "checkbox", "Allows one or more independent choices."),
      component("RadioGroup", "radio-group", "Selects one option from a small set."),
      component("Switch", "switch", "Controls an immediate boolean setting."),
      component("Slider", "slider", "Chooses a numeric value from a range."),
      component("SearchInput", "search-input", "A text field specialized for search."),
      component("PasswordInput", "password-input", "A password field with a visibility control."),
      component("NumberInput", "number-input", "A numeric text field with native step controls.")
    ]
  },
  {
    name: "Navigation",
    slug: "navigation",
    icon: "navigation",
    components: [component("Breadcrumb", "breadcrumb", "Shows location within a page hierarchy."), component("Tabs", "tabs", "Switches between related content panels with arrow-key support."), component("TabPanel", "tab-panel", "The accessible content region controlled by a tab."), component("Pagination", "pagination", "Moves between pages in a collection."), component("Stepper", "stepper", "Communicates progress through a multi-step flow."), component("DropdownMenu", "dropdown-menu", "Presents contextual actions from a compact trigger.", 'import DropdownMenu from "@/components/navigation/DropdownMenu.astro";\nimport { menuItemStyles } from "@/lib/styles";\n\n<DropdownMenu label="Document actions">\n  <button type="button" role="menuitem" tabindex="-1" class={menuItemStyles}>Duplicate</button>\n  <a role="menuitem" tabindex="-1" href="/documents" class={menuItemStyles}>All documents</a>\n</DropdownMenu>')]
  },
  {
    name: "Data display",
    slug: "data-display",
    icon: "data",
    components: [
      component("Card", "card", "A bordered surface for related information and actions."),
      component("Chip", "chip", "A compact text label for status or classification."),
      component("Avatar", "avatar", "Represents a person with an image or initials."),
      component("AvatarGroup", "avatar-group", "Displays several avatars in a compact stack."),
      component("Table", "table", "Displays structured data with configurable spacing and optional row highlighting.", 'import Table from "@/components/data-display/Table.astro";\n\nconst columns = [\n  { key: "name", label: "Name", rowHeader: true },\n  { key: "role", label: "Role" },\n  { key: "status", label: "Status", align: "right" as const }\n];\nconst rows = [\n  { name: "Ari Lane", role: "Designer", status: "Active" },\n  { name: "Mina Park", role: "Engineer", status: "Away" },\n  { name: "Theo Moss", role: "Researcher", status: "Active" }\n];\n\n<Table columns={columns} rows={rows} caption="Members" />'),
      component("DescriptionList", "description-list", "Pairs terms with descriptive values."),
      component("Progress", "progress", "Shows completion against a known total."),
      component("Skeleton", "skeleton", "Reserves content space while data loads."),
      component("Divider", "divider", "Separates adjacent content or groups."),
      component("Tag", "tag", "Labels an item and can optionally be removed."),
      component("InlineCode", "inline-code", "Styles a short code token inside a sentence."),
      component("CodeBlock", "code-block", "Displays code with library-consistent styling.")
    ]
  },
  { name: "Feedback", slug: "feedback", icon: "feedback", components: [component("Alert", "alert", "Communicates persistent informational or status messages.", '<Alert variant="warning" title="Review required">\n  Two fields need attention.\n</Alert>'), component("Toast", "toast", "Shows a temporary result without interrupting work."), component("ToastRegion", "toast-region", "Positions and stacks toast notifications within the viewport."), component("Spinner", "spinner", "Indicates indeterminate background activity.")] },
  {
    name: "Overlays",
    slug: "overlays",
    icon: "overlays",
    components: [
      component("Dialog", "dialog", "Focuses attention on a decision or short task.", 'import Dialog from "@/components/overlays/Dialog.astro";\n\n<Button data-dialog-open="publish-dialog">Publish</Button>\n<Dialog id="publish-dialog" title="Publish changes?" description="This creates a new component version.">\n  <!-- Dialog content and actions -->\n</Dialog>'),
      component("Drawer", "drawer", "Shows supplementary controls from the edge of the viewport.", 'import Drawer from "@/components/overlays/Drawer.astro";\n\n<Button data-dialog-open="example-drawer">Open drawer</Button>\n<Drawer id="example-drawer" title="Drawer title">\n  <p>Drawer content.</p>\n</Drawer>'),
      component("Popover", "popover", "Displays concise contextual content near its trigger.", 'import Popover from "@/components/overlays/Popover.astro";\n\n<Popover label="Open popover">\n  <p>Contextual content.</p>\n</Popover>'),
      component("Tooltip", "tooltip", "Provides a short label for an icon or unfamiliar control.", 'import svgCopy from "@phosphor-icons/core/duotone/copy-duotone.svg?raw";\nimport Tooltip from "@/components/overlays/Tooltip.astro";\n\n<Tooltip text="Copy component">\n  <IconButton label="Copy component"><Icon src={svgCopy} /></IconButton>\n</Tooltip>')
    ]
  },
  { name: "Layout", slug: "layout", icon: "layout", components: [component("Surface", "surface", "Creates an explicit substrate or lifts a panel relative to its nearest surface.", "<Surface level={1}>\n  <Surface lift={1}>Elevated content</Surface>\n</Surface>"), component("Container", "container", "Constrains content width and horizontal padding."), component("Stack", "stack", "Arranges children vertically with a consistent gap."), component("Inline", "inline", "Arranges children horizontally with wrapping support."), component("Grid", "grid", "Creates responsive multi-column layouts."), component("Section", "section", "Applies consistent vertical section spacing.")] }
];

export const components = componentGroups.flatMap((group) => group.components.map((item) => ({ ...item, group: group.name, groupSlug: group.slug })));
export const getComponent = (slug: string) => components.find((item) => item.slug === slug);
