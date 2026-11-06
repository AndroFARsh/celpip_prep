import { useEffect, useState } from "react"

export function useCountdown(seconds: number, onExpire: () => void) {
  const [left, setLeft] = useState(seconds)

  useEffect(() => {
    const id = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (left <= 0) onExpire()
  }, [left, onExpire])

  return Math.max(left, 0)
}
