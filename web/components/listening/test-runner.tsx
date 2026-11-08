"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react"

import { Questions } from "@/components/questions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCountdown } from "@/hooks/use-countdown"
import { useSegmentPlayer } from "@/hooks/use-segment-player"
import type { ListeningPart, ListeningTest, Segment } from "@/lib/listening/schema"
import { itemsForPart } from "@/lib/listening/scoring"
import { saveResult } from "@/lib/results-store"
import { resultsPath, runParts, type Run } from "@/lib/runs"
import { formatTime, score, type Answers, type Item } from "@/lib/scoring"
import { SECTIONS } from "@/lib/sections"
import { cn } from "@/lib/utils"

/** Time to answer each spoken question in parts 1-3. */
export const QUESTION_SEC = 30

type Phase =
  | { kind: "intro" }
  | { kind: "audio"; section: number }
  | { kind: "question"; section: number; question: number; playing: boolean }
  | { kind: "answer" }
  | { kind: "done" }

type State = { step: number; phase: Phase }

const START: State = { step: 0, phase: { kind: "intro" } }

const LISTEN_TO = ["conversation", "conversation", "conversation", "news item", "discussion", "report"]

/** The phase after `phase` in this part, or null when the part is over. */
function nextPhase(part: ListeningPart, phase: Phase): Phase | null {
  switch (phase.kind) {
    case "intro":
      return { kind: "audio", section: 0 }
    case "audio":
      return part.timeLimitSec ? { kind: "answer" } : { kind: "question", section: phase.section, question: 0, playing: true }
    case "question": {
      const { section, question } = phase
      if (phase.playing) return { ...phase, playing: false }
      if (question + 1 < part.sections[section].questions.length)
        return { kind: "question", section, question: question + 1, playing: true }
      if (section + 1 < part.sections.length) return { kind: "audio", section: section + 1 }
      return null
    }
    default:
      return null
  }
}

function intro(part: ListeningPart, n: number) {
  const count = part.sections.reduce((sum, s) => sum + s.questions.length, 0)
  if (part.sections.length > 1)
    return `You will hear a conversation in ${part.sections.length} sections. You will hear each section only once. After each section, you will hear 2 or 3 questions. You will hear the questions only once. Choose the best answer to each question.`
  if (!part.timeLimitSec)
    return `You will hear a ${LISTEN_TO[n - 1]} only once. After it, you will hear ${count} questions. You will hear the questions only once. Choose the best answer to each question.`
  return `You will hear a ${LISTEN_TO[n - 1]} only once. Then answer ${count} questions using the drop-down menus. You have ${part.timeLimitSec / 60} minutes to answer.`
}

function Instruction({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm font-medium text-muted-foreground">{children}</p>
}

function Timer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const left = useCountdown(seconds, onExpire)
  return (
    <Badge
      variant="outline"
      aria-label="Time remaining"
      className={cn("tabular-nums", left < 10 && "border-red-500 text-red-600")}
    >
      Time remaining: {formatTime(left)}
    </Badge>
  )
}

