import { expect, test } from "@playwright/test";
import { components } from "@lib/components";

for (const theme of ["light", "dark"]) {
  for (const width of [320, 1440]) {
    test(`section and subsection headings stay coherent at ${width}px in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((theme) => localStorage.setItem("lamaui-theme", theme), theme);
      await page.goto("/components/button");
      const section = page.locator('section[aria-labelledby="examples"] > h2');
      const subsection = page.locator(".example-heading h3").first();
      await expect(section).toHaveCSS("font-size", "24px");
      await expect(subsection).toHaveCSS("font-size", "18px");
      await expect(section).toHaveCSS("font-weight", "650");
      await expect(subsection).toHaveCSS("font-weight", "600");
      const expectedColor = await page.evaluate(() => {
        const probe = document.createElement("span");
        probe.style.color = "var(--accent-hover)";
        document.body.append(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      });
      for (const heading of [section, subsection]) {
        const link = heading.locator("[data-guide-permalink]");
        await page.mouse.move(0, 0);
        await link.scrollIntoViewIfNeeded();
        await expect(link).toHaveCSS("text-decoration-line", "none");
        await expect(link.locator(".guide-heading-link-icon")).toHaveCSS("opacity", "0");
        await link.hover();
        await expect(link).toHaveCSS("color", expectedColor);
        await expect(link).toHaveCSS("text-decoration-line", "none");
        await expect(link.locator(".guide-heading-link-icon")).toHaveCSS("opacity", "1");
        await page.mouse.move(0, 0);
        await page.keyboard.press("Tab");
        await link.focus();
        await expect(link).toHaveCSS("color", expectedColor);
        await expect(link).toHaveCSS("outline-style", "solid");
        await expect(link.locator(".guide-heading-link-icon")).toHaveCSS("opacity", "1");
        await expect(heading).toHaveAccessibleName((await link.locator(".guide-heading-text").innerText()).trim());
      }
      await expect(page.locator("[data-example-live] [data-guide-permalink]")).toHaveCount(0);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  }
}

test("subsection links copy a stable address and preserve their target on reload", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/button");
  const heading = page.locator(".example-heading h3").first();
  const id = await heading.getAttribute("id");
  const link = heading.locator("[data-guide-permalink]");
  await expect(link).toHaveAttribute("href", `#${id}`);
  await link.click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(`${new URL(page.url()).origin}/components/button#${id}`);
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
  await page.reload();
  await expect(page.locator(`[id="${id}"]`)).toBeInViewport();
});

test("guide links resolve to existing pages and section targets", async ({ page }) => {
  await page.goto("/");
  const broken = await page.evaluate(
    async (slugs) => {
      const paths = ["/", "/getting-started", ...slugs.map((slug) => `/components/${slug}`)];
      const pages = new Map<string, { ids: Set<string>; links: string[] }>();
      for (const path of paths) {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Page returned ${response.status}: ${path}`);
        const document = new DOMParser().parseFromString(await response.text(), "text/html");
        const content = document.querySelector("[data-guide-content]") ?? document.querySelector("main")!;
        const links = Array.from(content.querySelectorAll<HTMLAnchorElement>("a[href]")).filter((link) => !link.closest("[data-example-live], [data-example-code], [data-guide-no-export]"));
        pages.set(path, { ids: new Set(Array.from(document.querySelectorAll("[id]"), (element) => element.id)), links: links.map((link) => link.getAttribute("href")!) });
      }
      const broken: string[] = [];
      for (const [path, { links }] of pages) {
        for (const href of links) {
          const target = new URL(href, location.origin + path);
          if (target.origin !== location.origin) continue;
          const destination = pages.get(target.pathname.replace(/\/$/, "") || "/");
          if (!destination || (target.hash && !destination.ids.has(decodeURIComponent(target.hash.slice(1))))) broken.push(`${path} -> ${href}`);
        }
      }
      return broken;
    },
    components.map((component) => component.slug)
  );
  expect(broken).toEqual([]);
});

test("a reader can find setup, compare components, and follow contextual references", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Install the package and build your first component" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Getting started" })).toBeVisible();
  await page.getByRole("link", { name: "Dialog usage example", exact: true }).click();
  await expect(page).toHaveURL(/\/components\/dialog#usage$/);
  await expect(page.getByRole("note").filter({ hasText: "data-dialog-open" })).toContainText("data-dialog-open");
  const related = page.getByRole("region", { name: "Related components", exact: true });
  await expect(related.getByRole("heading", { level: 2 })).toHaveAccessibleName("Related components");
  await related.getByRole("link", { name: "Drawer", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Drawer" })).toBeVisible();
  await expect(page.getByRole("note").filter({ hasText: "data-dialog-open" })).toContainText("data-dialog-open");
  await page.goto("/components/icon-button");
  const caution = page.getByRole("note").filter({ hasText: "Provide a descriptive" });
  await caution.getByRole("link", { name: "Tooltip", exact: true }).click();
  await expect(page).toHaveURL(/\/components\/tooltip\/?$/);
});

test("troubleshooting disclosures work with the keyboard and appear in search", async ({ page }) => {
  await page.goto("/getting-started#troubleshooting");
  const summary = page.locator("summary").filter({ hasText: "Components look unstyled" });
  await summary.focus();
  await page.keyboard.press("Enter");
  const disclosure = summary.locator("..");
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(disclosure.getByRole("link", { name: "Add the styles" })).toBeVisible();
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "Search components and guides" }).fill("troubleshooting");
  await expect(page.locator('#docs-search-results a[href="/getting-started#troubleshooting"]')).toBeVisible();
});

for (const theme of ["light", "dark"]) {
  test(`guidance and related links fit a narrow viewport in ${theme} mode`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.addInitScript((theme) => localStorage.setItem("lamaui-theme", theme), theme);
    for (const path of ["/getting-started", "/components/tooltip", "/components/form-field"]) {
      await page.goto(path);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      const callout = page.getByRole("note").first();
      await expect(callout).toBeVisible();
      const geometry = await callout.boundingBox();
      expect(geometry!.x).toBeGreaterThanOrEqual(0);
      expect(geometry!.x + geometry!.width).toBeLessThanOrEqual(321);
      const icon = await callout.locator(".guide-note-icon").boundingBox();
      expect(Math.abs(geometry!.y + geometry!.height / 2 - icon!.y - icon!.height / 2)).toBeLessThan(1);
      const contrast = await callout.evaluate((note) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d")!;
        const luminance = (color: string) => {
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          const channels = Array.from(context.getImageData(0, 0, 1, 1).data)
            .slice(0, 3)
            .map((channel) => {
              const value = channel / 255;
              return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            });
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        };
        const foreground = luminance(getComputedStyle(note.querySelector(".guide-note-content")!).color);
        const background = luminance(getComputedStyle(note).backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      if (path.includes("/components/")) {
        const related = page.getByRole("region", { name: "Related components", exact: true });
        await expect(related.getByRole("link").first()).toBeVisible();
      }
    }
  });
}

test("guidance reflows with enlarged text", async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 900 });
  for (const path of ["/getting-started", "/components/tooltip"]) {
    await page.goto(path);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.getByRole("note").first()).toBeVisible();
  }
});

for (const theme of ["light", "dark"]) {
  for (const accent of ["lime", "blue"]) {
    test(`prose links share accent hover and keyboard focus in ${theme} mode with ${accent}`, async ({ page }) => {
      await page.addInitScript(
        ({ theme, accent }) => {
          localStorage.setItem("lamaui-theme", theme);
          localStorage.setItem("lamaui-accent", accent);
        },
        { theme, accent }
      );
      await page.goto("/components/icon");
      const expectedColor = await page.evaluate(() => {
        const probe = document.createElement("span");
        probe.style.color = "var(--accent-hover)";
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      });
      const inlineLink = page
        .locator("a.docs-link")
        .filter({ has: page.locator("code") })
        .first();
      await inlineLink.hover();
      await expect(inlineLink).toHaveCSS("color", expectedColor);
      await expect(inlineLink.locator("code")).toHaveCSS("color", expectedColor);
      const relatedLink = page.locator('section[aria-labelledby="related-components"] a.related-card').first();
      await relatedLink.hover();
      await expect(relatedLink.locator(".related-card-title")).toHaveCSS("color", expectedColor);
      await page.mouse.move(0, 0);
      await page.keyboard.press("Tab");
      await relatedLink.focus();
      await expect(relatedLink.locator(".related-card-title")).toHaveCSS("color", expectedColor);
      await expect(relatedLink).toHaveCSS("outline-style", "solid");
      await page.goto("/getting-started");
      const calloutLink = page.getByRole("note").first().getByRole("link").first();
      await calloutLink.hover();
      await expect(calloutLink).toHaveCSS("color", expectedColor);
      await page.emulateMedia({ reducedMotion: "reduce" });
      // The shared reduced-motion reset uses a near-zero duration so native
      // transition completion events can still fire.
      await expect.poll(() => calloutLink.evaluate((link) => Math.max(...getComputedStyle(link).transitionDuration.split(",").map(parseFloat)))).toBeLessThanOrEqual(0.001);
    });
  }
}
