import { z } from "zod"

export { metaSchema } from "../schema"

const timeLimitSec = z.int().positive()

/** Task 1: Writing an Email. `task` is the instruction sentence; `points` are the 3 things the email must do. */
export const part1Schema = z.object({
  timeLimitSec,
  situation: z.string(),
  task: z.string(),
  points: z.array(z.string()).length(3),
  sample: z.string(),
})

/** Task 2: Responding to Survey Questions. `options` and `samples` are [Option A, Option B]. */
export const part2Schema = z.object({
  timeLimitSec,
  title: z.string(),
  situation: z.string(),
  options: z.array(z.string()).length(2),
  samples: z.array(z.string()).length(2),
})

export type WritingPart1 = z.infer<typeof part1Schema>
export type WritingPart2 = z.infer<typeof part2Schema>

export type WritingTest = {
  id: string
  title: string
  parts: [WritingPart1, WritingPart2]
}
