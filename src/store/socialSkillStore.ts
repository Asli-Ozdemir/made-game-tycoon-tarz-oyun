// src/store/socialSkillStore.ts
import { create } from 'zustand'
import { SOCIAL_SKILLS } from '@/data/socialSkills'
import type { SocialSkillId, SocialSkillEffect } from '@/data/socialSkills'

interface SocialSkillStore {
  xp: Record<SocialSkillId, number>

  gainXP(skillId: SocialSkillId, amount?: number): void
  getXP(skillId: SocialSkillId): number
  getTier(skillId: SocialSkillId): number          // 0 = hiç açılmadı, 1–5
  getActiveEffect(skillId: SocialSkillId): SocialSkillEffect | null
  getAllActiveEffects(): { skillId: SocialSkillId; effect: SocialSkillEffect }[]
  reset(): void
}

const INITIAL_XP: Record<SocialSkillId, number> = {
  capkinlik:      0,
  dostluk:        0,
  sicakkanlilik:  0,
  sogukkanlilik:  0,
}

export const useSocialSkillStore = create<SocialSkillStore>((set, get) => ({
  xp: { ...INITIAL_XP },

  gainXP(skillId, amount = 1) {
    set(s => ({
      xp: { ...s.xp, [skillId]: s.xp[skillId] + amount },
    }))
  },

  getXP(skillId) {
    return get().xp[skillId]
  },

  getTier(skillId) {
    const skill   = SOCIAL_SKILLS.find(s => s.id === skillId)
    if (!skill) return 0
    const current = get().xp[skillId]
    let tier = 0
    for (const t of skill.tiers) {
      if (current >= t.xpRequired) tier = t.tier
    }
    return tier
  },

  getActiveEffect(skillId) {
    const tier  = get().getTier(skillId)
    if (tier === 0) return null
    const skill = SOCIAL_SKILLS.find(s => s.id === skillId)
    if (!skill) return null
    return skill.tiers.find(t => t.tier === tier)?.effect ?? null
  },

  getAllActiveEffects() {
    return SOCIAL_SKILLS.flatMap(skill => {
      const effect = get().getActiveEffect(skill.id)
      if (!effect) return []
      return [{ skillId: skill.id, effect }]
    })
  },

  reset() {
    set({ xp: { ...INITIAL_XP } })
  },
}))
