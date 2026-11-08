"use client"

import { ChoiceSelect } from "@/components/choice-select"
import type { Answers, Item } from "@/lib/scoring"

type Props = { items: Item[]; answers: Answers; onAnswer: (key: string, value: string) => void }

/** A "______" in a question prompt marks where its dropdown goes; without one, the dropdown follows the prompt. */
export function Questions({ items, answers, onAnswer }: Props) {
  return (
    <ol className="space-y-1 leading-8">
      {items.map((it) => {
        const [before, after] = it.label.split(/_{3,}/, 2)
        return (
          <li key={it.key}>
            {it.number}. {before}
            <ChoiceSelect item={it} value={answers[it.key]} onChange={(v) => onAnswer(it.key, v)} />
            {after}
          </li>
        )
      })}
    </ol>
  )
}
