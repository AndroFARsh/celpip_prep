"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Answers, Item } from "@/lib/scoring"
import { splitBlanks } from "@/lib/scoring"
import type { ReadingTest } from "@/lib/schema"
import { ChoiceSelect } from "./choice-select"

type PartProps = {
  test: ReadingTest
  items: Item[]
  answers: Answers
  onAnswer: (key: string, value: string) => void
}

type Pane = { left: React.ReactNode; right: React.ReactNode }

function Instruction({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm font-medium text-muted-foreground">{children}</p>
}

/** A "______" in a question prompt marks where its dropdown goes; without one, the dropdown follows the prompt. */
function Questions({ items, answers, onAnswer }: Omit<PartProps, "test">) {
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

function BlankText({ text, items, answers, onAnswer }: Omit<PartProps, "test"> & { text: string }) {
  return (
    <div className="leading-8 whitespace-pre-line">
      {splitBlanks(text).map((seg, i) =>
        "text" in seg ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <ChoiceSelect
            key={i}
            item={items[seg.blank]}
            value={answers[items[seg.blank].key]}
            onChange={(v) => onAnswer(items[seg.blank].key, v)}
          />
        ),
      )}
    </div>
  )
}

const MCQ_HINT = "Using the drop-down menu, choose the best option according to the information given"

function part1({ test, items, answers, onAnswer }: PartProps): Pane {
  const p = test.parts[0]
  const shared = { answers, onAnswer }
  return {
    left: (
      <>
        <Instruction>Read the following message.</Instruction>
        <div className="whitespace-pre-line">{p.passage}</div>
      </>
    ),
    right: (
      <>
        <Instruction>{MCQ_HINT} in the message.</Instruction>
        <Questions items={items.slice(0, 6)} {...shared} />
        <Separator className="my-3" />
        <Instruction>
          Here is a response to the message. Complete the response by filling in the blanks. Select the best choice
          for each blank from the drop-down menu.
        </Instruction>
        <BlankText text={p.reply.text} items={items.slice(6)} {...shared} />
      </>
    ),
  }
}

function part2({ test, items, answers, onAnswer }: PartProps): Pane {
  const p = test.parts[1]
  const shared = { answers, onAnswer }
  return {
    left: (
      <>
        <Instruction>Read the following information.</Instruction>
        {p.diagram.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL from the test folder
          <img
            src={p.diagram.src}
            alt="Diagram"
            className="mx-auto max-h-[calc(100dvh-15rem)] w-auto max-w-full rounded-md border object-contain"
          />
        ) : (
          <iframe
            srcDoc={p.diagram.html}
            sandbox=""
            title="Diagram"
            className="h-[calc(100dvh-15rem)] w-full rounded-md border bg-white"
          />
        )}
      </>
    ),
    right: (
      <>
        <Instruction>
          Read the following email message about the information on the left. Complete the email by filling in the
          blanks. Select the best choice for each blank from the drop-down menu.
        </Instruction>
        <BlankText text={p.email.text} items={items.slice(0, 5)} {...shared} />
        <Separator className="my-3" />
        <Instruction>{MCQ_HINT} in the diagram and the email.</Instruction>
        <Questions items={items.slice(5)} {...shared} />
      </>
    ),
  }
}

function part3({ test, items, answers, onAnswer }: PartProps): Pane {
  const p = test.parts[2]
  return {
    left: (
      <>
        <Instruction>Read the following passage.</Instruction>
        <div className="space-y-4">
          {p.paragraphs.map((text, i) => (
            <div key={i} className="flex gap-3">
              <Badge variant="secondary" className="h-6 shrink-0">
                {"ABCD"[i]}
              </Badge>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </>
    ),
    right: (
      <>
        <Instruction>
          Decide which paragraph, A to D, has the information given in each statement below. Select E if the
          information is not given in any of the paragraphs.
        </Instruction>
        <Questions items={items} answers={answers} onAnswer={onAnswer} />
      </>
    ),
  }
}

function part4({ test, items, answers, onAnswer }: PartProps): Pane {
  const p = test.parts[3]
  const shared = { answers, onAnswer }
  return {
    left: (
      <>
        <Instruction>Read the following article.</Instruction>
        <div className="whitespace-pre-line">{p.passage}</div>
      </>
    ),
    right: (
      <>
        <Instruction>{MCQ_HINT} in the article.</Instruction>
        <Questions items={items.slice(0, 5)} {...shared} />
        <Separator className="my-3" />
        <Instruction>
          The following is a comment by a visitor to the website page. Complete the comment by choosing the best
          option to fill in each blank.
        </Instruction>
        <BlankText text={p.comment.text} items={items.slice(5)} {...shared} />
      </>
    ),
  }
}

export const PANES = [part1, part2, part3, part4]
