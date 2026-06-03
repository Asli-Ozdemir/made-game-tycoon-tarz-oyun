// src/components/ArcadePanel.tsx
import { useEffect, useRef, useState } from 'react'
import { useWorldStore }   from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useArcadeStore }  from '@/store/arcadeStore'
import { ARCADE_SHIFTS }   from '@/data/arcadeShifts'
import { ArcadeShiftScene } from '@/pixi/ArcadeShiftScene'
import { RetroGameScene }   from '@/pixi/RetroGameScene'
import type { ArcadeSessionResult } from '@/store/arcadeStore'

type PanelPhase = 'briefing' | 'customer' | 'shift' | 'retro_game' | 'machine_choice' | 'result'

const ARC_LABELS: Record<string, string> = {
  arc_glory:  'Arc of Glory',
  arc_denial: 'Arc of Denial',
  arc_truth:  'Arc of Truth',
}

const DIFF_COLORS: Record<string, string> = {
  easy:   'text-green-400',
  normal: 'text-yellow-400',
  hard:   'text-red-400',
}

const TIER_COLORS: Record<string, string> = {
  good: 'text-green-400',
  okay: 'text-yellow-400',
  bad:  'text-red-400',
}

export default function ArcadePanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  const activeShift      = useArcadeStore((s) => s.activeShift)
  const completedShifts  = useArcadeStore((s) => s.completedShifts)

  const [phase, setPhase] = useState<PanelPhase>('briefing')
  const [sessionResult, setSessionResult] = useState<ArcadeSessionResult | null>(null)

  // Customer phase local state
  const [customerScore,   setCustomerScore]   = useState(50)
  const [customerIdx,     setCustomerIdx]      = useState(0)
  const [feedback,        setFeedback]         = useState<string | null>(null)

  // Canvas refs
  const shiftCanvasRef  = useRef<HTMLCanvasElement>(null)
  const retroCanvasRef  = useRef<HTMLCanvasElement>(null)
  const shiftSceneRef   = useRef<ArcadeShiftScene | null>(null)
  const retroSceneRef   = useRef<RetroGameScene | null>(null)

  // Pause day-time clock while panel is open
  useEffect(() => {
    setIsPaused(true)
    return () => setIsPaused(false)
  }, [setIsPaused])

  // Escape key closes from briefing / result
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape' && (phase === 'briefing' || phase === 'result')) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Mount ArcadeShiftScene ───────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'shift') return
    if (!activeShift) return
    const canvas = shiftCanvasRef.current
    if (!canvas) return

    let scene: ArcadeShiftScene | null = null
    let cancelled = false

    ArcadeShiftScene.create({
      canvas,
      width: 500,
      height: 280,
      brokenMachines: activeShift.brokenMachines,
      timeLimitSecs:  activeShift.timeLimitSecs,
      onShiftEnd: (repairScore) => {
        // Stale-closure rule: always use getState()
        const cs = useArcadeStore.getState().customerScore
        useArcadeStore.getState().recordShiftResult(cs, repairScore)
        scene?.destroy()
        shiftSceneRef.current = null
        const newPhase = useArcadeStore.getState().phase
        if (newPhase === 'retro_game') setPhase('retro_game')
        else setPhase('result')
      },
    }).then(s => {
      if (cancelled) { s.destroy(); return }
      scene = s
      shiftSceneRef.current = s
    })

    return () => {
      cancelled = true
      scene?.destroy()
      shiftSceneRef.current = null
    }
  }, [phase, activeShift?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Mount RetroGameScene ──────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'retro_game') return
    if (!activeShift?.retroGame) return
    const canvas = retroCanvasRef.current
    if (!canvas) return

    let scene: RetroGameScene | null = null
    let cancelled = false

    RetroGameScene.create({
      canvas,
      width: 600,
      height: 340,
      gameType: activeShift.retroGame,
      arcId:    activeShift.arcId,
      onComplete: (winner) => {
        useArcadeStore.getState().recordRetroResult(winner)
        scene?.destroy()
        retroSceneRef.current = null
        setPhase('machine_choice')
      },
    }).then(s => {
      if (cancelled) { s.destroy(); return }
      scene = s
      retroSceneRef.current = s
    })

    return () => {
      cancelled = true
      scene?.destroy()
      retroSceneRef.current = null
    }
  }, [phase, activeShift?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function close() {
    shiftSceneRef.current?.destroy()
    shiftSceneRef.current = null
    retroSceneRef.current?.destroy()
    retroSceneRef.current = null
    useArcadeStore.getState().reset()
    setLocation(null)
  }

  // ─── Phase handlers ────────────────────────────────────────────────────────

  function handlePickShift(shiftId: string) {
    useArcadeStore.getState().startShift(shiftId)
    useArcadeStore.getState().advanceFromBriefing()
    // Reset customer state
    setCustomerScore(50)
    setCustomerIdx(0)
    setFeedback(null)
    setPhase('customer')
  }

  function handleTokenPick(count: number) {
    if (!activeShift) return
    const customer = activeShift.customers[customerIdx]
    if (!customer) return
    if (count === customer.tokenRequest) {
      setCustomerScore(s => Math.min(100, s + 10))
      setFeedback('Correct! +10')
    } else {
      setCustomerScore(s => Math.max(0, s - 8))
      setFeedback(`Wrong. -8  (needed ${customer.tokenRequest})`)
    }
  }

  function handlePrizePick(tier: 'small' | 'medium' | 'large') {
    if (!activeShift) return
    const customer = activeShift.customers[customerIdx]
    if (!customer) return
    if (tier === customer.desiredPrizeTier) {
      setCustomerScore(s => Math.min(100, s + 10))
      setFeedback('Correct! +10')
    } else {
      setCustomerScore(s => Math.max(0, s - 8))
      setFeedback(`Wrong. -8  (wanted ${customer.desiredPrizeTier})`)
    }
    // Move to next customer after prize pick
    setTimeout(() => {
      setFeedback(null)
      const nextIdx = customerIdx + 1
      if (!activeShift || nextIdx >= activeShift.customers.length) {
        // Store the current customerScore before switching phase
        useArcadeStore.setState({ customerScore })
        setPhase('shift')
      } else {
        setCustomerIdx(nextIdx)
      }
    }, 700)
  }

  function handleMachineChoice(machineId: string) {
    useArcadeStore.getState().chooseMachine(machineId)
    setPhase('result')
  }

  function handleEndShift() {
    const result = useArcadeStore.getState().endShift()
    setSessionResult(result)
  }

  // ─── Render helpers ────────────────────────────────────────────────────────

  function renderBriefing() {
    const available = ARCADE_SHIFTS.filter(s => !completedShifts.includes(s.id))
    const done      = ARCADE_SHIFTS.filter(s =>  completedShifts.includes(s.id))

    return (
      <div className="flex flex-col gap-3">
        <p className="text-blue-300 font-mono text-xs uppercase tracking-widest mb-1">
          Choose a Shift
        </p>

        {available.length === 0 && (
          <p className="text-blue-500 font-mono text-sm italic">
            All shifts complete. Thanks for helping out.
          </p>
        )}

        {available.map(s => (
          <button
            key={s.id}
            onClick={() => handlePickShift(s.id)}
            className="text-left border border-blue-800 rounded-lg p-3 hover:bg-blue-950/60 hover:border-blue-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-100 font-mono text-sm font-semibold">
                {ARC_LABELS[s.arcId] ?? s.arcId}
              </span>
              <span className={`font-mono text-xs uppercase ${DIFF_COLORS[s.difficulty]}`}>
                {s.difficulty}
              </span>
            </div>
            <p className="text-blue-400 font-mono text-xs leading-snug">
              &ldquo;{s.briefingLines[0]}&rdquo;
            </p>
            <p className="text-blue-600 font-mono text-xs mt-1">
              {s.customers.length} customer{s.customers.length !== 1 ? 's' : ''}
              &nbsp;&middot;&nbsp;
              {s.brokenMachines.length} machine{s.brokenMachines.length !== 1 ? 's' : ''} to fix
              {s.isArcEnd && (
                <span className="text-amber-500 ml-2">★ Arc End</span>
              )}
            </p>
          </button>
        ))}

        {done.length > 0 && (
          <p className="text-blue-700 font-mono text-xs mt-1">
            {done.length} shift{done.length !== 1 ? 's' : ''} completed
          </p>
        )}
      </div>
    )
  }

  function renderCustomer() {
    if (!activeShift) return null
    const customer = activeShift.customers[customerIdx]
    if (!customer) return null

    return (
      <div className="flex flex-col gap-4">
        <p className="text-blue-300 font-mono text-xs uppercase tracking-widest">
          Customer Queue
          <span className="text-blue-600 ml-2 normal-case">
            {customerIdx + 1} / {activeShift.customers.length}
          </span>
        </p>

        <div className="border border-blue-800 rounded-lg p-4 bg-blue-950/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100 font-mono text-sm font-semibold">{customer.name}</p>
            {customer.isImpatient && (
              <span className="text-red-400 font-mono text-xs">IMPATIENT</span>
            )}
          </div>
          <p className="text-blue-400 font-mono text-xs">
            Wants: <span className="text-blue-200">{customer.tokenRequest} token{customer.tokenRequest !== 1 ? 's' : ''}</span>
            &nbsp;&middot;&nbsp;
            Prize: <span className="text-blue-200">{customer.desiredPrizeTier}</span>
          </p>
        </div>

        {feedback && (
          <p className={`font-mono text-sm ${feedback.startsWith('Correct') ? 'text-green-400' : 'text-red-400'}`}>
            {feedback}
          </p>
        )}

        <div>
          <p className="text-blue-400 font-mono text-xs mb-2">Give tokens:</p>
          <div className="flex gap-2">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                onClick={() => handleTokenPick(n)}
                className="border border-blue-700 rounded px-4 py-2 font-mono text-sm text-blue-200 hover:bg-blue-900/40 hover:border-blue-500 transition-colors"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-blue-400 font-mono text-xs mb-2">Give prize tier:</p>
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as const).map(tier => (
              <button
                key={tier}
                onClick={() => handlePrizePick(tier)}
                className="border border-blue-700 rounded px-3 py-2 font-mono text-xs text-blue-200 hover:bg-blue-900/40 hover:border-blue-500 transition-colors capitalize"
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-blue-900 pt-2">
          <p className="text-blue-600 font-mono text-xs">
            Customer score: <span className="text-blue-300">{customerScore}</span>
          </p>
        </div>
      </div>
    )
  }

  function renderShift() {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-blue-300 font-mono text-xs uppercase tracking-widest mb-1">
          Repair Shift
        </p>
        <p className="text-blue-500 font-mono text-xs mb-2">
          Click broken machines (red border) to fix them before time runs out.
        </p>
        <canvas
          ref={shiftCanvasRef}
          width={500}
          height={280}
          style={{ display: 'block' }}
          className="rounded-lg border border-blue-900"
        />
      </div>
    )
  }

  function renderRetroGame() {
    if (!activeShift) return null
    const gameLabels: Record<string, string> = {
      pong:           'Pong',
      space_invaders: 'Space Invaders',
      breakout:       'Breakout',
    }
    const label = activeShift.retroGame ? (gameLabels[activeShift.retroGame] ?? activeShift.retroGame) : '?'

    return (
      <div className="flex flex-col gap-2">
        <p className="text-blue-300 font-mono text-xs uppercase tracking-widest mb-1">
          {label} — vs Rex
        </p>
        <p className="text-blue-500 font-mono text-xs mb-2">
          {activeShift.retroGame === 'pong'
            ? 'W/S or Arrow keys · First to 5 wins'
            : activeShift.retroGame === 'space_invaders'
            ? 'A/D to move · Space to shoot · Clear your invaders first'
            : 'A/D to move paddle · Break all your bricks first'}
        </p>
        <canvas
          ref={retroCanvasRef}
          width={600}
          height={340}
          style={{ display: 'block' }}
          className="rounded-lg border border-blue-900"
        />
      </div>
    )
  }

  function renderMachineChoice() {
    if (!activeShift?.machineChoices) return null

    return (
      <div className="flex flex-col gap-3">
        <p className="text-blue-300 font-mono text-xs uppercase tracking-widest">
          Machine Choice
        </p>
        <p className="text-blue-500 font-mono text-xs">
          Rex asks which machine should stay closed. Your choice shapes the story.
        </p>
        {activeShift.machineChoices.map(mc => (
          <button
            key={mc}
            onClick={() => handleMachineChoice(mc)}
            className="text-left border border-blue-800 rounded-lg p-3 hover:bg-blue-950/60 hover:border-blue-600 transition-colors"
          >
            <p className="text-blue-100 font-mono text-sm">{mc}</p>
          </button>
        ))}
      </div>
    )
  }

  function renderResult() {
    const r = sessionResult

    return (
      <div className="flex flex-col gap-4">
        <p className="text-blue-300 font-mono text-xs uppercase tracking-widest">
          Shift Complete
        </p>

        {r ? (
          <div className="border border-blue-800 rounded-lg p-4 bg-blue-950/30 flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-blue-400 font-mono text-xs">Result</span>
              <span className={`font-mono text-xs uppercase font-semibold ${TIER_COLORS[r.tier]}`}>
                {r.tier}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400 font-mono text-xs">game_history seeds</span>
              <span className="text-blue-100 font-mono text-sm">+{r.gameHistorySeeds}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400 font-mono text-xs">nostalji seeds</span>
              <span className="text-blue-100 font-mono text-sm">+{r.nostaljiSeeds}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400 font-mono text-xs">huzur progress</span>
              <span className="text-blue-100 font-mono text-sm">+{r.progress}</span>
            </div>
          </div>
        ) : (
          <div className="border border-blue-800 rounded-lg p-4 bg-blue-950/30">
            <button
              onClick={handleEndShift}
              className="w-full border border-blue-700 rounded-lg py-2 font-mono text-sm text-blue-200 hover:bg-blue-900/40 hover:border-blue-500 transition-colors"
            >
              Collect rewards
            </button>
          </div>
        )}

        <button
          onClick={close}
          className="border border-blue-700 rounded-lg py-2 font-mono text-sm text-blue-200 hover:bg-blue-900/40 hover:border-blue-500 transition-colors"
        >
          Leave the arcade
        </button>
      </div>
    )
  }

  // ─── Layout ────────────────────────────────────────────────────────────────

  const isWide = phase === 'shift' || phase === 'retro_game'

  return (
    <div
      className={`bg-gray-950/97 border border-blue-900 rounded-xl shadow-2xl flex flex-col font-mono ${
        isWide ? 'w-[640px]' : 'w-[420px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-blue-900">
        <div>
          <p className="text-blue-100 font-mono text-sm font-semibold tracking-wide">
            Rex&apos;s Arcade
          </p>
          {activeShift && (
            <p className="text-blue-600 font-mono text-xs">
              {ARC_LABELS[activeShift.arcId] ?? activeShift.arcId}
              &nbsp;&middot;&nbsp;
              <span className={DIFF_COLORS[activeShift.difficulty]}>
                {activeShift.difficulty}
              </span>
            </p>
          )}
        </div>
        {(phase === 'briefing' || phase === 'result') && (
          <button
            onClick={close}
            className="text-blue-700 hover:text-blue-400 font-mono text-xs transition-colors"
          >
            [ESC]
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-5 overflow-y-auto max-h-[80vh]">
        {phase === 'briefing'       && renderBriefing()}
        {phase === 'customer'       && renderCustomer()}
        {phase === 'shift'          && renderShift()}
        {phase === 'retro_game'     && renderRetroGame()}
        {phase === 'machine_choice' && renderMachineChoice()}
        {phase === 'result'         && renderResult()}
      </div>

      {/* Footer: shift progress dots */}
      {activeShift && phase !== 'briefing' && phase !== 'result' && (
        <div className="px-5 py-2 border-t border-blue-900 flex items-center gap-2">
          {(['customer', 'shift', ...(activeShift.isArcEnd ? ['retro_game', 'machine_choice'] : []), 'result'] as const).map((p, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                p === phase ? 'bg-blue-200 animate-pulse' : 'bg-blue-800'
              }`}
            />
          ))}
          <span className="text-blue-700 font-mono text-xs ml-1">
            {ARC_LABELS[activeShift.arcId] ?? activeShift.arcId}
          </span>
        </div>
      )}
    </div>
  )
}
