import { Suspense } from "react"

import { Results } from "@/components/results"
import { itemsForPart } from "@/lib/listening/scoring"
import { listListeningTests, loadListeningRun } from "@/lib/listening/tests"
import { runParts, runsFor } from "@/lib/runs"

async function View({ params }: { params: Promise<{ id: string; run: string }> }) {
  const { id, run } = await params
  const { test } = await loadListeningRun(id, run)
  const items = runParts("listening", run).flatMap((p) => itemsForPart(test, p))
  return <Results section="listening" testId={test.id} title={test.title} run={run} items={items} />
}

export async function generateStaticParams() {
  return (await listListeningTests()).flatMap((t) => runsFor("listening").map((run) => ({ id: t.id, run })))
}

export default function Page({ params }: PageProps<"/listening/[id]/results/[run]">) {
  return (
    <Suspense>
      <View params={params} />
    </Suspense>
  )
}
