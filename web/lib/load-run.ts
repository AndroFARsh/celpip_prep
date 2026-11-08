import { notFound } from "next/navigation"

import { isRun } from "./runs"
import { listTests, loadTest } from "./tests"

export async function loadRun(id: string, run: string) {
  if (!isRun("reading", run) || !(await listTests()).some((t) => t.id === id)) notFound()
  return { test: await loadTest(id), run }
}
