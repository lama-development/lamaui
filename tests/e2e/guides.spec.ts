import { expect, test } from "@playwright/test";
import { components } from "@lib/components";
import { readdirSync } from "node:fs";

test("the primitive catalog covers every shipped component and lists only component categories", async ({ page }) => {
  const root = new URL("../../src/components/", import.meta.url);
  const files = readdirSync(root, { recursive: true })
    .map((file) => String(file).replaceAll("\\", "/"))
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
    await page.setViewportSize({ width: 1440, height: 900 });
    const response = await page.goto(`/components/${component.slug}`);
    expect(response?.ok()).toBe(true);
    const article = page.locator("[data-guide-content]");
    await expect(article.getByRole("heading", { level: 1, name: component.name, exact: true })).toBeVisible();
    for (const id of ["usage", "examples", "props", "accessibility"]) {
      const section = article.locator(`section[aria-labelledby="${id}"]`);
      await expect(section.locator(`h2#${id}`)).toHaveCount(1);
      expect((await section.innerText()).trim().length).toBeGreaterThan(40);
    }
    const usage = article.locator('section[aria-labelledby="usage"] pre code');
    const code = await usage.innerText();
    expect(code).toMatch(new RegExp(`import \\{[^}]*\\b${component.name}\\b[^}]*\\} from "lamaui";`));
    expect(code).toContain(`---`);
    await expect(article.locator('section[aria-labelledby="props"] table').first()).toBeAttached();
    await expect(article.locator('section[aria-labelledby="props"] tbody tr').first()).toBeAttached();
    const contents = page.getByRole("navigation", { name: "On this page", exact: true });
    await expect(contents.locator('a[href="#usage"]').first()).toBeAttached();
    await expect(contents.locator('a[href="#setup"]')).toHaveCount(0);
    await expect(article.getByText("LamaUI not configured yet?", { exact: false })).toHaveCount(0);
    const usageSection = article.locator('section[aria-labelledby="usage"]');
    expect(await usageSection.evaluate((section) => getComputedStyle(section).rowGap)).toBe("20px");
    expect(
      await usageSection.evaluate((section) =>
        Array.from(section.children).every((child) => {
          const style = getComputedStyle(child);
          return style.marginTop === "0px" && style.marginBottom === "0px";
        })
      )
    ).toBe(true);
    for (const href of await contents.locator("a").evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute("href")))])) {
      await expect(article.locator(`h2[id="${href!.slice(1)}"]`)).toHaveCount(1);
    }
    await expect(article.locator("[data-example-live]").first()).toBeVisible();
    const exampleTabs = article.locator('[data-example-frame] [role="tablist"][aria-label="Example view"]');
    expect(await exampleTabs.count()).toBeGreaterThan(0);
    for (const appearance of await exampleTabs.evaluateAll((tablists) =>
      tablists.map((tablist) => ({
        height: tablist.getBoundingClientRect().height,
        border: getComputedStyle(tablist).borderTopWidth,
        background: getComputedStyle(tablist).backgroundColor
      }))
    )) {
      expect(appearance.height).toBeLessThanOrEqual(38);
      expect(appearance.border).toBe("1px");
      expect(appearance.background).not.toBe("rgba(0, 0, 0, 0)");
    }
    await expect(article.locator(".component-preview")).toHaveCSS("border-top-style", "dashed");
    const download = page.locator(".guide-rail").getByRole("button", { name: "Download PDF", exact: true });
    await expect(download).toBeVisible();
    await expect(page.locator(".guide-breadcrumb")).toHaveCount(0);
    expect(Math.abs((await article.getByRole("heading", { level: 1 }).boundingBox())!.y - (await download.boundingBox())!.y)).toBeLessThan(1);
    await expect(article.getByRole("button", { name: "View source", exact: true })).toHaveCount(0);
    await expect(article.locator(".docs-page-header code")).toHaveCount(0);
    await expect(article.locator("[data-guide-setup] summary")).toHaveCount(0);
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

test("getting started centralizes one-time project setup", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto("/getting-started");
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("heading", { level: 1, name: "Getting started" })).toBeVisible();
  await expect(page.getByText("Setup", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Documentation" }).getByRole("link", { name: "Getting started" })).toHaveAttribute("aria-current", "page");
  const code = await page.locator("pre code").allInnerTexts();
  expect(code.join("\n")).toContain("npm install lamaui");
  expect(code.join("\n")).toContain('import "lamaui/styles.css";');
  expect(code.join("\n")).toContain('import { Button } from "lamaui";');
  const ready = page.locator("[data-guide-content] > aside").filter({ hasText: "You’re ready" });
  await expect(ready).toHaveClass(/bg-surface/);
  await expect(ready.getByRole("link", { name: "Browse components" })).toHaveClass(/lamaui-primary/);
  const content = page.locator("[data-guide-content]");
  const download = page.locator(".guide-rail").getByRole("button", { name: "Download PDF", exact: true });
  await expect(download).toBeVisible();
  await expect(page.locator(".guide-breadcrumb")).toHaveCount(0);
  expect(Math.abs((await content.getByRole("heading", { level: 1 }).boundingBox())!.y - (await download.boundingBox())!.y)).toBeLessThan(1);
  await expect(page.locator("[data-guide-toc]:visible").getByRole("link", { name: "You’re ready" })).toHaveAttribute("href", "#ready");
  expect(Math.abs((await ready.boundingBox())!.width - (await content.locator(".code-block").last().boundingBox())!.width)).toBeLessThan(1);
});

test("component-owned behavior activates a documented toggle", async ({ page }) => {
  await page.goto("/components/toggle");
  const toggle = page.locator(".component-preview [data-toggle]").first();
  const before = await toggle.getAttribute("aria-pressed");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", String(before !== "true"));
});

test("component-owned behavior changes the selected tab and associated panel", async ({ page }) => {
  await page.goto("/components/tabs");
  const preview = page.locator(".component-preview");
  const tabs = preview.getByRole("tab");
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  const panelId = await tabs.nth(1).getAttribute("aria-controls");
  await expect(page.locator(`[id="${panelId}"]`)).toBeVisible();
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "false");
});

test("component-owned behavior opens and dismisses a toast", async ({ page }) => {
  await page.goto("/components/toast-region");
  await page.getByRole("button", { name: "Show notification", exact: true }).click();
  const toast = page.locator('[data-toast-transient="true"]');
  await expect(toast).toBeVisible();
  await toast.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(toast).toHaveCount(0);
});
