"use client"

import { useRouter } from "next/navigation"
import { useCallback, useLayoutEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { useCountdown } from "@/hooks/use-countdown"
import { saveResult } from "@/lib/results-store"
import { resultsPath, runParts, type Run } from "@/lib/runs"
import { formatTime, type Answers } from "@/lib/scoring"
import { SECTIONS } from "@/lib/sections"
import { cn } from "@/lib/utils"
import type { WritingTest } from "@/lib/writing/schema"
import { countWords, MAX_WORDS, MIN_WORDS, OPTION_KEY, OPTION_LABELS, responseKey } from "@/lib/writing/words"

type TaskProps = {
  test: WritingTest
  part: number
  answers: Answers
  onAnswer: (key: string, value: string) => void
  onNext: () => void
}

function Instruction({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm font-medium text-muted-foreground">{children}</p>
}

function Task1({ test }: { test: WritingTest }) {
  const p = test.parts[0]
  return (
    <>
      <p>{p.task}</p>
      <p className="mt-3">Your email should do the following things:</p>
      <ul className="ml-6 list-disc">
        {p.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </>
  )
}

function Task2({ test, answers, onAnswer }: Pick<TaskProps, "test" | "answers" | "onAnswer">) {
  return (
    <>
      <p>
        Choose the option that you prefer. Explain the reasons for your choice. Write about {MIN_WORDS}-{MAX_WORDS} words.
      </p>
      <RadioGroup
        aria-label="Your choice"
        className="mt-3"
        value={answers[OPTION_KEY] ?? ""}
        onValueChange={(v) => onAnswer(OPTION_KEY, v)}
      >
        {test.parts[1].options.map((option, i) => (
          <div key={i} className="flex items-start gap-2">
            <RadioGroupItem id={`option-${i}`} value={OPTION_LABELS[i]} className="mt-0.5" />
            <Label htmlFor={`option-${i}`} className="leading-snug font-normal">
              Option {OPTION_LABELS[i]}: {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </>
  )
}

function TaskScreen({ test, part, answers, onAnswer, onNext }: TaskProps) {
  const left = useCountdown(test.parts[part - 1].timeLimitSec, onNext)
  const key = responseKey(part)
  const text = answers[key] ?? ""
  const p2 = test.parts[1]

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b bg-background px-4 py-2">
        <h1 className="font-semibold">
          Writing Task {part}: {SECTIONS.writing.parts[part - 1]}
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
        <Card className="py-0">
          <CardContent className="py-4">
            <Instruction>Read the following information.</Instruction>
            {part === 2 && <p className="mb-2 font-semibold">{p2.title}</p>}
            <p>{test.parts[part - 1].situation}</p>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="flex flex-col gap-3 py-4">
            <div>{part === 1 ? <Task1 test={test} /> : <Task2 test={test} answers={answers} onAnswer={onAnswer} />}</div>
            <Textarea
              aria-label="Your response"
              spellCheck
              autoCorrect="off"
              autoCapitalize="off"
              className="field-sizing-fixed min-h-72 flex-1 resize-none"
              value={text}
              onChange={(e) => onAnswer(key, e.target.value)}
            />
            <p className="text-sm text-muted-foreground" data-testid="word-count">
              Word count: {countWords(text)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function WritingTestRunner({ test, run }: { test: WritingTest; run: Run }) {
  const router = useRouter()
  const parts = runParts("writing", run)
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
    saveResult("writing", test.id, run, { answers })
    router.push(resultsPath("writing", test.id, run))
  }, [step, parts.length, test.id, run, answers, router])

  return (
    <TaskScreen
      key={`${attempt}-${step}`}
      test={test}
      part={parts[step]}
      answers={answers}
      onAnswer={onAnswer}
      onNext={onNext}
    />
  )
}
