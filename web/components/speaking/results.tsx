"use client"

import { useEffect, useState } from "react"

import { NoResult, ResultActions } from "@/components/results"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useResult } from "@/lib/results-store"
import { runLabel, runParts, type Run } from "@/lib/runs"
import { SECTIONS } from "@/lib/sections"
import { loadRecordings } from "@/lib/speaking/recordings"
import { OPTION_KEY, OPTION_LABELS, type SpeakingTask, type SpeakingTest } from "@/lib/speaking/schema"
import { TaskContent } from "./task-content"

/** Object URLs for the run's recordings, by task number. */
function useRecordingUrls(testId: string, run: Run, saved: boolean) {
  const [urls, setUrls] = useState<Record<number, string>>({})
  useEffect(() => {
    if (!saved) return
    let made: string[] = []
    loadRecordings(testId, run).then((recordings) => {
      const entries = Object.entries(recordings).map(([part, blob]) => [part, URL.createObjectURL(blob)])
      made = entries.map(([, url]) => url)
      setUrls(Object.fromEntries(entries))
    })
    return () => made.forEach((url) => URL.revokeObjectURL(url))
  }, [testId, run, saved])
  return urls
}

function samplesFor(test: SpeakingTest, part: number) {
  if (part === 5) return [{ title: `Sample answer (keeps ${test.parts[4].options[test.parts[4].sampleChoice].name})`, text: test.parts[4].sample }]
  if (part === 6) return test.parts[5].samples.map((text, i) => ({ title: `Sample answer: ${i === 0 ? "EITHER" : "OR"}`, text }))
  return [{ title: "Sample answer", text: (test.parts[part - 1] as SpeakingTask).sample }]
}

export function SpeakingResults({ test, run }: { test: SpeakingTest; run: Run }) {
  const result = useResult("speaking", test.id, run)
  const urls = useRecordingUrls(test.id, run, result !== null)
  if (!result) return <NoResult section="speaking" testId={test.id} title={test.title} run={run} />
  const choice = result.answers[OPTION_KEY]

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {test.title}: {runLabel("speaking", run)}
          </CardTitle>
          <CardDescription>
            Speaking is not scored automatically. Listen to each answer and compare it with the sample: did you answer
            every part of the task, speak for most of the time, organize your ideas and use varied vocabulary?
          </CardDescription>
        </CardHeader>
        <ResultActions section="speaking" testId={test.id} run={run} />
      </Card>
      {runParts("speaking", run).map((part) => (
        <Card key={part} data-testid={`task-${part}`}>
          <CardHeader>
            <CardTitle>
              Task {part}: {SECTIONS.speaking.parts[part - 1]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TaskContent test={test} part={part} phase="prep" choice={choice} />
            {part === 5 && (
              <p className="text-sm text-muted-foreground" data-testid="choice">
                You chose Option {choice} ({test.parts[4].options[OPTION_LABELS.indexOf(choice)].name}).
              </p>
            )}
            <div className="space-y-2">
              <h3 className="font-medium">Your answer</h3>
              {urls[part] ? (
                <audio controls src={urls[part]} aria-label={`Your answer to Task ${part}`} className="w-full" />
              ) : (
                <p className="text-sm text-muted-foreground">No recording.</p>
              )}
            </div>
            {samplesFor(test, part).map((s) => (
              <div key={s.title} className="space-y-2">
                <Separator />
                <h3 className="font-medium">{s.title}</h3>
                <p className="whitespace-pre-line">{s.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
