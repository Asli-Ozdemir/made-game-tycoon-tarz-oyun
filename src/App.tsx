import { useEffect, useState } from 'react'
import GameCanvas from '@/components/GameCanvas'
import HUD from '@/components/HUD'
import Dashboard from '@/components/Dashboard'
import PublishResult from '@/components/PublishResult'
import CafePanel from '@/components/CafePanel'
import FairPanel from '@/components/FairPanel'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useWorldStore } from '@/store/worldStore'

export default function App() {
  const [resultProjectId, setResultProjectId] = useState<string | null>(null)

  const advance         = useTimeStore((s) => s.advance)
  const tickAllProjects = useProjectStore((s) => s.tickAllProjects)
  const addMoney        = useGameStore((s) => s.addMoney)
  const weeklyTick      = useEmployeeStore((s) => s.weeklyTick)
  const setOnWeeklyTick = useDayTimeStore((s) => s.setOnWeeklyTick)
  const gameMode        = useWorldStore((s) => s.gameMode)
  const currentLocation = useWorldStore((s) => s.currentLocation)

  // Wire weeklyTick callback once
  useEffect(() => {
    setOnWeeklyTick(() => {
      advance()
      const tickCount = useTimeStore.getState().tickCount
      const { totalSalary } = weeklyTick(tickCount)
      if (totalSalary > 0) addMoney(-totalSalary)
      tickAllProjects()
      window.electronAPI?.saveGame({
        game:      useGameStore.getState(),
        time:      useTimeStore.getState(),
        projects:  useProjectStore.getState().projects,
        employees: useEmployeeStore.getState().employees,
      })
    })
  }, [advance, tickAllProjects, addMoney, weeklyTick, setOnWeeklyTick])

  const isTycoon = gameMode === 'tycoon'

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <GameCanvas />

      {/* HUD — always visible */}
      <div className="absolute inset-x-0 top-0 z-10">
        <HUD />
      </div>

      {/* Tycoon overlay — only interactive in tycoon mode */}
      <div
        className="absolute inset-0 z-20"
        style={{
          pointerEvents: isTycoon ? 'all' : 'none',
          opacity: isTycoon ? 1 : 0,
          background: isTycoon ? 'rgba(0,0,0,0.6)' : 'transparent',
          transition: 'opacity 0.2s',
        }}
      >
        <div className="h-full flex flex-col pt-14">
          <div className="flex-1 overflow-auto">
            <Dashboard onPublishResult={(id) => setResultProjectId(id)} />
          </div>
        </div>
      </div>

      {/* Location panels */}
      {currentLocation === 'cafe' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <CafePanel />
        </div>
      )}
      {currentLocation === 'fair' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <FairPanel />
        </div>
      )}

      {/* Publish result */}
      {resultProjectId && (
        <div className="absolute inset-0 z-30">
          <PublishResult
            projectId={resultProjectId}
            onContinue={() => setResultProjectId(null)}
          />
        </div>
      )}
    </div>
  )
}
