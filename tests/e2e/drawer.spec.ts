import { expect, test, type Page } from "@playwright/test";

const openDrawer = async (page: Page) => {
  const opener = page.locator('[data-dialog-open="preview-drawer"]');
  await opener.click();
  const drawer = page.getByRole("dialog", { name: "Right drawer" });
  await expect(drawer).toBeVisible();
  return { drawer, opener };
};

test.beforeEach(async ({ page }) => {
  await page.goto("/components/drawer");
});

test("opens with an accessible name and initial focus", async ({ page }) => {
  const { drawer } = await openDrawer(page);

  await expect(drawer).toHaveAttribute("aria-labelledby", "preview-drawer-title");
  await expect(drawer.getByRole("button", { name: "Close drawer" })).toBeFocused();
});

test("shows left and right desktop variants", async ({ page }) => {
  const leftOpener = page.locator('[data-dialog-open="preview-left-drawer"]');
  const rightOpener = page.locator('[data-dialog-open="preview-drawer"]');

  await expect(leftOpener).toHaveText("Open left drawer");
  await expect(rightOpener).toHaveText("Open right drawer");

  await leftOpener.click();
  const leftDrawer = page.getByRole("dialog", { name: "Left drawer" });
  await expect(leftDrawer).toBeVisible();
  await expect(leftDrawer).toHaveAttribute("data-drawer-side", "left");
});

test("Escape closes the drawer and restores focus", async ({ page }) => {
  const { drawer, opener } = await openDrawer(page);

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(opener).toBeFocused();
});

test("a backdrop click closes the drawer and restores focus", async ({ page }) => {
  const { drawer, opener } = await openDrawer(page);
  await drawer.evaluate(async (element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  const bounds = await drawer.boundingBox();
  if (!bounds) throw new Error("Drawer bounds are unavailable");

  await page.mouse.click(Math.max(1, bounds.x - 12), Math.max(1, bounds.y + 12));
  await expect(drawer).toBeHidden();
  await expect(opener).toBeFocused();
});

test("locks the page while drawer content scrolls", async ({ page }) => {
  const opener = page.locator('[data-dialog-open="preview-drawer"]');
  await opener.scrollIntoViewIfNeeded();
  const layoutBefore = await page.locator(".docs-content").boundingBox();
  const pageScroll = await page.evaluate(() => window.scrollY);
  const { drawer } = await openDrawer(page);
  const body = drawer.locator(".lamaui-drawer-body");
  await body.evaluate((element) => {
    const content = document.createElement("div");
    content.style.height = "1800px";
    element.append(content);
  });

  await body.hover();
  await page.mouse.wheel(0, 500);
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(pageScroll);
  expect(await page.locator(".docs-content").boundingBox()).toEqual(layoutBefore);
});

test.describe("mobile bottom sheet", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("uses safe-area padding and closes with a downward drag", async ({ page }) => {
    const { drawer, opener } = await openDrawer(page);
    const body = drawer.locator(".lamaui-drawer-body");
    const drawerBounds = await drawer.boundingBox();
    expect(drawerBounds?.x).toBe(0);
    expect(drawerBounds?.width).toBe(390);
    expect(await page.evaluate(() => getComputedStyle(document.body).paddingInlineEnd)).toBe("0px");
    const paddingBottom = await body.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingBottom));
    expect(paddingBottom).toBeGreaterThanOrEqual(20);

    const dragArea = drawer.locator("[data-drawer-drag-zone]");
    const bounds = await dragArea.boundingBox();
    if (!bounds) throw new Error("Drawer drag area bounds are unavailable");
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + 12;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 180, { steps: 8 });
    await page.mouse.up();

    await expect(drawer).toBeHidden();
    await expect(opener).toBeFocused();
  });
});
