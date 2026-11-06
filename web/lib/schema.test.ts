import { describe, expect, it } from "vitest"

import { part1Schema, part2Schema, part3Schema, part4Schema } from "./schema"
import { loadTest } from "./tests"

const valid = async () => (await loadTest("demo-1")).parts

describe("schemas", () => {
  it("accept the demo test", async () => {
    const [p1, p2, p3, p4] = await valid()
    expect(part1Schema.safeParse(p1).success).toBe(true)
    expect(part2Schema.safeParse(p2).success).toBe(true)
    expect(part3Schema.safeParse(p3).success).toBe(true)
    expect(part4Schema.safeParse(p4).success).toBe(true)
  })

  it("reject a wrong number of questions", async () => {
    const [p1] = await valid()
    expect(part1Schema.safeParse({ ...p1, questions: p1.questions.slice(1) }).success).toBe(false)
  })

  it("reject an answer index out of range", async () => {
    const [p1] = await valid()
    const questions = [{ ...p1.questions[0], answer: 9 }, ...p1.questions.slice(1)]
    expect(part1Schema.safeParse({ ...p1, questions }).success).toBe(false)
  })

  it("reject placeholders that do not match blanks", async () => {
    const [, , , p4] = await valid()
    const comment = { ...p4.comment, text: p4.comment.text.replace("{{5}}", "") }
    expect(part4Schema.safeParse({ ...p4, comment }).success).toBe(false)
  })

  it("reject an invalid paragraph letter", async () => {
    const [, , p3] = await valid()
    const statements = [{ text: "x", answer: "F" }, ...p3.statements.slice(1)]
    expect(part3Schema.safeParse({ ...p3, statements }).success).toBe(false)
  })

  it("reject a missing time limit", async () => {
    const [, p2] = await valid()
    expect(part2Schema.safeParse({ ...p2, timeLimitSec: undefined }).success).toBe(false)
  })
})
