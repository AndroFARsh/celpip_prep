import { Suspense } from "react"

import { Results } from "@/components/results"
import { loadRun } from "@/lib/load-run"
import { listTests } from "@/lib/tests"
import { runParts, runsFor } from "@/lib/runs"
import { itemsForPart } from "@/lib/scoring"

async function View({ params }: { params: Promise<{ id: string; run: string }> }) {
  const { id, run } = await params
  const { test } = await loadRun(id, run)
  const items = runParts("reading", run).flatMap((p) => itemsForPart(test, p))
  return <Results section="reading" testId={test.id} title={test.title} run={run} items={items} />
}

export async function generateStaticParams() {
  return (await listTests()).flatMap((t) => runsFor("reading").map((run) => ({ id: t.id, run })))
}

export default function Page({ params }: PageProps<"/reading/[id]/results/[run]">) {
  return (
    <Suspense>
      <View params={params} />
    </Suspense>
  )
}
