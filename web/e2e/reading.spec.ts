import { expect, test, type Page } from "@playwright/test"

import type { ReadingTest } from "../lib/schema"
import { itemsForPart } from "../lib/scoring"
import { loadTest } from "../lib/tests"

let demo: ReadingTest

test.beforeAll(async () => {
  demo = await loadTest("demo-1")
})

async function answerPart(page: Page, part: number) {
  for (const item of itemsForPart(demo, part)) {
    await page.getByRole("combobox", { name: `Question ${item.number}`, exact: true }).click()
    await page.getByRole("option", { name: item.answer, exact: true }).click()
  }
}

// demo-1 is the first card on the reading page.
const row = (page: Page, run: string) => page.getByTestId(`run-${run}`).first()
const next = (page: Page) => page.getByRole("button", { name: "Next" }).click()

test("full test: Next moves through every part, then shows saved results", async ({ page }) => {
  await page.goto("/reading")
  await row(page, "full").getByRole("link", { name: "Start" }).click()
  for (const part of [1, 2, 3, 4]) {
    await expect(page.getByRole("heading", { name: new RegExp(`Reading Part ${part}`) })).toBeVisible()
    await answerPart(page, part)
    await next(page)
  }
  await expect(page).toHaveURL("/reading/demo-1/results/full/")
  await expect(page.getByTestId("score")).toHaveText("Score: 38 / 38")
  await expect(page.getByText("Correct", { exact: true })).toHaveCount(38)
  await expect(page.getByTestId("level")).toHaveText("CELPIP level 12 (estimate)")
  await page.reload()
  await expect(page.getByTestId("score")).toHaveText("Score: 38 / 38")
})

test("single part: Next goes straight to that part's results", async ({ page }) => {
  await page.goto("/reading")
  await row(page, "3").getByRole("link", { name: "Start" }).click()
  await expect(page).toHaveURL("/reading/demo-1/3/")
  await expect(page.getByRole("heading", { name: "Reading Part 3: Reading for Information" })).toBeVisible()
  await answerPart(page, 3)
  await next(page)
  await expect(page).toHaveURL("/reading/demo-1/results/3/")
  await expect(page.getByTestId("score")).toHaveText("Score: 9 / 9")
  await expect(page.getByText("Part 1:")).toHaveCount(0)
})

test("home shows results and clear for taken runs only", async ({ page }) => {
  await page.goto("/reading/demo-1/2")
  await answerPart(page, 2)
  await next(page)
  await page.getByRole("link", { name: "Back to tests" }).click()
  await expect(row(page, "2").getByRole("link", { name: "Results 8/8" })).toBeVisible()
  await expect(row(page, "1").getByRole("link", { name: /Results/ })).toHaveCount(0)
  await row(page, "2").getByRole("link", { name: "Results 8/8" }).click()
  await expect(page).toHaveURL("/reading/demo-1/results/2/")
  await page.goBack()
  await row(page, "2").getByRole("button", { name: "Clear" }).click()
  await expect(row(page, "2").getByRole("link", { name: /Results/ })).toHaveCount(0)
})

test("clear result on the results page", async ({ page }) => {
  await page.goto("/reading/demo-1/4")
  await next(page)
  await page.getByRole("button", { name: "Clear result" }).click()
  await expect(page).toHaveURL("/reading/")
  await expect(row(page, "4").getByRole("link", { name: /Results/ })).toHaveCount(0)
  await page.goto("/reading/demo-1/results/4")
  await expect(page.getByText("No saved result.")).toBeVisible()
})

test("start always begins a fresh run", async ({ page }) => {
  await page.goto("/reading")
  await row(page, "full").getByRole("link", { name: "Start" }).click()
  await answerPart(page, 1)
  await next(page)
  await expect(page.getByRole("heading", { name: /Reading Part 2/ })).toBeVisible()
  await page.getByRole("link", { name: "CELPIP Practice" }).click()
  await page.getByRole("link", { name: "Reading tests" }).click()
  await row(page, "full").getByRole("link", { name: "Start" }).click()
  await expect(page.getByRole("heading", { name: /Reading Part 1/ })).toBeVisible()
  await expect(page.getByLabel("Time remaining")).toContainText("11:0")
  await expect(page.getByRole("combobox", { name: "Question 1", exact: true })).toHaveText("(1)", { useInnerText: true })
})

test("start again from results ignores the previous answers", async ({ page }) => {
  await page.goto("/reading/demo-1/1")
  await answerPart(page, 1)
  await next(page)
  await page.getByRole("link", { name: "Start again" }).click()
  await expect(page).toHaveURL("/reading/demo-1/1/")
  await next(page)
  await expect(page.getByTestId("score")).toHaveText("Score: 0 / 11")
})

test("theme toggle switches to dark and back", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Toggle theme" }).click()
  await page.getByRole("menuitem", { name: "Dark" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.getByRole("button", { name: "Toggle theme" }).click()
  await page.getByRole("menuitem", { name: "Light" }).click()
  await expect(page.locator("html")).not.toHaveClass(/dark/)
})

test("dark mode renders the test", async ({ browser }) => {
  const page = await browser.newPage({ colorScheme: "dark" })
  await page.goto("/reading/demo-1")
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(page.getByText("Read the following message.")).toBeVisible()
})

test("pages fit the viewport without horizontal scroll", async ({ page }) => {
  for (const url of ["/", "/reading", "/reading/demo-1", "/reading/demo-1/2", "/reading/demo-1/results/full"]) {
    await page.goto(url)
    await page.waitForLoadState("networkidle")
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, url).toBeLessThanOrEqual(0)
  }
})

test("mobile stacks passage above questions", async ({ page, isMobile }) => {
  test.skip(!isMobile)
  await page.goto("/reading/demo-1")
  const passage = await page.getByText("Read the following message.").boundingBox()
  const questions = await page.getByText(/Using the drop-down menu/).first().boundingBox()
  expect(passage!.y).toBeLessThan(questions!.y)
})

test("unknown test, part or run shows 404", async ({ page }) => {
  for (const url of ["/reading/nope", "/reading/demo-1/5", "/reading/demo-1/full", "/reading/demo-1/results/x"]) {
    await page.goto(url)
    await expect(page.getByText("This page could not be found."), url).toBeVisible()
  }
})
