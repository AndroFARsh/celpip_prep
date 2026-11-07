"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Item } from "@/lib/scoring"

type Props = {
  item: Item
  value: string | undefined
  onChange: (value: string) => void
}

/** Inline dropdown that always shows its question number, before and after an option is picked. */
export function ChoiceSelect({ item, value, onChange }: Props) {
  const longest = item.options.reduce((a, b) => (b.length > a.length ? b : a))
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger aria-label={`Question ${item.number}`} size="sm" className="mx-1 inline-flex max-w-full align-middle">
        <span className="shrink-0">({item.number})</span>
        {/* Stack the longest option (invisible) under the value so the width is fixed before and after a pick. */}
        <span className="grid min-w-0">
          <span aria-hidden className="invisible col-start-1 row-start-1 truncate">
            {longest}
          </span>
          <span className="col-start-1 row-start-1 truncate">
            <SelectValue />
          </span>
        </span>
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
