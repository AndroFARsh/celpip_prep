import { Suspense } from "react"

import { SpeakingResults } from "@/components/speaking/results"
import { runsFor } from "@/lib/runs"
import { listSpeakingTests, loadSpeakingRun } from "@/lib/speaking/tests"

async function View({ params }: { params: Promise<{ id: string; run: string }> }) {
  const { id, run } = await params
  return <SpeakingResults {...await loadSpeakingRun(id, run)} />
}

export async function generateStaticParams() {
  return (await listSpeakingTests()).flatMap((t) => runsFor("speaking").map((run) => ({ id: t.id, run })))
}

export default function Page({ params }: PageProps<"/speaking/[id]/results/[run]">) {
  return (
    <Suspense>
      <View params={params} />
    </Suspense>
  )
}
