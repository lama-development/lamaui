# LamaUI agent contract

LamaUI is an Astro component package and documentation site. The package is the primary distribution model; do not tell users to copy internal dependency trees.

## Consumer usage

- Install `lamaui`, then import `lamaui/styles.css` once in the root layout.
- Prefer named component imports from `lamaui` for normal usage.
- Use direct paths such as `lamaui/overlays/Dialog` only when a strict per-component module boundary is required.
- Interactive components import their own behavior. Do not add `lamaui/effects` to make Dialog, Drawer, Tooltip, Tabs, Toggle, form controls, Toast, or Alert work.
- `lamaui/effects` is optional visual enhancement for theme initialization, ripple, fluid hover, and surface elevation.

## Repository rules

- Public package files are `src/index.ts`, non-doc components, their scripts, shared library helpers, styles, types, icons, and the packaged font.
- Use relative imports inside public package files. `@/` is reserved for the documentation application.
- Export every new public component from `src/index.ts` and register its documentation metadata in `src/lib/components.ts`.
- Put executable documentation examples in `src/components/docs/examples`. Displayed examples are converted to package imports.
- Preserve semantic HTML, keyboard behavior, focus restoration, IDs, `data-*` contracts, and reduced-motion behavior.
- Keep component behavior modular. A component must not require the documentation layout's global script.

## Validation

Run these checks after package or component changes:

```sh
npm run check
npm run check:package
npm run test:consumer
npm run test:package
npm run build
npm run test:e2e
npm run format:check
```

Report source/build validation separately from browser validation.
