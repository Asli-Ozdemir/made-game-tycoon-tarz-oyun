// src/components/DetectivePanel.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useDetectiveStore } from '@/store/detectiveStore'
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { DETECTIVE_CASES } from '@/data/detectiveCases'
import { ExamineScene } from '@/pixi/ExamineScene'
import type { Suspect, DetectiveCase } from '@/data/detectiveCases'

type Phase = 'briefing' | 'scene' | 'examine' | 'suspect' | 'accusation' | 'result'
type AccuseOutcome = 'correct' | 'wrong' | 'timeout' | null

const CANVAS_W = 480
const CANVAS_H = 320

// Reward mirror — same formula as detectiveStore
function calcReward(outcome: 'correct' | 'wrong' | 'timeout', dayCount: number, dayLimit: number) {
  if (outcome === 'wrong' || outcome === 'timeout') return { seeds: 1, progress: 3 }
  if (dayCount >= dayLimit) return { seeds: 2, progress: 8 }
  return { seeds: 3, progress: 12 }
}

// Returns all evidence IDs that are referenced as revealsClue (not root nodes)
function nonRootIds(caseObj: DetectiveCase | null): Set<string> {
  const ids = new Set<string>()
  if (!caseObj) return ids
  for (const node of caseObj.evidence) {
    for (const item of node.examineItems ?? []) {
      if (item.revealsClue) ids.add(item.revealsClue)
    }
  }
  return ids
}

