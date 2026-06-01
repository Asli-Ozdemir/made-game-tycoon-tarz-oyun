// src/components/DialogueView.tsx
import { useState } from 'react'
import { NPC_DEFS, IDEA_SEED_META, type Dialogue, type IdeaSeedType } from '@/data/npcDialogues'
import { useNPCStore } from '@/store/npcStore'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useDayTimeStore } from '@/store/dayTimeStore'

interface Props {
  npcId: 'marcus' | 'remy' | 'theo'
  onClose: () => void
}

type Phase = 'list' | 'reading' | 'reward'

interface RewardInfo {
  type: IdeaSeedType
  label: string
  emoji: string
  color: string
}

export default function DialogueView({ npcId, onClose }: Props) {
  const def = NPC_DEFS[npcId]
  const npcStore     = useNPCStore()
  const addSeed      = useIdeaSeedStore((s) => s.addSeed)
  const advanceTime  = useDayTimeStore((s) => s.advanceRealSeconds)

  const [phase, setPhase]           = useState<Phase>('list')
  const [activeDialogue, setActive] = useState<Dialogue | null>(null)
  const [choiceIndex, setChoice]    = useState<number | null>(null)
  const [reward, setReward]         = useState<RewardInfo | null>(null)

  const tier      = npcStore.getTier(npcId)
  const rel       = npcStore.getRelationship(npcId)
  const available = npcStore.getAvailableDialogues(npcId)

  function openDialogue(d: Dialogue) {
    setActive(d)
    setChoice(null)
    setPhase('reading')
  }

  function finishDialogue(extraSeed?: IdeaSeedType, extraBonus = 0) {
    if (!activeDialogue) return
    const totalBonus = activeDialogue.relationshipBonus + extraBonus
    npcStore.completeDialogue(npcId, activeDialogue.id, totalBonus)
    advanceTime(120) // 1 oyun saati

    const seedType = extraSeed ?? activeDialogue.ideaSeed
    if (seedType) {
      addSeed(seedType)
      const meta = IDEA_SEED_META[seedType]
      setReward({ type: seedType, ...meta })
      setPhase('reward')
    } else {
      setPhase('list')
      setActive(null)
    }
  }

  function dismissReward() {
    setReward(null)
    setActive(null)
    setPhase('list')
  }

  // ─── Ödül ekranı ───────────────────────────────────────────────────────────
  if (phase === 'reward' && reward) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-6">
        <div className="text-4xl">{reward.emoji}</div>
        <p className="text-xs uppercase tracking-widest text-gray-500">Fikir Tohumu Kazandın</p>
        <p className="text-xl font-bold" style={{ color: reward.color }}>{reward.label}</p>
        <p className="text-gray-500 text-xs">Beceri ağacında kullanabilirsin.</p>
        <button
          onClick={dismissReward}
          className="mt-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-lg text-sm transition-colors"
        >
          Tamam
        </button>
      </div>
    )
  }

  // ─── Diyalog okuma ekranı ──────────────────────────────────────────────────
  if (phase === 'reading' && activeDialogue) {
    const activeChoice = choiceIndex !== null ? activeDialogue.choices?.[choiceIndex] : null
    const lines = activeChoice ? activeChoice.lines : activeDialogue.lines
    const hasChoices = activeDialogue.choices && choiceIndex === null

    return (
      <div className="flex flex-col gap-3 w-full">
        {/* Başlık */}
        <div className="flex items-center gap-2 border-b border-gray-700 pb-2 mb-1">
          <button
            onClick={() => { setPhase('list'); setActive(null); setChoice(null) }}
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            ← Geri
          </button>
          <span className="text-gray-400 text-xs ml-auto">{activeDialogue.title}</span>
          <TierBadge tier={activeDialogue.tier} />
        </div>

        {/* Konuşma satırları */}
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex gap-2 ${line.speaker === 'player' ? 'flex-row-reverse' : ''}`}
            >
              {line.speaker === 'npc' && (
                <span className="text-base shrink-0 mt-0.5">{def.emoji}</span>
              )}
              <div
                className={`rounded-xl px-3 py-2 text-sm max-w-[85%] leading-relaxed ${
                  line.speaker === 'npc'
                    ? 'bg-gray-800 text-gray-200'
                    : 'bg-blue-900/60 text-blue-100 text-right'
                }`}
              >
                {line.text}
              </div>
            </div>
          ))}
        </div>

        {/* Seçimler veya tamamla */}
        <div className="flex flex-col gap-2 mt-1">
          {hasChoices ? (
            <>
              <p className="text-gray-500 text-xs text-center">Ne yanıt verirsin?</p>
              {activeDialogue.choices!.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => setChoice(i)}
                  className="text-left bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-blue-600 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors"
                >
                  <span className="text-blue-400 mr-1">›</span>
                  {choice.text}
                  {choice.ideaSeed && (
                    <span className="ml-2 text-xs opacity-60">
                      {IDEA_SEED_META[choice.ideaSeed].emoji}
                    </span>
                  )}
                </button>
              ))}
            </>
          ) : (
            <button
              onClick={() => {
                const bonus = activeChoice?.relationshipBonus
                const seed  = activeChoice?.ideaSeed
                finishDialogue(seed, bonus)
              }}
              className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {activeChoice ? 'Devam' : 'Tamamla'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── Liste ekranı ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* NPC bilgisi */}
      <div className="flex items-start gap-3">
        <span className="text-3xl">{def.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-blue-300 font-bold text-base">{def.name}</h2>
            <span className="text-gray-500 text-xs">— {def.role}</span>
          </div>
          <p className="text-gray-500 text-xs mt-0.5 leading-relaxed italic">{def.philosophy}</p>
        </div>
      </div>

      {/* Dostluk çubuğu */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-500 text-xs">Dostluk</span>
          <span className="text-gray-400 text-xs">{rel} / 100</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${rel}%`,
              background: tier === 3 ? '#a78bfa' : tier === 2 ? '#60a5fa' : '#3b82f6',
            }}
          />
        </div>
        <div className="flex gap-1 mt-1">
          {[1, 2, 3].map((t) => (
            <span
              key={t}
              className={`text-xs px-1.5 py-0.5 rounded ${
                tier >= t
                  ? 'bg-blue-800/60 text-blue-300'
                  : 'bg-gray-800 text-gray-600'
              }`}
            >
              T{t}
            </span>
          ))}
        </div>
      </div>

      {/* Diyalog listesi */}
      <div className="flex flex-col gap-2">
        <p className="text-gray-500 text-xs uppercase tracking-wide">Konuşmalar</p>
        {available.map((d) => {
          const seen = npcStore.hasSeenDialogue(npcId, d.id)
          return (
            <button
              key={d.id}
              onClick={() => openDialogue(d)}
              className={`text-left rounded-lg px-3 py-2.5 transition-colors border ${
                seen
                  ? 'bg-gray-900/50 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-400'
                  : 'bg-gray-800 border-gray-700 text-gray-200 hover:border-blue-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <TierBadge tier={d.tier} />
                <span className="text-sm flex-1">{d.title}</span>
                {seen && <span className="text-xs text-gray-600">✓</span>}
                {d.ideaSeed && !seen && (
                  <span className="text-xs">{IDEA_SEED_META[d.ideaSeed].emoji}</span>
                )}
              </div>
            </button>
          )
        })}
        {tier < 3 && (
          <p className="text-gray-600 text-xs text-center mt-1">
            {tier === 1
              ? `${def.tier2Threshold - rel} dostluk puanı daha — T2 açılır`
              : `${def.tier3Threshold - rel} dostluk puanı daha — T3 açılır`}
          </p>
        )}
      </div>

      {/* Kapat */}
      <button
        onClick={onClose}
        className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-4 py-2 rounded-lg text-xs transition-colors mt-1"
      >
        Çık (ESC)
      </button>
    </div>
  )
}

function TierBadge({ tier }: { tier: 1 | 2 | 3 }) {
  const colors: Record<number, string> = {
    1: 'bg-gray-700 text-gray-400',
    2: 'bg-blue-900/70 text-blue-400',
    3: 'bg-purple-900/70 text-purple-400',
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${colors[tier]}`}>
      T{tier}
    </span>
  )
}
