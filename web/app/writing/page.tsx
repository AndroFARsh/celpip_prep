import { Suspense } from "react"

import { TestCard } from "@/components/test-card"
import { listWritingTests } from "@/lib/writing/tests"

async function TestList() {
  const tests = await listWritingTests()
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tests.map((t) => (
        <TestCard key={t.id} section="writing" id={t.id} title={t.title} source={t.source} />
      ))}
    </div>
  )
}

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Writing Tests</h1>
      <Suspense>
        <TestList />
      </Suspense>
    </div>
  )
}
