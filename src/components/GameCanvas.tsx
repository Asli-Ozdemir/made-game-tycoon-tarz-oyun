// src/components/GameCanvas.tsx
import { useEffect, useRef } from 'react'
import { initGame, destroyGame } from '@/pixi/Game'

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    initGame(canvasRef.current)
    return () => { destroyGame() }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    />
  )
}
