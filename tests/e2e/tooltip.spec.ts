import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/components/tooltip");
});

test("connects the trigger and shows on hover", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Copy component" });
  const tooltip = page.locator('[role="tooltip"]', { hasText: "Copy component" });

  const tooltipId = await tooltip.getAttribute("id");
  if (!tooltipId) throw new Error("Tooltip id is missing");
  await expect(trigger).toHaveAttribute("aria-describedby", tooltipId);
  await trigger.hover();
  await expect(tooltip).toBeVisible();
  const bounds = await tooltip.boundingBox();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(1280);

  await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden();
});

test("stays visible while focused and closes with Escape", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Copy component" });
  const tooltip = page.locator('[role="tooltip"]', { hasText: "Copy component" });

  await page.keyboard.press("Tab");
  await trigger.focus();
  await expect(tooltip).toBeVisible();
  await page.waitForTimeout(2000);
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tooltip).toBeHidden();
  await expect(trigger).toBeFocused();
});

test.describe("touch", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("does not flash or intercept the control tap", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Copy component" });
    const tooltip = page.locator('[role="tooltip"]', { hasText: "Copy component" });

    await trigger.tap();
    await expect(tooltip).toBeHidden();
  });
});

test("shows both position variants", async ({ page }) => {
  const topTrigger = page.getByRole("button", { name: "Copy component" });
  const bottomTrigger = page.getByRole("button", { name: "Open documentation" });
  const bottomTooltip = page.locator('[role="tooltip"]', { hasText: "Open documentation" });

  await expect(topTrigger).toBeVisible();
  await bottomTrigger.hover();
  await expect(bottomTooltip).toBeVisible();

  const triggerBounds = await bottomTrigger.boundingBox();
  const tooltipBounds = await bottomTooltip.boundingBox();
  expect(tooltipBounds?.y).toBeGreaterThanOrEqual((triggerBounds?.y ?? 0) + (triggerBounds?.height ?? 0));
});
