import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { saveResult } from "@/lib/results-store"
import { loadRecordings, saveRecordings } from "@/lib/speaking/recordings"
import { loadSpeakingTest } from "@/lib/speaking/tests"
import { SpeakingResults } from "./results"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
URL.createObjectURL = vi.fn(() => "blob:recording")
URL.revokeObjectURL = vi.fn()

const test = await loadSpeakingTest("demo-1")

describe("SpeakingResults", () => {
  it("shows an empty state with a start link when nothing is saved", () => {
    render(<SpeakingResults test={test} run="2" />)
    expect(screen.getByText("No saved result.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start" })).toHaveAttribute("href", "/speaking/demo-1/2")
  })

  it("full test: plays each recording next to the task and its sample", async () => {
    await saveRecordings("demo-1", "full", { 1: new Blob(["a"]), 5: new Blob(["b"]) })
    saveResult("speaking", "demo-1", "full", { answers: { "p5-option": "A" } })
    render(<SpeakingResults test={test} run="full" />)
    expect(screen.getAllByTestId(/^task-/)).toHaveLength(8)

    const task1 = screen.getByTestId("task-1")
    expect(await within(task1).findByLabelText("Your answer to Task 1")).toHaveAttribute("src", "blob:recording")
    expect(within(task1).getByText("Sample for task 1.")).toBeInTheDocument()
    expect(within(screen.getByTestId("task-2")).getByText("No recording.")).toBeInTheDocument()

    const task5 = screen.getByTestId("task-5")
    expect(within(task5).getByTestId("choice")).toHaveTextContent("You chose Option A (Road Bike).")
    expect(within(task5).getByText(/Explain why the Road Bike is still better/)).toBeInTheDocument()
    expect(within(task5).getByText("Sample answer (keeps Cargo Bike)")).toBeInTheDocument()

    const task6 = screen.getByTestId("task-6")
    expect(within(task6).getByText("Store sample.")).toBeInTheDocument()
    expect(within(task6).getByText("Sample answer: OR")).toBeInTheDocument()
    expect(within(screen.getByTestId("task-3")).getByRole("img")).toHaveAttribute("src", test.parts[2].image)
  })

  it("clear result removes the recordings and returns to the speaking tests", async () => {
    await saveRecordings("demo-1", "1", { 1: new Blob(["a"]) })
    saveResult("speaking", "demo-1", "1", { answers: {} })
    render(<SpeakingResults test={test} run="1" />)
    expect(screen.queryByTestId("task-2")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Clear result" }))
    expect(push).toHaveBeenCalledWith("/speaking")
    await expect.poll(() => loadRecordings("demo-1", "1")).toEqual({})
  })
})
