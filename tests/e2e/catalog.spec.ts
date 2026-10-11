import { expect, test } from "@playwright/test";
import { components, componentGroups } from "../../src/lib/components";

test("category tabs show their components and All restores their original order", async ({ page }) => {
  await page.goto("/");
  const catalog = page.locator("[data-catalog]");
  await expect(catalog.getByRole("searchbox")).toHaveCount(0);
  const tabs = catalog.getByRole("tablist", { name: "Component category" });
  const cards = catalog.locator("[data-catalog-card]:visible");
  const original = await cards.evaluateAll((items) => items.map((item) => item.getAttribute("data-name")));
  for (const group of componentGroups) {
    const tab = tabs.getByRole("tab", { name: group.name, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(cards).toHaveCount(group.components.length);
    await expect(catalog.getByRole("tabpanel")).toHaveCount(1);
    await expect(catalog.getByRole("tabpanel")).toHaveAttribute("id", (await tab.getAttribute("aria-controls"))!);
    await expect(catalog.getByRole("status")).toHaveText(`${group.components.length} components in ${group.name}`);
    expect(new URL(page.url()).searchParams.get("category")).toBe(group.slug);
  }
  await tabs.getByRole("tab", { name: "All components", exact: true }).click();
  await expect(cards).toHaveCount(components.length);
  expect(await cards.evaluateAll((items) => items.map((item) => item.getAttribute("data-name")))).toEqual(original);
  await expect(catalog.locator("[data-catalog-card]")).toHaveCount(components.length);
  await expect(page).toHaveURL(/\/$/);
});

test("category tabs support keyboard selection and keep spacing consistent", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const catalog = page.locator("[data-catalog]");
    const tabs = catalog.getByRole("tablist", { name: "Component category" });
    const all = tabs.getByRole("tab", { name: "All components", exact: true });
    const position = () =>
      catalog
        .locator("[data-catalog-group]:visible")
        .first()
        .evaluate((section) => {
          const list = section.closest("[data-tabs]")!.querySelector('[role="tablist"]')!;
          return section.getBoundingClientRect().top - list.getBoundingClientRect().bottom;
        });
    const gap = await position();
    await all.focus();
    for (const group of componentGroups) {
      await page.keyboard.press("ArrowRight");
      const tab = tabs.getByRole("tab", { name: group.name, exact: true });
      await expect(tab).toBeFocused();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect.poll(position).toBeCloseTo(gap, 1);
    }
    await page.keyboard.press("Home");
    await expect(all).toBeFocused();
    await expect(catalog.locator("[data-catalog-group]:visible")).toHaveCount(componentGroups.length);
    const sections = await catalog.locator("[data-catalog-group]").evaluateAll((items) => items.map((item) => ({ top: item.getBoundingClientRect().top, bottom: item.getBoundingClientRect().bottom })));
    for (let i = 1; i < sections.length; i++) expect(sections[i].top - sections[i - 1].bottom).toBeCloseTo(40, 1);
    await page.keyboard.press("End");
    await expect(tabs.getByRole("tab", { name: "Layout", exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`category indicator preserves its transition with ${reducedMotion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const result = await page.locator("[data-catalog] > [data-tabs]").evaluate(async (root) => {
        const indicator = root.querySelector<HTMLElement>(".lamaui-tab-highlight")!;
        const tab = root.querySelector<HTMLButtonElement>('[data-tab="forms"]')!;
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const before = root.getBoundingClientRect().height;
        tab.click();
        // Resolve styles so the transition starts before resize notifications.
        getComputedStyle(indicator).transform;
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const transition = indicator.getAnimations().find((animation) => animation instanceof CSSTransition && animation.transitionProperty === "transform");
        const running = transition?.playState === "running";
        await transition?.finished;
        return {
          resized: root.getBoundingClientRect().height !== before,
          running,
          aligned: Math.abs(indicator.getBoundingClientRect().left - tab.getBoundingClientRect().left) < 1,
          widthMatches: Math.abs(indicator.getBoundingClientRect().width - tab.getBoundingClientRect().width) < 1
        };
      });
      expect(result.resized).toBe(true);
      expect(result.running).toBe(reducedMotion === "no-preference");
      expect(result.aligned).toBe(true);
      expect(result.widthMatches).toBe(true);
    }
  });
}

test("fluid tab hover follows the pointer without changing selection", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const example of [
    { path: "/", label: "Component category", targets: ["Actions", "Forms"] },
    { path: "/components/tabs", label: "Settings sections", targets: ["Security", "General"] }
  ]) {
    await page.goto(example.path);
    const tabs = page.getByRole("tablist", { name: example.label, exact: true });
    await tabs.scrollIntoViewIfNeeded();
    await tabs.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const selected = tabs.locator('[aria-selected="true"]');
    const initial = await selected.getAttribute("id");
    for (const name of example.targets) {
      const target = tabs.getByRole("tab", { name, exact: true });
      await target.hover();
      const hover = tabs.locator(".lamaui-fluid-hover");
      await expect(hover).toHaveAttribute("data-visible", "true");
      await expect.poll(async () => Math.abs((await hover.boundingBox())!.x - (await target.boundingBox())!.x)).toBeLessThan(1);
      await expect.poll(async () => Math.abs((await hover.boundingBox())!.width - (await target.boundingBox())!.width)).toBeLessThan(1);
      await expect(selected).toHaveAttribute("id", initial!);
    }
    await page.mouse.move(0, 0);
    await expect(tabs.locator('.lamaui-fluid-hover[data-visible="true"]')).toHaveCount(0);
  }
});

test("category selection survives reload and return navigation from a guide", async ({ page }) => {
  await page.goto("/?category=forms&q=PasswordInput#catalog");
  const catalog = page.locator("[data-catalog]");
  const forms = catalog.getByRole("tab", { name: "Forms", exact: true });
  await expect(forms).toHaveAttribute("aria-selected", "true");
  expect(new URL(page.url()).searchParams.has("q")).toBe(false);
  await page.reload();
  await expect(forms).toHaveAttribute("aria-selected", "true");
  await catalog.locator('[data-catalog-card][data-name="PasswordInput"]').click();
  await expect(page).toHaveURL(/\/components\/password-input$/);
  await page.goBack();
  await expect(forms).toHaveAttribute("aria-selected", "true");
  await expect(catalog.locator("[data-catalog-card]:visible")).toHaveCount(componentGroups.find((group) => group.slug === "forms")!.components.length);
});

test("mobile navigation contains focus, leaves search in control, and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const opener = page.getByRole("button", { name: "Open navigation" });
  await opener.click();
  const navigation = page.getByRole("dialog", { name: "Documentation navigation" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("button", { name: "Close navigation" })).toBeFocused();
  await expect(page.locator(".docs-page")).toHaveAttribute("inert", "");
  await navigation.locator("[data-accent-trigger]").focus();
  await page.keyboard.press("Tab");
  await expect(navigation.getByRole("link", { name: "LamaUI home" })).toBeFocused();
  await navigation.getByRole("button", { name: "Search documentation" }).click();
  await expect(page.getByRole("dialog", { name: "Search documentation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("button", { name: "Search documentation" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await expect(page.locator(".docs-page")).not.toHaveAttribute("inert");
});

test("the whole brand links home in the sidebar and mobile header", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const brand = page.locator(width < 861 ? ".docs-mobile-header .docs-brand" : ".docs-sidebar .docs-brand");
    for (const target of [".docs-mark", "strong", null]) {
      await page.goto("/components/button-group");
      await expect(brand).toHaveAttribute("href", "/");
      await expect(brand.locator("button, a")).toHaveCount(0);
      if (target) await brand.locator(target).click();
      else {
        const box = (await brand.boundingBox())!;
        await brand.click({ position: { x: box.width - 4, y: box.height / 2 } });
      }
      await expect(page).toHaveURL(/\/$/);
    }
  }
});

for (const width of [320, 390, 768, 1024, 1440]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`catalog fits at ${width}px in ${colorScheme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await page.goto("/");
      const catalog = page.locator("[data-catalog]");
      await expect(catalog).toBeAttached();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await catalog.getByRole("tab", { name: "Forms", exact: true }).click();
      await expect(page.locator("[data-catalog-card]:visible")).toHaveCount(componentGroups.find((group) => group.slug === "forms")!.components.length);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }
}
