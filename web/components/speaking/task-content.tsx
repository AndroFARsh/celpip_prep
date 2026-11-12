"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { OPTION_LABELS, type SpeakingPart5, type SpeakingTest } from "@/lib/speaking/schema"

type Option = SpeakingPart5["options"][number]

/** "choose" is Task 5's first screen; the other tasks start at "prep". */
export type Phase = "choose" | "prep" | "record"

function Picture({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- data URL from the test folder
  return <img src={src} alt={alt} className="mx-auto max-h-80 w-auto max-w-full rounded-md border object-contain" />
}

function OptionBlock({ option, children }: { option: Option; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <Picture src={option.image} alt={option.name} />
      {children}
      <ul className="ml-6 list-disc text-sm">
        {option.details.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </div>
  )
}

/** Index (0 or 1) of the option chosen in Task 5. */
export const choiceIndex = (choice: string | undefined) => Math.max(OPTION_LABELS.indexOf(choice ?? "A"), 0)

type Props = {
  test: SpeakingTest
  part: number
  phase: Phase
  /** Task 5: the chosen option, "A" or "B". */
  choice?: string
  onChoose?: (choice: string) => void
}

function Task5({ p, phase, choice, onChoose }: { p: SpeakingPart5 } & Omit<Props, "test" | "part">) {
  if (phase === "choose")
    return (
      <>
        <p className="font-medium">{p.prompt}</p>
        <RadioGroup aria-label="Your choice" className="grid gap-4 md:grid-cols-2" value={choice ?? ""} onValueChange={onChoose}>
          {p.options.map((o, i) => (
            <OptionBlock key={o.name} option={o}>
              <div className="flex items-center gap-2">
                <RadioGroupItem id={`option-${i}`} value={OPTION_LABELS[i]} />
                <Label htmlFor={`option-${i}`}>
                  Option {OPTION_LABELS[i]}: {o.name}
                </Label>
              </div>
            </OptionBlock>
          ))}
        </RadioGroup>
      </>
    )
  const chosen = p.options[choiceIndex(choice)]
  return (
    <>
      <p className="font-medium">{p.compare.replace("{choice}", chosen.name)}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { option: chosen, label: "Your choice" },
          { option: p.alternative, label: "New option" },
        ].map(({ option, label }) => (
          <OptionBlock key={label} option={option}>
            <p className="font-medium">
              {label}: {option.name}
            </p>
          </OptionBlock>
        ))}
      </div>
    </>
  )
}

export function TaskContent({ test, part, phase, choice, onChoose }: Props) {
  if (part === 5) return <Task5 p={test.parts[4]} phase={phase} choice={choice} onChoose={onChoose} />
  if (part === 6) {
    const p = test.parts[5]
    return (
      <>
        <p className="font-medium">{p.prompt}</p>
        <p>Choose ONE:</p>
        <ul className="ml-6 list-disc">
          {p.choices.map((c, i) => (
            <li key={c}>
              {i === 0 ? "EITHER" : "OR"}: {c}
            </li>
          ))}
        </ul>
      </>
    )
  }
  const p = test.parts[part - 1] as SpeakingTest["parts"][0]
  return (
    <>
      <p className="font-medium">{p.prompt}</p>
      {p.image && <Picture src={p.image} alt="Picture for this task" />}
    </>
  )
}
