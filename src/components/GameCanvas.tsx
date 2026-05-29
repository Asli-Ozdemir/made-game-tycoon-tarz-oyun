// src/components/GameCanvas.tsx
import { useEffect, useRef } from 'react'
import { initGame, destroyGame } from '@/pixi/Game'

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let cleanup = false

    initGame(el).then(() => {
      if (cleanup) destroyGame()
    })

    return () => {
      cleanup = true
      destroyGame()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    />
  )
}
