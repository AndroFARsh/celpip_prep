import { Suspense } from "react"

import { TestCard } from "@/components/test-card"
import { listSpeakingTests } from "@/lib/speaking/tests"

async function TestList() {
  const tests = await listSpeakingTests()
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tests.map((t) => (
        <TestCard key={t.id} section="speaking" id={t.id} title={t.title} source={t.source} />
      ))}
    </div>
  )
}

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Speaking Tests</h1>
      <Suspense>
        <TestList />
      </Suspense>
    </div>
  )
}
