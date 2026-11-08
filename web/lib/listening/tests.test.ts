import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { itemsForPart } from "./scoring"
import { part1Schema, part2Schema, part4Schema } from "./schema"
import { DATA_DIR, listListeningTests, loadListeningTest, REPO_DATA_DIR } from "./tests"

const repoTestIds = (await listListeningTests(REPO_DATA_DIR)).map((t) => t.id)
const json = async (file: string) => JSON.parse(await readFile(path.join(DATA_DIR, "demo-1", file), "utf8"))

/** A copy of demo-1 in a temp folder with one file replaced. */
async function withChange<T>(file: string, change: (data: T) => unknown) {
  const dir = await mkdtemp(path.join(tmpdir(), "celpip-listening-"))
  await cp(path.join(DATA_DIR, "demo-1"), path.join(dir, "t"), { recursive: true })
  await writeFile(path.join(dir, "t", file), JSON.stringify(change(await json(file))))
  return { load: () => loadListeningTest("t", dir), cleanup: () => rm(dir, { recursive: true }) }
}

describe("data/listening", () => {
  it.each(repoTestIds.length ? repoTestIds : ["(none)"])("%s is a valid test", async (id) => {
    if (id === "(none)") return
    await expect(loadListeningTest(id, REPO_DATA_DIR)).resolves.toMatchObject({ id })
  })
})

describe("listening loader", () => {
  it("loads six parts with 38 questions and the video id", async () => {
    const test = await loadListeningTest("demo-1")
    expect(test.videoId).toBe("ZuA_Fm4RNAM")
    expect(test.parts.map((p) => p.sections.length)).toEqual([3, 1, 1, 1, 1, 1])
    expect([1, 2, 3, 4, 5, 6].map((p) => itemsForPart(test, p).length)).toEqual([8, 5, 6, 5, 8, 6])
    expect(test.parts.map((p) => p.timeLimitSec)).toEqual([undefined, undefined, undefined, 180, 180, 180])
  })

  it("loads picture options as data URLs labelled A-D", async () => {
    const q8 = (await loadListeningTest("demo-1")).parts[0].sections[2].questions[1]
    expect(q8.options).toEqual(["A", "B", "C", "D"])
    expect(q8.images).toHaveLength(4)
    expect(q8.images![0]).toMatch(/^data:image\/png;base64,/)
    expect(itemsForPart(await loadListeningTest("demo-1"), 1)[7].answer).toBe("D")
  })

  it("discovers new test folders without code changes", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "celpip-listening-"))
    await cp(path.join(DATA_DIR, "demo-1"), path.join(dir, "new-test"), { recursive: true })
    expect((await listListeningTests(dir)).map((t) => t.id)).toEqual(["new-test"])
    await rm(dir, { recursive: true })
  })

  it("fails when a picture file is missing", async () => {
    const { load, cleanup } = await withChange("part1.json", (p: { sections: { questions: { options: string[] }[] }[] }) => {
      p.sections[2].questions[1].options[0] = "missing.png"
      return p
    })
    await expect(load()).rejects.toThrow(/ENOENT/)
    await cleanup()
  })

  it("rejects a source that is not a YouTube watch URL", async () => {
    const { load, cleanup } = await withChange("meta.json", () => ({ title: "x", source: "https://example.com/a" }))
    await expect(load()).rejects.toThrow(/YouTube/)
    await cleanup()
  })
})

describe("listening schemas", () => {
  it("accepts the fixture parts", async () => {
    expect(part1Schema.safeParse(await json("part1.json")).success).toBe(true)
    expect(part2Schema.safeParse(await json("part2.json")).success).toBe(true)
    expect(part4Schema.safeParse(await json("part4.json")).success).toBe(true)
  })

  it("rejects wrong question counts", async () => {
    const p2 = await json("part2.json")
    expect(part2Schema.safeParse({ ...p2, questions: p2.questions.slice(1) }).success).toBe(false)
    const p1 = await json("part1.json")
    p1.sections[0].questions.pop()
    expect(part1Schema.safeParse(p1).success).toBe(false)
  })

  it("rejects an answer index out of range", async () => {
    const p4 = await json("part4.json")
    p4.questions[0].answer = 4
    expect(part4Schema.safeParse(p4).success).toBe(false)
  })

  it("rejects a clip that ends before it starts", async () => {
    const p2 = await json("part2.json")
    p2.audio = { start: 50, end: 50 }
    expect(part2Schema.safeParse(p2).success).toBe(false)
  })

  it("requires spoken audio for parts 1-3 and a time limit for parts 4-6", async () => {
    const p2 = await json("part2.json")
    delete p2.questions[0].audio
    expect(part2Schema.safeParse(p2).success).toBe(false)
    const p4 = await json("part4.json")
    delete p4.timeLimitSec
    expect(part4Schema.safeParse(p4).success).toBe(false)
  })
})
