import { z } from "zod"

export { metaSchema } from "../schema"

/** Picture file in the test folder. The loader replaces it with a data URL. */
const image = z.string().regex(/\.(png|jpe?g|webp)$/i, "image must be a png, jpg or webp file")

export const taskSchema = z.object({ prompt: z.string(), sample: z.string() })
export const pictureTaskSchema = taskSchema.extend({ image })

const option = z.object({ name: z.string(), image, details: z.array(z.string()).min(1) })

/** Task 5: choose one of `options`, then persuade against `alternative`. `compare` names the pick as `{choice}`. */
export const part5Schema = z.object({
  prompt: z.string(),
  options: z.array(option).length(2),
  alternative: option,
  compare: z.string().includes("{choice}"),
  /** The option (0 or 1) that `sample` argues for. */
  sampleChoice: z.union([z.literal(0), z.literal(1)]),
  sample: z.string(),
})

/** Task 6: speak about one of two `choices`; `samples` has a model answer for each. */
export const part6Schema = z.object({
  prompt: z.string(),
  choices: z.array(z.string()).length(2),
  samples: z.array(z.string()).length(2),
})

export type SpeakingTask = z.infer<typeof taskSchema> & { image?: string }
export type SpeakingPart5 = z.infer<typeof part5Schema>
export type SpeakingPart6 = z.infer<typeof part6Schema>
export type SpeakingPart = SpeakingTask | SpeakingPart5 | SpeakingPart6

export type SpeakingTest = {
  id: string
  title: string
  parts: [SpeakingTask, SpeakingTask, SpeakingTask, SpeakingTask, SpeakingPart5, SpeakingPart6, SpeakingTask, SpeakingTask]
}

/** Seconds per task in the real test: `choose` is Task 5's time to pick an option. */
export const TIMES = [
  { prep: 30, speak: 90 },
  { prep: 30, speak: 60 },
  { prep: 30, speak: 60 },
  { prep: 30, speak: 60 },
  { choose: 60, prep: 60, speak: 60 },
  { prep: 60, speak: 60 },
  { prep: 30, speak: 90 },
  { prep: 30, speak: 60 },
]

export const OPTION_KEY = "p5-option"
export const OPTION_LABELS = ["A", "B"]
