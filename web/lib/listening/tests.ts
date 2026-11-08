import { notFound } from "next/navigation"
import path from "node:path"

import { isRun } from "../runs"
import { listTests, loadImage, readJson } from "../tests"
import { metaSchema, PART_SCHEMAS, type ListeningPart, type ListeningQuestion, type ListeningTest } from "./schema"

/** The repo's test data. Unit and e2e tests set LISTENING_DATA_DIR to their fixtures instead. */
export const REPO_DATA_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "..", "data", "listening")
export const DATA_DIR = process.env.LISTENING_DATA_DIR ?? REPO_DATA_DIR

export const listListeningTests = (dir = DATA_DIR) => listTests(dir)

const IMAGE = /\.(png|jpe?g|webp)$/i

async function withImages(q: ListeningQuestion, dir: string): Promise<ListeningQuestion> {
  if (!q.options.every((o) => IMAGE.test(o))) return q
  return { ...q, options: ["A", "B", "C", "D"], images: await Promise.all(q.options.map((o) => loadImage(path.join(dir, o)))) }
}

export async function loadListeningTest(id: string, dir = DATA_DIR): Promise<ListeningTest> {
  const folder = path.join(dir, id)
  const [meta, ...raw] = await Promise.all(
    ["meta", "part1", "part2", "part3", "part4", "part5", "part6"].map((f) => readJson(path.join(folder, `${f}.json`))),
  )
  const { title, source } = metaSchema.parse(meta)
  const parts = await Promise.all(
    raw.map(async (json, i): Promise<ListeningPart> => {
      const p = PART_SCHEMAS[i].parse(json)
      const sections = "sections" in p ? p.sections : [{ audio: p.audio, questions: p.questions }]
      return {
        timeLimitSec: "timeLimitSec" in p ? p.timeLimitSec : undefined,
        sections: await Promise.all(
          sections.map(async (s) => ({
            audio: s.audio,
            questions: await Promise.all(s.questions.map((q) => withImages(q, folder))),
          })),
        ),
      }
    }),
  )
  return { id, title, videoId: new URL(source).searchParams.get("v")!, parts }
}

export async function loadListeningRun(id: string, run: string) {
  if (!isRun("listening", run) || !(await listListeningTests()).some((t) => t.id === id)) notFound()
  return { test: await loadListeningTest(id), run }
}
