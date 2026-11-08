import { Suspense } from "react"

import { WritingTestRunner } from "@/components/writing/test-runner"
import { listWritingTests, loadWritingRun } from "@/lib/writing/tests"

async function Run({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <WritingTestRunner {...await loadWritingRun(id, "full")} />
}

export async function generateStaticParams() {
  return (await listWritingTests()).map((t) => ({ id: t.id }))
}

export default function Page({ params }: PageProps<"/writing/[id]">) {
  return (
    <Suspense>
      <Run params={params} />
    </Suspense>
  )
}
