import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/components/custom-select");
});

test("associates the visible label, value, and help text", async ({ page }) => {
  const trigger = page.locator(".component-preview").getByRole("button", { name: "Team Design", exact: true });
  await page.locator('label[for="team-select-button"]').click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("option", { name: "Design", exact: true })).toBeFocused();
  await expect(trigger).toHaveAccessibleDescription("Choose the team that owns this project.");
  await expect(page.locator("#team-select")).toHaveValue("design");
  const list = page.getByRole("listbox", { name: "Team", exact: true });
  await expect(list).toHaveAttribute("id", (await trigger.getAttribute("aria-controls")) as string);
  await expect(list.getByRole("option", { selected: true })).toHaveText("Design");
});

for (const key of ["Enter", "Space", "ArrowDown", "ArrowUp"]) {
  test(`opens with ${key} at the expected option`, async ({ page }) => {
    const trigger = page.locator("#review-select-button");
    await trigger.focus();
    await trigger.press(key);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const list = page.getByRole("listbox", { name: "Review team", exact: true });
    await expect(list.getByRole("option", { name: key === "ArrowDown" ? "Design" : key === "ArrowUp" ? "Research" : "Engineering", exact: true })).toBeFocused();
  });
}

test("arrows skip disabled options, wrap, and leave selection unchanged", async ({ page }) => {
  await page.locator("#team-select-button").click();
  const list = page.getByRole("listbox", { name: "Team", exact: true });
  await page.keyboard.press("ArrowUp");
  await expect(list.getByRole("option", { name: "Strategy", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(list.getByRole("option", { name: "Design", exact: true })).toBeFocused();
  await page.keyboard.press("End");
  await expect(list.getByRole("option", { name: "Strategy", exact: true })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(list.getByRole("option", { name: "Design", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(list.getByRole("option", { name: "Support", exact: true })).toBeFocused();
  await expect(list.getByRole("option", { name: "Sales", exact: true })).toBeDisabled();
  await expect(list.getByRole("option", { selected: true })).toHaveText("Design");
  await expect(page.locator("#team-select")).toHaveValue("design");
});

for (const key of ["Enter", "Space"]) {
  test(`commits with ${key}, fires change, and submits the chosen value`, async ({ page }) => {
    await page.locator("[data-select-demo]").evaluate((form) => {
      form.addEventListener("change", (event) => {
        if (event.target instanceof HTMLInputElement) form.setAttribute("data-changed", event.target.value);
      });
    });
    const trigger = page.locator("#team-select-button");
    await trigger.click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press(key);
    await expect(trigger).toHaveAccessibleName("Team Engineering");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#team-select")).toHaveValue("engineering");
    await expect(page.locator("[data-select-demo]")).toHaveAttribute("data-changed", "engineering");
    await page.getByRole("button", { name: "Save assignment", exact: true }).click();
    await expect(page.locator("[data-select-demo-result]")).toHaveText("Assigned to engineering.");
  });
}

test("type-ahead matches prefixes, cycles repeated letters, skips disabled choices, and resets", async ({ page }) => {
  await page.locator("#team-select-button").click();
  const list = page.getByRole("listbox", { name: "Team", exact: true });
  await page.keyboard.type("s");
  await expect(list.getByRole("option", { name: "Support", exact: true })).toBeFocused();
  await page.keyboard.type("s");
  await expect(list.getByRole("option", { name: "Strategy", exact: true })).toBeFocused();
  await page.keyboard.type("s");
  await expect(list.getByRole("option", { name: "Support", exact: true })).toBeFocused();
  await page.waitForTimeout(750);
  await page.keyboard.type("str");
  await expect(list.getByRole("option", { name: "Strategy", exact: true })).toBeFocused();
  await page.waitForTimeout(750);
  await page.keyboard.type("re");
  await expect(list.getByRole("option", { name: "Research", exact: true })).toBeFocused();
  await expect(page.locator("#team-select")).toHaveValue("design");
});

test("typing while closed opens at a match without committing it", async ({ page }) => {
  const trigger = page.locator("#team-select-button");
  await trigger.focus();
  await trigger.press("e");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("option", { name: "Engineering", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAccessibleName("Team Design");
  await expect(page.getByRole("listbox", { name: "Team", exact: true })).toBeHidden();
  await trigger.press("Enter");
  await expect(page.getByRole("option", { name: "Design", exact: true })).toBeFocused();
});

for (const key of ["Tab", "Shift+Tab"]) {
  test(`${key} leaves the listbox in document order`, async ({ page }) => {
    const trigger = page.locator(key === "Tab" ? "#team-select-button" : "#review-select-button");
    await trigger.click();
    await page.keyboard.press(key);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(key === "Tab" ? "#review-select-button" : "#team-select-button")).toBeFocused();
  });
}

test("opening another select dismisses the first and outside clicks preserve focus", async ({ page }) => {
  const team = page.locator("#team-select-button");
  const review = page.locator("#review-select-button");
  await team.click();
  await review.click();
  await expect(team).toHaveAttribute("aria-expanded", "false");
  await expect(review).toHaveAttribute("aria-expanded", "true");
  const save = page.getByRole("button", { name: "Save assignment", exact: true });
  await save.click();
  await expect(review).toHaveAttribute("aria-expanded", "false");
  await expect(save).toBeFocused();
});

test("exposes errors and excludes disabled and empty fields from submission", async ({ page }) => {
  await expect(page.locator("#review-select-button")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#review-select-button")).toHaveAccessibleDescription("Choose a team with an available reviewer.");
  await expect(page.locator("#locked-select-button")).toBeDisabled();
  await expect(page.locator("#empty-select-button")).toBeDisabled();
  await expect(page.locator("#empty-select-button")).toHaveText("No options available");
  const data = await page.locator("[data-select-demo]").evaluate((form) => Object.fromEntries(new FormData(form as HTMLFormElement)));
  expect(data).toEqual({ team: "design", reviewer: "engineering" });
});

test("reset restores the original label, value, icon, and selected option", async ({ page }) => {
  const trigger = page.locator("#team-select-button");
  const originalIcon = await trigger.locator("[data-select-value-icon] svg").innerHTML();
  await trigger.click();
  await page.getByRole("option", { name: "Engineering", exact: true }).click();
  await expect(trigger).toHaveAccessibleName("Team Engineering");
  await page.getByRole("button", { name: "Reset assignment", exact: true }).click();
  await expect(trigger).toHaveAccessibleName("Team Design");
  await expect(page.locator("#team-select")).toHaveValue("design");
  expect(await trigger.locator("[data-select-value-icon] svg").innerHTML()).toBe(originalIcon);
  await trigger.click();
  await expect(page.getByRole("option", { name: "Design", exact: true })).toHaveAttribute("aria-selected", "true");
});

test.describe("touch", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("tap selects and outside tap dismisses", async ({ page }) => {
    const trigger = page.locator("#team-select-button");
    await trigger.tap();
    await page.getByRole("option", { name: "Research", exact: true }).tap();
    await expect(trigger).toHaveAccessibleName("Team Research");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("listbox", { name: "Team", exact: true })).toBeHidden();
    await trigger.tap();
    await page.getByRole("heading", { name: "CustomSelect", exact: true }).tap();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
