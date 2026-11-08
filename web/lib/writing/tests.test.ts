import { cp, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { DATA_DIR, listWritingTests, loadWritingTest, REPO_DATA_DIR } from "./tests"

const repoTestIds = (await listWritingTests(REPO_DATA_DIR)).map((t) => t.id)

describe("data/writing", () => {
  it.each(repoTestIds)("%s is a valid test", async (id) => {
    await expect(loadWritingTest(id, REPO_DATA_DIR)).resolves.toMatchObject({ id })
  })
})

async function copyDemo(name: string) {
  const dir = await mkdtemp(path.join(tmpdir(), "celpip-writing-"))
  await cp(path.join(DATA_DIR, "demo-1"), path.join(dir, name), { recursive: true })
  return dir
}

describe("writing test loader", () => {
  it("loads both tasks of the demo test", async () => {
    const test = await loadWritingTest("demo-1")
    expect(test.title).toBe("Writing Practice Test 1")
    expect(test.parts[0].points).toHaveLength(3)
    expect(test.parts[1].options).toHaveLength(2)
    expect(test.parts[1].samples).toHaveLength(2)
  })

  it("discovers new test folders without code changes", async () => {
    const dir = await copyDemo("new-test")
    expect((await listWritingTests(dir)).map((t) => t.id)).toEqual(["new-test"])
  })

  it("throws when Task 1 does not have 3 points", async () => {
    const dir = await copyDemo("bad")
    const p1 = JSON.parse(JSON.stringify((await loadWritingTest("demo-1")).parts[0]))
    await writeFile(path.join(dir, "bad", "part1.json"), JSON.stringify({ ...p1, points: ["one", "two"] }))
    await expect(loadWritingTest("bad", dir)).rejects.toThrow()
  })

  it("throws when Task 2 does not have a sample for each option", async () => {
    const dir = await copyDemo("bad")
    const p2 = (await loadWritingTest("demo-1")).parts[1]
    await writeFile(path.join(dir, "bad", "part2.json"), JSON.stringify({ ...p2, samples: [p2.samples[0]] }))
    await expect(loadWritingTest("bad", dir)).rejects.toThrow()
  })
})
