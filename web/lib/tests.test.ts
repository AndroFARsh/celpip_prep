import { cp, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { DATA_DIR, listTests, loadTest } from "./tests"

describe("test loader", () => {
  it("lists the demo test", async () => {
    expect(await listTests()).toContainEqual({ id: "demo-1", title: "Practice Test 1" })
  })

  it("discovers new test folders without code changes", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "celpip-"))
    await cp(path.join(DATA_DIR, "demo-1"), path.join(dir, "b-test"), { recursive: true })
    await cp(path.join(DATA_DIR, "demo-1"), path.join(dir, "a-test"), { recursive: true })
    await writeFile(path.join(dir, "a-test", "meta.json"), JSON.stringify({ title: "A" }))
    expect((await listTests(dir)).map((t) => t.id)).toEqual(["a-test", "b-test"])
    expect((await loadTest("a-test", dir)).title).toBe("A")
  })

  it("loads all four parts", async () => {
    const test = await loadTest("demo-1")
    expect(test.parts).toHaveLength(4)
    expect(test.parts[2].paragraphs).toHaveLength(4)
  })

  it("throws on invalid part data", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "celpip-"))
    await cp(path.join(DATA_DIR, "demo-1"), path.join(dir, "bad"), { recursive: true })
    await writeFile(path.join(dir, "bad", "part3.json"), JSON.stringify({ timeLimitSec: 600 }))
    await expect(loadTest("bad", dir)).rejects.toThrow()
  })
})
