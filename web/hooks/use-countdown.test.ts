import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useCountdown } from "./use-countdown"

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("counts down every second", () => {
    const { result } = renderHook(() => useCountdown(10, () => {}))
    expect(result.current).toBe(10)
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current).toBe(7)
  })

  it("calls onExpire at zero and never goes negative", () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useCountdown(2, onExpire))
    act(() => vi.advanceTimersByTime(1000))
    expect(onExpire).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1000))
    expect(onExpire).toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(5000))
    expect(result.current).toBe(0)
  })
})
