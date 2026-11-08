import { expect, test, type Page } from "@playwright/test"

import type { ListeningTest } from "../lib/listening/schema"
import { itemsForPart } from "../lib/listening/scoring"
import { loadListeningTest } from "../lib/listening/tests"

// The e2e build uses a fake player (NEXT_PUBLIC_FAKE_AUDIO=1): every clip ends after 200 ms.
let demo: ListeningTest

test.beforeAll(async () => {
  demo = await loadListeningTest("demo-1")
})

const row = (page: Page, run: string) => page.getByTestId(`run-${run}`).first()
const next = (page: Page) => page.getByRole("button", { name: "Next" }).click()

async function answerPart(page: Page, part: number) {
  await next(page) // intro
  for (const item of itemsForPart(demo, part)) {
    if (part <= 3) {
      const group = page.getByRole("radiogroup", { name: `Question ${item.number}`, exact: true })
      const name = item.images ? new RegExp(`^${item.answer}\\.`) : item.answer
      await group.getByRole("radio", { name, exact: !item.images }).click()
      await next(page)
    } else {
      await page.getByRole("combobox", { name: `Question ${item.number}`, exact: true }).click()
      await page.getByRole("option", { name: item.answer, exact: true }).click()
    }
  }
  if (part > 3) await next(page)
}

test("landing page links to each section", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Choose a test" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Reading tests" })).toHaveAttribute("href", "/reading/")
  await page.getByRole("link", { name: "Listening tests" }).click()
  await expect(page).toHaveURL("/listening/")
  await expect(page.getByRole("heading", { name: "Listening Tests" })).toBeVisible()
  await expect(row(page, "6")).toContainText("Part 6: Listening for Viewpoints")
})

test("full test: audio, questions and timers through all six parts, then saved results", async ({ page }) => {
  await page.goto("/listening")
  await row(page, "full").getByRole("link", { name: "Start" }).click()
  for (const part of [1, 2, 3, 4, 5, 6]) {
    await expect(page.getByRole("heading", { name: new RegExp(`Listening Part ${part}`) })).toBeVisible()
    await answerPart(page, part)
  }
  await expect(page).toHaveURL("/listening/demo-1/results/full/")
  await expect(page.getByTestId("score")).toHaveText("Score: 38 / 38")
  await expect(page.getByTestId("level")).toHaveText("CELPIP level 12 (estimate)")
  await expect(page.getByRole("img", { name: "Option D" })).toHaveCount(2)
  await page.reload()
  await expect(page.getByTestId("score")).toHaveText("Score: 38 / 38")
})

test("Next is hidden while a clip plays and the answer timer starts after it", async ({ page }) => {
  await page.goto("/listening/demo-1/2")
  await expect(page.getByText(/You will hear a conversation only once/)).toBeVisible()
  await next(page)
  await expect(page.getByRole("button", { name: "Next" })).toBeHidden()
  await expect(page.getByRole("radiogroup", { name: "Question 1", exact: true })).toBeVisible()
  await expect(page.getByLabel("Time remaining")).toHaveText(/00:(30|29)/)
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible()
})

test("single part with a picture question: results, home row, clear", async ({ page }) => {
  await page.goto("/listening")
  await row(page, "1").getByRole("link", { name: "Start" }).click()
  await expect(page).toHaveURL("/listening/demo-1/1/")
  await answerPart(page, 1)
  await expect(page).toHaveURL("/listening/demo-1/results/1/")
  await expect(page.getByTestId("score")).toHaveText("Score: 8 / 8")
  await expect(page.getByTestId("level")).toHaveText("CELPIP level 12 (estimate from Part 1 only)")
  await page.getByRole("link", { name: "Back to tests" }).click()
  await expect(row(page, "1").getByRole("link", { name: "Results 8/8" })).toBeVisible()
  await row(page, "1").getByRole("button", { name: "Clear" }).click()
  await expect(row(page, "1").getByRole("link", { name: /Results/ })).toHaveCount(0)
})

test("start again begins a fresh run", async ({ page }) => {
  await page.goto("/listening/demo-1/4")
  await answerPart(page, 4)
  await expect(page.getByTestId("score")).toHaveText("Score: 5 / 5")
  await page.getByRole("link", { name: "Start again" }).click()
  await expect(page).toHaveURL("/listening/demo-1/4/")
  await next(page)
  await expect(page.getByRole("combobox", { name: "Question 1", exact: true })).toHaveText("(1)", { useInnerText: true })
  await next(page)
  await expect(page.getByTestId("score")).toHaveText("Score: 0 / 5")
})

test("listening pages fit the viewport without horizontal scroll", async ({ page }) => {
  for (const url of ["/listening", "/listening/demo-1", "/listening/demo-1/5"]) {
    await page.goto(url)
    await page.waitForLoadState("networkidle")
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, url).toBeLessThanOrEqual(0)
  }
})

test("mobile stacks the player above the questions", async ({ page, isMobile }) => {
  test.skip(!isMobile)
  await page.goto("/listening/demo-1/4")
  await next(page)
  const status = await page.getByText("Audio finished.").boundingBox()
  const questions = await page.getByRole("combobox", { name: "Question 1", exact: true }).boundingBox()
  expect(status!.y).toBeLessThan(questions!.y)
})

test("unknown listening test, part or run shows 404", async ({ page }) => {
  for (const url of ["/listening/nope", "/listening/demo-1/7", "/listening/demo-1/results/x"]) {
    await page.goto(url)
    await expect(page.getByText("This page could not be found."), url).toBeVisible()
  }
})
