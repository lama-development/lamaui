import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/components/popover");
});

test("toggles from the trigger", async ({ page }) => {
  const trigger = page.locator(".component-preview summary", { hasText: "Left aligned" });
  const panel = trigger.locator("xpath=..").getByText("The panel starts at the trigger’s left edge.", { exact: true });

  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toBeVisible();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();
});

test("Escape closes and restores focus", async ({ page }) => {
  const trigger = page.locator(".component-preview summary", { hasText: "Left aligned" });
  await trigger.click();

  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("an outside click dismisses it", async ({ page }) => {
  const trigger = page.locator(".component-preview summary", { hasText: "Left aligned" });
  await trigger.click();

  await page.getByRole("heading", { name: "Popover" }).click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test.describe("touch", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("opens on tap and dismisses on an outside tap", async ({ page }) => {
    const trigger = page.locator(".component-preview summary", { hasText: "Left aligned" });
    await trigger.tap();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await page.getByRole("heading", { name: "Popover" }).tap();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

test("shows both alignment variants", async ({ page }) => {
  const triggers = page.locator(".component-preview summary");
  await expect(triggers).toHaveCount(2);
  await expect(triggers.nth(0)).toHaveText("Left aligned");
  await expect(triggers.nth(1)).toHaveText("Right aligned");
});
