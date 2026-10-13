import { expect, test } from "@playwright/test";
import { components, componentGroups } from "@lib/components";

test("category links keep every component visible and navigate to sections", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const catalog = page.locator("[data-catalog]");
  await expect(page.locator(".guide-rail, [data-guide-toc], [data-guide-actions]")).toHaveCount(0);
  expect(Math.abs((await catalog.boundingBox())!.width - (await page.locator(".docs-content").boundingBox())!.width)).toBeLessThan(1);
  await expect(catalog.getByRole("searchbox")).toHaveCount(0);
  const navigation = catalog.getByRole("navigation", { name: "Component categories" });
  const cards = catalog.locator("[data-catalog-card]:visible");
  const original = await cards.evaluateAll((items) => items.map((item) => item.getAttribute("data-name")));
  await expect(navigation.getByRole("link")).toHaveCount(componentGroups.length);
  await expect(navigation.getByRole("link", { name: "Components", exact: true })).toHaveCount(0);
  await expect(cards).toHaveCount(components.length);
  for (const group of componentGroups) {
    const link = navigation.getByRole("link", { name: group.name, exact: true });
    await expect(link).toHaveAttribute("href", `#${group.slug}`);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`#${group.slug}$`));
    await expect(link).toHaveAttribute("aria-current", "location");
    await expect(catalog.locator(`#${group.slug}-heading`)).toBeInViewport();
    await expect(cards).toHaveCount(components.length);
  }
  expect(await cards.evaluateAll((items) => items.map((item) => item.getAttribute("data-name")))).toEqual(original);
});

test("category links follow native keyboard order and keep section spacing consistent", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const catalog = page.locator("[data-catalog]");
    const navigation = catalog.getByRole("navigation", { name: "Component categories" });
    const first = navigation.getByRole("link", { name: componentGroups[0].name, exact: true });
    await first.focus();
    await expect(first).toHaveAttribute("aria-current", "location");
    for (const group of componentGroups.slice(1)) {
      await page.keyboard.press("Tab");
      await expect(navigation.getByRole("link", { name: group.name, exact: true })).toBeFocused();
    }
    await expect(catalog.locator("[data-catalog-group]:visible")).toHaveCount(componentGroups.length);
    const sections = await catalog.locator("[data-catalog-group]").evaluateAll((items) => items.map((item) => ({ top: item.getBoundingClientRect().top, bottom: item.getBoundingClientRect().bottom })));
    for (let i = 1; i < sections.length; i++) expect(sections[i].top - sections[i - 1].bottom).toBeCloseTo(40, 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test("category navigation marks the section currently being viewed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const navigation = page.getByRole("navigation", { name: "Component categories" });
    for (const slug of ["actions", "forms", "data-display", "layout"]) {
      await page.locator(`#${slug}`).evaluate((section) => section.scrollIntoView());
      const link = navigation.locator(`[data-catalog-link="${slug}"]`);
      await expect(link).toHaveAttribute("aria-current", "location");
      await expect(navigation.locator('[aria-current="location"]')).toHaveCount(1);
      if (width < 861) await expect(link).toBeInViewport();
    }
  }
});

test("category navigation uses the same surfaces as catalog cards", async ({ page }) => {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("/");
    const colors = await page.locator("[data-catalog-nav]").evaluate((navigation) => {
      const track = navigation.querySelector<HTMLElement>(".lamaui-tabs")!;
      const highlight = navigation.querySelector<HTMLElement>(".lamaui-tab-highlight")!;
      const card = document.querySelector<HTMLElement>(".docs-component-card")!;
      const preview = card.querySelector<HTMLElement>(".catalog-preview")!;
      return {
        track: getComputedStyle(track).backgroundColor,
        highlight: getComputedStyle(highlight).backgroundColor,
        border: getComputedStyle(track).borderColor,
        card: getComputedStyle(card).backgroundColor,
        cardBorder: getComputedStyle(card).borderColor,
        preview: getComputedStyle(preview).backgroundColor
      };
    });
    expect(colors.highlight).toBe(colors.card);
    expect(colors.track).toBe(colors.preview);
    expect(colors.border).toBe(colors.cardBorder);
  }
});

