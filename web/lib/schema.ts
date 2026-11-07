import { z } from "zod"

const choice = z
  .object({ options: z.array(z.string()).min(2), answer: z.int().min(0) })
  .refine((c) => c.answer < c.options.length, "answer index out of range")

const question = z.intersection(z.object({ prompt: z.string() }), choice)

const blankText = (count: number) =>
  z
    .object({ text: z.string(), blanks: z.array(choice).length(count) })
    .refine(
      (b) => (b.text.match(/\{\{\d+\}\}/g) ?? []).length === b.blanks.length,
      "number of {{n}} placeholders must match blanks",
    )

const timeLimitSec = z.int().positive()

/** `source`: link to where the test came from, e.g. the YouTube video it was transcribed from. */
export const metaSchema = z.object({ title: z.string(), source: z.url().optional() })

export const part1Schema = z.object({
  timeLimitSec,
  passage: z.string(),
  questions: z.array(question).length(6),
  reply: blankText(5),
})

/** File in the test folder: an image (png, jpg, webp, gif, svg) or a static HTML page. */
export const diagramFile = z.string().regex(/\.(png|jpe?g|webp|gif|svg|html)$/i, "diagram must be an image or .html file")

export const part2Schema = z.object({
  timeLimitSec,
  diagram: diagramFile,
  email: blankText(5),
  questions: z.array(question).length(3),
})

/** Diagram resolved by the loader: an image as a data URL, or the HTML page source. */
export type Diagram = { kind: "image"; src: string } | { kind: "html"; html: string }

export const part3Schema = z.object({
  timeLimitSec,
  paragraphs: z.array(z.string()).length(4),
  statements: z.array(z.object({ text: z.string(), answer: z.enum(["A", "B", "C", "D", "E"]) })).length(9),
})

export const part4Schema = z.object({
  timeLimitSec,
  passage: z.string(),
  questions: z.array(question).length(5),
  comment: blankText(5),
})

export type Question = z.infer<typeof question>
export type BlankText = z.infer<ReturnType<typeof blankText>>
export type Part1 = z.infer<typeof part1Schema>
export type Part2 = Omit<z.infer<typeof part2Schema>, "diagram"> & { diagram: Diagram }
export type Part3 = z.infer<typeof part3Schema>
export type Part4 = z.infer<typeof part4Schema>

export type ReadingTest = {
  id: string
  title: string
  parts: [Part1, Part2, Part3, Part4]
}
