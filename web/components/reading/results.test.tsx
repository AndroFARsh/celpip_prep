import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { saveResult } from "@/lib/results-store"
import { allItems, itemsForPart } from "@/lib/scoring"
import { loadTest } from "@/lib/tests"
import { Results } from "./results"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const test = await loadTest("demo-1")

describe("Results", () => {
  it("shows an empty state with a start link when nothing is saved", () => {
    render(<Results test={test} run="3" />)
    expect(screen.getByText("No saved result.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start" })).toHaveAttribute("href", "/reading/demo-1/3")
  })

  it("shows details of a saved full test", () => {
    const items = allItems(test)
    const answers = Object.fromEntries(items.map((i) => [i.key, i.answer]))
    const first = items[0]
    const wrong = first.options.find((o) => o !== first.answer)!
    saveResult(test.id, "full", { answers: { ...answers, [first.key]: wrong }, score: 37, total: 38 })
    render(<Results test={test} run="full" />)
    expect(screen.getByTestId("score")).toHaveTextContent("Score: 37 / 38")
    expect(screen.getAllByText("Correct")).toHaveLength(37)
    const row = screen.getByRole("cell", { name: first.label }).closest("tr")!
    expect(row).toHaveTextContent(wrong)
    expect(row).toHaveTextContent(first.answer)
    expect(screen.getByText("Part 1: 10 / 11")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start again" })).toHaveAttribute("href", "/reading/demo-1")
  })

  it("shows only the selected part for a single part result", () => {
    saveResult(test.id, "2", { answers: {}, score: 0, total: 8 })
    render(<Results test={test} run="2" />)
    expect(screen.getByTestId("score")).toHaveTextContent("Score: 0 / 8")
    expect(screen.getAllByText("Wrong")).toHaveLength(itemsForPart(test, 2).length)
    expect(screen.queryByText(/Part 1:/)).not.toBeInTheDocument()
  })

  it("clear result removes it and returns home", async () => {
    saveResult(test.id, "4", { answers: {}, score: 0, total: 10 })
    render(<Results test={test} run="4" />)
    await userEvent.click(screen.getByRole("button", { name: "Clear result" }))
    expect(localStorage.getItem("celpip:demo-1:4")).toBeNull()
    expect(push).toHaveBeenCalledWith("/")
  })
})
