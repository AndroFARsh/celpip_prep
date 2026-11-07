import { Suspense } from "react"

import { TestRunner } from "@/components/reading/test-runner"
import { loadRun } from "@/lib/load-run"

async function Run({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TestRunner {...await loadRun(id, "full")} />
}

export default function Page({ params }: PageProps<"/reading/[id]">) {
  return (
    <Suspense>
      <Run params={params} />
    </Suspense>
  )
}
