// src/components/NehirPanel.tsx
import { useEffect, useRef, useState } from 'react'
import { useWorldStore }   from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useNehirStore }   from '@/store/nehirStore'
import { NEHIR_SHIFTS }    from '@/data/nehirShifts'
import { RaftScene }       from '@/pixi/RaftScene'
import type { ShiftResult } from '@/store/nehirStore'

type PanelPhase = 'briefing' | 'rafting' | 'result'

const ARC_LABELS: Record<string, string> = {
  arc_ekip:    'The Crew',
  arc_firtina: 'The Storm Night',
  arc_karar:   'The Choice',
}

const DIFF_COLORS: Record<string, string> = {
  easy:   'text-green-400',
  normal: 'text-yellow-400',
  hard:   'text-red-400',
}

export default function NehirPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  const activeShift      = useNehirStore((s) => s.activeShift)
  const completedShifts  = useNehirStore((s) => s.completedShifts)

  const [phase, setPhase]               = useState<PanelPhase>('briefing')
  const [shiftResult, setShiftResult]   = useState<ShiftResult | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef  = useRef<RaftScene | null>(null)
  const lastResultRef = useRef<{ damage: number; timeLeft: number } | null>(null)

  // Pause clock while panel is open
  useEffect(() => {
    setIsPaused(true)
    return () => setIsPaused(false)
  }, [setIsPaused])

  // Escape key: exit from briefing or result only
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape' && (phase === 'briefing' || phase === 'result')) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  // Mount / tear-down RaftScene when entering rafting phase
  useEffect(() => {
    if (phase !== 'rafting') return
    if (!activeShift) return
    const canvas = canvasRef.current
    if (!canvas) return

    let scene: RaftScene | null = null
    let cancelled = false

    RaftScene.create({
      canvas,
      width:         520,
      height:        280,
      obstacles:     activeShift.obstacles,
      currentForce:  activeShift.currentForce,
      currentShifts: activeShift.currentShifts,
      timeLimitSecs: activeShift.timeLimitSecs,
      onComplete: ({ damage, timeLeft }) => {
        // Stale-closure rule: use getState()
        useNehirStore.getState().recordResult(damage, timeLeft)
        scene?.destroy()
        sceneRef.current = null
        const result = useNehirStore.getState().endShift()
        // Capture before endShift zeroes them
        lastResultRef.current = { damage, timeLeft }
        setShiftResult(result)
        setPhase('result')
      },
    }).then(s => {
      if (cancelled) { s.destroy(); return }
      scene = s
      sceneRef.current = s
    })

    return () => {
      cancelled = true
      scene?.destroy()
      sceneRef.current = null
    }
  }, [phase, activeShift?.id])

  function close() {
    sceneRef.current?.destroy()
    sceneRef.current = null
    useNehirStore.getState().reset()
    setLocation(null)
  }

  // ── Phase handlers ──────────────────────────────────────────────────────────

  function handlePickShift(shiftId: string) {
    useNehirStore.getState().startShift(shiftId)
    useNehirStore.getState().advanceFromBriefing()
    setPhase('rafting')
  }

  // ── Result tier helper ──────────────────────────────────────────────────────

  function getResultLines(): string[] {
    // activeShift is cleared by endShift — look up by completedShifts last entry
    const lastId = useNehirStore.getState().completedShifts.slice(-1)[0]
    const shift  = NEHIR_SHIFTS.find(s => s.id === lastId)
    if (!shift || !lastResultRef.current) return []
    const { damage: d, timeLeft: t } = lastResultRef.current
    if (d === 0 && t > 0) return shift.resultLines.good
    if (d >= 3 || t <= 0) return shift.resultLines.bad
    return shift.resultLines.okay
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderBriefing() {
    const available = NEHIR_SHIFTS.filter(s => !completedShifts.includes(s.id))
    const done      = NEHIR_SHIFTS.filter(s =>  completedShifts.includes(s.id))

    return (
      <div className="flex flex-col gap-3">
        <p className="text-cyan-300 font-mono text-xs uppercase tracking-widest mb-1">
          Evening Runs — Søren
        </p>

        {available.length === 0 && (
          <p className="text-cyan-600 font-mono text-sm italic">
            All shifts complete. The river remembers.
          </p>
        )}

        {available.map(shift => (
          <button
            key={shift.id}
            onClick={() => handlePickShift(shift.id)}
            className="text-left border border-cyan-900 rounded-lg p-3 hover:bg-cyan-950/50 hover:border-cyan-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-cyan-100 font-mono text-sm font-semibold">
                {ARC_LABELS[shift.arcId] ?? shift.arcId}
              </span>
              <span className={`font-mono text-xs uppercase ${DIFF_COLORS[shift.difficulty]}`}>
                {shift.difficulty}
              </span>
            </div>
            <div className="text-cyan-400 font-mono text-xs leading-snug mt-1">
              {shift.briefingLines.map((line, i) => (
                <p key={i}>&ldquo;{line}&rdquo;</p>
              ))}
            </div>
            <p className="text-cyan-700 font-mono text-xs mt-1.5">
              {shift.obstacles.length} obstacle{shift.obstacles.length !== 1 ? 's' : ''}
              &nbsp;&middot;&nbsp;{shift.timeLimitSecs}s limit
            </p>
          </button>
        ))}

        {done.length > 0 && (
          <p className="text-cyan-800 font-mono text-xs mt-1">
            {done.length} shift{done.length !== 1 ? 's' : ''} completed
          </p>
        )}
      </div>
    )
  }

  function renderRafting() {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-cyan-300 font-mono text-xs uppercase tracking-widest mb-1">
          On the River
        </p>
        <p className="text-cyan-600 font-mono text-xs mb-2">
          ← / A &nbsp;steer up &nbsp;&nbsp; D / → &nbsp;steer down
        </p>
        <canvas
          ref={canvasRef}
          width={520}
          height={280}
          style={{ display: 'block' }}
          className="rounded-lg border border-cyan-900"
        />
      </div>
    )
  }

  function renderResult() {
    const r     = shiftResult
    const lines = getResultLines()
    const tier  = !r ? '' : r.kaosSeed === 1 ? 'Perfect run' : r.kaosSeed === 3 ? 'Rough crossing' : 'Made it through'

    return (
      <div className="flex flex-col gap-4">
        <p className="text-cyan-300 font-mono text-xs uppercase tracking-widest">
          Shift Complete
        </p>

        {lines.length > 0 && (
          <div className="border border-cyan-900 rounded-lg p-4 bg-cyan-950/20">
            <p className="text-amber-400 font-mono text-xs mb-1">Søren</p>
            {lines.map((line, i) => (
              <p key={i} className="text-cyan-100 font-mono text-sm leading-relaxed">
                &ldquo;{line}&rdquo;
              </p>
            ))}
          </div>
        )}

        {r ? (
          <div className="border border-cyan-900 rounded-lg p-4 bg-cyan-950/30 flex flex-col gap-2">
            {tier && (
              <p className="text-cyan-500 font-mono text-xs mb-1">{tier}</p>
            )}
            <div className="flex justify-between">
              <span className="text-cyan-400 font-mono text-xs">Kaos seeds</span>
              <span className="text-cyan-100 font-mono text-sm">+{r.kaosSeed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-400 font-mono text-xs">Zaman yönetimi seeds</span>
              <span className="text-cyan-100 font-mono text-sm">+{r.zamanSeed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-400 font-mono text-xs">Emek progress</span>
              <span className="text-cyan-100 font-mono text-sm">+{r.progress}</span>
            </div>
          </div>
        ) : (
          <div className="border border-cyan-900 rounded-lg p-4 bg-cyan-950/30">
            <p className="text-cyan-600 font-mono text-sm italic">No rewards recorded.</p>
          </div>
        )}

        <button
          onClick={close}
          className="border border-cyan-800 rounded-lg py-2 font-mono text-sm text-cyan-200 hover:bg-cyan-900/40 hover:border-cyan-600 transition-colors"
        >
          Leave the river
        </button>
      </div>
    )
  }

  // ── Layout ──────────────────────────────────────────────────────────────────

  const isWide = phase === 'rafting'

  return (
    <div
      className={`bg-gray-950/97 border border-cyan-900 rounded-xl shadow-2xl flex flex-col font-mono ${
        isWide ? 'w-[560px]' : 'w-96'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-900">
        <div>
          <p className="text-cyan-100 font-mono text-sm font-semibold tracking-wide">
            Søren&apos;s River
          </p>
          {activeShift && (
            <p className="text-cyan-700 font-mono text-xs">
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
            className="text-cyan-800 hover:text-cyan-500 font-mono text-xs transition-colors"
          >
            [ESC]
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-5 overflow-y-auto max-h-[80vh]">
        {phase === 'briefing' && renderBriefing()}
        {phase === 'rafting'  && renderRafting()}
        {phase === 'result'   && renderResult()}
      </div>
    </div>
  )
}
