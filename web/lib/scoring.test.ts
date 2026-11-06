import { describe, expect, it } from "vitest"

import { allItems, formatTime, itemsForPart, PARAGRAPH_OPTIONS, score, splitBlanks } from "./scoring"
import { loadTest } from "./tests"

describe("scoring", async () => {
  const test = await loadTest("demo-1")

  it("builds the real CELPIP question counts", () => {
    expect([1, 2, 3, 4].map((p) => itemsForPart(test, p).length)).toEqual([11, 8, 9, 10])
    expect(allItems(test)).toHaveLength(38)
  })

  it("numbers items within each part and keeps keys unique", () => {
    expect(itemsForPart(test, 2).map((i) => i.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    const keys = allItems(test).map((i) => i.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("orders part 1 questions before the reply and part 2 email before questions", () => {
    expect(itemsForPart(test, 1)[0].label).toBe(test.parts[0].questions[0].prompt)
    expect(itemsForPart(test, 1)[6].label).toBe("Blank 1")
    expect(itemsForPart(test, 2)[0].label).toBe("Blank 1")
  })

  it("maps part 3 letters to options, including not given", () => {
    const items = itemsForPart(test, 3)
    expect(items[0].answer).toBe("A")
    expect(items[2].answer).toBe(PARAGRAPH_OPTIONS[4])
  })

  it("scores answers", () => {
    const items = allItems(test)
    const all = Object.fromEntries(items.map((i) => [i.key, i.answer]))
    expect(score(items, all)).toBe(38)
    expect(score(items, {})).toBe(0)
    const wrong = { ...all, [items[0].key]: items[0].options.find((o) => o !== items[0].answer)! }
    expect(score(items, wrong)).toBe(37)
  })

  it("splits blank placeholders", () => {
    expect(splitBlanks("a {{1}} b {{2}}")).toEqual([{ text: "a " }, { blank: 0 }, { text: " b " }, { blank: 1 }, { text: "" }])
  })

  it("formats time", () => {
    expect(formatTime(660)).toBe("11:00")
    expect(formatTime(65)).toBe("1:05")
    expect(formatTime(0)).toBe("0:00")
  })
})
