import { expect, test } from "@playwright/test";

const palette = (page: import("@playwright/test").Page) => page.getByRole("dialog", { name: "Search documentation" });

test("Cmd+K and Ctrl+K open and toggle search, with focus restored", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Search documentation" }).last();
  await trigger.focus();
  await page.keyboard.press("Meta+k");
  await expect(palette(page)).toBeVisible();
  await expect(palette(page).getByRole("combobox")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(palette(page)).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(palette(page)).not.toBeVisible();
});

for (const [query, expected] of [
  ["buton", "Button"],
  ["modal", "Dialog"],
  ["cs", "CustomSelect"],
  ["forms password", "PasswordInput"],
  ["button props", "Button · Props"],
  ["dialog keyboard", "Dialog · Accessibility"]
]) {
  test(`smart search ranks ${query} correctly`, async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    await palette(page).getByRole("combobox").fill(query);
    await expect(palette(page).getByRole("option").first()).toContainText(expected);
  });
}

test("keyboard selection navigates to guide sections and remembers recent results", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const input = palette(page).getByRole("combobox");
  await input.fill("button props");
  const options = palette(page).getByRole("option");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
  await input.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  await input.press("ArrowUp");
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("aria-activedescendant", (await options.first().getAttribute("id")) ?? "");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/components\/button#props$/);
  await page.waitForLoadState("load");
  await page.keyboard.press("Control+k");
  await expect(palette(page).getByRole("option").first()).toContainText("Button · Props");
});

test("empty results are accessible and input is treated as text", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const input = palette(page).getByRole("combobox");
  await input.fill('<img src=x onerror="window.searchInjected=true">xyzzy');
  await expect(palette(page).getByRole("option")).toHaveCount(0);
  await expect(palette(page).getByText(/No matches/)).toBeVisible();
  await expect(input).not.toHaveAttribute("aria-activedescendant");
  await input.press("Enter");
  await expect(palette(page)).toBeVisible();
  expect(await page.evaluate(() => "searchInjected" in window)).toBe(false);
});

test("broad searches show distinct components instead of repeated guide sections", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  await palette(page).getByRole("combobox").fill("forms");
  const options = palette(page).getByRole("option");
  await expect(options).toHaveCount(10);
  const names = await options.allTextContents();
  expect(names.every((name) => !name.includes("· Props") && !name.includes("· Setup"))).toBe(true);
});

test("mobile trigger, focus containment, outside dismissal, and narrow layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const trigger = page.locator(".docs-sidebar [data-search-open]");
  await trigger.click();
  await expect(palette(page)).toBeVisible();
  const input = palette(page).getByRole("combobox");
  await expect(input).toHaveAttribute("placeholder", "Search docs…");
  await expect(palette(page)).toHaveAttribute("data-surface-level", "3");
  await expect(palette(page).locator(".search-key")).toHaveCount(4);
  await expect(palette(page).locator(".search-key-enter")).toHaveText("Enter");
  await expect(palette(page).locator(".search-result-key")).toHaveCount(0);
  await expect(palette(page).getByRole("option").first()).toHaveClass(/aria-selected:bg-\[var\(--search-result-hover\)\]/);
  await expect(palette(page).getByRole("option").first()).not.toHaveClass(/aria-selected:bg-accent-subtle/);
  await expect(palette(page).locator(".search-shortcut-label").first()).toBeHidden();
  await expect(palette(page).locator(".search-result-description").first()).toBeHidden();
  await input.press("Shift+Tab");
  await expect(palette(page).getByRole("button", { name: "Close search" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  const box = await palette(page).boundingBox();
  expect((await palette(page).locator(".search-input-row").boundingBox())!.height).toBeLessThanOrEqual(58);
  expect((await palette(page).getByRole("option").first().boundingBox())!.height).toBeGreaterThanOrEqual(56);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(await palette(page).evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.mouse.click(2, 2);
  await expect(palette(page)).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("light-mode results use a visible neutral fluid hover", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const dialog = palette(page);
  const results = dialog.getByRole("listbox");
  const option = dialog.getByRole("option").nth(1);
  await expect(results).toHaveAttribute("data-fluid-hover", "");
  await option.hover();
  const dialogBackground = await dialog.evaluate((element) => getComputedStyle(element).backgroundColor);
  const optionBackground = await option.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(optionBackground).not.toBe(dialogBackground);
  expect(optionBackground).not.toBe("rgba(0, 0, 0, 0)");
  await expect(dialog.locator('.lamaui-fluid-hover[data-visible="true"]')).toHaveCount(1);
});

test("search leaves another open modal in control", async ({ page }) => {
  await page.goto("/components/dialog");
  await page.locator(".component-preview [data-dialog-open]").first().click();
  await page.keyboard.press("Control+k");
  await expect(palette(page)).not.toBeVisible();
  await expect(page.locator("dialog[open]")).toHaveCount(1);
});

for (const width of [320, 390, 860]) {
  test(`mobile header keeps search and navigation reachable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const header = page.locator(".docs-mobile-header");
    await expect(header).toBeVisible();
    await expect(header.getByRole("button", { name: "Search documentation" })).toBeVisible();
    const trigger = header.getByRole("button", { name: "Open navigation" });
    const menu = await trigger.boundingBox();
    expect(menu!.x + menu!.width).toBeLessThanOrEqual(width);
    expect(menu!.y).toBeGreaterThanOrEqual(0);
    expect(menu!.width).toBeGreaterThanOrEqual(44);
    expect(menu!.height).toBeGreaterThanOrEqual(44);
    await trigger.click();
    await expect(page.locator("#docs-navigation")).toHaveAttribute("data-open", "true");
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });
}
