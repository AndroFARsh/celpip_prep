import { cp, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { DATA_DIR, listTests, loadTest, REPO_DATA_DIR } from "./tests"

const repoTestIds = (await listTests(REPO_DATA_DIR)).map((t) => t.id)

describe("data/reading", () => {
  it.each(repoTestIds)("%s is a valid test", async (id) => {
    await expect(loadTest(id, REPO_DATA_DIR)).resolves.toMatchObject({ id })
  })
})

describe("test loader", () => {
  it("lists the demo test", async () => {
    expect((await listTests()).map((t) => t.id)).toContain("demo-1")
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

  it("loads an image diagram as a data URL", async () => {
    const { diagram } = (await loadTest("demo-1")).parts[1]
    expect(diagram.kind).toBe("image")
    if (diagram.kind === "image") expect(diagram.src).toMatch(/^data:image\/jpeg;base64,/)
  })

  it("loads an html diagram as page source", async () => {
    const { diagram } = (await loadTest("demo-2")).parts[1]
    expect(diagram).toMatchObject({ kind: "html", html: expect.stringContaining("<table") })
  })

  it("throws on a missing diagram file", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "celpip-"))
    await cp(path.join(DATA_DIR, "demo-2"), path.join(dir, "bad"), { recursive: true })
    await rm(path.join(dir, "bad", "diagram.html"))
    await expect(loadTest("bad", dir)).rejects.toThrow()
  })

  it("throws on invalid part data", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "celpip-"))
    await cp(path.join(DATA_DIR, "demo-1"), path.join(dir, "bad"), { recursive: true })
    await writeFile(path.join(dir, "bad", "part3.json"), JSON.stringify({ timeLimitSec: 600 }))
    await expect(loadTest("bad", dir)).rejects.toThrow()
  })
})
