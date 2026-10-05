import { cx } from "@/lib/classes";
// Shared Tailwind recipes; keep classes literal for build-time discovery.
// The lamaui-* markers support composed controls and selector-based interactions.
export const controlStyles = cx("lamaui-control inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent leading-[1.2] font-semibold no-underline [corner-shape:squircle] disabled:pointer-events-none disabled:opacity-[.48] aria-disabled:pointer-events-none aria-disabled:opacity-[.48] [&:active:not(:disabled)]:scale-[.97] [&:not(.lamaui-sm):not(.lamaui-lg)]:min-h-(--control-md) [&:not(.lamaui-sm):not(.lamaui-lg):not(.lamaui-icon)]:px-4 [&:not(.lamaui-sm):not(.lamaui-lg):not(.lamaui-icon)]:py-2.5");

export const fieldStyles = cx("lamaui-field min-h-(--control-md) w-full rounded-md border border-outline bg-input px-[.85rem] py-[.65rem] text-label outline-none [corner-shape:squircle] placeholder:text-[color-mix(in_srgb,var(--muted-label)_65%,transparent)] focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)] disabled:cursor-not-allowed disabled:opacity-[.52] aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_3px_color-mix(in_srgb,var(--destructive)_22%,transparent)] [&.lamaui-password-field]:pr-11 [&.lamaui-search-field]:pl-10");

export const cardStyles = cx("lamaui-card rounded-lg border border-card-outline bg-card-surface shadow-(--shadow-sm) [corner-shape:squircle]");

export const interactiveStyles = cx("lamaui-interactive hover:bg-surface-hover");

export const menuStyles = cx("lamaui-menu absolute z-60 min-w-52 rounded-lg border border-outline bg-surface-elevated p-1.5 shadow-(--shadow-dropdown) [corner-shape:squircle]");

export const menuItemStyles = cx("lamaui-menu-item flex w-full cursor-pointer items-center gap-2.5 rounded-[.625rem] border-0 bg-transparent px-3 py-2.5 text-left text-label no-underline hover:bg-surface-hover focus-visible:bg-surface-hover");

export const alertCloseStyles = cx("lamaui-alert-close -mt-1 -mr-1 grid size-8 flex-none place-items-center rounded-lg border-0 bg-transparent p-0 text-current hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]");

export const toastCloseStyles = cx("lamaui-toast-close -mt-1 -mr-1 grid size-8 flex-none place-items-center rounded-lg border-0 bg-transparent p-0 text-muted-label hover:bg-surface-hover hover:text-label");

export const dialogCloseStyles = cx("lamaui-dialog-close -mt-1 -mr-1 grid size-8 flex-none place-items-center rounded-lg border-0 bg-transparent p-0 text-current hover:bg-surface-hover hover:text-label");

export const primaryStyles = cx("lamaui-primary bg-accent text-accent-label shadow-(--shadow-control) hover:bg-accent-hover");

export const secondaryStyles = cx("lamaui-secondary bg-surface text-label shadow-(--shadow-control) hover:bg-surface-hover [&.lamaui-secondary]:border-outline");

export const outlineStyles = cx("lamaui-outline bg-transparent text-label hover:bg-surface-hover [&.lamaui-outline]:border-outline");

export const ghostStyles = cx("lamaui-ghost bg-transparent text-muted-label hover:bg-surface-hover");

export const destructiveStyles = cx("lamaui-destructive bg-destructive text-destructive-label shadow-(--shadow-control)");

export const smallControlStyles = cx("lamaui-sm min-h-(--control-sm) text-sm [&:not(.lamaui-icon)]:px-3 [&:not(.lamaui-icon)]:py-[.45rem]");

export const largeControlStyles = cx("lamaui-lg min-h-(--control-lg) [&:not(.lamaui-icon)]:px-5 [&:not(.lamaui-icon)]:py-3");

export const iconControlStyles = cx("lamaui-icon w-(--control-md) p-0");
