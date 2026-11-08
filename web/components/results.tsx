"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { celpipLevel, type ScoredSection } from "@/lib/celpip-level"
import { clearResult, useResult } from "@/lib/results-store"
import { runLabel, runParts, runPath, type Run } from "@/lib/runs"
import { score, type Item } from "@/lib/scoring"
import type { Section } from "@/lib/sections"

type Props = { section: ScoredSection; testId: string; title: string; run: Run; items: Item[] }

/** An answer as text, or as its picture for picture options. */
function Answer({ item, value }: { item: Item; value: string | undefined }) {
  if (value === undefined) return "-"
  const image = item.images?.[item.options.indexOf(value)]
  if (!image) return value
  return (
    <span className="flex items-center gap-2">
      {value}
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the test folder */}
      <img src={image} alt={`Option ${value}`} className="h-12 w-auto rounded border" />
    </span>
  )
}

type RunProps = { section: Section; testId: string; run: Run }

/** Shown when a run has no saved result. */
export function NoResult({ section, testId, title, run }: RunProps & { title: string }) {
  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {title}: {runLabel(section, run)}
          </CardTitle>
          <CardDescription>No saved result.</CardDescription>
        </CardHeader>
        <CardFooter className="gap-2">
          <Button asChild>
            <Link href={runPath(section, testId, run)}>Start</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${section}`}>Back to tests</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

/** Start again, Clear result and Back to tests. */
export function ResultActions({ section, testId, run }: RunProps) {
  const router = useRouter()
  const home = `/${section}`
  return (
    <CardFooter className="flex-wrap gap-2">
      <Button asChild>
        <Link href={runPath(section, testId, run)}>Start again</Link>
      </Button>
      <Button
        variant="destructive"
        onClick={() => {
          clearResult(section, testId, run)
          router.push(home)
        }}
      >
        Clear result
      </Button>
      <Button variant="outline" asChild>
        <Link href={home}>Back to tests</Link>
      </Button>
    </CardFooter>
  )
}

export function Results({ section, testId, title, run, items }: Props) {
  const result = useResult(section, testId, run)

  if (!result) return <NoResult section={section} testId={testId} title={title} run={run} />

  const { answers } = result
  const total = score(items, answers)
  const parts = runParts(section, run)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {title}: {runLabel(section, run)}
          </CardTitle>
          <CardDescription data-testid="score">
            Score: {total} / {items.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div data-testid="level">
            <span className="text-3xl font-semibold">CELPIP level {celpipLevel(section, total, items.length)}</span>{" "}
            <span className="text-sm text-muted-foreground">
              {run === "full" ? "(estimate)" : `(estimate from Part ${run} only)`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {parts.map((p) => {
              const partItems = items.filter((it) => it.part === p)
              return (
                <Badge key={p} variant="secondary">
                  Part {p}: {score(partItems, answers)} / {partItems.length}
                </Badge>
              )
            })}
          </div>
        </CardContent>
        <ResultActions section={section} testId={testId} run={run} />
      </Card>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead>#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Your answer</TableHead>
                <TableHead>Correct answer</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => {
                const ok = answers[it.key] === it.answer
                return (
                  <TableRow key={it.key}>
                    <TableCell>{it.part}</TableCell>
                    <TableCell>{it.number}</TableCell>
                    <TableCell className="min-w-48 whitespace-normal">{it.label}</TableCell>
                    <TableCell className="whitespace-normal">
                      <Answer item={it} value={answers[it.key]} />
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <Answer item={it} value={it.answer} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={ok ? "default" : "destructive"}>{ok ? "Correct" : "Wrong"}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
