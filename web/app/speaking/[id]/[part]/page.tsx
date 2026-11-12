import { Suspense } from "react"

import { SpeakingTestRunner } from "@/components/speaking/test-runner"
import { listSpeakingTests, loadSpeakingRun } from "@/lib/speaking/tests"
import { runsFor } from "@/lib/runs"

async function Run({ params }: { params: Promise<{ id: string; part: string }> }) {
  const { id, part } = await params
  return <SpeakingTestRunner {...await loadSpeakingRun(id, part === "full" ? "" : part)} />
}

export async function generateStaticParams() {
  const parts = runsFor("speaking").slice(1)
  return (await listSpeakingTests()).flatMap((t) => parts.map((part) => ({ id: t.id, part })))
}

export default function Page({ params }: PageProps<"/speaking/[id]/[part]">) {
  return (
    <Suspense>
      <Run params={params} />
    </Suspense>
  )
}
