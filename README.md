# LamaUI

An Astro source library of UI primitives and a documentation site. Combine controls, surfaces, and layout components to build your own UI. The library is private and is not published as an npm package. Every primitive has a guide and live preview.

## Development

Use Node.js compatible with the installed Astro release and npm. Install dependencies and Chromium, then start the site:

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open `http://localhost:4321`. For dependency install-script policy, use npm’s `allowScripts` project field or your user `.npmrc`; approvals are separate from the security audit.

| Script                    | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `npm run dev`             | Start the local Astro server               |
| `npm run check`           | Check Astro and TypeScript diagnostics     |
| `npm run build`           | Generate the static site in `dist/`        |
| `npm run preview`         | Preview the production build               |
| `npm run test:e2e`        | Run Chromium browser tests                 |
| `npm run test:e2e:headed` | Run browser tests with the browser visible |
| `npm run format:check`    | Check formatting                           |
| `npm run format`          | Format the project                         |

## Using components

The `@/` alias resolves to `src/`. Import the global stylesheet in your Astro layout and the shared browser runtime in a bundled script:

```astro
---
import "@/styles/global.css";
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Workspace</title>
  </head>
  <body data-surface-level="1">
    <slot />
    <script>
      import "@/scripts/components";
    </script>
  </body>
</html>
```

`astro.config.mjs` configures Tailwind through `@tailwindcss/vite`. Copy the component’s referenced helpers, scripts, styles, icons, and font assets when using the source in another Astro project. There is no npm installation command for LamaUI itself.

The runtime provides dialogs, tooltips, tabs, toggles, password visibility, sliders, code actions, toast stacking, alert dismissal, surface elevation, and shared effects. Components with their own bundled scripts import those automatically. Browser modules initialize the rendered document once; use ordinary Astro navigation or add an initialization strategy before adopting client-side page replacement.

Props set the initial rendered state. Native fields submit through their `name`; custom controls document their hidden inputs or application events. Astro component props are not reactive client bindings. Application requests, persistence, server validation, and authorization belong to the consuming application.

## Icons

Lama uses [Phosphor](https://phosphoricons.com/). Install `@phosphor-icons/core` in the consuming project and import any SVG with Vite’s `?raw` suffix. `Icon` takes SVG markup through `src`; `Button`, `SplitButton`, `Alert`, and select options take the same markup through `icon`. There is no icon registry to update.

```astro
---
import rocket from "@phosphor-icons/core/duotone/rocket-duotone.svg?raw";
import Icon from "@/components/ui/Icon.astro";
import Button from "@/components/ui/Button.astro";
---

<Icon src={rocket} size={24} />
<Button icon={rocket}>Launch project</Button>
```

Phosphor provides thin, light, regular, bold, fill, and duotone weights. Regular imports use `regular/rocket.svg?raw`; other weights use the suffix shown above. Pass trusted SVG imports to `src`, and name icon-only actions on their enclosing control.

## Component and guide conventions

- Keep the public library focused on reusable controls, surfaces, and layout primitives. Build marketing sections, navigation shells, pricing plans, statistics, and empty states in the consuming app by composing primitives.
- Put reusable `.astro` components in their category folder. Keep props typed, IDs unique, and styles based on theme tokens.
- Use native elements where possible. Preserve visible labels, keyboard access, semantic headings, and explicit error descriptions.
- Use literal Tailwind classes or explicit preset maps. Do not assume a dynamically constructed class will be discovered by Tailwind.
- Register every component in `src/lib/components.ts` and provide its live preview in `src/components/docs/ComponentPreview.astro`.
- Author component-specific quick starts, examples, behavior, accessibility, and responsive guidance in `src/lib/guide-content.ts`, or maintain a dedicated guide for components that need longer explanations.
- `src/lib/component-reference.ts` reads the component’s frontmatter during the docs build to derive prop names, types, defaults, data types, and slots. Add precise property descriptions when introducing a new prop. The build rejects missing descriptions or guide entries.
- Slot descriptions live in `src/components/docs/ComponentSlots.astro`. Document forwarding and wrapper behavior accurately; slot attributes do not automatically become attributes on slotted components.
- Guide code must include realistic imports and required props. Explain any simulated request or example URL. Keep live examples separate from exported documentation where appropriate.

## Validation and contributions

Run diagnostics, a production build, formatting checks, and relevant browser tests before submitting a change. Test new interaction behavior with meaningful browser assertions. The browser suite also checks every guide for quick starts, setup, examples, API reference, accessibility, and slot documentation.

GitHub Actions runs these checks on pushes and pull requests, with a manual run available from the Actions tab. CI uses Node.js 24, installs dependencies from the lockfile, and runs Chromium tests with two workers. Browser reports and failure traces are retained for 14 days under the `browser-test-results` artifact. Download the artifact and open its HTML report with `npx playwright show-report path/to/playwright-report`. New commits cancel superseded runs on the same branch.

Check responsive layouts, 200% zoom, both color schemes, and reduced motion when changing visual behavior. A contribution should describe the user-visible result, validation performed, and any remaining limitation. See `TODO.md` for pending release work.
