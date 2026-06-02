// src/components/BarPanel.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { useBarStore } from '@/store/barStore'
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { BAR_SHIFTS } from '@/data/barShifts'
import { DoorScene } from '@/pixi/DoorScene'
import { FightScene } from '@/pixi/FightScene'

type Phase = 'briefing' | 'door' | 'incident' | 'fight' | 'result'
type ShiftResult = { seeds: number; progress: number } | null

const CANVAS_W = 480
const CANVAS_H = 320

export default function BarPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  // Store state — read only what we need for rendering
  const activeShift       = useBarStore((s) => s.activeShift)
  const currentGuestIndex = useBarStore((s) => s.currentGuestIndex)
  const activeIncident    = useBarStore((s) => s.activeIncident)
  const currentTensionStep = useBarStore((s) => s.currentTensionStep)
  const tensionLevel      = useBarStore((s) => s.tensionLevel)
  const completedShifts   = useBarStore((s) => s.completedShifts)

  const [phase, setPhase] = useState<Phase>('briefing')
  const [shiftResult, setShiftResult] = useState<ShiftResult>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Holds the active PixiJS scene so we can destroy it on phase change
  const sceneRef = useRef<{ destroy(): void } | null>(null)

  // ── Close ──────────────────────────────────────────────────────────────────
  const close = useCallback(() => {
    sceneRef.current?.destroy()
    sceneRef.current = null
    setLocation(null)
    setIsPaused(false)
  }, [setLocation, setIsPaused])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape' && phase === 'briefing') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, close])

  // ── After incident resolves — decide next phase ────────────────────────────
  const checkAfterIncidentResolved = useCallback(() => {
    const store = useBarStore.getState()
    if (!store.activeShift) return
    if (store.currentGuestIndex >= store.activeShift.guests.length) {
      const result = store.endShift()
      setShiftResult(result)
      setPhase('result')
    } else {
      setPhase('door')
    }
  }, [])

  // ── Guest decision callback (called from DoorScene) ────────────────────────
  const handleGuestDecision = useCallback((decision: 'admit' | 'reject') => {
    const store = useBarStore.getState()
    const { activeShift, currentGuestIndex } = store
    if (!activeShift) return

    const guest = activeShift.guests[currentGuestIndex]
    store.makeGuestDecision(guest.id, decision)

    const updated = useBarStore.getState()
    const newIndex = updated.currentGuestIndex
    const processedIndex = newIndex - 1

    // Check if an incident should trigger at this position
    const triggerPos = activeShift.incidentTriggers.indexOf(processedIndex)
    if (triggerPos >= 0 && triggerPos < activeShift.incidents.length) {
      store.triggerIncident(activeShift.incidents[triggerPos].id)
      sceneRef.current?.destroy()
      sceneRef.current = null
      setPhase('incident')
      return
    }

    if (newIndex >= activeShift.guests.length) {
      sceneRef.current?.destroy()
      sceneRef.current = null
      const result = updated.endShift()
      setShiftResult(result)
      setPhase('result')
      return
    }

    // More guests remain — DoorScene useEffect will re-run because currentGuestIndex changed
  }, [])

  // ── Tension option callback ────────────────────────────────────────────────
  const handleTensionOption = useCallback((optionIndex: number) => {
    const store = useBarStore.getState()
    store.chooseTensionOption(optionIndex)

    const updated = useBarStore.getState()
    if (updated.fightActive) {
      setPhase('fight')
      return
    }
    if (!updated.activeIncident) {
      checkAfterIncidentResolved()
    }
    // else: still in incident, re-render with new tension/step
  }, [checkAfterIncidentResolved])

  // ── Door phase — mount DoorScene for the current guest ────────────────────
  useEffect(() => {
    if (phase !== 'door') return
    if (!activeShift) return
    if (currentGuestIndex >= activeShift.guests.length) return
    const canvas = canvasRef.current
    if (!canvas) return

    const guest = activeShift.guests[currentGuestIndex]
    let scene: DoorScene | null = null
    let cancelled = false

    DoorScene.create({
      canvas,
      width: CANVAS_W,
      height: CANVAS_H,
      guest,
      nightRule: activeShift.nightRule,
      onAdmit:  () => handleGuestDecision('admit'),
      onReject: () => handleGuestDecision('reject'),
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
  }, [phase, activeShift?.id, currentGuestIndex, handleGuestDecision])

  // ── Fight phase — mount FightScene ────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'fight') return
    const canvas = canvasRef.current
    if (!canvas) return

    let scene: FightScene | null = null
    let cancelled = false

    FightScene.create({
      canvas,
      width: CANVAS_W,
      height: CANVAS_H,
      onFightEnd: (playerWon) => {
        useBarStore.getState().endFight(playerWon)
        scene?.destroy()
        sceneRef.current = null
        checkAfterIncidentResolved()
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
  }, [phase, checkAfterIncidentResolved])

  // ── RENDER ─────────────────────────────────────────────────────────────────

  // Briefing — shift picker
  if (phase === 'briefing') {
    const available = BAR_SHIFTS.filter(s => !completedShifts.includes(s.id))
    return (
      <div className="bg-gray-950/98 border border-orange-900 rounded-xl p-6 w-96 shadow-2xl text-orange-100 font-mono">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-orange-300 tracking-wide">BAR GÜVENLİK</h2>
          <button
            onClick={close}
            className="text-xs text-orange-700 hover:text-orange-400 transition"
          >
            [ESC]
          </button>
        </div>

        {available.length === 0 ? (
          <p className="text-sm text-gray-500">Tüm vardiyalar tamamlandı.</p>
        ) : (
          <div className="space-y-2">
            {available.map(shift => (
              <button
                key={shift.id}
                onClick={() => { useBarStore.getState().startShift(shift.id); setPhase('door') }}
                className="w-full text-left p-3 bg-gray-900 border border-orange-900/60 rounded-lg hover:bg-orange-900/25 transition"
              >
                <div className="text-xs font-bold text-orange-300 uppercase">
                  {shift.id.replace('_', ' ')}
                </div>
                <div className="text-xs text-orange-600 mt-0.5">
                  Kural: {shift.nightRule}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {shift.guests.length} misafir · {shift.incidents.length} olay riski
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Door & Fight — canvas fills the panel
  if (phase === 'door' || phase === 'fight') {
    const label = phase === 'door'
      ? activeShift
        ? `Misafir ${currentGuestIndex + 1} / ${activeShift.guests.length}`
        : ''
      : 'KAVGA'
    return (
      <div className="bg-gray-950 border border-orange-900/70 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-3 py-1.5 bg-gray-900/80 flex items-center justify-between">
          <span className="text-xs font-mono text-orange-500">{label}</span>
          {phase === 'door' && activeShift && (
            <span className="text-xs font-mono text-gray-600">
              {activeShift.nightRule}
            </span>
          )}
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block' }}
        />
      </div>
    )
  }

  // Incident — tension dialogue
  if (phase === 'incident' && activeIncident) {
    const step = activeIncident.tensionSteps[currentTensionStep]
    const tensionColor =
      tensionLevel >= 75 ? '#ff4444' :
      tensionLevel >= 45 ? '#ffaa44' :
                           '#44cc88'

    return (
      <div className="bg-gray-950/98 border border-red-900 rounded-xl p-5 w-96 shadow-2xl text-red-100 font-mono">
        <div className="text-xs text-red-600 uppercase tracking-widest mb-1">Olay</div>
        <p className="text-sm text-red-200 mb-4">{activeIncident.description}</p>

        {/* Tension bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>GERİLİM</span>
            <span style={{ color: tensionColor }}>{tensionLevel} / 100</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${tensionLevel}%`, background: tensionColor }}
            />
          </div>
        </div>

        {step && (
          <>
            <p className="text-sm text-gray-200 mb-4 leading-relaxed">{step.text}</p>
            <div className="space-y-2">
              {step.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleTensionOption(i)}
                  className="w-full text-left px-3 py-2.5 bg-gray-900 border border-red-900/50 rounded-lg hover:bg-red-900/20 text-sm text-gray-200 transition"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // Result
  if (phase === 'result' && shiftResult) {
    return (
      <div className="bg-gray-950/98 border border-orange-900 rounded-xl p-6 w-80 shadow-2xl text-orange-100 font-mono">
        <div className="text-xs text-orange-600 uppercase tracking-widest mb-4">Vardiya Bitti</div>
        <div className="space-y-2 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500">Fikir Tohumu (Kaos)</span>
            <span className="text-orange-300">+{shiftResult.seeds}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Emek Yolu</span>
            <span className="text-orange-300">+{shiftResult.progress}</span>
          </div>
        </div>
        <button
          onClick={close}
          className="w-full py-2 bg-orange-900/30 border border-orange-800 rounded-lg hover:bg-orange-800/40 transition text-sm text-orange-200"
        >
          Çıkış [ESC]
        </button>
      </div>
    )
  }

  return null
}
