import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { saveResult } from "@/lib/results-store"
import { TestCard } from "./test-card"

describe("TestCard", () => {
  it("offers a start link for the full test and each part", () => {
    render(<TestCard section="reading" id="demo-1" title="Practice Test 1" />)
    const hrefs = screen.getAllByRole("link", { name: "Start" }).map((a) => a.getAttribute("href"))
    expect(hrefs).toEqual(["/reading/demo-1", "/reading/demo-1/1", "/reading/demo-1/2", "/reading/demo-1/3", "/reading/demo-1/4"])
    expect(screen.queryByRole("link", { name: /Results/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Source" })).not.toBeInTheDocument()
  })

  it("links to the source when there is one", () => {
    render(<TestCard section="reading" id="demo-1" title="Practice Test 1" source="https://www.youtube.com/watch?v=abc" />)
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=abc")
  })

  it("shows results and clear for a run taken before", async () => {
    saveResult("reading", "demo-1", "2", { answers: {}, score: 5, total: 8 })
    render(<TestCard section="reading" id="demo-1" title="Practice Test 1" />)
    const row = screen.getByTestId("run-2")
    expect(within(row).getByRole("link", { name: "Results 5/8" })).toHaveAttribute("href", "/reading/demo-1/results/2")
    expect(within(screen.getByTestId("run-full")).queryByRole("link", { name: /Results/ })).not.toBeInTheDocument()
    await userEvent.click(within(row).getByRole("button", { name: "Clear" }))
    expect(within(row).queryByRole("link", { name: /Results/ })).not.toBeInTheDocument()
    expect(localStorage.getItem("celpip:demo-1:2")).toBeNull()
  })

  it("updates when a result is saved elsewhere", () => {
    render(<TestCard section="reading" id="demo-1" title="Practice Test 1" />)
    act(() => saveResult("reading", "demo-1", "full", { answers: {}, score: 30, total: 38 }))
    expect(screen.getByRole("link", { name: "Results 30/38" })).toBeInTheDocument()
  })
})
