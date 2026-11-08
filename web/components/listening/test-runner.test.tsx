import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Activity } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Segment } from "@/lib/listening/schema"
import { itemsForPart } from "@/lib/listening/scoring"
import { loadListeningTest } from "@/lib/listening/tests"
import type { Item } from "@/lib/scoring"
import { TestRunner } from "./test-runner"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

/** Clips end at once when `auto`, otherwise when the test calls `finish`. */
const audio = vi.hoisted(() => ({ auto: true, played: [] as Segment[], finish: () => {} }))
vi.mock("@/lib/listening/player", () => ({
  createPlayer: async () => ({
    play: (segment: Segment, onProgress: (f: number) => void) => {
      audio.played.push(segment)
      return new Promise<void>((done) => {
        audio.finish = () => {
          onProgress(1)
          done()
        }
        if (audio.auto) audio.finish()
      })
    },
    destroy: () => {},
  }),
}))

const test = await loadListeningTest("demo-1")
const saved = (run: string) => JSON.parse(localStorage.getItem(`celpip:listening:demo-1:${run}`)!)
type User = ReturnType<typeof userEvent.setup>

const next = (user: User) => user.click(screen.getByRole("button", { name: "Next" }))
const radioName = (item: Item) => (item.images ? new RegExp(`^${item.answer}\\.`) : item.answer)

async function answerPart(user: User, part: number) {
  await next(user) // intro
  for (const item of itemsForPart(test, part)) {
    if (part <= 3) {
      const group = await screen.findByRole("radiogroup", { name: `Question ${item.number}` })
      await user.click(within(group).getByRole("radio", { name: radioName(item) }))
      await next(user)
    } else {
      await user.click(await screen.findByRole("combobox", { name: `Question ${item.number}` }))
      await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: item.answer }))
    }
  }
  if (part > 3) await next(user)
}

describe("Listening TestRunner", () => {
  beforeEach(() => {
    push.mockClear()
    audio.auto = true
    audio.played = []
  })
  afterEach(() => vi.useRealTimers())

  it("full test goes through all six parts, then saves 38/38 and opens results", async () => {
    const user = userEvent.setup()
    render(<TestRunner test={test} run="full" />)
    for (const part of [1, 2, 3, 4, 5, 6]) {
      expect(await screen.findByRole("heading", { name: new RegExp(`Listening Part ${part}`) })).toBeInTheDocument()
      await answerPart(user, part)
    }
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/listening/demo-1/results/full"))
    expect(saved("full")).toMatchObject({ score: 38, total: 38 })
    // Every section and spoken question played once, in order.
    const [p1, p2, p3, p4, p5, p6] = test.parts
    const clips = [p1, p2, p3].flatMap((p) => p.sections.flatMap((s) => [s.audio, ...s.questions.map((q) => q.audio)]))
    expect(audio.played).toEqual([...clips, p4.sections[0].audio, p5.sections[0].audio, p6.sections[0].audio])
  }, 60000)

  it("hides Next while audio plays and starts the question timer after it", async () => {
    audio.auto = false
    const user = userEvent.setup()
    render(<TestRunner test={test} run="2" />)
    expect(screen.getByText(/You will hear a conversation only once/)).toBeInTheDocument()
    await next(user)
    await screen.findByText("Playing")
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument()
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument()

    act(() => audio.finish()) // conversation ends, question 1 is spoken
    expect(await screen.findByRole("radiogroup", { name: "Question 1" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Time remaining")).not.toBeInTheDocument()

    act(() => audio.finish())
    expect(await screen.findByRole("button", { name: "Next" })).toBeInTheDocument()
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("00:30")
    expect(screen.getByText("Audio finished.")).toBeInTheDocument()
  })

  it("moves to the next spoken question after 30 seconds", async () => {
    vi.useFakeTimers()
    render(<TestRunner test={test} run="2" />)
    await act(async () => screen.getByRole("button", { name: "Next" }).click())
    await act(async () => {})
    expect(screen.getByRole("radiogroup", { name: "Question 1" })).toBeInTheDocument()
    await act(async () => vi.advanceTimersByTime(30_000))
    expect(screen.getByRole("radiogroup", { name: "Question 2" })).toBeInTheDocument()
    for (let i = 0; i < 4; i++) await act(async () => vi.advanceTimersByTime(30_000))
    expect(push).toHaveBeenCalledWith("/listening/demo-1/results/2")
    expect(saved("2")).toMatchObject({ score: 0, total: 5 })
  })

  it("parts 4-6 show all questions with the part timer, and time out to results", async () => {
    vi.useFakeTimers()
    render(<TestRunner test={test} run="5" />)
    await act(async () => screen.getByRole("button", { name: "Next" }).click())
    await act(async () => {})
    expect(screen.getAllByRole("combobox")).toHaveLength(8)
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("03:00")
    await act(async () => vi.advanceTimersByTime(180_000))
    expect(push).toHaveBeenCalledWith("/listening/demo-1/results/5")
    expect(saved("5")).toMatchObject({ score: 0, total: 8 })
  })

  it("starts fresh when the page is hidden and shown again", async () => {
    const user = userEvent.setup()
    const view = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <TestRunner test={test} run="full" />
      </Activity>
    )
    const { rerender } = render(view("visible"))
    await next(user)
    await screen.findByRole("radiogroup", { name: "Question 1" })
    rerender(view("hidden"))
    rerender(view("visible"))
    expect(screen.getByRole("heading", { name: /Listening Part 1/ })).toBeInTheDocument()
    expect(screen.getByText(/You will hear a conversation in 3 sections/)).toBeInTheDocument()
  })
})
