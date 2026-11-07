"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { clearResult, useResult } from "@/lib/results-store"
import { runLabel, runParts, runPath, type Run } from "@/lib/runs"
import { itemsForPart, score } from "@/lib/scoring"
import type { ReadingTest } from "@/lib/schema"

export function Results({ test, run }: { test: ReadingTest; run: Run }) {
  const router = useRouter()
  const result = useResult(test.id, run)
  const parts = runParts(run)

  if (!result)
    return (
      <div className="mx-auto w-full max-w-5xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {test.title}: {runLabel(run)}
            </CardTitle>
            <CardDescription>No saved result.</CardDescription>
          </CardHeader>
          <CardFooter className="gap-2">
            <Button asChild>
              <Link href={runPath(test.id, run)}>Start</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to tests</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )

  const { answers } = result
  const items = parts.flatMap((p) => itemsForPart(test, p))

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {test.title}: {runLabel(run)}
          </CardTitle>
          <CardDescription data-testid="score">
            Score: {score(items, answers)} / {items.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {parts.map((p) => {
            const partItems = itemsForPart(test, p)
            return (
              <Badge key={p} variant="secondary">
                Part {p}: {score(partItems, answers)} / {partItems.length}
              </Badge>
            )
          })}
        </CardContent>
        <CardFooter className="flex-wrap gap-2">
          <Button asChild>
            <Link href={runPath(test.id, run)}>Start again</Link>
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              clearResult(test.id, run)
              router.push("/")
            }}
          >
            Clear result
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to tests</Link>
          </Button>
        </CardFooter>
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
                    <TableCell className="whitespace-normal">{answers[it.key] ?? "-"}</TableCell>
                    <TableCell className="whitespace-normal">{it.answer}</TableCell>
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
