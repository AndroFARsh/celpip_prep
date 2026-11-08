import { notFound } from "next/navigation"
import path from "node:path"

import { isRun } from "../runs"
import { listTests, readJson } from "../tests"
import { metaSchema, part1Schema, part2Schema, type WritingTest } from "./schema"

/** The repo's test data. Unit and e2e tests set WRITING_DATA_DIR to their fixtures instead. */
export const REPO_DATA_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "..", "data", "writing")
export const DATA_DIR = process.env.WRITING_DATA_DIR ?? REPO_DATA_DIR

export const listWritingTests = (dir = DATA_DIR) => listTests(dir)

export async function loadWritingTest(id: string, dir = DATA_DIR): Promise<WritingTest> {
  const [meta, p1, p2] = await Promise.all(["meta", "part1", "part2"].map((f) => readJson(path.join(dir, id, `${f}.json`))))
  return { id, title: metaSchema.parse(meta).title, parts: [part1Schema.parse(p1), part2Schema.parse(p2)] }
}

export async function loadWritingRun(id: string, run: string) {
  if (!isRun("writing", run) || !(await listWritingTests()).some((t) => t.id === id)) notFound()
  return { test: await loadWritingTest(id), run }
}
