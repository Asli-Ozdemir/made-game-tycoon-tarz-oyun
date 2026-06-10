// src/components/BalikciPanel.tsx
import { useEffect, useRef, useState } from 'react'
import { useObjectiveStore } from '@/store/objectiveStore'
import { useWorldStore }    from '@/store/worldStore'
import { useDayTimeStore }  from '@/store/dayTimeStore'
import { useFishingStore }  from '@/store/fishingStore'
import { FISHING_SESSIONS } from '@/data/fishingSessions'
import { FishingScene }     from '@/pixi/FishingScene'
import type { SessionResult } from '@/store/fishingStore'

type PanelPhase = 'briefing' | 'spot_select' | 'lure_select' | 'casting' | 'story_beat' | 'result'

const ARC_LABELS: Record<string, string> = {
  arc_lighthouse: 'The Lighthouse',
  arc_storm:      'The Storm',
  arc_family:     'The Family',
}

const DIFF_COLORS: Record<string, string> = {
  easy:   'text-green-400',
  normal: 'text-yellow-400',
  hard:   'text-red-400',
}

export default function BalikciPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  const activeSession    = useFishingStore((s) => s.activeSession)
  const storePhase       = useFishingStore((s) => s.phase)
  const selectedSpotId   = useFishingStore((s) => s.selectedSpotId)
  const selectedLureId   = useFishingStore((s) => s.selectedLureId)
  const completedSessions= useFishingStore((s) => s.completedSessions)
  const catchLog         = useFishingStore((s) => s.catchLog)
  const currentCastIndex = useFishingStore((s) => s.currentCastIndex)
  const storyBeatIndex   = useFishingStore((s) => s.storyBeatIndex)

  const [phase, setPhase]               = useState<PanelPhase>('briefing')
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef  = useRef<FishingScene | null>(null)

  // Pause the day-time clock when the panel is open
  useEffect(() => {
    setIsPaused(true)
    return () => setIsPaused(false)
  }, [setIsPaused])

  // Escape key closes the panel (only from briefing / result)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape' && (phase === 'briefing' || phase === 'result')) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  // Mount / tear-down FishingScene when entering the casting phase
  useEffect(() => {
    if (phase !== 'casting') return
    if (!activeSession || !selectedSpotId || !selectedLureId) return
    const canvas = canvasRef.current
    if (!canvas) return

    const spot = activeSession.spots.find(s => s.id === selectedSpotId)!
    const lure = activeSession.lures.find(l => l.id === selectedLureId)!
    const targetSpecies = spot.fishTypes.filter(f => lure.targetFish.includes(f))

    let scene: FishingScene | null = null
    let cancelled = false

    FishingScene.create({
      canvas,
      width:          480,
      height:         300,
      spotLabel:      spot.label,
      lureLabel:      lure.label,
      jiggingProfile: activeSession.jiggingProfile,
      targetSpecies,
      onCastResult: ({ caught, species }) => {
        // Stale-closure rule: always call getState() here
        useFishingStore.getState().advanceCast(caught, species ?? undefined)
        scene?.destroy()
        sceneRef.current = null
        const newStorePhase = useFishingStore.getState().phase
        if (newStorePhase === 'result') {
          const result = useFishingStore.getState().endSession()
          setSessionResult(result)
          setPhase('result')
          useObjectiveStore.getState().completeDemoStep('fish_pier')
        } else {
          setPhase('story_beat')
        }
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
  }, [phase, activeSession?.id, selectedSpotId, selectedLureId])

  function close() {
    sceneRef.current?.destroy()
    sceneRef.current = null
    useFishingStore.getState().reset()
    setLocation(null)
  }

  // ── Phase handlers ──────────────────────────────────────────────────────────

  function handlePickSession(sessionId: string) {
    useFishingStore.getState().startSession(sessionId)
    useFishingStore.getState().advanceFromBriefing()
    setPhase('spot_select')
  }

  function handlePickSpot(spotId: string) {
    useFishingStore.getState().selectSpot(spotId)
    setPhase('lure_select')
  }

  function handlePickLure(lureId: string) {
    useFishingStore.getState().selectLure(lureId)
    setPhase('casting')
  }

  function handleChooseDialogue(choiceId: string) {
    useFishingStore.getState().chooseDialogue(choiceId)
    setPhase('spot_select')
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderBriefing() {
    const available = FISHING_SESSIONS.filter(s => !completedSessions.includes(s.id))
    const done      = FISHING_SESSIONS.filter(s =>  completedSessions.includes(s.id))

    return (
      <div className="flex flex-col gap-3">
        <p className="text-blue-300 font-mono text-xs uppercase tracking-widest mb-1">
          Choose a Session
        </p>

        {available.length === 0 && (
          <p className="text-blue-500 font-mono text-sm italic">
            All sessions complete. Come back tomorrow.
          </p>
        )}

        {available.map(s => (
          <button
            key={s.id}
            onClick={() => handlePickSession(s.id)}
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
              &ldquo;{s.briefingText}&rdquo;
            </p>
            <p className="text-blue-600 font-mono text-xs mt-1">
              {s.castCount} cast{s.castCount !== 1 ? 's' : ''} &middot; {s.spots.length} spot{s.spots.length !== 1 ? 's' : ''}
            </p>
          </button>
        ))}

        {done.length > 0 && (
          <p className="text-blue-700 font-mono text-xs mt-1">
            {done.length} session{done.length !== 1 ? 's' : ''} completed
          </p>
        )}
      </div>
    )
  }

  function renderSpotSelect() {
    if (!activeSession) return null
    return (
      <div className="flex flex-col gap-3">
        <p className="text-blue-300 font-mono text-xs uppercase tracking-widest mb-1">
          Choose a Spot
          <span className="text-blue-600 ml-2 normal-case">
            cast {currentCastIndex + 1} / {activeSession.castCount}
          </span>
        </p>
        {activeSession.spots.map(spot => (
          <button
            key={spot.id}
            onClick={() => handlePickSpot(spot.id)}
            className="text-left border border-blue-800 rounded-lg p-3 hover:bg-blue-950/60 hover:border-blue-600 transition-colors"
          >
            <p className="text-blue-100 font-mono text-sm font-semibold">{spot.label}</p>
            <p className="text-blue-400 font-mono text-xs mt-0.5">{spot.hint}</p>
            <p className="text-blue-600 font-mono text-xs mt-1">
              Fish: {spot.fishTypes.join(', ')}
            </p>
          </button>
        ))}
      </div>
    )
  }

  function renderLureSelect() {
    if (!activeSession || !selectedSpotId) return null
    const spot = activeSession.spots.find(s => s.id === selectedSpotId)

    return (
      <div className="flex flex-col gap-3">
        <p className="text-blue-300 font-mono text-xs uppercase tracking-widest mb-1">
          Choose a Lure
        </p>
        {spot && (
          <p className="text-blue-500 font-mono text-xs mb-1">
            Spot: {spot.label} &mdash; {spot.fishTypes.join(', ')}
          </p>
        )}
        {activeSession.lures.map(lure => {
          const matched = spot ? lure.targetFish.some(f => spot.fishTypes.includes(f)) : false
          return (
            <button
              key={lure.id}
              onClick={() => handlePickLure(lure.id)}
              className={`text-left rounded-lg p-3 transition-colors border ${
                matched
                  ? 'border-green-700 hover:bg-green-950/40 hover:border-green-500'
                  : 'border-blue-800 hover:bg-blue-950/60 hover:border-blue-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className={`font-mono text-sm font-semibold ${matched ? 'text-green-300' : 'text-blue-100'}`}>
                  {lure.label}
                </p>
                {matched && (
                  <span className="text-green-500 font-mono text-xs">MATCHED</span>
                )}
              </div>
              <p className="text-blue-400 font-mono text-xs mt-0.5">
                Attracts: {lure.targetFish.join(', ')}
              </p>
            </button>
          )
        })}
      </div>
    )
  }

  function renderCasting() {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-blue-300 font-mono text-xs uppercase tracking-widest mb-1">Jigging</p>
        <p className="text-blue-500 font-mono text-xs mb-2">
          Click the canvas to jig &middot; scroll to reel when a fish bites
        </p>
        <canvas
          ref={canvasRef}
          width={480}
          height={300}
          style={{ display: 'block' }}
          className="rounded-lg border border-blue-900"
        />
      </div>
    )
  }

  function renderStoryBeat() {
    if (!activeSession) return null
    const beat = activeSession.storyBeats[storyBeatIndex]
    if (!beat) return null

    return (
      <div className="flex flex-col gap-4">
        <p className="text-blue-300 font-mono text-xs uppercase tracking-widest">
          Between Casts
        </p>
        <div className="border border-blue-800 rounded-lg p-4 bg-blue-950/30">
          <p className="text-amber-300 font-mono text-xs mb-1">Remy</p>
          <p className="text-blue-100 font-mono text-sm leading-relaxed">
            &ldquo;{beat.text}&rdquo;
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {beat.choices.map(choice => (
            <button
              key={choice.id}
              onClick={() => handleChooseDialogue(choice.id)}
              className="text-left border border-blue-800 rounded-lg px-4 py-2.5 hover:bg-blue-950/60 hover:border-blue-600 transition-colors"
            >
              <span className="text-blue-200 font-mono text-sm">{choice.text}</span>
              {choice.fragmentId && (
                <span className="text-blue-600 font-mono text-xs ml-2">[+story]</span>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  function renderResult() {
    const r = sessionResult
    return (
      <div className="flex flex-col gap-4">
        <p className="text-blue-300 font-mono text-xs uppercase tracking-widest">
          Session Complete
        </p>

        {r ? (
          <div className="border border-blue-800 rounded-lg p-4 bg-blue-950/30 flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-blue-400 font-mono text-xs">Nostalji seeds</span>
              <span className="text-blue-100 font-mono text-sm">+{r.nostaljiSeeds}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400 font-mono text-xs">Hikaye seeds</span>
              <span className="text-blue-100 font-mono text-sm">+{r.hikayeSeeds}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400 font-mono text-xs">Huzur progress</span>
              <span className="text-blue-100 font-mono text-sm">+{r.progress}</span>
            </div>
            {r.fragments.length > 0 && (
              <div className="mt-1 pt-2 border-t border-blue-800">
                <p className="text-blue-400 font-mono text-xs mb-1">Story fragments unlocked:</p>
                {r.fragments.map(f => (
                  <p key={f} className="text-amber-400 font-mono text-xs">{f}</p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="border border-blue-800 rounded-lg p-4 bg-blue-950/30">
            <p className="text-blue-500 font-mono text-sm italic">No rewards recorded.</p>
          </div>
        )}

        <div className="border border-blue-800 rounded-lg p-3 bg-blue-950/20">
          <p className="text-blue-400 font-mono text-xs mb-1">
            Fish caught: {catchLog.length}
          </p>
          {catchLog.map((entry, i) => (
            <p key={i} className="text-blue-300 font-mono text-xs">
              Cast {entry.castIndex + 1}: {entry.species} ({entry.spotId})
            </p>
          ))}
          {catchLog.length === 0 && (
            <p className="text-blue-600 font-mono text-xs italic">Nothing caught today.</p>
          )}
        </div>

        <button
          onClick={close}
          className="border border-blue-700 rounded-lg py-2 font-mono text-sm text-blue-200 hover:bg-blue-900/40 hover:border-blue-500 transition-colors"
        >
          Leave the pier
        </button>
      </div>
    )
  }

  // ── Layout ──────────────────────────────────────────────────────────────────

  const isWide = phase === 'casting'

  return (
    <div
      className={`bg-gray-950/97 border border-blue-900 rounded-xl shadow-2xl flex flex-col font-mono ${
        isWide ? 'w-[520px]' : 'w-96'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-blue-900">
        <div>
          <p className="text-blue-100 font-mono text-sm font-semibold tracking-wide">
            Remy&apos;s Pier
          </p>
          {activeSession && (
            <p className="text-blue-600 font-mono text-xs">
              {ARC_LABELS[activeSession.arcId] ?? activeSession.arcId}
              &nbsp;&middot;&nbsp;
              <span className={DIFF_COLORS[activeSession.difficulty]}>
                {activeSession.difficulty}
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
      <div className="p-5 overflow-y-auto max-h-[75vh]">
        {phase === 'briefing'   && renderBriefing()}
        {phase === 'spot_select'&& renderSpotSelect()}
        {phase === 'lure_select'&& renderLureSelect()}
        {phase === 'casting'    && renderCasting()}
        {phase === 'story_beat' && renderStoryBeat()}
        {phase === 'result'     && renderResult()}
      </div>

      {/* Footer progress dots */}
      {activeSession && phase !== 'briefing' && phase !== 'result' && (
        <div className="px-5 py-2 border-t border-blue-900 flex items-center gap-1.5">
          {Array.from({ length: activeSession.castCount }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < currentCastIndex
                  ? 'bg-blue-400'
                  : i === currentCastIndex && (phase === 'casting' || phase === 'story_beat')
                  ? 'bg-blue-200 animate-pulse'
                  : 'bg-blue-800'
              }`}
            />
          ))}
          <span className="text-blue-700 font-mono text-xs ml-2">
            {currentCastIndex} / {activeSession.castCount} casts
          </span>
        </div>
      )}
    </div>
  )
}
