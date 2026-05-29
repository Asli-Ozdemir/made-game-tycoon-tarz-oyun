import { useEffect, useRef, useState } from 'react'
import HUD from '@/components/HUD'
import Dashboard from '@/components/Dashboard'
import PublishResult from '@/components/PublishResult'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import type { GameSpeed } from '@/types'

const TICK_MS: Record<GameSpeed, number | null> = {
  durduruldu: null,
  normal:     2000,
  hizli:      500,
  cok_hizli:  100,
}

export default function App() {
  const [resultProjectId, setResultProjectId] = useState<string | null>(null)

  const advance         = useTimeStore((s) => s.advance)
  const speed           = useTimeStore((s) => s.speed)
  const tickAllProjects = useProjectStore((s) => s.tickAllProjects)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const ms = TICK_MS[speed]
    if (ms === null) return
    intervalRef.current = setInterval(() => {
      advance()
      tickAllProjects()
      // Auto-save every 10 ticks
      const tickCount = useTimeStore.getState().tickCount
      if (tickCount % 10 === 0) {
        const saveState = {
          game:     useGameStore.getState(),
          time:     useTimeStore.getState(),
          projects: useProjectStore.getState().projects
        }
        window.electronAPI?.saveGame(saveState)
      }
    }, ms)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [speed, advance, tickAllProjects])

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <HUD />
      <div className="flex-1 overflow-auto">
        <Dashboard onPublishResult={(id) => setResultProjectId(id)} />
      </div>
      {resultProjectId && (
        <PublishResult
          projectId={resultProjectId}
          onContinue={() => setResultProjectId(null)}
        />
      )}
    </div>
  )
}