export default function DetectivePanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  const activeCase       = useDetectiveStore((s) => s.activeCase)
  const dayCount         = useDetectiveStore((s) => s.dayCount)
  const collectedEvidence = useDetectiveStore((s) => s.collectedEvidence)
  const chainPosition    = useDetectiveStore((s) => s.chainPosition)
  const completedCases   = useDetectiveStore((s) => s.completedCases)

  const [phase, setPhase] = useState<Phase>('briefing')
  const [examineTarget, setExamineTarget] = useState<string | null>(null)
  const [suspectTarget, setSuspectTarget] = useState<Suspect | null>(null)
  const [accusedSuspect, setAccusedSuspect] = useState<Suspect | null>(null)
  const [outcome, setOutcome] = useState<AccuseOutcome>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef  = useRef<{ destroy(): void } | null>(null)

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

  // ── Visible evidence: root nodes + anything already collected ──────────────
  const visibleEvidence = useMemo(() => {
    if (!activeCase) return []
    const hidden = nonRootIds(activeCase)
    return activeCase.evidence.filter(
      (n) => !hidden.has(n.id) || collectedEvidence.includes(n.id)
    )
  }, [activeCase, collectedEvidence])

  // ── ExamineScene mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'examine') return
    if (!activeCase || !examineTarget) return
    const node = activeCase.evidence.find((e) => e.id === examineTarget)
    if (!node) return
    const canvas = canvasRef.current
    if (!canvas) return

    let scene: ExamineScene | null = null
    let cancelled = false

    // Collect the node itself immediately on open
    useDetectiveStore.getState().collectEvidence(examineTarget)

    ExamineScene.create({
      canvas,
      width: CANVAS_W,
      height: CANVAS_H,
      evidenceNode: node,
      onItemFound: (itemId) => {
        // Search all nodes for this item and handle revealsClue
        for (const evNode of activeCase.evidence) {
          const item = evNode.examineItems?.find((i) => i.id === itemId)
          if (item?.revealsClue) {
            useDetectiveStore.getState().collectEvidence(item.revealsClue)
          }
        }
      },
      onClose: () => {
        scene?.destroy()
        sceneRef.current = null
        setPhase('scene')
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
  }, [phase, examineTarget, activeCase?.id])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAccuse = useCallback((suspect: Suspect) => {
    const store = useDetectiveStore.getState()
    const { dayCount, activeCase } = store
    const result = store.makeAccusation(suspect.id)
    if (!result || !activeCase) return
    const reward = calcReward(result, dayCount, activeCase.dayLimit)
    setAccusedSuspect(suspect)
    setOutcome(result)
    // Store reward in accusedSuspect carrier — just reuse state
    setPendingReward(reward)
    setPhase('result')
  }, [])

  const [pendingReward, setPendingReward] = useState<{ seeds: number; progress: number } | null>(null)

  // ── RENDER ─────────────────────────────────────────────────────────────────

  // --- Briefing ---
  if (phase === 'briefing') {
    const available = DETECTIVE_CASES.filter((c) => !completedCases.includes(c.id))
    return (
      <div className="bg-gray-950/98 border border-amber-900 rounded-xl p-6 w-96 shadow-2xl text-amber-100 font-mono">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-amber-300 tracking-wide">DEDEKTIF VAKASI</h2>
          <button onClick={close} className="text-xs text-amber-700 hover:text-amber-400 transition">
            [ESC]
          </button>
        </div>

        {available.length === 0 ? (
          <p className="text-sm text-gray-500">Tüm vakalar çözüldü.</p>
        ) : (
          <div className="space-y-2">
            {available.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  useDetectiveStore.getState().startCase(c.id)
                  setPhase('scene')
                }}
                className="w-full text-left p-3 bg-gray-900 border border-amber-900/60 rounded-lg hover:bg-amber-900/20 transition"
              >
                <div className="text-xs font-bold text-amber-300 uppercase">{c.title}</div>
                <div className="text-xs text-amber-700 mt-0.5">
                  {c.suspects.length} şüpheli · {c.evidence.length} kanıt · {c.dayLimit} gün sınırı
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // --- Examine (canvas) ---
  if (phase === 'examine') {
    const node = activeCase?.evidence.find((e) => e.id === examineTarget)
    return (
      <div className="bg-gray-950 border border-amber-900/70 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-3 py-1.5 bg-gray-900/80 flex items-center justify-between">
          <span className="text-xs font-mono text-amber-500">
            İnceleniyor: {node?.label ?? ''}
          </span>
          <span className="text-xs font-mono text-gray-600">[ESC] geri</span>
        </div>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ display: 'block' }} />
      </div>
    )
  }

  // --- Suspect dialogue ---
  if (phase === 'suspect' && suspectTarget) {
    return (
      <div className="bg-gray-950/98 border border-amber-900 rounded-xl p-5 w-80 shadow-2xl text-amber-100 font-mono">
        <div className="text-xs text-amber-600 uppercase tracking-widest mb-1">Şüpheli</div>
        <div className="text-sm font-bold text-amber-300 mb-0.5">{suspectTarget.name}</div>
        <div className="text-xs text-gray-600 mb-4">{suspectTarget.location}</div>

        <div className="bg-gray-900 border border-amber-900/40 rounded-lg p-3 mb-3">
          <p className="text-xs text-gray-300 leading-relaxed italic">
            &ldquo;{suspectTarget.dialogue.greeting}&rdquo;
          </p>
        </div>

        {suspectTarget.dialogue.detectiveComment && (
          <div className="text-xs text-amber-700 italic mb-4">
            ↳ {suspectTarget.dialogue.detectiveComment}
          </div>
        )}

        <button
          onClick={() => setPhase('scene')}
          className="w-full py-2 bg-gray-900 border border-amber-900/50 rounded-lg hover:bg-amber-900/20 transition text-xs text-amber-400"
        >
          Geri
        </button>
      </div>
    )
  }

  // --- Accusation ---
  if (phase === 'accusation' && activeCase) {
    const timedOut = dayCount > activeCase.dayLimit
    return (
      <div className="bg-gray-950/98 border border-red-900 rounded-xl p-5 w-80 shadow-2xl text-red-100 font-mono">
        <div className="text-xs text-red-600 uppercase tracking-widest mb-1">Suçlama</div>
        <p className="text-xs text-gray-500 mb-4">
          {timedOut
            ? 'Süre doldu — yine de suçlaman gerekiyor.'
            : 'Kanıtlara göre kim suçlu? Yanlış suçlama ödülü düşürür.'}
        </p>

        <div className="space-y-2">
          {activeCase.suspects.map((s) => (
            <button
              key={s.id}
              onClick={() => handleAccuse(s)}
              className="w-full text-left p-3 bg-gray-900 border border-red-900/50 rounded-lg hover:bg-red-900/20 transition"
            >
              <div className="text-sm text-red-200">{s.name}</div>
              <div className="text-xs text-gray-600">{s.location}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setPhase('scene')}
          className="mt-3 w-full py-1.5 text-xs text-gray-600 hover:text-gray-400 transition"
        >
          İptal
        </button>
      </div>
    )
  }

  // --- Result ---
  if (phase === 'result' && outcome && accusedSuspect) {
    const dialogueLine =
      outcome === 'correct'
        ? accusedSuspect.dialogue.accuseCorrect
        : accusedSuspect.dialogue.accuseWrong

    const outcomeLabel = {
      correct: 'Doğru Suçlama',
      wrong:   'Yanlış Suçlama',
      timeout: 'Süre Doldu',
    }[outcome]

    const outcomeColor = outcome === 'correct' ? 'text-green-400' : 'text-red-400'

    return (
      <div className="bg-gray-950/98 border border-amber-900 rounded-xl p-6 w-80 shadow-2xl text-amber-100 font-mono">
        <div className={`text-sm font-bold mb-3 ${outcomeColor}`}>{outcomeLabel}</div>

        {dialogueLine && (
          <div className="bg-gray-900 border border-amber-900/40 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-300 leading-relaxed italic">
              &ldquo;{dialogueLine}&rdquo;
            </p>
            <p className="text-xs text-amber-800 mt-1">— {accusedSuspect.name}</p>
          </div>
        )}

        {pendingReward && (
          <div className="space-y-1 text-sm mb-5">
            <div className="flex justify-between">
              <span className="text-gray-500">Fikir Tohumu (Analiz)</span>
              <span className="text-amber-300">+{pendingReward.seeds}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Emek Yolu</span>
              <span className="text-amber-300">+{pendingReward.progress}</span>
            </div>
          </div>
        )}

        <button
          onClick={close}
          className="w-full py-2 bg-amber-900/30 border border-amber-800 rounded-lg hover:bg-amber-800/40 transition text-sm text-amber-200"
        >
          Çıkış
        </button>
      </div>
    )
  }

  // --- Scene (main investigation view) ---
  if (phase === 'scene' && activeCase) {
    const currentClue = activeCase.dayClues.find((d) => d.day === dayCount)
    const timedOut = dayCount > activeCase.dayLimit
    const canAdvance = dayCount <= activeCase.dayLimit

    return (
      <div className="bg-gray-950/98 border border-amber-900 rounded-xl p-5 w-[28rem] shadow-2xl text-amber-100 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
            {activeCase.title}
          </span>
          <span className={`text-xs ${timedOut ? 'text-red-500' : 'text-amber-700'}`}>
            Gün {dayCount} / {activeCase.dayLimit}
            {timedOut && ' — SÜRE DOLDU'}
          </span>
        </div>

        {/* Day clue */}
        {currentClue && (
          <div className="text-xs text-amber-700 italic mb-4 leading-relaxed border-l-2 border-amber-900 pl-2">
            {currentClue.text}
          </div>
        )}

        {/* Evidence nodes */}
        <div className="mb-4">
          <div className="text-xs text-gray-600 uppercase mb-2">Kanıtlar</div>
          <div className="space-y-1.5">
            {visibleEvidence.map((node) => {
              const isCollected = collectedEvidence.includes(node.id)
              const isChainTarget = chainPosition === node.id
              return (
                <div
                  key={node.id}
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    isChainTarget
                      ? 'border-amber-600 bg-amber-900/20'
                      : 'border-gray-800 bg-gray-900/60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-200 truncate">{node.label}</span>
                      {isCollected && (
                        <span className="text-xs text-green-600">✓</span>
                      )}
                      {isChainTarget && !isCollected && (
                        <span className="text-xs text-amber-500">→ ipucu</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{node.description}</p>
                  </div>
                  <button
                    onClick={() => { setExamineTarget(node.id); setPhase('examine') }}
                    className="ml-3 px-2 py-1 text-xs bg-gray-800 border border-amber-900/50 rounded hover:bg-amber-900/30 transition flex-shrink-0"
                  >
                    İncele
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Suspects */}
        <div className="mb-4">
          <div className="text-xs text-gray-600 uppercase mb-2">Şüpheliler</div>
          <div className="flex flex-wrap gap-1.5">
            {activeCase.suspects.map((s) => {
              const isChainTarget = chainPosition === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => { setSuspectTarget(s); setPhase('suspect') }}
                  className={`px-2.5 py-1 text-xs rounded border transition ${
                    isChainTarget
                      ? 'border-amber-600 bg-amber-900/30 text-amber-300'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-amber-800'
                  }`}
                >
                  {s.name}
                  {isChainTarget && ' ★'}
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-800">
          {canAdvance ? (
            <button
              onClick={() => useDetectiveStore.getState().advanceDay()}
              className="flex-1 py-1.5 text-xs bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition text-gray-400"
            >
              Sonraki Gün
            </button>
          ) : (
            <div className="flex-1 py-1.5 text-xs text-center text-red-700 border border-red-900/30 rounded-lg">
              Süre Doldu
            </div>
          )}
          <button
            onClick={() => setPhase('accusation')}
            className="flex-1 py-1.5 text-xs bg-red-900/30 border border-red-800 rounded-lg hover:bg-red-800/40 transition text-red-300"
          >
            Suçla
          </button>
          <button
            onClick={close}
            className="px-3 py-1.5 text-xs text-gray-600 border border-gray-800 rounded-lg hover:border-gray-600 transition"
          >
            ESC
          </button>
        </div>
      </div>
    )
  }

  return null
}
