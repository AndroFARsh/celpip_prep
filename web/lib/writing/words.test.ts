import { describe, expect, it } from "vitest"

import { countWords, inRange } from "./words"

describe("countWords", () => {
  it.each([
    ["", 0],
    ["   \n ", 0],
    ["Hi Sarah,", 2],
    ["  Dear  Sir,\n\nI am writing.\tThanks ", 6],
    ["well-being, it's 150-200 words.", 4],
  ])("%j has %i words", (text, words) => {
    expect(countWords(text)).toBe(words)
  })
})

describe("inRange", () => {
  it("accepts 150 to 200 words", () => {
    expect([149, 150, 200, 201].map(inRange)).toEqual([false, true, true, false])
  })
})
