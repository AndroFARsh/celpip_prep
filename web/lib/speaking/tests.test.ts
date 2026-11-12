import { cp, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { readJson } from "../tests"
import { DATA_DIR, listSpeakingTests, loadSpeakingTest, REPO_DATA_DIR } from "./tests"

const repoTestIds = (await listSpeakingTests(REPO_DATA_DIR)).map((t) => t.id)

describe("data/speaking", () => {
  it.each(repoTestIds)("%s is a valid test", async (id) => {
    await expect(loadSpeakingTest(id, REPO_DATA_DIR)).resolves.toMatchObject({ id })
  })
})

async function copyDemo() {
  const dir = await mkdtemp(path.join(tmpdir(), "celpip-speaking-"))
  await cp(path.join(DATA_DIR, "demo-1"), path.join(dir, "bad"), { recursive: true })
  return dir
}

describe("speaking test loader", () => {
  it("loads all 8 tasks with pictures as data URLs", async () => {
    const test = await loadSpeakingTest("demo-1")
    expect(test.parts).toHaveLength(8)
    for (const p of [test.parts[2], test.parts[3], test.parts[7]]) expect(p.image).toMatch(/^data:image\/jpeg;base64,/)
    expect(test.parts[0].image).toBeUndefined()
    const p5 = test.parts[4]
    expect(p5.options.map((o) => o.image)).toEqual([expect.stringMatching(/^data:/), expect.stringMatching(/^data:/)])
    expect(p5.alternative.image).toMatch(/^data:/)
    expect(test.parts[5].samples).toHaveLength(2)
  })

  it("discovers new test folders without code changes", async () => {
    expect((await listSpeakingTests(await copyDemo())).map((t) => t.id)).toEqual(["bad"])
  })

  it("throws when a picture task has no picture file", async () => {
    const dir = await copyDemo()
    await rm(path.join(dir, "bad", "pic.jpg"))
    await expect(loadSpeakingTest("bad", dir)).rejects.toThrow()
  })

  it("throws when Task 5 does not name the choice in its compare prompt", async () => {
    const dir = await copyDemo()
    const file = path.join(dir, "bad", "part5.json")
    await writeFile(file, JSON.stringify({ ...(await readJson(file)), compare: "Explain why yours is better." }))
    await expect(loadSpeakingTest("bad", dir)).rejects.toThrow()
  })
})
