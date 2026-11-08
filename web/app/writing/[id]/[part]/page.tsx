import { Suspense } from "react"

import { WritingTestRunner } from "@/components/writing/test-runner"
import { listWritingTests, loadWritingRun } from "@/lib/writing/tests"
import { runsFor } from "@/lib/runs"

async function Run({ params }: { params: Promise<{ id: string; part: string }> }) {
  const { id, part } = await params
  return <WritingTestRunner {...await loadWritingRun(id, part === "full" ? "" : part)} />
}

export async function generateStaticParams() {
  const parts = runsFor("writing").slice(1)
  return (await listWritingTests()).flatMap((t) => parts.map((part) => ({ id: t.id, part })))
}

export default function Page({ params }: PageProps<"/writing/[id]/[part]">) {
  return (
    <Suspense>
      <Run params={params} />
    </Suspense>
  )
}
