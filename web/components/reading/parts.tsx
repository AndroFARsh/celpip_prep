"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  return <p className="mb-3 text-sm font-medium text-muted-foreground">{children}</p>
}

function Questions({ items, answers, onAnswer }: Omit<PartProps, "test">) {
  return (
    <ol className="space-y-4">
      {items.map((it) => (
        <li key={it.key} className="space-y-2">
          <p>
            {it.number}. {it.label}
          </p>
          <ChoiceSelect item={it} value={answers[it.key]} onChange={(v) => onAnswer(it.key, v)} />
        </li>
      ))}
    </ol>
  )
}

function BlankText({ text, items, answers, onAnswer }: Omit<PartProps, "test"> & { text: string }) {
  return (
    <div className="leading-10 whitespace-pre-line">
      {splitBlanks(text).map((seg, i) =>
        "text" in seg ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <ChoiceSelect
            key={i}
            inline
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
        <Separator className="my-6" />
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
        <h3 className="mb-3 font-semibold">{p.diagram.title}</h3>
        <Table>
          <TableHeader>
            <TableRow>
              {p.diagram.columns.map((c) => (
                <TableHead key={c}>{c}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {p.diagram.rows.map((r, i) => (
              <TableRow key={i}>
                {r.map((c, j) => (
                  <TableCell key={j} className="whitespace-normal">
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    ),
    right: (
      <>
        <Instruction>
          Read the following email message about the information on the left. Complete the email by filling in the
          blanks. Select the best choice for each blank from the drop-down menu.
        </Instruction>
        <BlankText text={p.email.text} items={items.slice(0, 5)} {...shared} />
        <Separator className="my-6" />
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
        <Separator className="my-6" />
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
