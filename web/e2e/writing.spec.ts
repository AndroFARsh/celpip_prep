import { expect, test, type Page } from "@playwright/test"

const row = (page: Page, run: string) => page.getByTestId(`run-${run}`).first()
const next = (page: Page) => page.getByRole("button", { name: "Next" }).click()
const response = (page: Page) => page.getByRole("textbox", { name: "Your response" })
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ")

test("landing page links to the writing tests", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: "Writing tests" }).click()
  await expect(page).toHaveURL("/writing/")
  await expect(page.getByRole("heading", { name: "Writing Tests" })).toBeVisible()
})

test("full test: write both tasks, then see responses next to the samples", async ({ page }) => {
  await page.goto("/writing")
  await row(page, "full").getByRole("link", { name: "Start" }).click()
  await expect(page.getByRole("heading", { name: "Writing Task 1: Writing an Email" })).toBeVisible()
  await expect(page.getByLabel("Time remaining")).toContainText("27:0")
  await response(page).fill(words(170))
  await expect(page.getByTestId("word-count")).toHaveText("Word count: 170")
  await next(page)

  await expect(page.getByRole("heading", { name: "Writing Task 2: Responding to Survey Questions" })).toBeVisible()
  await expect(response(page)).toHaveValue("")
  await page.getByRole("radio", { name: /Option A/ }).click()
  await response(page).fill("Evenings suit workers.")
  await next(page)

  await expect(page).toHaveURL("/writing/demo-1/results/full/")
  await expect(page.getByTestId("task-1").getByText("170 words")).toBeVisible()
  await expect(page.getByTestId("task-2").getByTestId("choice")).toHaveText("You chose Option A.")
  await expect(page.getByTestId("task-2").getByText("Evenings suit workers.")).toBeVisible()
  await expect(page.getByText("Sample answer: Option B")).toBeVisible()
  await page.reload()
  await expect(page.getByTestId("task-2").getByText("Evenings suit workers.")).toBeVisible()
})

test("single task: Next goes to its results; home shows Results and Clear", async ({ page }) => {
  await page.goto("/writing/demo-1/2")
  await response(page).fill("Mornings.")
  await next(page)
  await expect(page).toHaveURL("/writing/demo-1/results/2/")
  await expect(page.getByTestId("task-1")).toHaveCount(0)
  await page.getByRole("link", { name: "Back to tests" }).click()
  await expect(row(page, "2").getByRole("link", { name: "Results" })).toBeVisible()
  await expect(row(page, "1").getByRole("link", { name: "Results" })).toHaveCount(0)
  await row(page, "2").getByRole("button", { name: "Clear" }).click()
  await expect(row(page, "2").getByRole("link", { name: "Results" })).toHaveCount(0)
})

test("clear result on the results page, start again is a fresh run", async ({ page }) => {
  await page.goto("/writing/demo-1/1")
  await response(page).fill("First draft.")
  await next(page)
  await page.getByRole("link", { name: "Start again" }).click()
  await expect(page).toHaveURL("/writing/demo-1/1/")
  await expect(response(page)).toHaveValue("")
  await next(page)
  await page.getByRole("button", { name: "Clear result" }).click()
  await expect(page).toHaveURL("/writing/")
  await page.goto("/writing/demo-1/results/1")
  await expect(page.getByText("No saved result.")).toBeVisible()
})

test("writing pages fit the viewport without horizontal scroll", async ({ page }) => {
  await page.goto("/writing/demo-1/1")
  await response(page).fill("x".repeat(300))
  await next(page)
  for (const url of ["/", "/writing", "/writing/demo-1", "/writing/demo-1/2", "/writing/demo-1/results/1"]) {
    await page.goto(url)
    await page.waitForLoadState("networkidle")
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, url).toBeLessThanOrEqual(0)
  }
})

test("mobile stacks the information above the text box", async ({ page, isMobile }) => {
  test.skip(!isMobile)
  await page.goto("/writing/demo-1")
  const info = await page.getByText("Read the following information.").boundingBox()
  const box = await response(page).boundingBox()
  expect(info!.y).toBeLessThan(box!.y)
})

test("unknown writing test or task shows 404", async ({ page }) => {
  for (const url of ["/writing/nope", "/writing/demo-1/3", "/writing/demo-1/results/x"]) {
    await page.goto(url)
    await expect(page.getByText("This page could not be found."), url).toBeVisible()
  }
})
