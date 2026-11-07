import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import {
  metaSchema,
  part1Schema,
  part2Schema,
  part3Schema,
  part4Schema,
  type Diagram,
  type ReadingTest,
} from "./schema"

/** The repo's test data. Unit and e2e tests set READING_DATA_DIR to their fixtures instead. */
export const REPO_DATA_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "..", "data", "reading")
export const DATA_DIR = process.env.READING_DATA_DIR ?? REPO_DATA_DIR

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

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
}

export async function loadDiagram(file: string): Promise<Diagram> {
  const ext = path.extname(file).toLowerCase()
  if (ext === ".html") return { kind: "html", html: await readFile(file, "utf8") }
  const data = await readFile(file)
  return { kind: "image", src: `data:${MIME[ext]};base64,${data.toString("base64")}` }
}

export async function loadTest(id: string, dir = DATA_DIR): Promise<ReadingTest> {
  const file = (name: string) => readJson(path.join(dir, id, `${name}.json`))
  const [meta, p1, p2, p3, p4] = await Promise.all(["meta", "part1", "part2", "part3", "part4"].map(file))
  const part2 = part2Schema.parse(p2)
  return {
    id,
    title: metaSchema.parse(meta).title,
    parts: [
      part1Schema.parse(p1),
      { ...part2, diagram: await loadDiagram(path.join(dir, id, part2.diagram)) },
      part3Schema.parse(p3),
      part4Schema.parse(p4),
    ],
  }
}
