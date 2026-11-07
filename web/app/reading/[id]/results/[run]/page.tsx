import { Suspense } from "react"

import { Results } from "@/components/reading/results"
import { loadRun } from "@/lib/load-run"
import { listTests } from "@/lib/tests"
import { RUNS } from "@/lib/runs"

async function View({ params }: { params: Promise<{ id: string; run: string }> }) {
  const { id, run } = await params
  return <Results {...await loadRun(id, run)} />
}

export async function generateStaticParams() {
  return (await listTests()).flatMap((t) => RUNS.map((run) => ({ id: t.id, run })))
}

export default function Page({ params }: PageProps<"/reading/[id]/results/[run]">) {
  return (
    <Suspense>
      <View params={params} />
    </Suspense>
  )
}
