import { describe, expect, it } from "vitest"

import { celpipLevel } from "./celpip-level"

describe("celpipLevel", () => {
  it.each([
    [0, 0],
    [1, 1],
    [3, 1],
    [4, 2],
    [10, 3],
    [11, 4],
    [16, 4],
    [17, 5],
    [26, 6],
    [27, 7],
    [32, 8],
    [33, 9],
    [34, 9],
    [35, 10],
    [36, 10],
    [37, 11],
    [38, 12],
  ])("listening %i/38 is level %i", (score, level) => {
    expect(celpipLevel("listening", score, 38)).toBe(level)
  })

  it.each([
    [4, 1],
    [5, 2],
    [9, 3],
    [10, 4],
    [23, 6],
    [24, 7],
    [30, 8],
    [31, 9],
    [32, 9],
    [33, 10],
    [36, 10],
    [37, 11],
    [38, 12],
  ])("reading %i/38 is level %i", (score, level) => {
    expect(celpipLevel("reading", score, 38)).toBe(level)
  })

  it("scales a part score to 38 questions", () => {
    expect(celpipLevel("listening", 8, 8)).toBe(12)
    expect(celpipLevel("listening", 4, 8)).toBe(5) // 19/38
    expect(celpipLevel("reading", 0, 9)).toBe(0)
  })
})
