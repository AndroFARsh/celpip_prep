"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { clearResult, useResult } from "@/lib/results-store"
import { resultsPath, RUNS, runLabel, runPath, type Run } from "@/lib/runs"

function RunRow({ testId, run }: { testId: string; run: Run }) {
  const result = useResult(testId, run)
  return (
    <div className="flex flex-wrap items-center justify-between gap-2" data-testid={`run-${run}`}>
      <span className="text-sm">{runLabel(run)}</span>
      <div className="flex gap-2">
        {result && (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={resultsPath(testId, run)}>
                Results {result.score}/{result.total}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clearResult(testId, run)}>
              Clear
            </Button>
          </>
        )}
        <Button size="sm" asChild>
          <Link href={runPath(testId, run)}>Start</Link>
        </Button>
      </div>
    </div>
  )
}

export function TestCard({ id, title }: { id: string; title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>4 parts, 38 questions, 55-60 minutes</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {RUNS.map((run, i) => (
          <div key={run} className="flex flex-col gap-3">
            {i === 1 && <Separator />}
            <RunRow testId={id} run={run} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
