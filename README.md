# LamaUI

Accessible, styled Astro UI primitives and their documentation site. Install the package once and import any component; interactive components bring only their own browser behavior.

The package surface is implemented and tested locally. Confirm the final npm name before the first prerelease is published.

## Installation

Install LamaUI in an Astro project that uses Tailwind CSS 4:

```sh
npm install lamaui
```

Import the stylesheet once in the root layout:

```astro
---
import "lamaui/styles.css";
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
  </body>
</html>
```

All components are available immediately after installation:

```astro
---
import { Button, Dialog } from "lamaui";
---

<Button data-dialog-open="publish-dialog">Publish</Button>
<Dialog id="publish-dialog" title="Publish changes?">
  <Button data-dialog-close>Cancel</Button>
</Dialog>
```

Direct component paths are also exported for consumers that want the strictest module boundary, for example `import Button from "lamaui/ui/Button"`. The root import is the convenient default.

Dialogs, tooltips, tabs, toggles, password visibility, sliders, code actions, toast stacking, and alert dismissal are component-owned modules. Importing a static component does not load unrelated interaction code. Optional ripple, fluid-hover, surface, and early-theme effects are available from `lamaui/effects`.

Props set the initial rendered state. Native fields submit through their `name`; custom controls document their hidden inputs or application events. Astro component props are not reactive client bindings. Application requests, persistence, server validation, and authorization belong to the consuming application.

## Icons

Lama uses [Phosphor](https://phosphoricons.com/). Install `@phosphor-icons/core` when your application imports icons directly, then import any SVG with Vite's `?raw` suffix. `Icon` takes SVG markup through `src`; `Button`, `SplitButton`, `Alert`, and select options take the same markup through `icon`.

```astro
---
import rocket from "@phosphor-icons/core/duotone/rocket-duotone.svg?raw";
import { Button, Icon } from "lamaui";
---

<Icon src={rocket} size={24} />
<Button icon={rocket}>Launch project</Button>
```

Phosphor provides thin, light, regular, bold, fill, and duotone weights. Pass trusted SVG imports to `src`, and name icon-only actions on their enclosing control.

## Development

Use Node.js compatible with the installed Astro release and npm. Install dependencies and Chromium, then start the documentation site:

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open `http://localhost:4321`.

| Script                    | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `npm run dev`             | Start the local documentation site         |
| `npm run check`           | Check Astro and TypeScript diagnostics     |
| `npm run check:package`   | Check exports and public import boundaries |
| `npm run build`           | Generate the static documentation site     |
| `npm run preview`         | Preview the production build               |
| `npm run test:consumer`   | Build a clean app through package exports  |
| `npm run test:package`    | Inspect the files included in the package  |
| `npm run test:e2e`        | Run Chromium browser tests                 |
| `npm run test:e2e:headed` | Run browser tests with the browser visible |
| `npm run format:check`    | Check formatting                           |
| `npm run format`          | Format the project                         |

## Component and guide conventions

- Keep the public library focused on reusable controls, surfaces, and layout primitives. Build product sections in the consuming app by composing primitives.
- Put reusable `.astro` components in their category folder. Keep props typed, IDs unique, and styles based on theme tokens.
- Use relative imports inside public package files. The documentation application may use the `@/` alias.
- Use native elements where possible. Preserve visible labels, keyboard access, semantic headings, and explicit error descriptions.
- Use literal Tailwind classes or explicit preset maps. Do not assume a dynamically constructed class will be discovered by Tailwind.
- Register every component in `src/lib/components.ts`, export it from `src/index.ts`, and provide a live example under `src/components/docs/examples`.
- `src/lib/component-reference.ts` reads component frontmatter during the docs build to derive prop names, types, defaults, data types, and slots. Add precise property descriptions when introducing a new prop.
- Guide code must use package imports, include required props, and explain any simulated request or example URL.

## Validation and contributions

Run diagnostics, the package consumer fixture, a production documentation build, formatting checks, and relevant browser tests before submitting a change. Test new interaction behavior with meaningful browser assertions.

GitHub Actions runs checks on pushes and pull requests. Browser reports and failure traces are retained under the `browser-test-results` artifact. Check responsive layouts, 200% zoom, both color schemes, and reduced motion when changing visual behavior. See `TODO.md` for pending release work.
