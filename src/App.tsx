import { useEffect, useRef, useState } from 'react'
import GameCanvas from '@/components/GameCanvas'
import HUD from '@/components/HUD'
import Dashboard from '@/components/Dashboard'
import PublishResult from '@/components/PublishResult'
import CafePanel from '@/components/CafePanel'
import FairPanel from '@/components/FairPanel'
import CharacterCreationWizard from '@/components/CharacterCreationWizard'
import CutscenePlayer from '@/components/CutscenePlayer'
import ResolutionScreen from '@/components/ResolutionScreen'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useWorldStore } from '@/store/worldStore'
import { useCharacterStore } from '@/store/characterStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useRivalStore } from '@/store/rivalStore'
import EventModal from '@/components/EventModal'
import { useEventStore } from '@/store/eventStore'

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

  const setGameMode      = useWorldStore((s) => s.setGameMode)
  const setLocation      = useWorldStore((s) => s.setLocation)
  const setIsPaused      = useDayTimeStore((s) => s.setIsPaused)
  const isCreated        = useCharacterStore((s) => s.isCreated)
  const activeCutscene   = useCutsceneStore((s) => s.activeCutscene)
  const pendingResolution = useRivalStore((s) => s.pendingResolution)
  const pendingEvent = useEventStore((s) => s.pendingEvent)

  const [toast, setToast] = useState<string | null>(null)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }

  // ESC key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Escape') return
      const { gameMode, currentLocation } = useWorldStore.getState()
      if (gameMode === 'tycoon') {
        setGameMode('exploration')
        setIsPaused(false)
      } else if (currentLocation !== null) {
        setLocation(null)
        setIsPaused(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setGameMode, setLocation, setIsPaused])

  // console.info interceptor → toast
  useEffect(() => {
    const orig = console.info.bind(console)
    console.info = (...args: unknown[]) => {
      if (typeof args[0] === 'string') showToast(args[0])
      orig(...args)
    }
    return () => { console.info = orig }
  }, [])

  // Wizard gate — render wizard until character is created
  if (!isCreated)        return <CharacterCreationWizard />
  if (activeCutscene)    return <CutscenePlayer />
  if (pendingResolution) return <ResolutionScreen />
  if (pendingEvent)      return <EventModal />

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

      {toast && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-xl text-sm shadow-xl pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  )
}
