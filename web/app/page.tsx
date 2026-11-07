import { Suspense } from "react"

import { TestCard } from "@/components/reading/test-card"
import { listTests } from "@/lib/tests"

async function TestList() {
  const tests = await listTests()
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tests.map((t) => (
        <TestCard key={t.id} id={t.id} title={t.title} />
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Reading Tests</h1>
      <Suspense>
        <TestList />
      </Suspense>
    </div>
  )
}
