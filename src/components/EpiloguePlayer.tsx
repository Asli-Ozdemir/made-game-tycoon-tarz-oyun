import { useState, useMemo } from 'react'
import { useLifeStore } from '@/store/lifeStore'
import { useCharacterStore } from '@/store/characterStore'
import { useGameStore } from '@/store/gameStore'
import { useNPCStore } from '@/store/npcStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { getNpc } from '@/data/npcDialogues'
import { buildEpilogue, type FinaleSnapshot, type NexusOutcome } from '@/engine/finaleEngine'

const PHIL_NPCS = ['marcus', 'remy', 'theo', 'bruno', 'magnus', 'yevgeni', 'marta', 'clara', 'aldo', 'rex', 'vivian', 'soren']

function buildSnapshot(): FinaleSnapshot {
  const cs = useCharacterStore.getState()
  const life = useLifeStore.getState()
  const npc = useNPCStore.getState()

  const spouseName = cs.spouseId ? (getNpc(cs.spouseId)?.name ?? null) : null
  const childNames = cs.childIds
    .map((id) => life.spawnedNpcs.find((d) => d.id === id)?.name)
    .filter((n): n is string => !!n)

  let topId: string | null = null
  let topRel = 0
  for (const id of PHIL_NPCS) {
    const r = npc.getRelationship(id)
    if (r > topRel) { topRel = r; topId = id }
  }

  return {
    playerName:       cs.name || 'Stüdyo Sahibi',
    spouseName,
    childNames,
    nexusOutcome:     (useCutsceneStore.getState().resolutionChoice ?? 'none') as NexusOutcome,
    reputation:       useGameStore.getState().reputation,
    topPhilosophyNpc: topId,
    beaMural:         life.hasFlag('bea_mural_yapildi'),
    firinDevri:       life.hasFlag('devir_firin_rosa'),
    danielSigridEvli: life.hasFlag('married_daniel_sigrid'),
  }
}

export default function EpiloguePlayer() {
  const arcEnd = useLifeStore((s) => s.flags.has('arcEnd'))
  const shown  = useLifeStore((s) => s.flags.has('arcEnd_shown'))
  const visible = arcEnd && !shown

  const content = useMemo(() => (visible ? buildEpilogue(buildSnapshot()) : null), [visible])
  const [step, setStep] = useState(0)

  if (!visible || !content) return null

  const screens = [
    ...content.monolog.map((l) => ({ kind: 'mono' as const, speaker: l.speaker, text: l.text })),
    ...content.kartlar.map((c) => ({ kind: 'kart' as const, baslik: c.baslik, metin: c.metin })),
  ]
  const cur = screens[step]
  const last = step >= screens.length - 1

  function advance() {
    if (last) useLifeStore.getState().setFlag('arcEnd_shown')
    else setStep((s) => s + 1)
  }

  return (
    <div onClick={advance} className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] cursor-pointer">
      <div className="max-w-lg w-full px-8 text-center">
        {cur.kind === 'mono' ? (
          <>
            <p className="text-gray-500 text-xs mb-3 tracking-widest">{cur.speaker.toUpperCase()}</p>
            <p className="text-white text-xl leading-relaxed italic">“{cur.text}”</p>
          </>
        ) : (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <p className="text-blue-300 text-xs tracking-widest mb-2">{cur.baslik.toUpperCase()}</p>
            <p className="text-gray-200 text-lg leading-relaxed">{cur.metin}</p>
          </div>
        )}
        <p className="text-gray-600 text-xs mt-8">
          {last ? 'Kapatmak için tıkla' : 'Devam için tıkla'} · {step + 1}/{screens.length}
        </p>
      </div>
    </div>
  )
}
