"use client"

import { useRouter } from "next/navigation"
import { useCallback, useLayoutEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCountdown } from "@/hooks/use-countdown"
import { saveResult } from "@/lib/results-store"
import { resultsPath, runParts, type Run } from "@/lib/runs"
import { formatTime, itemsForPart, PART_NAMES, score, type Answers } from "@/lib/scoring"
import type { ReadingTest } from "@/lib/schema"
import { cn } from "@/lib/utils"
import { PANES } from "./parts"

type PartScreenProps = {
  test: ReadingTest
  part: number
  answers: Answers
  onAnswer: (key: string, value: string) => void
  onNext: () => void
}

function PartScreen({ test, part, answers, onAnswer, onNext }: PartScreenProps) {
  const left = useCountdown(test.parts[part - 1].timeLimitSec, onNext)
  const { left: leftPane, right: rightPane } = PANES[part - 1]({
    test,
    items: itemsForPart(test, part),
    answers,
    onAnswer,
  })

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b bg-background px-4 py-2">
        <h1 className="font-semibold">
          Reading Part {part}: {PART_NAMES[part - 1]}
        </h1>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            aria-label="Time remaining"
            className={cn(
              "tabular-nums",
              left < 60 ? "border-red-500 text-red-600" : left < 120 && "border-orange-500 text-orange-600",
            )}
          >
            Time remaining: {formatTime(left)}
          </Badge>
          <Button onClick={onNext}>Next</Button>
        </div>
      </div>
      <div className="grid flex-1 gap-4 p-4 md:grid-cols-2">
        {[leftPane, rightPane].map((pane, i) => (
          <Card key={i} className="py-0">
            <ScrollArea className="md:h-[calc(100dvh-9.5rem)]">
              <CardContent className="py-4">{pane}</CardContent>
            </ScrollArea>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function TestRunner({ test, run }: { test: ReadingTest; run: Run }) {
  const router = useRouter()
  const parts = runParts("reading", run)
  const [step, setStep] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const onAnswer = useCallback((key: string, value: string) => setAnswers((a) => ({ ...a, [key]: value })), [])

  // Next.js keeps visited pages alive (Activity); start fresh whenever this page is left.
  useLayoutEffect(
    () => () => {
      setStep(0)
      setAnswers({})
      setAttempt((a) => a + 1)
    },
    [],
  )

  const onNext = useCallback(() => {
    if (step < parts.length - 1) return setStep(step + 1)
    const items = parts.flatMap((p) => itemsForPart(test, p))
    saveResult("reading", test.id, run, { answers, score: score(items, answers), total: items.length })
    router.push(resultsPath("reading", test.id, run))
  }, [step, parts, test, run, answers, router])

  return (
    <PartScreen
      key={`${attempt}-${step}`}
      test={test}
      part={parts[step]}
      answers={answers}
      onAnswer={onAnswer}
      onNext={onNext}
    />
  )
}
