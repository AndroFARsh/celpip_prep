import { afterEach, describe, expect, it, vi } from "vitest"

import { createYouTubePlayer } from "./player"

type Options = { videoId: string; events: { onReady: () => void; onStateChange: (e: { data: number }) => void } }

/** Stands in for the YouTube IFrame API and records what the app asks of it. */
function mockYouTube() {
  const yt = {
    options: undefined as Options | undefined,
    time: 0,
    loadVideoById: vi.fn(),
    unloadModule: vi.fn(),
    getCurrentTime: () => yt.time,
    destroy: vi.fn(),
  }
  window.YT = {
    Player: class {
      constructor(_el: HTMLElement, options: Options) {
        yt.options = options
        setTimeout(options.events.onReady)
        return yt as never
      }
    } as never,
  }
  return yt
}

afterEach(() => vi.useRealTimers())

describe("createYouTubePlayer", () => {
  it("loads the API script once and plays the requested clip", async () => {
    const yt = mockYouTube()
    const ready = createYouTubePlayer(document.createElement("div"), "abcdefghijk")
    expect(document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')).toHaveLength(1)
    window.onYouTubeIframeAPIReady!()
    const player = await ready
    expect(yt.options!.videoId).toBe("abcdefghijk")

    let ended = false
    const playing = player.play({ start: 10, end: 20 }, () => {}).then(() => (ended = true))
    expect(yt.loadVideoById).toHaveBeenCalledWith({ videoId: "abcdefghijk", startSeconds: 10, endSeconds: 20 })
    await Promise.resolve()
    expect(ended).toBe(false)

    yt.options!.events.onStateChange({ data: 1 }) // playing
    await Promise.resolve()
    expect(ended).toBe(false)
    expect(yt.unloadModule).toHaveBeenCalledWith("captions")
    yt.options!.events.onStateChange({ data: 0 }) // ended
    await playing
    expect(ended).toBe(true)

    player.destroy()
    expect(yt.destroy).toHaveBeenCalled()
  })

  it("reports progress through the clip", async () => {
    const yt = mockYouTube()
    const player = await createYouTubePlayer(document.createElement("div"), "abcdefghijk")
    vi.useFakeTimers()
    const progress: number[] = []
    const playing = player.play({ start: 100, end: 110 }, (f) => progress.push(f))
    yt.time = 105
    vi.advanceTimersByTime(250)
    expect(progress.at(-1)).toBe(0.5)
    yt.options!.events.onStateChange({ data: 1 })
    yt.options!.events.onStateChange({ data: 0 })
    await playing
    expect(progress.at(-1)).toBe(1)
  })

  it("ignores the previous clip's ENDED replayed while the next clip loads", async () => {
    const yt = mockYouTube()
    const player = await createYouTubePlayer(document.createElement("div"), "abcdefghijk")
    const state = (data: number) => yt.options!.events.onStateChange({ data })
    const first = player.play({ start: 0, end: 5 }, () => {})
    state(1)
    state(0)
    await first
    let ended = false
    const second = player.play({ start: 5, end: 9 }, () => {}).then(() => (ended = true))
    state(0) // stale, before the new clip plays
    await Promise.resolve()
    expect(ended).toBe(false)
    state(1)
    state(0)
    await second
    expect(ended).toBe(true)
  })
})
