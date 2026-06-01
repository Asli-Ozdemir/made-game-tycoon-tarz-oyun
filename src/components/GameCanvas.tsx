// src/components/GameCanvas.tsx
import { useEffect, useRef } from 'react'
import { initGame, destroyGame } from '@/pixi/Game'

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    initGame(el).catch((err) => {
      console.error('[GameCanvas] initGame failed:', err)
    })

    return () => { destroyGame() }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#1a1a2e' }}
    />
  )
}
