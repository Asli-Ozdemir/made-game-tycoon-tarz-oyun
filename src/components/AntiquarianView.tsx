// src/components/AntiquarianView.tsx
import { useEffect, useRef, useState } from 'react'
import { useAntiquarianStore } from '@/store/antiquarianStore'
import { ANTIQUARIAN_SHIFTS } from '@/data/antiquarianShifts'
import { AntiquarianScene } from '@/pixi/AntiquarianScene'

type ViewPhase = 'select' | 'shift' | 'result'

interface Props {
  onBack: () => void
}

export default function AntiquarianView({ onBack }: Props) {
  const completedShifts = useAntiquarianStore((s) => s.completedShifts)
  const [phase, setPhase] = useState<ViewPhase>('select')
  const [result, setResult] = useState<{ seeds: number; progress: number; pay: number } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef  = useRef<AntiquarianScene | null>(null)

  // Vardiya fazında AntiquarianScene'i mount/tear-down et (BalikciPanel kalıbı)
  useEffect(() => {
    if (phase !== 'shift') return
    const shift = useAntiquarianStore.getState().activeShift
    const canvas = canvasRef.current
    if (!shift || !canvas) return

    let scene: AntiquarianScene | null = null
    let cancelled = false

    AntiquarianScene.create({
      canvas,
      width: 560,
      height: 420,
      shift,
      onAdvanceFromBriefing: () => useAntiquarianStore.getState().advanceFromBriefing(),
      onSelectLocation:      (id) => useAntiquarianStore.getState().selectLocation(id),
      onCollectBook:         (id) => useAntiquarianStore.getState().collectBook(id),
      onUncollectBook:       (id) => useAntiquarianStore.getState().uncollectBook(id),
      onAdvanceToIdentify:   () => useAntiquarianStore.getState().advanceToIdentify(),
      onIdentifyBook:        (id, data) => useAntiquarianStore.getState().identifyBook(id, data),
      onAdvanceToMatch:      () => useAntiquarianStore.getState().advanceToMatch(),
      onMatchBook:           (rid, bid) => useAntiquarianStore.getState().matchBook(rid, bid),
      onShiftEnd: () => {
        // Stale-closure kuralı: her zaman getState()
        const r = useAntiquarianStore.getState().endShift()
        setResult(r)
        setPhase('result')
        scene?.destroy()
        sceneRef.current = null
      },
    }).then((s) => {
      if (cancelled) { s.destroy(); return }
      scene = s
      sceneRef.current = s
    })

    return () => {
      cancelled = true
      scene?.destroy()
      sceneRef.current = null
    }
  }, [phase])

  function startShift(shiftId: string) {
    useAntiquarianStore.getState().startShift(shiftId)
    setPhase('shift')
  }

  function renderSelect() {
    const available = ANTIQUARIAN_SHIFTS.filter((s) => !completedShifts.includes(s.id))
    return (
      <div className="flex flex-col gap-3">
        <p className="text-amber-300 font-mono text-xs uppercase tracking-widest mb-1">
          Arşiv Vardiyası Seç
        </p>
        {available.length === 0 && (
          <p className="text-amber-600 font-mono text-sm italic">
            Bugünlük iş kalmadı. Yarın yine uğra.
          </p>
        )}
        {available.map((s) => (
          <button
            key={s.id}
            onClick={() => startShift(s.id)}
            className="text-left border border-amber-900 rounded-lg p-3 hover:bg-amber-950/40 hover:border-amber-600 transition-colors"
          >
            <p className="text-amber-100 font-mono text-sm font-semibold">
              Vardiya {s.id.replace('antiq_shift_', '')}
            </p>
            <p className="text-amber-500 font-mono text-xs mt-0.5">
              {s.requests.length} talep · {s.locations.length} lokasyon
              {s.hasAuthenticity ? ' · orijinallik kontrolü' : ''}
            </p>
          </button>
        ))}
        <button
          onClick={onBack}
          className="border border-gray-700 rounded-lg py-2 font-mono text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          ← Marcus'a dön
        </button>
      </div>
    )
  }

  function renderShift() {
    return (
      <canvas
        ref={canvasRef}
        width={560}
        height={420}
        style={{ display: 'block' }}
        className="rounded-lg border border-amber-900"
      />
    )
  }

  function renderResult() {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-amber-300 font-mono text-xs uppercase tracking-widest">
          Vardiya Tamamlandı
        </p>
        {result && (
          <div className="border border-amber-900 rounded-lg p-4 bg-amber-950/20 flex flex-col gap-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-amber-500 text-xs">Nostalji tohumu</span>
              <span className="text-amber-100">+{result.seeds}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-500 text-xs">Huzur ilerlemesi</span>
              <span className="text-amber-100">+{result.progress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-500 text-xs">Ücret</span>
              <span className="text-amber-100">${result.pay}</span>
            </div>
          </div>
        )}
        <button
          onClick={onBack}
          className="border border-amber-700 rounded-lg py-2 font-mono text-sm text-amber-200 hover:bg-amber-900/30 transition-colors"
        >
          Dükkana dön
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {phase === 'select' && renderSelect()}
      {phase === 'shift'  && renderShift()}
      {phase === 'result' && renderResult()}
    </div>
  )
}