test("category navigation reaches the trailing viewport edge on narrow screens", async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const content = page.locator(".docs-content");
    const scroller = page.locator(".catalog-tabs > .lamaui-tabs-scroll");
    const [contentBox, scrollerBox] = await Promise.all([content.boundingBox(), scroller.boundingBox()]);
    expect(scrollerBox!.x).toBeCloseTo(0, 1);
    expect(scrollerBox!.x + scrollerBox!.width).toBeCloseTo(width, 1);
    const initialTrackLeft = await scroller.locator(".lamaui-tabs").evaluate((element) => element.getBoundingClientRect().left);
    expect(initialTrackLeft).toBeCloseTo(contentBox!.x, 1);
    const scrolledTrackLeft = await scroller.evaluate((element, inset) => {
      element.scrollLeft = inset;
      return element.querySelector<HTMLElement>(".lamaui-tabs")!.getBoundingClientRect().left;
    }, contentBox!.x);
    expect(scrolledTrackLeft).toBeCloseTo(0, 1);
    const endState = await scroller.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
      const track = element.querySelector<HTMLElement>(".lamaui-tabs")!;
      const lastLink = element.querySelector<HTMLElement>("[data-catalog-link]:last-of-type")!;
      const trackRight = track.getBoundingClientRect().right;
      return {
        outerGap: window.innerWidth - trackRight,
        innerGap: trackRight - lastLink.getBoundingClientRect().right,
        scrollbarWidth: getComputedStyle(element).scrollbarWidth
      };
    });
    expect(Math.abs(endState.outerGap - contentBox!.x)).toBeLessThanOrEqual(1.1);
    expect(endState.innerGap).toBeGreaterThanOrEqual(4);
    expect(endState.innerGap).toBeLessThanOrEqual(6);
    expect(endState.scrollbarWidth).toBe("none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

    const forms = page.getByRole("navigation", { name: "Component categories" }).getByRole("link", { name: "Forms", exact: true });
    await forms.click();
    await expect(forms).toBeInViewport();
    await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
    await expect.poll(async () => Math.round((await scroller.boundingBox())!.y)).toBeLessThanOrEqual(56);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const tabsBox = await page.getByRole("navigation", { name: "Component categories" }).locator(".lamaui-tabs").boundingBox();
  expect(tabsBox!.x + tabsBox!.width).toBeLessThan(1440);
});

