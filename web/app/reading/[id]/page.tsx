import { notFound } from "next/navigation"
import { Suspense } from "react"

import { TestRunner } from "@/components/reading/test-runner"
import { listTests, loadTest } from "@/lib/tests"

async function Test({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await listTests()).some((t) => t.id === id)) notFound()
  return <TestRunner test={await loadTest(id)} />
}

export default function Page({ params }: PageProps<"/reading/[id]">) {
  return (
    <Suspense>
      <Test params={params} />
    </Suspense>
  )
}
