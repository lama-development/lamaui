import { cx } from "@/lib/classes";
// Shared Tailwind recipes; keep classes literal for build-time discovery.
// The lui-* markers support composed controls and selector-based interactions.
export const controlStyles = cx("lui-control inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent leading-[1.2] font-semibold no-underline transition-[background-color,border-color,color,box-shadow,transform] duration-(--duration-fast) [corner-shape:squircle] disabled:pointer-events-none disabled:opacity-[.48] aria-disabled:pointer-events-none aria-disabled:opacity-[.48] [&:active:not(:disabled)]:scale-[.97] [&:not(.lui-sm):not(.lui-lg)]:min-h-(--control-md) [&:not(.lui-sm):not(.lui-lg):not(.lui-icon)]:px-4 [&:not(.lui-sm):not(.lui-lg):not(.lui-icon)]:py-2.5");

export const fieldStyles = cx("lui-field min-h-(--control-md) w-full rounded-md border border-outline bg-input px-[.85rem] py-[.65rem] text-label transition-[border-color,box-shadow,background-color] duration-(--duration-fast) outline-none [corner-shape:squircle] placeholder:text-[color-mix(in_srgb,var(--muted-label)_65%,transparent)] focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)] disabled:cursor-not-allowed disabled:opacity-[.52] aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_3px_color-mix(in_srgb,var(--destructive)_22%,transparent)] [&.lui-password-field]:pr-11 [&.lui-search-field]:pl-10");

export const cardStyles = cx("lui-card rounded-lg border border-outline bg-surface shadow-(--shadow-sm) [corner-shape:squircle]");

export const interactiveStyles = cx("lui-interactive transition-[background-color,border-color,box-shadow] duration-(--duration-fast) hover:bg-surface-hover");

export const menuStyles = cx("lui-menu absolute z-60 min-w-52 origin-top -translate-y-1 scale-[.97] rounded-lg border border-outline bg-surface-elevated p-1.5 opacity-0 shadow-(--shadow-md) transition-[transform,opacity] duration-(--duration-normal) ease-(--ease-standard) [corner-shape:squircle] [&.is-closing]:-translate-y-0.5 [&.is-closing]:scale-[.99] [&.is-closing]:opacity-0 [&.is-open]:translate-y-0 [&.is-open]:scale-100 [&.is-open]:opacity-100 [details[open]>&]:translate-y-0 [details[open]>&]:scale-100 [details[open]>&]:opacity-100");

export const menuItemStyles = cx("lui-menu-item flex w-full cursor-pointer items-center gap-2.5 rounded-[.625rem] border-0 bg-transparent px-3 py-2.5 text-left text-label no-underline hover:bg-surface-hover focus-visible:bg-surface-hover");

export const alertCloseStyles = cx("lui-alert-close -mt-1 -mr-1 grid size-8 flex-none place-items-center rounded-lg border-0 bg-transparent p-0 text-current transition-[background-color,color,transform] duration-(--duration-fast) hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]");

export const toastCloseStyles = cx("lui-toast-close -mt-1 -mr-1 grid size-8 flex-none place-items-center rounded-lg border-0 bg-transparent p-0 text-muted-label transition-[background-color,color,transform] duration-(--duration-fast) hover:bg-surface-hover hover:text-label");

export const dialogCloseStyles = cx("lui-dialog-close -mt-1 -mr-1 grid size-8 flex-none place-items-center rounded-lg border-0 bg-transparent p-0 text-current transition-[background-color,color,transform] duration-(--duration-fast) hover:bg-surface-hover hover:text-label");

export const primaryStyles = cx("lui-primary bg-accent text-accent-label shadow-(--shadow-control) hover:bg-accent-hover");

export const secondaryStyles = cx("lui-secondary bg-surface text-label shadow-(--shadow-sm) hover:bg-surface-hover [&.lui-secondary]:border-outline");

export const outlineStyles = cx("lui-outline bg-transparent text-label hover:bg-surface-hover [&.lui-outline]:border-outline");

export const ghostStyles = cx("lui-ghost bg-transparent text-muted-label hover:bg-surface-hover");

export const destructiveStyles = cx("lui-destructive bg-destructive text-destructive-label shadow-(--shadow-control)");

export const smallControlStyles = cx("lui-sm min-h-(--control-sm) text-sm [&:not(.lui-icon)]:px-3 [&:not(.lui-icon)]:py-[.45rem]");

export const largeControlStyles = cx("lui-lg min-h-(--control-lg) [&:not(.lui-icon)]:px-5 [&:not(.lui-icon)]:py-3");

export const iconControlStyles = cx("lui-icon w-(--control-md) p-0");
