import { notFound } from "next/navigation"
import path from "node:path"

import { isRun } from "../runs"
import { listTests, loadImage, readJson } from "../tests"
import { metaSchema, part5Schema, part6Schema, pictureTaskSchema, taskSchema, type SpeakingTest } from "./schema"

/** The repo's test data. Unit and e2e tests set SPEAKING_DATA_DIR to their fixtures instead. */
export const REPO_DATA_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "..", "data", "speaking")
export const DATA_DIR = process.env.SPEAKING_DATA_DIR ?? REPO_DATA_DIR

export const listSpeakingTests = (dir = DATA_DIR) => listTests(dir)

export async function loadSpeakingTest(id: string, dir = DATA_DIR): Promise<SpeakingTest> {
  const folder = path.join(dir, id)
  const [meta, p1, p2, p3, p4, p5, p6, p7, p8] = await Promise.all(
    ["meta", "part1", "part2", "part3", "part4", "part5", "part6", "part7", "part8"].map((f) =>
      readJson(path.join(folder, `${f}.json`)),
    ),
  )
  const withImage = async <T extends { image: string }>(o: T) => ({ ...o, image: await loadImage(path.join(folder, o.image)) })
  const picture = (json: unknown) => withImage(pictureTaskSchema.parse(json))
  const task5 = part5Schema.parse(p5)
  return {
    id,
    title: metaSchema.parse(meta).title,
    parts: [
      taskSchema.parse(p1),
      taskSchema.parse(p2),
      await picture(p3),
      await picture(p4),
      { ...task5, options: await Promise.all(task5.options.map(withImage)), alternative: await withImage(task5.alternative) },
      part6Schema.parse(p6),
      taskSchema.parse(p7),
      await picture(p8),
    ],
  }
}

export async function loadSpeakingRun(id: string, run: string) {
  if (!isRun("speaking", run) || !(await listSpeakingTests()).some((t) => t.id === id)) notFound()
  return { test: await loadSpeakingTest(id), run }
}
