import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/components/dropdown-menu");
});

for (const key of ["Enter", "Space", "ArrowDown", "ArrowUp"]) {
  test(`opens with ${key} and focuses an enabled action`, async ({ page }) => {
    const trigger = page.locator(".component-preview summary", { hasText: "Actions" });
    await trigger.focus();
    await trigger.press(key);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const menu = page.getByRole("menu", { name: "Actions", exact: true });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: key === "ArrowUp" ? "Delete" : "Duplicate", exact: true })).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-controls", (await menu.getAttribute("id")) as string);
  });
}

test("arrow keys wrap, skip disabled items, and support Home and End", async ({ page }) => {
  await page.locator(".component-preview summary", { hasText: "Actions" }).click();
  const item = (name: string) => page.getByRole("menuitem", { name, exact: true });
  await page.keyboard.press("ArrowDown");
  await expect(item("Settings")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(item("Duplicate")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(item("Delete")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(item("Duplicate")).toBeFocused();
  await page.keyboard.press("End");
  await expect(item("Delete")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(item("Duplicate")).toBeFocused();
});

test("Escape closes and restores focus, and the menu can reopen", async ({ page }) => {
  const trigger = page.locator(".component-preview summary", { hasText: "Actions" });
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("menu", { name: "Actions", exact: true })).toBeHidden();
  await trigger.press("ArrowUp");
  await expect(page.getByRole("menuitem", { name: "Delete", exact: true })).toBeFocused();
});

for (const key of ["Enter", "Space"]) {
  test(`selecting with ${key} dismisses and restores focus`, async ({ page }) => {
    const trigger = page.locator(".component-preview summary", { hasText: "Actions" });
    await trigger.click();
    await page.keyboard.press(key);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });
}

test("outside click preserves the new focus target", async ({ page }) => {
  const trigger = page.locator(".component-preview summary", { hasText: "Actions" });
  await trigger.click();
  const other = page.locator(".component-preview summary", { hasText: "More options" });
  await other.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("menuitem", { name: "View usage" })).toBeFocused();
});

test("Tab leaves the menu and reopening restores keyboard navigation", async ({ page }) => {
  const trigger = page.locator(".component-preview summary", { hasText: "Actions" });
  const other = page.locator(".component-preview summary", { hasText: "More options" });
  await trigger.click();
  await page.keyboard.press("Tab");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(other).toBeFocused();
  await trigger.focus();
  await trigger.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Duplicate", exact: true })).toBeFocused();
});

test("Shift+Tab closes and moves to the preceding control", async ({ page }) => {
  const trigger = page.locator(".component-preview summary", { hasText: "More options" });
  const previous = page.locator(".component-preview summary", { hasText: "Actions" });
  await trigger.click();
  await page.keyboard.press("Shift+Tab");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(previous).toBeFocused();
});

test("moving focus outside dismisses the menu", async ({ page }) => {
  const trigger = page.locator(".component-preview summary", { hasText: "Actions" });
  await trigger.click();
  const other = page.locator(".component-preview summary", { hasText: "More options" });
  await other.focus();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(other).toBeFocused();
});

test("links keep their navigation behavior", async ({ page }) => {
  const trigger = page.locator(".component-preview summary", { hasText: "More options" });
  await trigger.click();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/#usage$/);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test.describe("touch", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("tap selects an action and outside tap dismisses", async ({ page }) => {
    const trigger = page.locator(".component-preview summary", { hasText: "Actions" });
    await trigger.tap();
    await page.getByRole("menuitem", { name: "Settings", exact: true }).tap();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("menu", { name: "Actions", exact: true })).toBeHidden();
    await trigger.tap();
    await page.getByRole("heading", { name: "DropdownMenu", exact: true }).tap();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
