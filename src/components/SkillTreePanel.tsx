// src/components/SkillTreePanel.tsx
import { useState } from 'react'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import { SKILL_NODES, type SkillNode } from '@/data/skillTree'
import { IDEA_SEED_META } from '@/data/npcDialogues'
import SkillTreeCanvas from '@/components/SkillTreeCanvas'
import { DEMO_MODE } from '@/config'

interface Props {
  onWake: () => void
}

export default function SkillTreePanel({ onWake }: Props) {
  const seeds        = useIdeaSeedStore(s => s.seeds)
  const getNodeState = useSkillTreeStore(s => s.getNodeState)
  const [hovered, setHovered] = useState<SkillNode | null>(null)

  const seedTypes = ['nostalji', 'hikaye', 'kaos', 'zaman_yonetimi'] as const

  return (
    <div className="flex flex-col w-full h-full relative" style={{ maxWidth: 800, maxHeight: 640 }}>

      {/* Üst bar — tohum sayaçları */}
      <div className="flex justify-center gap-6 py-3 border-b border-purple-900/30">
        {seedTypes.map(type => {
          const meta = IDEA_SEED_META[type]
          return (
            <div key={type} className="flex items-center gap-1.5">
              <span className="text-base">{meta.emoji}</span>
              <span className="font-mono text-sm" style={{ color: meta.color }}>
                {seeds[type]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Canvas alanı */}
      <div className="flex-1 relative">
        <SkillTreeCanvas onHover={setHovered} />
      </div>

      {/* Alt bar — hover tooltip */}
      <div className="h-16 border-t border-purple-900/30 flex items-center px-6 gap-4">
        {hovered ? (
          <>
            <div className="flex-1">
              <p className="text-purple-200 text-sm font-bold">{hovered.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{hovered.description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {hovered.cost.map((c, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    background: 'rgba(124,58,237,0.15)',
                    color: IDEA_SEED_META[c.type].color,
                    border: `1px solid ${IDEA_SEED_META[c.type].color}44`,
                  }}
                >
                  {IDEA_SEED_META[c.type].emoji} ×{c.amount}
                </span>
              ))}
            </div>
            <div>
              {DEMO_MODE && hovered.tier > 1 ? (
                <span className="text-xs px-2 py-1 rounded bg-amber-900/40 text-amber-300">
                  🔒 Tam sürümde
                </span>
              ) : (
                <span className={`text-xs px-2 py-1 rounded ${
                  getNodeState(hovered.id) === 'active'     ? 'bg-purple-900/40 text-purple-300' :
                  getNodeState(hovered.id) === 'unlockable' ? 'bg-blue-900/40 text-blue-300' :
                  'bg-gray-900/40 text-gray-600'
                }`}>
                  {getNodeState(hovered.id) === 'active'     ? '✓ Açık' :
                   getNodeState(hovered.id) === 'unlockable' ? 'Aç' : 'Kilitli'}
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-700 text-xs mx-auto font-mono">
            bir nörona tıkla · ESC ile uyan
          </p>
        )}
      </div>

      {/* Uyan butonu */}
      <button
        onClick={onWake}
        className="absolute top-3 right-4 text-gray-700 hover:text-gray-400 text-xs transition-colors font-mono"
      >
        Uyan (ESC)
      </button>
    </div>
  )
}
