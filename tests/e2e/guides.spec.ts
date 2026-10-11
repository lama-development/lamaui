import { expect, test } from "@playwright/test";
import { components } from "../../src/lib/components";
import { readdirSync } from "node:fs";

test("the primitive catalog covers every shipped component and lists only component categories", async ({ page }) => {
  const root = new URL("../../src/components/", import.meta.url);
  const files = readdirSync(root, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".astro") && !file.startsWith("docs/"));
  expect(files.map((file) => file.split("/").pop()!.replace(".astro", "")).sort()).toEqual(components.map((component) => component.name).sort());
  const removed = ["hero", "feature-card", "feature-grid", "cta", "pricing-card", "testimonial-card", "section-header", "footer", "navbar", "sidebar", "page-shell", "empty-state", "stat"];
  expect(components.filter((component) => removed.includes(component.slug))).toEqual([]);
  await page.goto("/");
  await expect(page.locator("#composition")).toHaveCount(0);
  await expect(page.locator(".docs-component-card")).toHaveCount(components.length);
  await expect(page.locator('a[href="/#marketing"]')).toHaveCount(0);
});

for (const component of components) {
  test(`${component.name} has a complete, navigable guide`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`/components/${component.slug}`);
    expect(response?.ok()).toBe(true);
    const article = page.locator("[data-guide-content]");
    await expect(article.getByRole("heading", { level: 1, name: component.name, exact: true })).toBeVisible();
    for (const id of ["quick-start", "setup", "examples", "props", "accessibility"]) {
      const section = article.locator(`section[aria-labelledby="${id}"]`);
      await expect(section.locator(`h2#${id}`)).toHaveCount(1);
      expect((await section.innerText()).trim().length).toBeGreaterThan(40);
    }
    const quickStart = article.locator('section[aria-labelledby="quick-start"] pre code');
    const code = await quickStart.innerText();
    expect(code).toContain(`import ${component.name} from "@/components/`);
    expect(code).toContain(`.astro"`);
    expect(code).toContain(`---`);
    await expect(article.locator('section[aria-labelledby="props"] table').first()).toBeAttached();
    await expect(article.locator('section[aria-labelledby="props"] tbody tr').first()).toBeAttached();
    const contents = page.getByRole("navigation", { name: "On this page", exact: true });
    await expect(contents.locator('a[href="#setup"]').first()).toBeAttached();
    for (const href of await contents.locator("a").evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute("href")))])) {
      await expect(article.locator(`h2[id="${href!.slice(1)}"]`)).toHaveCount(1);
    }
    await expect(article.locator("[data-example-live]").first()).toBeVisible();
    await expect(article.locator("[data-guide-source]")).toHaveAttribute("aria-labelledby", "component-source-title");
    await expect(article.locator("[data-guide-source] code")).toContainText("Astro.props");
    await expect(article.locator(".docs-page-header code")).toHaveCount(0);
    await expect(article.locator("[data-guide-setup] summary, [data-guide-source] summary")).toHaveCount(0);
    const duplicateIds = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll("[id]"), (element) => element.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    });
    expect(duplicateIds).toEqual([]);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test("the shared runtime activates a documented toggle", async ({ page }) => {
  await page.goto("/components/toggle");
  const toggle = page.locator(".component-preview [data-toggle]").first();
  const before = await toggle.getAttribute("aria-pressed");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", String(before !== "true"));
});

test("the shared runtime changes the selected tab and associated panel", async ({ page }) => {
  await page.goto("/components/tabs");
  const preview = page.locator(".component-preview");
  const tabs = preview.getByRole("tab");
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  const panelId = await tabs.nth(1).getAttribute("aria-controls");
  await expect(page.locator(`[id="${panelId}"]`)).toBeVisible();
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "false");
});

test("the shared runtime opens and dismisses a toast", async ({ page }) => {
  await page.goto("/components/toast-region");
  await page.getByRole("button", { name: "Show notification", exact: true }).click();
  const toast = page.locator('[data-toast-transient="true"]');
  await expect(toast).toBeVisible();
  await toast.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(toast).toHaveCount(0);
});
