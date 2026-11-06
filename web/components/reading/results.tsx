"use client"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { allItems, itemsForPart, PART_NAMES, score, type Answers } from "@/lib/scoring"
import type { ReadingTest } from "@/lib/schema"

export function Results({ test, answers }: { test: ReadingTest; answers: Answers }) {
  const items = allItems(test)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {test.title}: Results
          </CardTitle>
          <CardDescription data-testid="score">
            Score: {score(items, answers)} / {items.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {PART_NAMES.map((name, i) => {
            const partItems = itemsForPart(test, i + 1)
            return (
              <Badge key={name} variant="secondary">
                Part {i + 1}: {score(partItems, answers)} / {partItems.length}
              </Badge>
            )
          })}
        </CardContent>
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
      <Button asChild>
        <Link href="/">Back to tests</Link>
      </Button>
    </div>
  )
}
