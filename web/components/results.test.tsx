import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { saveResult } from "@/lib/results-store"
import { itemsForPart as listeningItems } from "@/lib/listening/scoring"
import { loadListeningTest } from "@/lib/listening/tests"
import { allItems, itemsForPart, type Item } from "@/lib/scoring"
import { loadTest } from "@/lib/tests"
import { Results } from "./results"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const test = await loadTest("demo-1")
const view = (run: string, items: Item[]) => (
  <Results section="reading" testId={test.id} title={test.title} run={run} items={items} />
)

describe("Results", () => {
  it("shows an empty state with a start link when nothing is saved", () => {
    render(view("3", itemsForPart(test, 3)))
    expect(screen.getByText("No saved result.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start" })).toHaveAttribute("href", "/reading/demo-1/3")
  })

  it("shows details of a saved full test", () => {
    const items = allItems(test)
    const answers = Object.fromEntries(items.map((i) => [i.key, i.answer]))
    const first = items[0]
    const wrong = first.options.find((o) => o !== first.answer)!
    saveResult("reading", test.id, "full", { answers: { ...answers, [first.key]: wrong }, score: 37, total: 38 })
    render(view("full", items))
    expect(screen.getByTestId("score")).toHaveTextContent("Score: 37 / 38")
    expect(screen.getAllByText("Correct")).toHaveLength(37)
    const row = screen.getByRole("cell", { name: first.label }).closest("tr")!
    expect(row).toHaveTextContent(wrong)
    expect(row).toHaveTextContent(first.answer)
    expect(screen.getByText("Part 1: 10 / 11")).toBeInTheDocument()
    expect(screen.getByTestId("level")).toHaveTextContent("CELPIP level 11 (estimate)")
    expect(screen.getByRole("link", { name: "Start again" })).toHaveAttribute("href", "/reading/demo-1")
  })

  it("shows only the selected part for a single part result", () => {
    saveResult("reading", test.id, "2", { answers: {}, score: 0, total: 8 })
    render(view("2", itemsForPart(test, 2)))
    expect(screen.getByTestId("score")).toHaveTextContent("Score: 0 / 8")
    expect(screen.getAllByText("Wrong")).toHaveLength(itemsForPart(test, 2).length)
    expect(screen.queryByText(/Part 1:/)).not.toBeInTheDocument()
    expect(screen.getByTestId("level")).toHaveTextContent("CELPIP level 0 (estimate from Part 2 only)")
  })

  it("clear result removes it and returns home", async () => {
    saveResult("reading", test.id, "4", { answers: {}, score: 0, total: 10 })
    render(view("4", itemsForPart(test, 4)))
    await userEvent.click(screen.getByRole("button", { name: "Clear result" }))
    expect(localStorage.getItem("celpip:demo-1:4")).toBeNull()
    expect(push).toHaveBeenCalledWith("/reading")
  })

  it("listening: shows the level and picture answers as images", async () => {
    const listening = await loadListeningTest("demo-1")
    const items = listeningItems(listening, 1)
    const q8 = items[7]
    saveResult("listening", "demo-1", "1", { answers: { [q8.key]: "A" }, score: 0, total: 8 })
    render(<Results section="listening" testId="demo-1" title={listening.title} run="1" items={items} />)
    expect(screen.getByTestId("level")).toHaveTextContent("CELPIP level 0 (estimate from Part 1 only)")
    const row = screen.getByRole("cell", { name: q8.label }).closest("tr")!
    expect(within(row).getByRole("img", { name: "Option A" })).toHaveAttribute("src", q8.images![0])
    expect(within(row).getByRole("img", { name: "Option D" })).toHaveAttribute("src", q8.images![3])
    expect(screen.getByRole("link", { name: "Start again" })).toHaveAttribute("href", "/listening/demo-1/1")
  })
})
