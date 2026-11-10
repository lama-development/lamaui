import { expect, test } from "@playwright/test";

for (const width of [320, 390, 768, 1440]) {
  test(`preview tabs and code actions stay separate and usable at ${width}px`, async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width, height: 900 });

    for (const slug of ["button", "checkbox", "alert"]) {
      await page.goto(`/components/${slug}`);
      const frames = page.locator("[data-example-frame]").filter({ has: page.getByRole("tablist", { name: "Example view" }) });
      const frame = frames.first();
      const tabs = frame.getByRole("tablist", { name: "Example view" });
      await tabs.getByRole("tab", { name: "Code", exact: true }).click();
      const source = frame.locator("[data-example-code]");
      const block = source.locator("[data-code-block]");
      const actions = source.locator(".code-actions");
      const [tabsBox, actionsBox, frameBox, blockBox] = await Promise.all([tabs.boundingBox(), actions.boundingBox(), frame.boundingBox(), block.boundingBox()]);
      expect(blockBox!.y - (tabsBox!.y + tabsBox!.height)).toBeGreaterThanOrEqual(8);
      await expect(source.locator(".code-language")).toHaveText("astro");
      await expect(source.locator(".code-head")).toHaveCSS("border-bottom-width", "0px");
      expect(actionsBox!.y).toBeGreaterThanOrEqual(tabsBox!.y + tabsBox!.height);
      expect(actionsBox!.x).toBeGreaterThanOrEqual(frameBox!.x);
      expect(actionsBox!.x + actionsBox!.width).toBeLessThanOrEqual(frameBox!.x + frameBox!.width);

      const wrap = source.locator("[data-code-wrap]");
      await expect(wrap).toHaveAccessibleName("Wrap lines");
      await wrap.click();
      await expect(wrap).toHaveAttribute("aria-pressed", "true");
      await expect(source.locator("pre")).toHaveCSS("white-space", "pre-wrap");
      const code = await source.locator("code").textContent();
      await source.getByRole("button", { name: "Copy code", exact: true }).click();
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(code);

      await tabs.getByRole("tab", { name: "Preview", exact: true }).click();
      await expect(frame.locator("[data-example-live]")).toBeVisible();
      const reset = frame.getByRole("button", { name: "Reset example", exact: true });
      if (await reset.count()) {
        const [tabsBox, resetBox] = await Promise.all([tabs.boundingBox(), reset.boundingBox()]);
        expect(resetBox!.y).toBeGreaterThanOrEqual(tabsBox!.y + tabsBox!.height);
        await reset.click();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
}

test("the Button form example remains interactive below the code snippets", async ({ page }) => {
  await page.goto("/components/button");
  const examples = page.locator('section[aria-labelledby="examples"]');
  await expect(examples.getByRole("tablist", { name: "Example view" })).toHaveCount(1);
  const form = examples.locator("form");
  await form.getByRole("button", { name: "Submit form", exact: true }).click();
  await expect(form.locator("output")).toHaveText('{"intent":"save"}');
});
