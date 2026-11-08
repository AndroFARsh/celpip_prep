import type { Segment } from "./schema"

/** Plays clips of one video. `play` resolves when the clip has ended. */
export type Player = {
  play: (segment: Segment, onProgress: (fraction: number) => void) => Promise<void>
  destroy: () => void
}

// The parts of the YouTube IFrame Player API used here.
type YTPlayer = {
  loadVideoById: (o: { videoId: string; startSeconds: number; endSeconds: number }) => void
  getCurrentTime: () => number
  /** Undocumented; unloading the "captions" module turns subtitles off. */
  unloadModule: (name: string) => void
  destroy: () => void
}
type YTApi = { Player: new (el: HTMLElement, options: object) => YTPlayer }

declare global {
  interface Window {
    YT?: YTApi
    onYouTubeIframeAPIReady?: () => void
  }
}

const ENDED = 0
const PLAYING = 1
let api: Promise<void> | undefined

function loadApi() {
  api ??= new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = resolve
    const script = document.createElement("script")
    script.src = "https://www.youtube.com/iframe_api"
    document.head.append(script)
  })
  return api
}

/** Replaces `el` with a YouTube player without controls. */
export async function createYouTubePlayer(el: HTMLElement, videoId: string): Promise<Player> {
  await loadApi()
  const YT = window.YT!
  let onEnded: (() => void) | undefined
  let timer: ReturnType<typeof setInterval> | undefined
  // Loading the next clip can replay the previous clip's ENDED, so only an ENDED after PLAYING counts.
  let started = false

  return new Promise((resolve) => {
    const yt = new YT.Player(el, {
      videoId,
      width: "100%",
      height: "100%",
      playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, iv_load_policy: 3, cc_load_policy: 0 },
      events: {
        onReady: () => resolve(player),
        onStateChange: (e: { data: number }) => {
          if (e.data === PLAYING) {
            started = true
            // No subtitles in a listening test. cc_load_policy alone does not override the viewer's
            // YouTube caption setting, and each loaded clip loads captions again.
            yt.unloadModule("captions")
          }
          if (e.data === ENDED && started) onEnded?.()
        },
      },
    })

    const player: Player = {
      play: ({ start, end }, onProgress) =>
        new Promise((done) => {
          started = false
          clearInterval(timer)
          timer = setInterval(
            () => onProgress(Math.min(Math.max((yt.getCurrentTime() - start) / (end - start), 0), 1)),
            250,
          )
          onEnded = () => {
            clearInterval(timer)
            onEnded = undefined
            onProgress(1)
            done()
          }
          yt.loadVideoById({ videoId, startSeconds: start, endSeconds: end })
        }),
      destroy: () => {
        clearInterval(timer)
        onEnded = undefined
        yt.destroy()
      },
    }
  })
}

/** Stand-in for tests (NEXT_PUBLIC_FAKE_AUDIO=1): every clip ends after a short delay. */
export function createFakePlayer(ms = 200): Player {
  return {
    play: (_, onProgress) =>
      new Promise((done) =>
        setTimeout(() => {
          onProgress(1)
          done()
        }, ms),
      ),
    destroy: () => {},
  }
}

export const createPlayer = (el: HTMLElement, videoId: string) =>
  process.env.NEXT_PUBLIC_FAKE_AUDIO === "1" ? Promise.resolve(createFakePlayer()) : createYouTubePlayer(el, videoId)
