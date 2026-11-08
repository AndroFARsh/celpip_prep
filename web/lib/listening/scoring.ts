import type { Item } from "../scoring"
import type { ListeningTest } from "./schema"

/** Questions of a part, numbered from 1 within the part. */
export function itemsForPart(test: ListeningTest, part: number): Item[] {
  return test.parts[part - 1].sections
    .flatMap((s) => s.questions)
    .map((q, i) => ({
      key: `p${part}-q${i}`,
      part,
      number: i + 1,
      label: q.prompt,
      options: q.options,
      images: q.images,
      answer: q.options[q.answer],
    }))
}
