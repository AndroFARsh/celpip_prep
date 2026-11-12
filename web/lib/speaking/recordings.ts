import { del, get, set } from "idb-keyval"

import type { Run } from "../runs"

/** Recorded answers of one run, by task number. Audio is too large for localStorage, so it lives in IndexedDB. */
export type Recordings = Record<number, Blob>

const key = (testId: string, run: Run) => `celpip:speaking:${testId}:${run}`

export const saveRecordings = (testId: string, run: Run, recordings: Recordings) => set(key(testId, run), recordings)
export const loadRecordings = async (testId: string, run: Run) => (await get<Recordings>(key(testId, run))) ?? {}
export const clearRecordings = (testId: string, run: Run) => del(key(testId, run))

/** Start recording `stream`; the returned function stops it and resolves to the audio. */
export function startRecording(stream: MediaStream): () => Promise<Blob> {
  const recorder = new MediaRecorder(stream, { audioBitsPerSecond: 32000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => chunks.push(e.data)
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }))
  })
  recorder.start()
  return () => {
    recorder.stop()
    return done
  }
}
