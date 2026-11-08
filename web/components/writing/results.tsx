"use client"

import { NoResult, ResultActions } from "@/components/results"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useResult } from "@/lib/results-store"
import { runLabel, runParts, type Run } from "@/lib/runs"
import type { Answers } from "@/lib/scoring"
import { SECTIONS } from "@/lib/sections"
import type { WritingTest } from "@/lib/writing/schema"
import { countWords, inRange, MAX_WORDS, MIN_WORDS, OPTION_KEY, OPTION_LABELS, responseKey } from "@/lib/writing/words"

function Text({ title, text, words }: { title: string; text: string; words: number }) {
  return (
    <div>
      <h3 className="mb-2 flex flex-wrap items-center gap-2 font-medium">
        {title}
        <Badge variant={inRange(words) ? "secondary" : "destructive"}>{words} words</Badge>
      </h3>
      <p className="whitespace-pre-line wrap-anywhere">{text || "-"}</p>
    </div>
  )
}

function TaskResult({ test, part, answers }: { test: WritingTest; part: number; answers: Answers }) {
  const [p1, p2] = test.parts
  const text = answers[responseKey(part)] ?? ""
  const option = answers[OPTION_KEY]
  const samples =
    part === 1
      ? [{ title: "Sample answer", text: p1.sample }]
      : p2.samples.map((s, i) => ({ title: `Sample answer: Option ${OPTION_LABELS[i]}`, text: s }))

  return (
    <Card data-testid={`task-${part}`}>
      <CardHeader>
        <CardTitle>
          Task {part}: {SECTIONS.writing.parts[part - 1]}
        </CardTitle>
        <CardDescription className="space-y-2">
          {part === 2 && <p className="font-medium">{p2.title}</p>}
          <p>{test.parts[part - 1].situation}</p>
          {part === 1 && <p>{p1.task}</p>}
          <ul className="ml-6 list-disc">
            {part === 1
              ? p1.points.map((point) => <li key={point}>{point}</li>)
              : p2.options.map((o, i) => (
                  <li key={o}>
                    Option {OPTION_LABELS[i]}: {o}
                  </li>
                ))}
          </ul>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          {part === 2 && (
            <p className="text-sm text-muted-foreground" data-testid="choice">
              {option ? `You chose Option ${option}.` : "No option chosen."}
            </p>
          )}
          <Text title="Your response" text={text} words={countWords(text)} />
        </div>
        <div className="space-y-4">
          {samples.map((s, i) => (
            <div key={s.title} className="space-y-4">
              {i > 0 && <Separator />}
              <Text title={s.title} text={s.text} words={countWords(s.text)} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function WritingResults({ test, run }: { test: WritingTest; run: Run }) {
  const result = useResult("writing", test.id, run)
  if (!result) return <NoResult section="writing" testId={test.id} title={test.title} run={run} />

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {test.title}: {runLabel("writing", run)}
          </CardTitle>
          <CardDescription>
            Writing is not scored automatically. Compare your response with the sample answer: does it cover every
            point, stay within {MIN_WORDS}-{MAX_WORDS} words, use clear paragraphs and the right tone?
          </CardDescription>
        </CardHeader>
        <ResultActions section="writing" testId={test.id} run={run} />
      </Card>
      {runParts("writing", run).map((p) => (
        <TaskResult key={p} test={test} part={p} answers={result.answers} />
      ))}
    </div>
  )
}
