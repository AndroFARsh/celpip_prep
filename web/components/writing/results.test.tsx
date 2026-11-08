import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { saveResult } from "@/lib/results-store"
import { loadWritingTest } from "@/lib/writing/tests"
import { WritingResults } from "./results"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const test = await loadWritingTest("demo-1")
const words = (n: number) => Array.from({ length: n }, () => "word").join(" ")

describe("WritingResults", () => {
  it("shows an empty state with a start link when nothing is saved", () => {
    render(<WritingResults test={test} run="1" />)
    expect(screen.getByText("No saved result.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start" })).toHaveAttribute("href", "/writing/demo-1/1")
  })

  it("full test: shows each response with its word count next to the samples", () => {
    saveResult("writing", "demo-1", "full", { answers: { p1: words(160), p2: "Too short.", "p2-option": "A" } })
    render(<WritingResults test={test} run="full" />)
    expect(screen.getByText(/Full test/)).toBeInTheDocument()
    expect(screen.queryByText(/CELPIP level/)).not.toBeInTheDocument()

    const task1 = screen.getByTestId("task-1")
    expect(within(task1).getByText("160 words")).toHaveAttribute("data-variant", "secondary")
    expect(within(task1).getByText("Sample answer")).toBeInTheDocument()
    expect(within(task1).getByText(test.parts[0].points[0])).toBeInTheDocument()

    const task2 = screen.getByTestId("task-2")
    expect(within(task2).getByTestId("choice")).toHaveTextContent("You chose Option A.")
    expect(within(task2).getByText("Too short.")).toBeInTheDocument()
    expect(within(task2).getByText("2 words")).toHaveAttribute("data-variant", "destructive")
    expect(within(task2).getByText("Sample answer: Option A")).toBeInTheDocument()
    expect(within(task2).getByText("Sample answer: Option B")).toBeInTheDocument()
    expect(within(task2).getByText(test.parts[1].samples[1])).toBeInTheDocument()
  })

  it("single task shows only that task, and an empty response as a dash", () => {
    saveResult("writing", "demo-1", "2", { answers: {} })
    render(<WritingResults test={test} run="2" />)
    expect(screen.queryByTestId("task-1")).not.toBeInTheDocument()
    expect(screen.getByTestId("choice")).toHaveTextContent("No option chosen.")
    expect(screen.getByText("0 words")).toBeInTheDocument()
    expect(screen.getByText("-")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start again" })).toHaveAttribute("href", "/writing/demo-1/2")
  })

  it("clear result removes it and returns to the writing tests", async () => {
    saveResult("writing", "demo-1", "1", { answers: { p1: "Hi" } })
    render(<WritingResults test={test} run="1" />)
    await userEvent.click(screen.getByRole("button", { name: "Clear result" }))
    expect(localStorage.getItem("celpip:writing:demo-1:1")).toBeNull()
    expect(push).toHaveBeenCalledWith("/writing")
  })
})
