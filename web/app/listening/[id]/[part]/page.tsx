import { Suspense } from "react"

import { TestRunner } from "@/components/listening/test-runner"
import { listListeningTests, loadListeningRun } from "@/lib/listening/tests"
import { runsFor } from "@/lib/runs"

async function Run({ params }: { params: Promise<{ id: string; part: string }> }) {
  const { id, part } = await params
  return <TestRunner {...await loadListeningRun(id, part === "full" ? "" : part)} />
}

export async function generateStaticParams() {
  const parts = runsFor("listening").slice(1)
  return (await listListeningTests()).flatMap((t) => parts.map((part) => ({ id: t.id, part })))
}

export default function Page({ params }: PageProps<"/listening/[id]/[part]">) {
  return (
    <Suspense>
      <Run params={params} />
    </Suspense>
  )
}
