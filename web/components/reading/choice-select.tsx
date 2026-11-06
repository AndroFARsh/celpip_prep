"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Item } from "@/lib/scoring"

type Props = {
  item: Item
  value: string | undefined
  onChange: (value: string) => void
  inline?: boolean
}

export function ChoiceSelect({ item, value, onChange, inline }: Props) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger
        aria-label={`Question ${item.number}`}
        size="sm"
        className={inline ? "mx-1 inline-flex max-w-full align-middle" : "h-auto w-full whitespace-normal text-left"}
      >
        <SelectValue placeholder={inline ? `(${item.number})` : "Choose an answer"} />
      </SelectTrigger>
      <SelectContent position="popper">
        {item.options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
