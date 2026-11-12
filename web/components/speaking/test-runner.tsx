"use client"

import { useRouter } from "next/navigation"
import { useLayoutEffect, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useCountdown } from "@/hooks/use-countdown"
import { saveResult } from "@/lib/results-store"
import { resultsPath, runLabel, runParts, type Run } from "@/lib/runs"
import { formatTime, type Answers } from "@/lib/scoring"
import { SECTIONS } from "@/lib/sections"
import { saveRecordings, startRecording } from "@/lib/speaking/recordings"
import { OPTION_KEY, TIMES, type SpeakingTest } from "@/lib/speaking/schema"
import { TaskContent, type Phase } from "./task-content"

const firstPhase = (part: number): Phase => (part === 5 ? "choose" : "prep")

const PHASE_LABEL: Record<Phase, string> = { choose: "Choose an option", prep: "Preparation time", record: "Recording" }

function PhaseTimer({ seconds, phase, onExpire }: { seconds: number; phase: Phase; onExpire: () => void }) {
  const left = useCountdown(seconds, onExpire)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        {phase === "record" ? <Badge variant="destructive">Recording</Badge> : <span />}
        <span aria-label="Time remaining" className="text-sm tabular-nums">
          {PHASE_LABEL[phase]}: {formatTime(left)}
        </span>
      </div>
      <Progress aria-label={PHASE_LABEL[phase]} value={(left / seconds) * 100} />
    </div>
  )
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        {children}
      </Card>
    </div>
  )
}

export function SpeakingTestRunner({ test, run }: { test: SpeakingTest; run: Run }) {
  const router = useRouter()
  const parts = runParts("speaking", run)
  const [attempt, setAttempt] = useState(0)
  const [started, setStarted] = useState(false)
  const [micError, setMicError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>(firstPhase(parts[0]))
  const [answers, setAnswers] = useState<Answers>({})
  const stream = useRef<MediaStream | null>(null)
  const stop = useRef<(() => Promise<Blob>) | null>(null)
  const recorded = useRef<Promise<[number, Blob]>[]>([])
  const part = parts[step]

  // Next.js keeps visited pages alive (Activity); release the microphone and start fresh whenever this page is left.
  useLayoutEffect(
    () => () => {
      stop.current?.()
      stream.current?.getTracks().forEach((t) => t.stop())
      stop.current = null
      stream.current = null
      recorded.current = []
      setStarted(false)
      setMicError(false)
      setSaving(false)
      setStep(0)
      setPhase(firstPhase(runParts("speaking", run)[0]))
      setAnswers({})
      setAttempt((a) => a + 1)
    },
    [run],
  )

  async function start() {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      setStarted(true)
    } catch {
      setMicError(true)
    }
  }

  function advance() {
    if (phase === "choose") {
      setAnswers((a) => ({ [OPTION_KEY]: "A", ...a }))
      return setPhase("prep")
    }
    if (phase === "prep") {
      stop.current = startRecording(stream.current!)
      return setPhase("record")
    }
    recorded.current.push(stop.current!().then((blob): [number, Blob] => [part, blob]))
    stop.current = null
    if (step < parts.length - 1) {
      setStep(step + 1)
      return setPhase(firstPhase(parts[step + 1]))
    }
    setSaving(true)
    Promise.all(recorded.current).then(async (entries) => {
      await saveRecordings(test.id, run, Object.fromEntries(entries))
      saveResult("speaking", test.id, run, { answers })
      stream.current?.getTracks().forEach((t) => t.stop())
      router.push(resultsPath("speaking", test.id, run))
    })
  }

  if (!started)
    return (
      <Message title={`${test.title}: ${runLabel("speaking", run)}`}>
        <CardContent className="space-y-2 text-sm">
          <p>
            Your answers are recorded with your microphone. Each task gives you preparation time, then records for a
            fixed time and moves on by itself. Next skips the rest of the current step. There is no going back.
          </p>
          <p className="text-muted-foreground">Recordings are kept only in this browser.</p>
          {micError && (
            <p role="alert" className="text-destructive">
              Microphone access is blocked. Allow it for this site, then press Start again.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={start}>Start</Button>
        </CardFooter>
      </Message>
    )

  if (saving)
    return (
      <Message title="Saving your answers">
        <CardContent>
          <CardDescription>One moment...</CardDescription>
        </CardContent>
      </Message>
    )

  const times = TIMES[part - 1]
  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b bg-background px-4 py-2">
        <h1 className="font-semibold">
          Speaking Task {part}: {SECTIONS.speaking.parts[part - 1]}
        </h1>
        <Button onClick={advance}>Next</Button>
      </div>
      <div className="mx-auto w-full max-w-5xl p-4">
        <Card>
          <CardContent className="space-y-4">
            <PhaseTimer
              key={`${attempt}-${step}-${phase}`}
              seconds={phase === "record" ? times.speak : times[phase]!}
              phase={phase}
              onExpire={advance}
            />
            <TaskContent
              test={test}
              part={part}
              phase={phase}
              choice={answers[OPTION_KEY]}
              onChoose={(v) => setAnswers((a) => ({ ...a, [OPTION_KEY]: v }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
