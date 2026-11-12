import { expect, test, type Page } from "@playwright/test"

// The browser records from Chrome's fake microphone (see playwright.config.ts).
const row = (page: Page, run: string) => page.getByTestId(`run-${run}`).first()
const next = (page: Page) => page.getByRole("button", { name: "Next" }).click()
const start = (page: Page) => page.getByRole("button", { name: "Start" }).click()

/** Prepare, then record for a moment, then move on. */
async function answer(page: Page) {
  await next(page)
  await expect(page.getByText("Recording", { exact: true })).toBeVisible()
  await page.waitForTimeout(700)
  await next(page)
}

test("landing page links to the speaking tests", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: "Speaking tests" }).click()
  await expect(page).toHaveURL("/speaking/")
  await expect(page.getByRole("heading", { name: "Speaking Tests" })).toBeVisible()
})

test("full test: records all 8 tasks and plays them back on the results page", async ({ page }) => {
  await page.goto("/speaking")
  await row(page, "full").getByRole("link", { name: "Start" }).click()
  await start(page)
  for (const part of [1, 2, 3, 4, 5, 6, 7, 8]) {
    await expect(page.getByRole("heading", { name: new RegExp(`Speaking Task ${part}:`) })).toBeVisible()
    if (part === 5) {
      await page.getByRole("radio", { name: "Option B: Cargo Bike" }).click()
      await next(page)
      await expect(page.getByText(/Explain why the Cargo Bike is still better/)).toBeVisible()
    }
    await answer(page)
  }
  await expect(page).toHaveURL("/speaking/demo-1/results/full/")
  await expect(page.getByTestId("choice")).toHaveText("You chose Option B (Cargo Bike).")
  for (const part of [1, 8]) {
    const audio = page.getByLabel(`Your answer to Task ${part}`)
    await expect(audio).toHaveAttribute("src", /^blob:/)
    await expect.poll(() => audio.evaluate((a: HTMLAudioElement) => a.readyState)).toBeGreaterThan(0)
  }
  await page.reload()
  await expect(page.getByLabel("Your answer to Task 3")).toHaveAttribute("src", /^blob:/)
})

test("single task: auto-advances, then home shows Results and Clear", async ({ page }) => {
  await page.goto("/speaking/demo-1/2")
  await start(page)
  await expect(page.getByLabel("Time remaining")).toContainText("Preparation time: 00:")
  await answer(page)
  await expect(page).toHaveURL("/speaking/demo-1/results/2/")
  await expect(page.getByLabel("Your answer to Task 2")).toHaveAttribute("src", /^blob:/)
  await expect(page.getByTestId("task-1")).toHaveCount(0)
  await page.getByRole("link", { name: "Back to tests" }).click()
  await expect(row(page, "2").getByRole("link", { name: "Results" })).toBeVisible()
  await row(page, "2").getByRole("button", { name: "Clear" }).click()
  await expect(row(page, "2").getByRole("link", { name: "Results" })).toHaveCount(0)
})

test("clear result on the results page removes the recordings", async ({ page }) => {
  await page.goto("/speaking/demo-1/7")
  await start(page)
  await answer(page)
  await page.getByRole("button", { name: "Clear result" }).click()
  await expect(page).toHaveURL("/speaking/")
  await page.goto("/speaking/demo-1/results/7")
  await expect(page.getByText("No saved result.")).toBeVisible()
})

test("speaking pages fit the viewport without horizontal scroll", async ({ page }) => {
  for (const url of ["/speaking", "/speaking/demo-1/3", "/speaking/demo-1/5"]) {
    await page.goto(url)
    if (url !== "/speaking") await start(page)
    await page.waitForLoadState("networkidle")
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, url).toBeLessThanOrEqual(0)
  }
})

test("unknown speaking test or task shows 404", async ({ page }) => {
  for (const url of ["/speaking/nope", "/speaking/demo-1/9", "/speaking/demo-1/results/x"]) {
    await page.goto(url)
    await expect(page.getByText("This page could not be found."), url).toBeVisible()
  }
})
