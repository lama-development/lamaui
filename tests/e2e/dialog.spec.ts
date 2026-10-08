import { expect, test, type Page } from "@playwright/test";

const openDialog = async (page: Page) => {
  const opener = page.locator('[data-dialog-open="preview-dialog"]');
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Publish changes?" });
  await expect(dialog).toBeVisible();
  return { dialog, opener };
};

test.beforeEach(async ({ page }) => {
  await page.goto("/components/dialog");
});

test("opens with an accessible name, description, and initial focus", async ({ page }) => {
  const { dialog } = await openDialog(page);

  await expect(dialog).toHaveAttribute("aria-labelledby", "preview-dialog-title");
  await expect(dialog).toHaveAttribute("aria-describedby", "preview-dialog-description");
  await expect(dialog.getByText("This creates a new component version.")).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Publish changes?" }).locator("a")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Close dialog" })).toBeFocused();
});

test("contains sequential keyboard focus", async ({ page }) => {
  const { dialog, opener } = await openDialog(page);
  const close = dialog.getByRole("button", { name: "Close dialog" });
  const cancel = dialog.getByRole("button", { name: "Cancel" });
  const publish = dialog.getByRole("button", { name: "Publish", exact: true });

  await page.keyboard.press("Tab");
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(publish).toBeFocused();
  await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const dialog = document.querySelector("#preview-dialog");
        return document.activeElement === document.body || Boolean(dialog?.contains(document.activeElement));
      })
    )
    .toBe(true);
  await expect(opener).not.toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const dialog = document.querySelector("#preview-dialog");
        return document.activeElement === document.body || Boolean(dialog?.contains(document.activeElement));
      })
    )
    .toBe(true);
  await page.keyboard.press("Shift+Tab");
  await expect(publish).toBeFocused();
});

test("Escape closes the dialog and restores focus", async ({ page }) => {
  const { dialog, opener } = await openDialog(page);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("the close button closes the dialog and restores focus", async ({ page }) => {
  const { dialog, opener } = await openDialog(page);

  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("a backdrop click closes the dialog and restores focus", async ({ page }) => {
  const { dialog, opener } = await openDialog(page);
  const bounds = await dialog.boundingBox();
  if (!bounds) throw new Error("Dialog bounds are unavailable");

  await page.mouse.click(Math.max(1, bounds.x - 8), Math.max(1, bounds.y - 8));
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("locks background scrolling while open", async ({ page }) => {
  const opener = page.locator('[data-dialog-open="preview-dialog"]');
  await opener.scrollIntoViewIfNeeded();
  const layoutBefore = await page.locator(".docs-content").boundingBox();
  const scrollPosition = await page.evaluate(() => window.scrollY);
  const { dialog } = await openDialog(page);

  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
  await page.mouse.move(4, 4);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(100);
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollPosition);
  expect(await page.locator(".docs-content").boundingBox()).toEqual(layoutBefore);
});
