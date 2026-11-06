import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { metaSchema, part1Schema, part2Schema, part3Schema, part4Schema, type ReadingTest } from "./schema"

export const DATA_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "..", "data", "reading")

async function readJson(file: string) {
  return JSON.parse(await readFile(file, "utf8"))
}

export async function listTests(dir = DATA_DIR) {
  const entries = await readdir(dir, { withFileTypes: true })
  const tests = await Promise.all(
    entries
      .filter((e) => e.isDirectory())
      .map(async (e) => ({ id: e.name, ...metaSchema.parse(await readJson(path.join(dir, e.name, "meta.json"))) })),
  )
  return tests.sort((a, b) => a.id.localeCompare(b.id))
}

export async function loadTest(id: string, dir = DATA_DIR): Promise<ReadingTest> {
  const file = (name: string) => readJson(path.join(dir, id, `${name}.json`))
  const [meta, p1, p2, p3, p4] = await Promise.all(["meta", "part1", "part2", "part3", "part4"].map(file))
  return {
    id,
    title: metaSchema.parse(meta).title,
    parts: [part1Schema.parse(p1), part2Schema.parse(p2), part3Schema.parse(p3), part4Schema.parse(p4)],
  }
}
