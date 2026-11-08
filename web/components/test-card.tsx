"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { clearResult, useResult } from "@/lib/results-store"
import { resultsPath, runLabel, runPath, runsFor, type Run } from "@/lib/runs"
import { SECTIONS, type Section } from "@/lib/sections"

type Props = { section: Section; id: string; title: string; source?: string }

function RunRow({ section, testId, run }: { section: Section; testId: string; run: Run }) {
  const result = useResult(section, testId, run)
  return (
    <div className="flex flex-wrap items-center justify-between gap-2" data-testid={`run-${run}`}>
      <span className="text-sm">{runLabel(section, run)}</span>
      <div className="flex gap-2">
        {result && (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={resultsPath(section, testId, run)}>
                {result.total === undefined ? "Results" : `Results ${result.score}/${result.total}`}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clearResult(section, testId, run)}>
              Clear
            </Button>
          </>
        )}
        <Button size="sm" asChild>
          <Link href={runPath(section, testId, run)}>Start</Link>
        </Button>
      </div>
    </div>
  )
}

export function TestCard({ section, id, title, source }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{SECTIONS[section].summary}</CardDescription>
        {source && (
          <CardAction>
            <Button variant="link" size="sm" asChild>
              <a href={source} target="_blank" rel="noreferrer">
                Source
              </a>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {runsFor(section).map((run, i) => (
          <div key={run} className="flex flex-col gap-3">
            {i === 1 && <Separator />}
            <RunRow section={section} testId={id} run={run} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
