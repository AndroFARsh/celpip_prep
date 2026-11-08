import { Suspense } from "react"

import { TestRunner } from "@/components/listening/test-runner"
import { listListeningTests, loadListeningRun } from "@/lib/listening/tests"

async function Run({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TestRunner {...await loadListeningRun(id, "full")} />
}

export async function generateStaticParams() {
  return (await listListeningTests()).map((t) => ({ id: t.id }))
}

export default function Page({ params }: PageProps<"/listening/[id]">) {
  return (
    <Suspense>
      <Run params={params} />
    </Suspense>
  )
}
