import { describe, expect, it } from "vitest"

import { clearResult, saveResult } from "../results-store"
import { loadRecordings, saveRecordings } from "./recordings"

describe("recordings", () => {
  it("are saved per test and run", async () => {
    await saveRecordings("t1", "full", { 1: new Blob(["a"]), 2: new Blob(["b"]) })
    await saveRecordings("t1", "3", { 3: new Blob(["c"]) })
    expect(Object.keys(await loadRecordings("t1", "full"))).toEqual(["1", "2"])
    expect(Object.keys(await loadRecordings("t1", "3"))).toEqual(["3"])
    expect(await loadRecordings("t2", "full")).toEqual({})
  })

  it("are cleared with the speaking result", async () => {
    await saveRecordings("t1", "1", { 1: new Blob(["a"]) })
    saveResult("speaking", "t1", "1", { answers: {} })
    clearResult("speaking", "t1", "1")
    expect(localStorage.getItem("celpip:speaking:t1:1")).toBeNull()
    await expect.poll(() => loadRecordings("t1", "1")).toEqual({})
  })
})
