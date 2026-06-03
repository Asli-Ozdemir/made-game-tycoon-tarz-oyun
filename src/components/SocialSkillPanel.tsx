// src/components/SocialSkillPanel.tsx
import { useState } from 'react'
import { useSocialSkillStore } from '@/store/socialSkillStore'
import { SOCIAL_SKILLS } from '@/data/socialSkills'
import SocialSkillCanvas from '@/components/SocialSkillCanvas'
import type { SocialSkill, SocialSkillTier } from '@/data/socialSkills'

interface Props {
  onWake: () => void
}

interface HoverInfo {
  skill:  SocialSkill
  tier:   SocialSkillTier
  active: boolean
  xp:     number
}

const EFFECT_LABELS: Record<string, (v: number) => string> = {
  charm_bonus:       (v) => `+${Math.round(v * 100)}% çekicilik bonusu`,
  friendship_decay:  (v) => `%${Math.round(v * 100)} daha yavaş azalır`,
  first_impression:  (v) => `İlk tanışmada +${v} kalp`,
  villain_sense:     (v) => `%${Math.round(v * 100)} sinsiliği fark etme`,
}

export default function SocialSkillPanel({ onWake }: Props) {
  const [hovered, setHovered] = useState<HoverInfo | null>(null)
  const getTier = useSocialSkillStore(s => s.getTier)
  const getXP   = useSocialSkillStore(s => s.getXP)

  return (
    <div className="flex flex-col w-full h-full relative" style={{ maxWidth: 800, maxHeight: 640 }}>

      {/* Üst bar — aktif tier özeti */}
      <div className="flex justify-center gap-6 py-3 border-b border-purple-900/30">
        {SOCIAL_SKILLS.map(skill => {
          const tier = getTier(skill.id)
          const xp   = getXP(skill.id)
          const next = skill.tiers.find(t => t.tier === tier + 1)
          return (
            <div key={skill.id} className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-xs text-gray-500">{skill.name}</span>
              <span className="font-mono text-sm text-purple-300">
                {tier === 0 ? '—' : `T${tier}`}
              </span>
              {next && (
                <span className="font-mono text-xs text-gray-700">
                  {xp}/{next.xpRequired}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <SocialSkillCanvas onHover={setHovered} />
      </div>

      {/* Alt bar — hover tooltip */}
      <div className="h-16 border-t border-purple-900/30 flex items-center px-6 gap-4">
        {hovered ? (
          <>
            <div className="flex-1">
              <p className="text-purple-200 text-sm font-bold">
                {hovered.skill.name} — {hovered.tier.name}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">{hovered.tier.description}</p>
            </div>
            <div className="text-xs text-blue-400 font-mono shrink-0">
              {EFFECT_LABELS[hovered.tier.effect.type]?.(hovered.tier.effect.value)}
            </div>
            <div>
              <span className={`text-xs px-2 py-1 rounded ${
                hovered.active
                  ? 'bg-purple-900/40 text-purple-300'
                  : 'bg-gray-900/40 text-gray-600'
              }`}>
                {hovered.active ? `✓ T${hovered.tier.tier} Aktif` : `T${hovered.tier.tier} — ${hovered.tier.xpRequired} XP`}
              </span>
            </div>
          </>
        ) : (
          <p className="text-gray-700 text-xs mx-auto font-mono">
            bir yeteneğe tıkla · ESC ile uyan
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
