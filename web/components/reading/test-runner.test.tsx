import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { allItems, itemsForPart } from "@/lib/scoring"
import { loadTest } from "@/lib/tests"
import { TestRunner } from "./test-runner"

const test = await loadTest("demo-1")

async function answerPart(user: ReturnType<typeof userEvent.setup>, part: number, pick: "right" | "wrong") {
  for (const item of itemsForPart(test, part)) {
    await user.click(screen.getByRole("combobox", { name: `Question ${item.number}` }))
    const choice = pick === "right" ? item.answer : item.options.find((o) => o !== item.answer)!
    await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: choice }))
  }
}

describe("TestRunner", () => {
  it("renders every question of each part and scores a perfect run", async () => {
    const user = userEvent.setup()
    render(<TestRunner test={test} />)
    for (const part of [1, 2, 3, 4]) {
      expect(screen.getByRole("heading", { name: new RegExp(`Reading Part ${part}`) })).toBeInTheDocument()
      expect(screen.getAllByRole("combobox")).toHaveLength(itemsForPart(test, part).length)
      await answerPart(user, part, "right")
      await user.click(screen.getByRole("button", { name: part === 4 ? "Finish" : "Next" }))
    }
    expect(screen.getByTestId("score")).toHaveTextContent("Score: 38 / 38")
    expect(screen.getAllByText("Correct")).toHaveLength(38)
  }, 60000)

  it("shows the user's answer and the correct answer on results", async () => {
    const user = userEvent.setup()
    render(<TestRunner test={test} />)
    await answerPart(user, 1, "wrong")
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole("button", { name: /Next|Finish/ }))
    expect(screen.getByTestId("score")).toHaveTextContent("Score: 0 / 38")
    const first = allItems(test)[0]
    const row = screen.getByRole("cell", { name: first.label }).closest("tr")!
    expect(row).toHaveTextContent(first.options.find((o) => o !== first.answer)!)
    expect(row).toHaveTextContent(first.answer)
    expect(screen.getAllByText("Wrong")).toHaveLength(38)
  }, 30000)

  it("keeps answers across parts in the final score", async () => {
    const user = userEvent.setup()
    render(<TestRunner test={test} />)
    await user.click(screen.getByRole("button", { name: "Next" }))
    await user.click(screen.getByRole("button", { name: "Next" }))
    await answerPart(user, 3, "right")
    await user.click(screen.getByRole("button", { name: "Next" }))
    await user.click(screen.getByRole("button", { name: "Finish" }))
    expect(screen.getByTestId("score")).toHaveTextContent("Score: 9 / 38")
    expect(screen.getByText("Part 3: 9 / 9")).toBeInTheDocument()
  }, 30000)

  it("auto-advances when a part's time runs out", () => {
    vi.useFakeTimers()
    render(<TestRunner test={test} />)
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("11:00")
    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("10:00")
    act(() => vi.advanceTimersByTime(600_000))
    expect(screen.getByRole("heading", { name: /Reading Part 2/ })).toBeInTheDocument()
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("9:00")
    for (const sec of [540, 600, 780]) act(() => vi.advanceTimersByTime(sec * 1000))
    expect(screen.getByTestId("score")).toBeInTheDocument()
    vi.useRealTimers()
  })
})
