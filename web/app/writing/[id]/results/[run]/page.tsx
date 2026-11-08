import { Suspense } from "react"

import { WritingResults } from "@/components/writing/results"
import { runsFor } from "@/lib/runs"
import { listWritingTests, loadWritingRun } from "@/lib/writing/tests"

async function View({ params }: { params: Promise<{ id: string; run: string }> }) {
  const { id, run } = await params
  return <WritingResults {...await loadWritingRun(id, run)} />
}

export async function generateStaticParams() {
  return (await listWritingTests()).flatMap((t) => runsFor("writing").map((run) => ({ id: t.id, run })))
}

export default function Page({ params }: PageProps<"/writing/[id]/results/[run]">) {
  return (
    <Suspense>
      <View params={params} />
    </Suspense>
  )
}
