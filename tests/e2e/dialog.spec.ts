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

test("async save reports errors, keeps values, and succeeds on retry", async ({ page }) => {
  const opener = page.locator('[data-dialog-open="edit-project-demo"]');
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Edit project", exact: true });
  const name = dialog.getByRole("textbox", { name: "Project name" });
  await expect(name).toBeFocused();
  await name.fill("New project name");
  await dialog.getByRole("checkbox", { name: "Simulate a save failure" }).check();
  await dialog.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Saving…", exact: true })).toBeDisabled();
  await expect(dialog.locator("form")).toHaveAttribute("aria-busy", "true");
  const error = dialog.getByRole("alert");
  await expect(error).toHaveText("Could not save the project. Your changes are still here; try again.");
  await expect(error).toBeFocused();
  await expect(name).toHaveValue("New project name");
  await expect(dialog.getByRole("button", { name: "Save project", exact: true })).toBeEnabled();
  await dialog.getByRole("checkbox", { name: "Simulate a save failure" }).uncheck();
  await dialog.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("#project-save-result")).toHaveText("Saved “New project name”.");
  await expect(opener).toBeFocused();
});

test("closing during an async save cancels the result and allows another attempt", async ({ page }) => {
  const opener = page.locator('[data-dialog-open="edit-project-demo"]');
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Edit project", exact: true });
  await dialog.getByRole("button", { name: "Save project", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.locator("#project-save-result")).toBeEmpty();
  await opener.click();
  await expect(dialog.getByRole("button", { name: "Save project", exact: true })).toBeEnabled();
  await dialog.getByRole("textbox", { name: "Project name" }).fill("Retry after cancelling");
  await dialog.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(page.locator("#project-save-result")).toHaveText("Saved “Retry after cancelling”.");
  await expect(dialog).toBeHidden();
});

test("required validation prevents an empty async submission", async ({ page }) => {
  await page.locator('[data-dialog-open="edit-project-demo"]').click();
  const dialog = page.getByRole("dialog", { name: "Edit project", exact: true });
  const name = dialog.getByRole("textbox", { name: "Project name" });
  await name.fill("");
  await dialog.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(name).toBeFocused();
  expect(await name.evaluate((input) => (input as HTMLInputElement).validity.valueMissing)).toBe(true);
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("form")).not.toHaveAttribute("aria-busy", "true");
});
