import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Activity } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { loadRecordings } from "@/lib/speaking/recordings"
import { loadSpeakingTest } from "@/lib/speaking/tests"
import { SpeakingTestRunner } from "./test-runner"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

class FakeRecorder {
  static started = 0
  mimeType = "audio/webm"
  ondataavailable?: (e: { data: Blob }) => void
  onstop?: () => void
  start() {
    FakeRecorder.started++
  }
  stop() {
    this.ondataavailable?.({ data: new Blob(["voice"]) })
    this.onstop?.()
  }
}
vi.stubGlobal("MediaRecorder", FakeRecorder)

const track = { stop: vi.fn() }
const getUserMedia = vi.fn(async () => ({ getTracks: () => [track] }))
Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true })

const test = await loadSpeakingTest("demo-1")
const saved = (run: string) => JSON.parse(localStorage.getItem(`celpip:speaking:demo-1:${run}`)!)
const timer = () => screen.getByLabelText("Time remaining")

async function start() {
  fireEvent.click(screen.getByRole("button", { name: "Start" }))
  await screen.findByRole("heading", { level: 1 })
}

describe("SpeakingTestRunner", () => {
  afterEach(() => vi.useRealTimers())
  beforeEach(() => {
    push.mockClear()
    track.stop.mockClear()
    FakeRecorder.started = 0
  })

  it("asks for the microphone on Start and explains when it is blocked", async () => {
    getUserMedia.mockRejectedValueOnce(new Error("denied"))
    render(<SpeakingTestRunner test={test} run="full" />)
    fireEvent.click(screen.getByRole("button", { name: "Start" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Microphone access is blocked")
    await start()
    expect(screen.getByRole("heading", { name: "Speaking Task 1: Giving Advice" })).toBeInTheDocument()
    expect(timer()).toHaveTextContent("Preparation time: 00:30")
  })

  it("full test: Next steps through preparation and recording of all 8 tasks, then saves", async () => {
    const user = userEvent.setup()
    render(<SpeakingTestRunner test={test} run="full" />)
    await start()
    const next = () => user.click(screen.getByRole("button", { name: "Next" }))
    for (const part of [1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(screen.getByRole("heading", { name: new RegExp(`Speaking Task ${part}:`) })).toBeInTheDocument()
      if (part === 5) {
        expect(timer()).toHaveTextContent("Choose an option: 01:00")
        await user.click(screen.getByRole("radio", { name: "Option B: Cargo Bike" }))
        await next()
        expect(screen.getByText("Your friend suggests the E-Scooter. Explain why the Cargo Bike is still better.")).toBeInTheDocument()
      }
      expect(timer()).toHaveTextContent("Preparation time")
      await next()
      expect(screen.getByText("Recording", { selector: "[data-slot=badge]" })).toBeInTheDocument()
      await next()
    }
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/speaking/demo-1/results/full"))
    expect(saved("full")).toEqual({ answers: { "p5-option": "B" } })
    expect(Object.keys(await loadRecordings("demo-1", "full"))).toEqual(["1", "2", "3", "4", "5", "6", "7", "8"])
    expect(FakeRecorder.started).toBe(8)
    expect(track.stop).toHaveBeenCalled()
  })

  it("moves on by itself when preparation and recording time run out", async () => {
    vi.useFakeTimers({ toFake: ["setInterval"] })
    render(<SpeakingTestRunner test={test} run="1" />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Start" })))
    expect(timer()).toHaveTextContent("Preparation time: 00:30")
    act(() => vi.advanceTimersByTime(30_000))
    expect(timer()).toHaveTextContent("Recording: 01:30")
    await act(() => vi.advanceTimersByTimeAsync(90_000))
    vi.useRealTimers()
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/speaking/demo-1/results/1"))
    expect(Object.keys(await loadRecordings("demo-1", "1"))).toEqual(["1"])
  })

  it("Task 5 picks Option A when the choosing time runs out", async () => {
    vi.useFakeTimers({ toFake: ["setInterval"] })
    render(<SpeakingTestRunner test={test} run="5" />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Start" })))
    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByText(/Explain why the Road Bike is still better/)).toBeInTheDocument()
    expect(timer()).toHaveTextContent("Preparation time: 01:00")
    vi.useRealTimers()
  })

  it("Task 6 shows both situations to choose from", async () => {
    render(<SpeakingTestRunner test={test} run="6" />)
    await start()
    expect(screen.getByText("EITHER: Call your friend.")).toBeInTheDocument()
    expect(screen.getByText("OR: Call the store.")).toBeInTheDocument()
    expect(timer()).toHaveTextContent("Preparation time: 01:00")
  })

  it("releases the microphone and starts fresh when the page is left", async () => {
    const view = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <SpeakingTestRunner test={test} run="full" />
      </Activity>
    )
    const { rerender } = render(view("visible"))
    await start()
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(FakeRecorder.started).toBe(1)
    rerender(view("hidden"))
    expect(track.stop).toHaveBeenCalled()
    rerender(view("visible"))
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })
})
