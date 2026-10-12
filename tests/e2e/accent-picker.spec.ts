import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`accent picker stays compact and selects a saved color at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/components/accent-picker");
    const picker = page.locator(".component-preview [data-accent-picker]");
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
