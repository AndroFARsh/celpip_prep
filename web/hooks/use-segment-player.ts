import { useEffect, useRef, useState } from "react"

import { createPlayer, type Player } from "@/lib/listening/player"

/** Mounts a player for `videoId` inside `ref`. `player` is null until it is ready. */
export function useSegmentPlayer(videoId: string) {
  const ref = useRef<HTMLDivElement>(null)
  const [player, setPlayer] = useState<Player | null>(null)

  useEffect(() => {
    const container = ref.current!
    // The YouTube API replaces its element with an iframe, so give it one React does not manage.
    const host = document.createElement("div")
    container.append(host)
    let created: Player | undefined
    let cancelled = false
    createPlayer(host, videoId).then((p) => {
      if (cancelled) return p.destroy()
      created = p
      setPlayer(p)
    })
    return () => {
      cancelled = true
      created?.destroy()
      container.replaceChildren()
      setPlayer(null)
    }
  }, [videoId])

  return { ref, player }
}
