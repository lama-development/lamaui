import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const normalizeLineEndings = (value: string) => value.replaceAll("\r\n", "\n");

test("narrow reference tables preserve code values and support keyboard scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components/custom-select");
  const reference = page.getByRole("region", { name: "CustomSelect props", exact: true });
  await expect(reference).toHaveAttribute("tabindex", "0");
  expect(await reference.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await reference.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => reference.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await reference.evaluate((element) => (element.scrollLeft = element.scrollWidth));
  await expect(reference.getByRole("columnheader", { name: "Description" })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("component cards keep their neutral border on hover", async ({ page }) => {
  await page.goto("/");
  const card = page.locator(".docs-component-card").first();
  const border = await card.evaluate((element) => getComputedStyle(element).borderColor);
  await card.hover();
  await card.evaluate((element) => element.getAnimations().forEach((animation) => animation.finish()));
  await expect.poll(() => card.evaluate((element) => getComputedStyle(element).borderColor)).toBe(border);
});

test("single examples and data types avoid redundant subsection headings", async ({ page }) => {
  await page.goto("/components/breadcrumb");
  const example = page.locator('section[aria-labelledby="examples"]');
  await expect(example.getByRole("heading", { level: 2, name: "A longer hierarchy" })).toBeVisible();
  await expect(example.getByRole("heading", { level: 3 })).toHaveCount(0);

  const dataTypes = page.locator('section[aria-labelledby="data-types"]');
  await expect(dataTypes.getByRole("heading", { level: 2, name: "Data types" })).toBeVisible();
  await expect(dataTypes).toContainText("The Item object uses the following properties.");
  await expect(dataTypes.getByRole("heading", { level: 3 })).toHaveCount(0);
});

test("guide body descriptions fill their available width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/icon");
  for (const selector of [".docs-page-header p", ".example-heading p", ".guide-note"]) {
    const description = page.locator(selector).last();
    await expect(description).toBeVisible();
    expect(await description.evaluate((element) => getComputedStyle(element).maxWidth)).toBe("none");
    expect(Math.abs((await description.boundingBox())!.width - (await description.locator("..").boundingBox())!.width)).toBeLessThan(1);
  }
});

test("live form examples validate, expose submitted values, and reset", async ({ page }) => {
  await page.goto("/components/input");
  const form = page.locator('[data-native-example="input"]');
  await form.getByRole("button", { name: "Read form value" }).click();
  await expect(form.locator(":scope > output")).toContainText("Submit to inspect");
  await form.getByLabel("Work email").fill("ari@example.com");
  await form.getByRole("button", { name: "Read form value" }).click();
  await expect(form.locator(":scope > output")).toHaveText('{"email":"ari@example.com"}');
  await form.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(form.getByLabel("Work email")).toHaveValue("not-an-email");
});

test("a slider reset restores its displayed value and track", async ({ page }) => {
  await page.goto("/components/slider");
  const form = page.locator('[data-native-example="slider"]');
  const slider = form.getByRole("slider");
  await slider.fill("12");
  await expect(form.locator("[data-slider-output]")).toHaveText("12");
  await form.getByRole("button", { name: "Read form value" }).click();
  await expect(form.locator(":scope > output")).toHaveText('{"seats":"12"}');
  await form.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(slider).toHaveValue("5");
  await expect(form.locator("[data-slider-output]")).toHaveText("5");
});

test("nested tabs retain independent selection and skip unavailable choices", async ({ page }) => {
  await page.goto("/components/tabs");
  const example = page.locator("[data-example-live]");
  const outer = example.getByRole("tablist", { name: "Settings sections" });
  const inner = example.getByRole("tablist", { name: "General settings", exact: true });
  await inner.getByRole("tab", { name: "Notifications" }).click();
  await expect(outer.getByRole("tab", { name: "General", exact: true })).toHaveAttribute("aria-selected", "true");
  await outer.getByRole("tab", { name: "Security" }).click();
  await page.keyboard.press("ArrowRight");
  await expect(outer.getByRole("tab", { name: "General", exact: true })).toBeFocused();
  await expect(inner.getByRole("tab", { name: "Notifications" })).toHaveAttribute("aria-selected", "true");
});

test("pagination condenses large totals and disables boundary destinations", async ({ page }) => {
  await page.goto("/components/pagination");
  const first = page.getByRole("navigation", { name: "First page example" });
  const last = page.getByRole("navigation", { name: "Last page example" });
  for (const link of [first.getByRole("link", { name: "Previous page" }), last.getByRole("link", { name: "Next page" })]) {
    await expect(link).toHaveAttribute("aria-disabled", "true");
    await expect(link).not.toHaveAttribute("href");
    await expect(link).toHaveAttribute("tabindex", "-1");
  }
  const middle = page.getByRole("navigation", { name: "Middle page example" });
  expect(await middle.getByRole("link").count()).toBeLessThan(10);
  await expect(middle.getByRole("link", { name: "Page 50", exact: true })).toHaveAttribute("aria-current", "page");
});

