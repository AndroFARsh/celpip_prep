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

test("home lists tests and starts one", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("Practice Test 1")).toBeVisible()
  await page.getByRole("link", { name: "Start" }).first().click()
  await expect(page.getByRole("heading", { name: "Reading Part 1: Reading Correspondence" })).toBeVisible()
  await expect(page.getByLabel("Time remaining")).toContainText("Time remaining: 1")
})

test("full test with all correct answers scores 38 / 38", async ({ page }) => {
  await page.goto("/reading/demo-1")
  for (const part of [1, 2, 3, 4]) {
    await expect(page.getByRole("heading", { name: new RegExp(`Reading Part ${part}`) })).toBeVisible()
    await answerPart(page, part)
    await page.getByRole("button", { name: part === 4 ? "Finish" : "Next" }).click()
  }
  await expect(page.getByTestId("score")).toHaveText("Score: 38 / 38")
  await expect(page.getByText("Correct", { exact: true })).toHaveCount(38)
  await page.getByRole("link", { name: "Back to tests" }).click()
  await expect(page).toHaveURL("/")
})

test("skipping all parts scores 0 and lists correct answers", async ({ page }) => {
  await page.goto("/reading/demo-1")
  for (const name of ["Next", "Next", "Next", "Finish"]) await page.getByRole("button", { name }).click()
  await expect(page.getByTestId("score")).toHaveText("Score: 0 / 38")
  await expect(page.getByRole("cell", { name: demo.parts[0].questions[0].prompt })).toBeVisible()
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

test("layout fits the viewport without horizontal scroll", async ({ page }) => {
  await page.goto("/reading/demo-1")
  await expect(page.getByText("Read the following message.")).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test("mobile stacks passage above questions", async ({ page, isMobile }) => {
  test.skip(!isMobile)
  await page.goto("/reading/demo-1")
  const passage = await page.getByText("Read the following message.").boundingBox()
  const questions = await page.getByText(/Using the drop-down menu/).first().boundingBox()
  expect(passage!.y).toBeLessThan(questions!.y)
})

test("unknown test shows 404", async ({ page }) => {
  await page.goto("/reading/does-not-exist")
  await expect(page.getByText("This page could not be found.")).toBeVisible()
})
