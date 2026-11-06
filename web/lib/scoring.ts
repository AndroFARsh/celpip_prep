import type { BlankText, Question, ReadingTest } from "./schema"

export const PART_NAMES = [
  "Reading Correspondence",
  "Reading to Apply a Diagram",
  "Reading for Information",
  "Reading for Viewpoints",
] as const

export const PARAGRAPH_OPTIONS = ["A", "B", "C", "D", "E: Not given in any of the paragraphs"]

export type Item = {
  key: string
  part: number
  number: number
  label: string
  options: string[]
  answer: string
}

export type Answers = Record<string, string>

const fromQuestions = (part: number, prefix: string, qs: Question[]) =>
  qs.map((q, i) => ({ key: `p${part}-${prefix}${i}`, label: q.prompt, options: q.options, answer: q.options[q.answer] }))

const fromBlanks = (part: number, prefix: string, b: BlankText) =>
  b.blanks.map((x, i) => ({ key: `p${part}-${prefix}${i}`, label: `Blank ${i + 1}`, options: x.options, answer: x.options[x.answer] }))

export function itemsForPart(test: ReadingTest, part: number): Item[] {
  const [p1, p2, p3, p4] = test.parts
  const items = [
    () => [...fromQuestions(1, "q", p1.questions), ...fromBlanks(1, "b", p1.reply)],
    () => [...fromBlanks(2, "b", p2.email), ...fromQuestions(2, "q", p2.questions)],
    () =>
      p3.statements.map((s, i) => ({ key: `p3-s${i}`, label: s.text, options: PARAGRAPH_OPTIONS, answer: PARAGRAPH_OPTIONS["ABCDE".indexOf(s.answer)] })),
    () => [...fromQuestions(4, "q", p4.questions), ...fromBlanks(4, "b", p4.comment)],
  ][part - 1]()
  return items.map((it, i) => ({ ...it, part, number: i + 1 }))
}

export function allItems(test: ReadingTest) {
  return [1, 2, 3, 4].flatMap((p) => itemsForPart(test, p))
}

export function score(items: Item[], answers: Answers) {
  return items.filter((it) => answers[it.key] === it.answer).length
}

export function splitBlanks(text: string) {
  return text.split(/\{\{(\d+)\}\}/).map((s, i) => (i % 2 ? { blank: Number(s) - 1 } : { text: s }))
}

export function formatTime(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`
}
