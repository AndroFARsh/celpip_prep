import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Activity } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { loadWritingTest } from "@/lib/writing/tests"
import { WritingTestRunner } from "./test-runner"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const test = await loadWritingTest("demo-1")
const saved = (run: string) => JSON.parse(localStorage.getItem(`celpip:writing:demo-1:${run}`)!)
const next = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Next" }))
const response = () => screen.getByRole("textbox", { name: "Your response" })

describe("WritingTestRunner", () => {
  beforeEach(() => push.mockClear())

  it("full test: shows both tasks, then saves the responses and opens results", async () => {
    const user = userEvent.setup()
    render(<WritingTestRunner test={test} run="full" />)
    expect(screen.getByRole("heading", { name: "Writing Task 1: Writing an Email" })).toBeInTheDocument()
    expect(screen.getByText(test.parts[0].situation)).toBeInTheDocument()
    for (const point of test.parts[0].points) expect(screen.getByText(point)).toBeInTheDocument()
    expect(response()).toHaveAttribute("spellcheck", "true")
    await user.click(response())
    await user.paste("Dear store, it broke.")
    await next(user)

    expect(screen.getByRole("heading", { name: "Writing Task 2: Responding to Survey Questions" })).toBeInTheDocument()
    expect(screen.getByText(test.parts[1].title)).toBeInTheDocument()
    expect(response()).toHaveValue("")
    await user.click(screen.getByRole("radio", { name: /Option B/ }))
    await user.click(response())
    await user.paste("I prefer weekends.")
    expect(push).not.toHaveBeenCalled()
    await next(user)

    expect(push).toHaveBeenCalledWith("/writing/demo-1/results/full")
    expect(saved("full")).toEqual({
      answers: { p1: "Dear store, it broke.", p2: "I prefer weekends.", "p2-option": "B" },
    })
  })

  it("counts words as you type", async () => {
    const user = userEvent.setup()
    render(<WritingTestRunner test={test} run="1" />)
    expect(screen.getByTestId("word-count")).toHaveTextContent("Word count: 0")
    await user.click(response())
    await user.paste("One two  three\nfour")
    expect(screen.getByTestId("word-count")).toHaveTextContent("Word count: 4")
  })

  it("single task goes to its results after Next", async () => {
    const user = userEvent.setup()
    render(<WritingTestRunner test={test} run="2" />)
    expect(screen.getByRole("heading", { name: /Writing Task 2/ })).toBeInTheDocument()
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("26:00")
    await next(user)
    expect(push).toHaveBeenCalledWith("/writing/demo-1/results/2")
    expect(saved("2")).toEqual({ answers: {} })
  })

  it("auto-advances when time runs out and saves at the end", () => {
    vi.useFakeTimers()
    render(<WritingTestRunner test={test} run="full" />)
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("27:00")
    act(() => vi.advanceTimersByTime(1620_000))
    expect(screen.getByRole("heading", { name: /Writing Task 2/ })).toBeInTheDocument()
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("26:00")
    act(() => vi.advanceTimersByTime(1560_000))
    expect(push).toHaveBeenCalledWith("/writing/demo-1/results/full")
    vi.useRealTimers()
  })

  it("starts fresh when the page is hidden and shown again", async () => {
    const user = userEvent.setup()
    const view = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <WritingTestRunner test={test} run="full" />
      </Activity>
    )
    const { rerender } = render(view("visible"))
    await user.click(response())
    await user.paste("Draft")
    await next(user)
    rerender(view("hidden"))
    rerender(view("visible"))
    expect(screen.getByRole("heading", { name: /Writing Task 1/ })).toBeInTheDocument()
    expect(response()).toHaveValue("")
  })
})
