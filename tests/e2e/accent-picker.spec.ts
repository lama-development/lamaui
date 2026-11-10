import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`accent picker stays compact and selects a saved color at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/components/accent-picker");
    const picker = page.locator(".component-preview [data-accent-picker]").first();
    const trigger = picker.locator("[data-accent-trigger]");
    const pickerBox = await picker.boundingBox();
    const triggerBox = await trigger.boundingBox();
    expect(pickerBox!.width).toBeLessThanOrEqual(triggerBox!.width + 12);

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const blue = picker.getByRole("button", { name: "Blue accent", exact: true });
    await blue.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
    await expect(page.locator("html")).toHaveAttribute("data-accent", "blue");
    await page.reload();
    await expect(trigger).toHaveAttribute("aria-label", "Choose accent color, current: Blue");
    await trigger.focus();
    await page.keyboard.press("ArrowUp");
    await expect(blue).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
}

test("tabs keep their neutral palette when the accent changes", async ({ page }) => {
  await page.goto("/components/tabs");
  const tablist = page.locator(".component-preview").getByRole("tablist", { name: "Tabs", exact: true });
  const colors = async () =>
    tablist.evaluate((element) => {
      const highlight = element.querySelector<HTMLElement>(".lamaui-tab-highlight")!;
      const selectedTab = element.querySelector<HTMLElement>('[aria-selected="true"]')!;
      return {
        track: getComputedStyle(element).backgroundColor,
        border: getComputedStyle(element).borderTopColor,
        selected: getComputedStyle(highlight).backgroundColor,
        selectedText: getComputedStyle(selectedTab).color
      };
    });
  const settle = () =>
    tablist.evaluate(async (element) => {
      await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined)));
    });

  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, value) => {
      element.dataset.theme = value;
      delete element.dataset.accent;
    }, theme);
    await settle();
    const before = await colors();
    await page.locator("html").evaluate((element) => (element.dataset.accent = "blue"));
    await expect.poll(colors).toEqual(before);
  }
});

test("a missing focusout target does not make the accent dock inert before a tap completes", async ({ page }) => {
  await page.goto("/components/accent-picker");
  const picker = page.locator(".component-preview [data-accent-picker]").first();
  const trigger = picker.locator("[data-accent-trigger]");

  await trigger.click();
  const stayedOpenSynchronously = await picker.evaluate((element) => {
    element.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
    return element.getAttribute("data-open") === "true" && !element.querySelector<HTMLElement>("[data-accent-dock]")!.inert;
  });

  expect(stayedOpenSynchronously).toBe(true);
});

for (const placement of ["top", "bottom", "left", "right"]) {
  test(`accent picker supports opening ${placement} with keyboard selection`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/components/accent-picker");
    const picker = page.locator(`.component-preview [data-accent-placement="${placement}"]`);
    // Give every direction enough room, as in a centered settings toolbar.
    await picker.evaluate((element) => Object.assign(element.style, { position: "fixed", left: "680px", top: "450px", zIndex: "100" }));
    const trigger = picker.locator("[data-accent-trigger]");
    await trigger.click();
    await expect(picker).toHaveAttribute("data-placement", placement);
    const [root, dock] = await Promise.all([picker.boundingBox(), picker.locator("[data-accent-dock]").boundingBox()]);
    if (placement === "top") expect(dock!.y + dock!.height).toBeLessThan(root!.y);
    if (placement === "bottom") expect(dock!.y).toBeGreaterThan(root!.y + root!.height);
    if (placement === "left") expect(dock!.x + dock!.width).toBeLessThan(root!.x);
    if (placement === "right") expect(dock!.x).toBeGreaterThan(root!.x + root!.width);
    await page.keyboard.press("End");
    await expect(picker.getByRole("button", { name: "Neutral accent", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "neutral");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
}

test("accent palette flips at the viewport edge and stays inside after resizing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/components/accent-picker");
  const picker = page.locator('.component-preview [data-accent-placement="top"]');
  await picker.evaluate((element) => Object.assign(element.style, { position: "fixed", left: "calc(100% - 64px)", top: "8px", zIndex: "100" }));
  await picker.locator("[data-accent-trigger]").click();
  await expect(picker).toHaveAttribute("data-placement", "bottom");
  await page.setViewportSize({ width: 320, height: 480 });
  const dock = picker.locator("[data-accent-dock]");
  await expect
    .poll(async () => {
      const box = await dock.boundingBox();
      return !!box && box.x >= 7 && box.y >= 7 && box.x + box.width <= 313 && box.y + box.height <= 473;
    })
    .toBe(true);
  await picker.getByRole("button", { name: "Blue accent", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-accent", "blue");
  for (const trigger of await page.locator(".component-preview [data-accent-trigger]").all()) {
    await expect(trigger).toHaveAttribute("aria-label", "Choose accent color, current: Blue");
  }
});

test.describe("touch", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("a side-opening palette falls back to a reachable direction on phones", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/components/accent-picker");
    const picker = page.locator('.component-preview [data-accent-placement="right"]');
    const trigger = picker.locator("[data-accent-trigger]");
    await trigger.tap();
    const dock = (await picker.locator("[data-accent-dock]").boundingBox())!;
    expect(dock.x).toBeGreaterThanOrEqual(7);
    expect(dock.x + dock.width).toBeLessThanOrEqual(383);
    expect(dock.y).toBeGreaterThanOrEqual(7);
    expect(dock.y + dock.height).toBeLessThanOrEqual(837);
    await picker.getByRole("button", { name: "Rose accent", exact: true }).tap();
    await expect(page.locator("html")).toHaveAttribute("data-accent", "rose");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
