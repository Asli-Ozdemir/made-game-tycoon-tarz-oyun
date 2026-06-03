// src/components/LawyerPanel.tsx
import { useEffect, useRef, useState } from 'react'
import { useWorldStore }   from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useLawyerStore }  from '@/store/lawyerStore'
import { LAWYER_SHIFTS }   from '@/data/lawyerShifts'
import { LegalScene }      from '@/pixi/LegalScene'
import type { LawyerSessionResult } from '@/store/lawyerStore'

type PanelPhase = 'briefing' | 'session' | 'cross_exam' | 'result'

const ARC_LABELS: Record<string, string> = {
  arc_indie: 'Arc I — New Beginnings',
  arc_rival: 'Arc II — Contested Ground',
  arc_nexus: 'Arc III — The Weight of It',
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

export default function LawyerPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  const activeShift     = useLawyerStore((s) => s.activeShift)
  const completedShifts = useLawyerStore((s) => s.completedShifts)
  const storePhase      = useLawyerStore((s) => s.phase)
  const usedCardIds     = useLawyerStore((s) => s.usedCardIds)

  const [panelPhase, setPanelPhase] = useState<PanelPhase>('briefing')
  const [sessionResult, setSessionResult] = useState<LawyerSessionResult | null>(null)
  const [crossSelected, setCrossSelected] = useState<string[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef  = useRef<LegalScene | null>(null)

  useEffect(() => {
    setIsPaused(true)
    return () => setIsPaused(false)
  }, [setIsPaused])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && (panelPhase === 'briefing' || panelPhase === 'result')) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelPhase])

  useEffect(() => {
    if (panelPhase !== 'session') return
    if (!canvasRef.current) return
    if (!activeShift) return

    let cancelled = false
    const canvas = canvasRef.current

    LegalScene.create(
      canvas,
      activeShift.turns,
      activeShift.availableCards,
      activeShift.opponentName,
      (argumentScore, usedIds) => {
        if (cancelled) return
        useLawyerStore.getState().recordSessionResult(argumentScore, usedIds)
        if (activeShift.isArcEnd) {
          setCrossSelected([])
          setPanelPhase('cross_exam')
        } else {
          setPanelPhase('result')
        }
        sceneRef.current?.destroy()
        sceneRef.current = null
      },
    ).then((scene) => {
      if (cancelled) { scene.destroy(); return }
      sceneRef.current = scene
    })

    return () => {
      cancelled = true
      sceneRef.current?.destroy()
      sceneRef.current = null
    }
  }, [panelPhase, activeShift])

  function close() {
    sceneRef.current?.destroy()
    sceneRef.current = null
    useLawyerStore.getState().reset()
    setLocation(null)
  }

  function handlePickShift(shiftId: string) {
    useLawyerStore.getState().startShift(shiftId)
    useLawyerStore.getState().advanceFromBriefing()
    setPanelPhase('session')
  }

  function handleCrossExamSubmit() {
    if (crossSelected.length !== 2) return
    const cards = activeShift!.availableCards.filter(c => crossSelected.includes(c.id))
    const bonus = cards.reduce((sum, c) => sum + c.power * 2, 0)
    useLawyerStore.getState().recordCrossExamResult(bonus)
    setPanelPhase('result')
  }

  function handleEndShift() {
    const result = useLawyerStore.getState().endShift()
    setSessionResult(result)
  }

  function toggleCrossCard(cardId: string) {
    setCrossSelected(prev => {
      if (prev.includes(cardId)) return prev.filter(id => id !== cardId)
      if (prev.length >= 2) return prev
      return [...prev, cardId]
    })
  }

  // Sync panel if store resets externally
  useEffect(() => {
    if (storePhase === 'idle' && panelPhase !== 'briefing') {
      setPanelPhase('briefing')
      setSessionResult(null)
    }
  }, [storePhase])

  function renderBriefing() {
    const available = LAWYER_SHIFTS.filter(s => !completedShifts.includes(s.id))
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Clara — Avukatlık</div>
        {available.length === 0 && (
          <div className="text-gray-400 text-sm">Tüm davalar tamamlandı.</div>
        )}
        {['arc_indie', 'arc_rival', 'arc_nexus'].map(arcId => {
          const arcShifts = available.filter(s => s.arcId === arcId)
          if (arcShifts.length === 0) return null
          return (
            <div key={arcId} className="mb-2">
              <div className="text-xs text-gray-500 mb-1">{ARC_LABELS[arcId]}</div>
              {arcShifts.map(shift => (
                <button
                  key={shift.id}
                  onClick={() => handlePickShift(shift.id)}
                  className="w-full text-left px-3 py-2 mb-1 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-indigo-600 rounded text-sm text-gray-200 transition-colors"
                >
                  <span className="font-medium">{shift.caseTitle}</span>
                  <span className={`ml-2 text-xs ${DIFF_COLORS[shift.difficulty]}`}>
                    {shift.difficulty}
                  </span>
                  {shift.isArcEnd && (
                    <span className="ml-2 text-xs text-yellow-500">arc sonu</span>
                  )}
                </button>
              ))}
            </div>
          )
        })}
        <button
          onClick={close}
          className="mt-2 px-3 py-1 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded self-start"
        >
          [ESC] Kapat
        </button>
      </div>
    )
  }

  function renderSession() {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-1 text-xs text-gray-600 border-b border-gray-800">
          {activeShift?.caseTitle}
          <span className="ml-2 text-gray-700">— {activeShift?.opponentCompany}</span>
        </div>
        <canvas ref={canvasRef} className="flex-1 w-full" />
      </div>
    )
  }

  function renderCrossExam() {
    const remaining = activeShift!.availableCards.filter(c => !usedCardIds.includes(c.id))
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-sm text-yellow-400 font-medium">Çapraz Sorgu</div>
        <div className="text-xs text-gray-400 mb-2">
          Clara tanığa soru soruyor. 2 kart seç — en güçlü kombinasyonu bul.
        </div>
        <div className="grid grid-cols-2 gap-2">
          {remaining.map(card => {
            const selected = crossSelected.includes(card.id)
            const disabled = !selected && crossSelected.length >= 2
            return (
              <button
                key={card.id}
                onClick={() => toggleCrossCard(card.id)}
                disabled={disabled}
                className={`p-2 text-left border rounded text-xs transition-colors
                  ${selected ? 'border-indigo-500 bg-indigo-950 text-indigo-200' : 'border-gray-700 bg-gray-900 text-gray-300'}
                  ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-gray-500'}
                `}
              >
                <div className="font-medium">{card.label}</div>
                <div className="text-yellow-500 mt-1">★{card.power}</div>
              </button>
            )
          })}
          {remaining.length === 0 && (
            <div className="col-span-2 text-gray-500 text-xs">Kullanılabilir kart kalmadı.</div>
          )}
        </div>
        <button
          onClick={handleCrossExamSubmit}
          disabled={crossSelected.length !== 2 && remaining.length > 0}
          className="mt-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm text-white"
        >
          Clara&apos;ya İlet ({crossSelected.length}/2)
        </button>
      </div>
    )
  }

  function renderResult() {
    if (!sessionResult) {
      return (
        <div className="p-4">
          <button
            onClick={handleEndShift}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded text-sm text-white"
          >
            Sonucu Gör
          </button>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest">Oturum Sonu</div>
        <div className={`text-lg font-bold ${TIER_COLORS[sessionResult.tier]}`}>
          {sessionResult.tier === 'good' ? 'Kazandı' : sessionResult.tier === 'okay' ? 'Berabere' : 'Kaybetti'}
        </div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Hukuk tohumu: <span className="text-indigo-400">+{sessionResult.hukukSeeds}</span></div>
          <div>Emek yolu: <span className="text-blue-400">+{sessionResult.emekProgress}</span></div>
          {activeShift && (
            <div className="mt-2 text-gray-600 border-t border-gray-800 pt-2">
              Karşı taraf: <span className="text-gray-500">{activeShift.opponentName}</span>
              {' · '}
              <span className="text-gray-600">{activeShift.opponentCompany}</span>
            </div>
          )}
        </div>
        <button
          onClick={close}
          className="mt-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 self-start"
        >
          Kapat
        </button>
      </div>
    )
  }

  return (
    <div
      className="bg-gray-950/97 border border-indigo-900 rounded-xl shadow-2xl flex flex-col font-mono overflow-hidden"
      style={{
        width:     panelPhase === 'session' ? '800px' : '440px',
        height:    panelPhase === 'session' ? '520px' : 'auto',
        minHeight: '200px',
      }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <span className="text-xs text-indigo-400 tracking-widest">AVUKAT ASİSTANLIĞI</span>
        {(panelPhase === 'briefing' || panelPhase === 'result') && (
          <button onClick={close} className="text-gray-600 hover:text-gray-400 text-xs">✕</button>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {panelPhase === 'briefing'   && renderBriefing()}
        {panelPhase === 'session'    && renderSession()}
        {panelPhase === 'cross_exam' && renderCrossExam()}
        {panelPhase === 'result'     && renderResult()}
      </div>
    </div>
  )
}
