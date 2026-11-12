import { Suspense } from "react"

import { SpeakingTestRunner } from "@/components/speaking/test-runner"
import { listSpeakingTests, loadSpeakingRun } from "@/lib/speaking/tests"

async function Run({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SpeakingTestRunner {...await loadSpeakingRun(id, "full")} />
}

export async function generateStaticParams() {
  return (await listSpeakingTests()).map((t) => ({ id: t.id }))
}

export default function Page({ params }: PageProps<"/speaking/[id]">) {
  return (
    <Suspense>
      <Run params={params} />
    </Suspense>
  )
}
