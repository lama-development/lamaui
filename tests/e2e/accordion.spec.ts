import { expect, test } from "@playwright/test";

test("single-open groups remain independent and preserve named-slot content", async ({ page }) => {
  await page.goto("/components/accordion");
  const group = page.getByRole("group", { name: "Workspace questions", exact: true });
  const first = group.locator("details").nth(0);
  const second = group.locator("details").nth(1);
  await expect(first).toHaveAttribute("open", "");
  await expect(first.getByRole("link", { name: "Alert", exact: true })).toBeVisible();
  await second.locator("summary").click();
  await expect(second).toHaveAttribute("open", "");
  await expect(first).not.toHaveAttribute("open");
  await expect(group.locator("details[open]")).toHaveCount(1);
  await expect(page.locator("#project-faq-included")).toHaveAttribute("open", "");
  await second.locator("summary").click();
  await expect(group.locator("details[open]")).toHaveCount(0);
});

test("multiple-open mode preserves other expanded sections", async ({ page }) => {
  await page.goto("/components/accordion");
  const group = page.getByRole("group", { name: "Reading preferences", exact: true });
  await expect(group.locator("details[open]")).toHaveCount(2);
  await group.locator("summary").nth(2).click();
  await expect(group.locator("details[open]")).toHaveCount(3);
  await group.locator("summary").nth(0).click();
  await expect(group.locator("details[open]")).toHaveCount(2);
});

test("native keyboard behavior works without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto("/components/accordion");
  const group = page.getByRole("group", { name: "Workspace questions", exact: true });
  const first = group.locator("summary").nth(0);
  const second = group.locator("summary").nth(1);
  await second.focus();
  await page.keyboard.press("Enter");
  await expect(group.locator("details[open]")).toHaveCount(1);
  await expect(group.locator("details").nth(1)).toHaveAttribute("open", "");
  await page.keyboard.press("Space");
  await expect(group.locator("details[open]")).toHaveCount(0);
  await first.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await expect(group.getByRole("link", { name: "Alert", exact: true })).toBeFocused();
  await context.close();
});

test("rapid reversal and reduced motion leave the panel in its requested state", async ({ page }) => {
  await page.goto("/components/accordion");
  const item = page.locator("#workspace-questions-access");
  const summary = item.locator("summary");
  for (let index = 0; index < 3; index++) await summary.click();
  await expect(item).not.toHaveAttribute("open");
  await expect.poll(() => item.evaluate((element) => element.getBoundingClientRect().height - element.querySelector("summary")!.getBoundingClientRect().height)).toBeLessThan(2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await summary.click();
  await expect(item).toHaveAttribute("open", "");
  await expect(item.getByRole("link", { name: "Alert", exact: true })).toBeVisible();
  await expect(item.locator(".lamaui-accordion-chevron")).toHaveCSS("transition-duration", "0s");
});

test("downloaded guidance includes collapsed questions and body-only callouts", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.goto("/getting-started");
  await page.locator('summary[aria-label="Guide actions"]').click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Download Markdown", exact: true }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  let markdown = "";
  for await (const chunk of stream!) markdown += chunk.toString();
  expect(markdown).toContain("### Components look unstyled");
  expect(markdown).toContain("### A dialog or drawer does not open");
  expect(markdown).toContain("Disabled controls and unchecked checkboxes do not submit a value.");
  expect(markdown).toContain("Start with an [Astro project]");
  await expect(page.getByRole("group", { name: "Common setup questions", exact: true }).locator("details[open]")).toHaveCount(0);
});

for (const theme of ["light", "dark"]) {
  test(`troubleshooting and callout typography fit at 320px in ${theme} mode`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.addInitScript((theme) => localStorage.setItem("lamaui-theme", theme), theme);
    await page.goto("/getting-started");
    const accordion = page.getByRole("group", { name: "Common setup questions", exact: true });
    await accordion.locator("summary").nth(0).click();
    await accordion.locator("summary").nth(1).click();
    await expect(accordion.locator("details[open]")).toHaveCount(1);
    await expect(accordion.locator("summary").first()).toHaveCSS("font-size", "16px");
    await expect(page.getByRole("note").first().locator(".guide-note-content")).toHaveCSS("font-size", "16px");
    await expect(page.getByRole("note").locator("h1,h2,h3")).toHaveCount(0);
    for (const note of await page.getByRole("note").all()) {
      const icon = note.locator(".guide-note-icon");
      await expect(icon).toHaveCount(1);
      const [noteBox, iconBox] = await Promise.all([note.boundingBox(), icon.boundingBox()]);
      expect(Math.abs(noteBox!.y + noteBox!.height / 2 - iconBox!.y - iconBox!.height / 2)).toBeLessThan(1);
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.goto("/components/icon");
    const usage = page.locator('section[aria-labelledby="usage"]');
    const notes = usage.locator(".guide-note-content");
    await expect(notes.nth(0)).toHaveCSS("font-size", "16px");
    await expect(notes.nth(1)).toHaveCSS("font-size", "16px");
    await expect(notes.nth(0)).toHaveCSS("line-height", "25.6px");
    await expect(notes.nth(1)).toHaveCSS("line-height", "25.6px");
  });
}
