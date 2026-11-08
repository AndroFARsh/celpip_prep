import { Suspense } from "react"

import { TestRunner } from "@/components/reading/test-runner"
import { loadRun } from "@/lib/load-run"
import { runsFor } from "@/lib/runs"
import { listTests } from "@/lib/tests"

async function Run({ params }: { params: Promise<{ id: string; part: string }> }) {
  const { id, part } = await params
  return <TestRunner {...await loadRun(id, part === "full" ? "" : part)} />
}

export async function generateStaticParams() {
  return (await listTests()).flatMap((t) => runsFor("reading").slice(1).map((part) => ({ id: t.id, part })))
}

export default function Page({ params }: PageProps<"/reading/[id]/[part]">) {
  return (
    <Suspense>
      <Run params={params} />
    </Suspense>
  )
}
