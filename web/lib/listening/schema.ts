import { z } from "zod"

/** A clip of the source video, in seconds. */
const segment = z
  .object({ start: z.number().min(0), end: z.number() })
  .refine((s) => s.end > s.start, "end must be after start")

/** `options`: text, or picture file names in the test folder (all four, .png/.jpg/.webp). */
const question = z.object({
  prompt: z.string(),
  options: z.array(z.string()).length(4),
  answer: z.int().min(0).max(3),
})

/** Parts 1-3: the question is spoken; `prompt` is its text, shown only on the results page. */
const spokenQuestion = question.extend({ audio: segment })

const timeLimitSec = z.int().positive()

/** `source` is the YouTube video the audio plays from. */
export const metaSchema = z.object({
  title: z.string(),
  source: z.url().regex(/[?&]v=[\w-]{11}/, "source must be a YouTube watch URL"),
})

export const part1Schema = z.object({
  sections: z
    .array(z.object({ audio: segment, questions: z.array(spokenQuestion).min(2).max(3) }))
    .length(3)
    .refine((s) => s.reduce((n, x) => n + x.questions.length, 0) === 8, "part 1 has 8 questions"),
})

const spokenPart = (count: number) => z.object({ audio: segment, questions: z.array(spokenQuestion).length(count) })
const writtenPart = (count: number) => z.object({ timeLimitSec, audio: segment, questions: z.array(question).length(count) })

export const part2Schema = spokenPart(5)
export const part3Schema = spokenPart(6)
export const part4Schema = writtenPart(5)
export const part5Schema = writtenPart(8)
export const part6Schema = writtenPart(6)

export const PART_SCHEMAS = [part1Schema, part2Schema, part3Schema, part4Schema, part5Schema, part6Schema]

export type Segment = z.infer<typeof segment>

/** Picture options are loaded as `images` (data URLs), and `options` become "A".."D". */
export type ListeningQuestion = z.infer<typeof question> & { audio?: Segment; images?: string[] }

/**
 * Every part as sections of audio followed by questions. Parts 2-6 have one section.
 * `timeLimitSec` is set for parts 4-6, where all questions are answered together after the audio.
 */
export type ListeningPart = {
  sections: { audio: Segment; questions: ListeningQuestion[] }[]
  timeLimitSec?: number
}

export type ListeningTest = { id: string; title: string; videoId: string; parts: ListeningPart[] }