test("Phosphor SVG imports render without an icon registry and copy with their imports", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/icon");
  const weights = page.locator(".component-preview [data-phosphor-preview] svg");
  await expect(weights).toHaveCount(6);
  expect(new Set(await weights.evaluateAll((icons) => icons.map((icon) => icon.innerHTML))).size).toBe(6);
  const frame = page.locator("[data-example-frame]").first();
  const rocket = frame.getByRole("button", { name: "Launch project" }).locator("svg");
  const original = readFileSync("node_modules/@phosphor-icons/core/assets/duotone/rocket-duotone.svg", "utf8");
  expect(await rocket.locator("path").last().getAttribute("d")).toBe(Array.from(original.matchAll(/<path[^>]*d="([^"]+)"/g)).at(-1)?.[1]);
  await expect(rocket).toHaveAttribute("aria-hidden", "true");
  await expect(rocket).toHaveAttribute("width", "18");
  await frame.getByRole("tab", { name: "Code", exact: true }).click();
  await frame.getByRole("button", { name: "Copy code" }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("@phosphor-icons/core/duotone/rocket-duotone.svg?raw");
  expect(copied).toContain("<Button icon={rocket}>");
  expect(copied).toContain("<Icon src={bell}");
});

test("Preview and Code tabs preserve the example state and copy its source", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/checkbox");
  const frame = page.locator("[data-example-frame]");
  const tablist = frame.getByRole("tablist", { name: "Example view" });
  const previewTab = frame.getByRole("tab", { name: "Preview", exact: true });
  const codeTab = frame.getByRole("tab", { name: "Code", exact: true });
  const source = frame.locator("[data-example-code]");
  const checkbox = frame.getByRole("checkbox");
  await checkbox.check();
  await expect(previewTab).toHaveAttribute("aria-selected", "true");
  expect(await tablist.evaluate((element) => getComputedStyle(element).borderTopWidth)).toBe("1px");
  expect(await tablist.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  expect((await tablist.boundingBox())!.height).toBeLessThanOrEqual(38);
  await expect(source).toBeHidden();
  await codeTab.click();
  await expect(codeTab).toHaveAttribute("aria-selected", "true");
  await expect(source).toBeVisible();
  await expect(frame.locator("[data-example-live]")).toBeHidden();
  const code = await source.locator("code").textContent();
  expect(code).toContain("Checkbox");
  expect(code).toContain('from "lamaui"');
  expect(code).toContain("new FormData(form)");
  await source.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect.poll(async () => normalizeLineEndings(await page.evaluate(() => navigator.clipboard.readText()))).toBe(normalizeLineEndings(code ?? ""));
  await codeTab.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(previewTab).toBeFocused();
  await expect(checkbox).toBeChecked();
  await expect(checkbox).toBeVisible();
  await page.keyboard.press("End");
  await expect(codeTab).toBeFocused();
  await expect(source).toBeVisible();
});

test("a dismissed example can be restored and dismissed again", async ({ page }) => {
  await page.goto("/components/alert");
  const frame = page.locator("[data-example-frame]").first();
  await frame.getByRole("button", { name: "Dismiss alert" }).click();
  await expect(frame.getByRole("status")).toHaveCount(0);
  await frame.getByRole("button", { name: "Reset example" }).click();
  await expect(frame.getByRole("status")).toBeVisible();
  await frame.getByRole("button", { name: "Dismiss alert" }).click();
  await expect(frame.getByRole("status")).toHaveCount(0);
});

test("disabled password fields keep the visibility control disabled", async ({ page }) => {
  await page.goto("/components/password-input");
  const field = page.locator("[data-password]").filter({ has: page.locator("#preview-password-disabled") });
  await expect(field.getByRole("button", { name: "Show password" })).toBeDisabled();
});

test("the mobile contents card contains only links and navigates directly", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components/input");
  const card = page.locator("[data-guide-toc]:visible");
  await expect(card.getByRole("navigation", { name: "On this page", exact: true })).toBeVisible();
  await expect(card.locator("button,svg,hr")).toHaveCount(0);
  await expect(card).not.toContainText("On this page");
  await card.getByRole("link", { name: "Examples", exact: true }).click();
  await expect(page).toHaveURL(/#examples$/);
  await expect(card.getByRole("link", { name: "Examples", exact: true })).toHaveAttribute("aria-current", "location");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("the PDF action stays pinned and exports example source with Preview selected", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/components/checkbox");
    const action = width === 1440 ? page.getByRole("button", { name: "Download PDF", exact: true }) : page.locator('summary[aria-label="Guide actions"]');
    await expect(action).toBeVisible();
    if (width === 390) {
      expect((await action.boundingBox())!.width).toBeLessThanOrEqual(48);
      await action.click();
      const menu = page.getByRole("menu", { name: "Guide actions" });
      await expect(menu.getByRole("menuitem")).toHaveCount(5);
      await page.keyboard.press("Escape");
      await expect(action).toBeFocused();
    }
    expect((await action.boundingBox())!.y).toBeLessThanOrEqual((await page.getByRole("heading", { level: 1 }).boundingBox())!.y);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "instant" }));
    await expect.poll(async () => (await action.boundingBox())!.y).toBeGreaterThanOrEqual(0);
    await expect.poll(async () => (await action.boundingBox())!.y).toBeLessThan(100);
    if (width === 1440) {
      const contents = page.locator("[data-guide-toc]:visible");
      await expect(contents).not.toContainText("On this page");
      await expect(contents.locator("svg,hr")).toHaveCount(0);
      const actionBounds = (await action.boundingBox())!;
      const contentsBounds = (await contents.boundingBox())!;
      expect(contentsBounds.y).toBeGreaterThan(actionBounds.y + actionBounds.height);
      expect(contentsBounds.y).toBeLessThan(actionBounds.y + actionBounds.height + 24);
    }
  }
  await page.locator('summary[aria-label="Guide actions"]').click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: "Download PDF", exact: true }).click()]);
  expect(download.suggestedFilename()).toBe("checkbox.pdf");
  const pdf = readFileSync((await download.path())!).toString("latin1");
  expect(pdf).toMatch(/^%PDF-/);
  expect(pdf).toContain("data-native-example");
});

test("a dropdown action opens an operable confirmation dialog", async ({ page }) => {
  await page.goto("/components/dropdown-menu");
  const example = page.locator("[data-example-live]");
  await example.getByText("Example actions", { exact: true }).click();
  await example.getByRole("menuitem", { name: "Review deletion" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this item?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});
