import Link from "next/link"
import { Suspense } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { listTests } from "@/lib/tests"

async function TestList() {
  const tests = await listTests()
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tests.map((t) => (
        <Card key={t.id}>
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>4 parts, 38 questions, 55-60 minutes</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href={`/reading/${t.id}`}>Start</Link>
            </Button>
          </CardFooter>
        </Card>
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