test("sticky category tabs follow the mobile navbar motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");

  const header = page.locator(".docs-mobile-header");
  const scroller = page.locator(".catalog-tabs > .lamaui-tabs-scroll");
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
  await expect(header).toHaveAttribute("data-scroll-hidden", "");

  await header.evaluate(async (element) => {
    element.removeAttribute("data-scroll-hidden");
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  await expect.poll(async () => (await scroller.boundingBox())!.y).toBeCloseTo(56, 1);

  const motion = await scroller.evaluate(async (element) => {
    const navbar = document.querySelector<HTMLElement>(".docs-mobile-header")!;
    const navigation = document.querySelector<HTMLElement>("[data-catalog-nav]")!;
    const startY = element.getBoundingClientRect().y;
    navbar.setAttribute("data-scroll-hidden", "");
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const tabTransition = navigation.getAnimations().find((animation) => animation instanceof CSSTransition && animation.transitionProperty === "top");
    const navbarTransition = navbar.getAnimations().find((animation) => animation instanceof CSSTransition && animation.transitionProperty === "transform");
    await new Promise<void>((resolve) => window.setTimeout(resolve, 80));
    const duringY = element.getBoundingClientRect().y;
    const tabTiming = tabTransition?.effect?.getTiming();
    const navbarTiming = navbarTransition?.effect?.getTiming();
    await Promise.all([tabTransition?.finished, navbarTransition?.finished]);

    return {
      startY,
      duringY,
      endY: element.getBoundingClientRect().y,
      tabDuration: tabTiming?.duration,
      navbarDuration: navbarTiming?.duration,
      tabEasing: tabTiming?.easing,
      navbarEasing: navbarTiming?.easing
    };
  });

  expect(motion.startY).toBeCloseTo(56, 1);
  expect(motion.duringY).toBeLessThan(motion.startY);
  expect(motion.duringY).toBeGreaterThan(0);
  expect(motion.endY).toBeCloseTo(0, 1);
  expect(motion.tabDuration).toBe(240);
  expect(motion.tabDuration).toBe(motion.navbarDuration);
  expect(motion.tabEasing).toBe(motion.navbarEasing);
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`category anchor indicator follows the current section with ${reducedMotion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const result = await page.locator("[data-catalog-nav]").evaluate(async (root) => {
        const indicator = root.querySelector<HTMLElement>(".lamaui-tab-highlight")!;
        const link = root.querySelector<HTMLAnchorElement>('[data-catalog-link="forms"]')!;
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        link.addEventListener("click", (event) => event.preventDefault(), { once: true });
        link.click();
        getComputedStyle(indicator).transform;
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const transition = indicator.getAnimations().find((animation) => animation instanceof CSSTransition && animation.transitionProperty === "transform");
        const running = transition?.playState === "running";
        await transition?.finished;
        return {
          running,
          current: link.getAttribute("aria-current"),
          aligned: Math.abs(indicator.getBoundingClientRect().left - link.getBoundingClientRect().left) < 1,
          widthMatches: Math.abs(indicator.getBoundingClientRect().width - link.getBoundingClientRect().width) < 1
        };
      });
      expect(result.running).toBe(reducedMotion === "no-preference");
      expect(result.current).toBe("location");
      expect(result.aligned).toBe(true);
      expect(result.widthMatches).toBe(true);
    }
  });
}

test("fluid category and tab hover follows the pointer without changing selection", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const example of [{ path: "/components/tabs", label: "Settings sections", targets: ["Security", "General"] }]) {
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

  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Component categories" });
  const initial = await navigation.locator('[aria-current="location"]').getAttribute("href");
  for (const name of ["Actions", "Forms"]) {
    const target = navigation.getByRole("link", { name, exact: true });
    await target.hover();
    const hover = navigation.locator(".lamaui-fluid-hover");
    await expect(hover).toHaveAttribute("data-visible", "true");
    await expect.poll(async () => Math.abs((await hover.boundingBox())!.x - (await target.boundingBox())!.x)).toBeLessThan(1);
    await expect(navigation.locator('[aria-current="location"]')).toHaveAttribute("href", initial!);
  }
});

test("category anchor survives legacy URLs, reload, and return navigation", async ({ page }) => {
  await page.goto("/?category=forms&q=PasswordInput#catalog");
  const catalog = page.locator("[data-catalog]");
  const forms = catalog.getByRole("navigation", { name: "Component categories" }).getByRole("link", { name: "Forms", exact: true });
  await expect(forms).toHaveAttribute("aria-current", "location");
  expect(new URL(page.url()).searchParams.has("q")).toBe(false);
  await expect(page).toHaveURL(/#forms$/);
  await page.reload();
  await expect(forms).toHaveAttribute("aria-current", "location");
  await catalog.locator('[data-catalog-card][data-name="PasswordInput"]').click();
  await expect(page).toHaveURL(/\/components\/password-input$/);
  await page.goBack();
  await expect(forms).toHaveAttribute("aria-current", "location");
  await expect(catalog.locator("[data-catalog-card]:visible")).toHaveCount(components.length);
});

test("sidebar separates start pages from component categories", async ({ page }) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Documentation" });
  await expect(navigation.getByText("Start", { exact: true })).toBeVisible();
  await expect(navigation.locator("#docs-nav-components")).toHaveText("Components");
  const startLinks = navigation.locator('[aria-labelledby="docs-nav-start"] a');
  await expect(startLinks).toHaveCount(2);
  expect(await startLinks.allTextContents()).toEqual(["Getting started", "Components"]);

  const foundations = navigation.getByRole("button", { name: "Foundations", exact: true });
  const actions = navigation.getByRole("button", { name: "Actions", exact: true });
  await foundations.click();
  await expect(foundations).toHaveAttribute("aria-expanded", "true");
  const foundationsPanel = navigation.locator("#docs-nav-foundations");
  expect(await foundationsPanel.getByRole("link").allTextContents()).toEqual(["Icon", "ThemePicker", "AccentPicker"]);
  await actions.click();
  await expect(actions).toHaveAttribute("aria-expanded", "true");
  await expect(foundations).toHaveAttribute("aria-expanded", "false");
});

test("sidebar reserves scrollbar space without resizing its items", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1600 });
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Documentation" });
  const row = navigation.getByRole("link", { name: "Getting started", exact: true });
  await expect(navigation).toHaveCSS("scrollbar-gutter", "stable");
  expect(await navigation.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true);
  const before = (await row.boundingBox())!.width;
  await navigation.evaluate((element) => {
    const spacer = document.createElement("div");
    spacer.dataset.testScrollbarSpacer = "";
    spacer.style.height = "2000px";
    spacer.style.flex = "none";
    element.append(spacer);
  });
  expect(await navigation.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  expect(Math.abs((await row.boundingBox())!.width - before)).toBeLessThan(1);
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
      await catalog.getByRole("navigation", { name: "Component categories" }).getByRole("link", { name: "Forms", exact: true }).click();
      await expect(page).toHaveURL(/#forms$/);
      await expect(page.locator("[data-catalog-card]:visible")).toHaveCount(components.length);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }
}
