import { Suspense } from "react"

import { TestRunner } from "@/components/reading/test-runner"
import { loadRun } from "@/lib/load-run"
import { listTests } from "@/lib/tests"

async function Run({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TestRunner {...await loadRun(id, "full")} />
}

export async function generateStaticParams() {
  return (await listTests()).map((t) => ({ id: t.id }))
}

export default function Page({ params }: PageProps<"/reading/[id]">) {
  return (
    <Suspense>
      <Run params={params} />
    </Suspense>
  )
}
