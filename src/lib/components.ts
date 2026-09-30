import type { IconName } from "@/components/ui/Icon.astro";

export interface ComponentDoc {
  name: string;
  slug: string;
  description: string;
  usage: string;
}

export interface ComponentGroup {
  name: string;
  slug: string;
  icon: IconName;
  components: ComponentDoc[];
}

const component = (name: string, slug: string, description: string, usage = `<${name} />`): ComponentDoc => ({ name, slug, description, usage });

export const componentGroups: ComponentGroup[] = [
  { name: "Actions", slug: "actions", icon: "actions", components: [
    component("Icon", "icon", "A consistent stroke icon set for controls and navigation.", '<Icon name="settings" size={20} />'),
    component("Button", "button", "Triggers an action or links to another view.", '<Button variant="primary" size="md">Save</Button>'),
    component("IconButton", "icon-button", "A compact action with an accessible text label.", '<IconButton label="Copy"><Icon name="copy" /></IconButton>'),
    component("ButtonGroup", "button-group", "Joins related actions into one control group."),
    component("Toggle", "toggle", "A button that represents an on or off state."),
    component("ToggleGroup", "toggle-group", "A coordinated set of mutually exclusive toggles."),
  ]},
  { name: "Forms", slug: "forms", icon: "forms", components: [
    component("Label", "label", "Labels a form control with optional required state."),
    component("FormField", "form-field", "Combines a label, control, help text, and validation message."),
    component("Input", "input", "A single-line text field with consistent focus and error states.", '<Input id="email" type="email" placeholder="name@company.com" />'),
    component("Textarea", "textarea", "A resizable multi-line text field."),
    component("Select", "select", "A styled native select for simple choices."),
    component("CustomSelect", "custom-select", "An animated, keyboard-accessible listbox with option icons."),
    component("Checkbox", "checkbox", "Allows one or more independent choices."),
    component("RadioGroup", "radio-group", "Selects one option from a small set."),
    component("Switch", "switch", "Controls an immediate boolean setting."),
    component("Slider", "slider", "Chooses a numeric value from a range."),
    component("SearchInput", "search-input", "A text field specialized for search."),
    component("PasswordInput", "password-input", "A password field with a visibility control."),
    component("NumberInput", "number-input", "A numeric text field with native step controls."),
  ]},
  { name: "Navigation", slug: "navigation", icon: "navigation", components: [
    component("Navbar", "navbar", "A responsive top navigation with a working mobile panel."),
    component("Sidebar", "sidebar", "An icon-led application navigation panel."),
    component("Breadcrumb", "breadcrumb", "Shows location within a page hierarchy."),
    component("Tabs", "tabs", "Switches between related content panels with arrow-key support."),
    component("TabPanel", "tab-panel", "The accessible content region controlled by a tab."),
    component("Pagination", "pagination", "Moves between pages in a collection."),
    component("Stepper", "stepper", "Communicates progress through a multi-step flow."),
    component("DropdownMenu", "dropdown-menu", "Presents contextual actions from a compact trigger."),
  ]},
  { name: "Data display", slug: "data-display", icon: "data", components: [
    component("Card", "card", "A bordered surface for related information and actions."),
    component("Badge", "badge", "A compact text label for status or classification."),
    component("Avatar", "avatar", "Represents a person with an image or initials."),
    component("AvatarGroup", "avatar-group", "Displays several avatars in a compact stack."),
    component("Table", "table", "Displays structured row and column data."),
    component("DescriptionList", "description-list", "Pairs terms with descriptive values."),
    component("Stat", "stat", "Highlights a key value and its recent direction."),
    component("Progress", "progress", "Shows completion against a known total."),
    component("Skeleton", "skeleton", "Reserves content space while data loads."),
    component("Divider", "divider", "Separates adjacent content or groups."),
    component("Tag", "tag", "Labels an item and can optionally be removed."),
    component("CodeBlock", "code-block", "Displays code with library-consistent styling."),
    component("EmptyState", "empty-state", "Explains an empty collection and offers a next action."),
  ]},
  { name: "Feedback", slug: "feedback", icon: "feedback", components: [
    component("Alert", "alert", "Communicates persistent informational or status messages.", '<Alert variant="warning" icon="warning">Review required</Alert>'),
    component("Toast", "toast", "Shows a temporary result without interrupting work."),
    component("Spinner", "spinner", "Indicates indeterminate background activity."),
  ]},
  { name: "Overlays", slug: "overlays", icon: "overlays", components: [
    component("Dialog", "dialog", "Focuses attention on a decision or short task."),
    component("Drawer", "drawer", "Shows supplementary controls from the edge of the viewport."),
    component("Popover", "popover", "Displays concise contextual content near its trigger."),
    component("Tooltip", "tooltip", "Provides a short label for an icon or unfamiliar control."),
  ]},
  { name: "Layout", slug: "layout", icon: "layout", components: [
    component("Container", "container", "Constrains content width and horizontal padding."),
    component("Stack", "stack", "Arranges children vertically with a consistent gap."),
    component("Inline", "inline", "Arranges children horizontally with wrapping support."),
    component("Grid", "grid", "Creates responsive multi-column layouts."),
    component("Section", "section", "Applies consistent vertical section spacing."),
    component("PageShell", "page-shell", "Composes page navigation, main content, and footer."),
  ]},
  { name: "Marketing", slug: "marketing", icon: "marketing", components: [
    component("Hero", "hero", "Introduces a product or page with focused actions."),
    component("FeatureCard", "feature-card", "Explains one reusable product capability."),
    component("FeatureGrid", "feature-grid", "Arranges feature cards responsively."),
    component("CTA", "cta", "Pairs a concise message with a primary action."),
    component("PricingCard", "pricing-card", "Presents a plan, price, features, and action."),
    component("TestimonialCard", "testimonial-card", "Displays a quotation with attribution."),
    component("SectionHeader", "section-header", "Introduces a content section with clear hierarchy."),
    component("Footer", "footer", "Closes a page with brand and secondary information."),
  ]},
];

export const components = componentGroups.flatMap(group => group.components.map(item => ({ ...item, group: group.name, groupSlug: group.slug })));
export const getComponent = (slug: string) => components.find(item => item.slug === slug);
