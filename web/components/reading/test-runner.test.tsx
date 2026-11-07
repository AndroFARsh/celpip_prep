import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Activity } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { itemsForPart } from "@/lib/scoring"
import { loadTest } from "@/lib/tests"
import { TestRunner } from "./test-runner"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const test = await loadTest("demo-1")
const saved = (run: string) => JSON.parse(localStorage.getItem(`celpip:demo-1:${run}`)!)

async function answerPart(user: ReturnType<typeof userEvent.setup>, part: number) {
  for (const item of itemsForPart(test, part)) {
    await user.click(screen.getByRole("combobox", { name: `Question ${item.number}` }))
    await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: item.answer }))
  }
}

const next = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Next" }))

describe("TestRunner", () => {
  beforeEach(() => push.mockClear())

  it("full test goes through every part, then saves and opens results", async () => {
    const user = userEvent.setup()
    render(<TestRunner test={test} run="full" />)
    for (const part of [1, 2, 3, 4]) {
      expect(screen.getByRole("heading", { name: new RegExp(`Reading Part ${part}`) })).toBeInTheDocument()
      expect(screen.getAllByRole("combobox")).toHaveLength(itemsForPart(test, part).length)
      expect(push).not.toHaveBeenCalled()
      await answerPart(user, part)
      await next(user)
    }
    expect(push).toHaveBeenCalledWith("/reading/demo-1/results/full")
    expect(saved("full")).toMatchObject({ score: 38, total: 38 })
  }, 60000)

  it("single part goes to its results after Next", async () => {
    const user = userEvent.setup()
    render(<TestRunner test={test} run="3" />)
    expect(screen.getByRole("heading", { name: /Reading Part 3/ })).toBeInTheDocument()
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("10:00")
    await answerPart(user, 3)
    await next(user)
    expect(push).toHaveBeenCalledWith("/reading/demo-1/results/3")
    expect(saved("3")).toMatchObject({ score: 9, total: 9 })
  }, 30000)

  it("keeps answers across parts in the saved score", async () => {
    const user = userEvent.setup()
    render(<TestRunner test={test} run="full" />)
    await next(user)
    await next(user)
    await answerPart(user, 3)
    await next(user)
    await next(user)
    expect(saved("full")).toMatchObject({ score: 9, total: 38 })
  }, 30000)

  it("auto-advances when time runs out and saves at the end", () => {
    vi.useFakeTimers()
    render(<TestRunner test={test} run="full" />)
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("11:00")
    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("10:00")
    act(() => vi.advanceTimersByTime(600_000))
    expect(screen.getByRole("heading", { name: /Reading Part 2/ })).toBeInTheDocument()
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("9:00")
    for (const sec of [540, 600, 780]) act(() => vi.advanceTimersByTime(sec * 1000))
    expect(push).toHaveBeenCalledWith("/reading/demo-1/results/full")
    expect(saved("full")).toMatchObject({ score: 0, total: 38 })
    vi.useRealTimers()
  })

  it("starts fresh when the page is hidden and shown again", async () => {
    const user = userEvent.setup()
    const view = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <TestRunner test={test} run="full" />
      </Activity>
    )
    const { rerender } = render(view("visible"))
    await answerPart(user, 1)
    await next(user)
    expect(screen.getByRole("heading", { name: /Reading Part 2/ })).toBeInTheDocument()
    rerender(view("hidden"))
    rerender(view("visible"))
    expect(screen.getByRole("heading", { name: /Reading Part 1/ })).toBeInTheDocument()
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("11:00")
    expect(screen.getByRole("combobox", { name: "Question 1" })).toHaveTextContent("Choose an answer")
  }, 30000)
})