function SpokenQuestion({ item, total, value, onAnswer }: { item: Item; total: number; value?: string; onAnswer: (v: string) => void }) {
  return (
    <>
      <Instruction>
        Question {item.number} of {total}
      </Instruction>
      <p className="mb-4 font-medium">Choose the best answer to each question.</p>
      <RadioGroup
        aria-label={`Question ${item.number}`}
        value={value ?? ""}
        onValueChange={onAnswer}
        className={cn(item.images && "grid-cols-2")}
      >
        {item.options.map((o, i) => (
          <div key={o} className="flex items-center gap-3">
            <RadioGroupItem value={o} id={`${item.key}-${i}`} />
            <Label htmlFor={`${item.key}-${i}`} className="text-base font-normal">
              {item.images ? (
                <>
                  {o}.
                  {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the test folder */}
                  <img src={item.images[i]} alt={`Option ${o}`} className="h-28 w-auto rounded border" />
                </>
              ) : (
                o
              )}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </>
  )
}

export function TestRunner({ test, run }: { test: ListeningTest; run: Run }) {
  const router = useRouter()
  const parts = useMemo(() => runParts("listening", run), [run])
  const [{ step, phase }, setState] = useState(START)
  const [attempt, setAttempt] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [progress, setProgress] = useState<{ segment?: Segment; fraction: number }>({ fraction: 0 })
  const { ref, player } = useSegmentPlayer(test.videoId)

  // Next.js keeps visited pages alive (Activity); start fresh whenever this page is left.
  useLayoutEffect(
    () => () => {
      setState(START)
      setAnswers({})
      setAttempt((a) => a + 1)
    },
    [],
  )

  const advance = useCallback(
    () =>
      setState((s) => {
        if (s.phase.kind === "done") return s
        const next = nextPhase(test.parts[parts[s.step] - 1], s.phase)
        if (next) return { ...s, phase: next }
        return s.step + 1 < parts.length ? { step: s.step + 1, phase: { kind: "intro" } } : { ...s, phase: { kind: "done" } }
      }),
    [test, parts],
  )

  const partNumber = parts[step]
  const part = test.parts[partNumber - 1]
  const items = itemsForPart(test, partNumber)
  const segment =
    phase.kind === "audio"
      ? part.sections[phase.section].audio
      : phase.kind === "question" && phase.playing
        ? part.sections[phase.section].questions[phase.question].audio
        : undefined

  useEffect(() => {
    if (!segment || !player) return
    let cancelled = false
    player
      .play(segment, (fraction) => !cancelled && setProgress({ segment, fraction }))
      .then(() => !cancelled && advance())
    return () => {
      cancelled = true
    }
  }, [segment, player, advance])

  useEffect(() => {
    if (phase.kind !== "done") return
    const all = parts.flatMap((p) => itemsForPart(test, p))
    saveResult("listening", test.id, run, { answers, score: score(all, answers), total: all.length })
    router.push(resultsPath("listening", test.id, run))
  }, [phase, parts, test, run, answers, router])

  const onAnswer = (key: string, value: string) => setAnswers((a) => ({ ...a, [key]: value }))
  const answering = phase.kind === "answer" || (phase.kind === "question" && !phase.playing)
  const timerKey = `${attempt}-${step}-${JSON.stringify(phase)}`

  let right: React.ReactNode = null
  if (phase.kind === "intro") right = <p>{intro(part, partNumber)}</p>
  if (phase.kind === "audio")
    right = (
      <Instruction>
        {part.sections.length > 1 && `Section ${phase.section + 1} of ${part.sections.length}. `}
        Listen to the {LISTEN_TO[partNumber - 1]}. You will hear it only once.
      </Instruction>
    )
  if (phase.kind === "question") {
    const index = part.sections.slice(0, phase.section).reduce((n, s) => n + s.questions.length, 0) + phase.question
    const item = items[index]
    right = (
      <SpokenQuestion
        key={item.key}
        item={item}
        total={items.length}
        value={answers[item.key]}
        onAnswer={(v) => onAnswer(item.key, v)}
      />
    )
  }
  if (phase.kind === "answer")
    right = (
      <>
        <Instruction>Choose the best answer to each question from the drop-down menu.</Instruction>
        <Questions items={items} answers={answers} onAnswer={onAnswer} />
      </>
    )

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b bg-background px-4 py-2">
        <h1 className="font-semibold">
          Listening Part {partNumber}: {SECTIONS.listening.parts[partNumber - 1]}
        </h1>
        <div className="flex items-center gap-2">
          {answering && (
            <Timer key={timerKey} seconds={phase.kind === "answer" ? part.timeLimitSec! : QUESTION_SEC} onExpire={advance} />
          )}
          {(phase.kind === "intro" || answering) && <Button onClick={advance}>Next</Button>}
        </div>
      </div>
      <div className="grid flex-1 gap-4 p-4 md:grid-cols-2">
        <Card className="py-0">
          <CardContent className="space-y-3 py-4">
            <div ref={ref} className="pointer-events-none aspect-video w-full overflow-hidden rounded-md border bg-muted" />
            {segment ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">Playing</p>
                <Progress aria-label="Audio progress" value={(progress.segment === segment ? progress.fraction : 0) * 100} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {phase.kind === "intro" ? "The audio starts when you press Next and plays only once." : "Audio finished."}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="py-0">
          <ScrollArea className="md:h-[calc(100dvh-9.5rem)]">
            <CardContent className="py-4">{right}</CardContent>
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}
