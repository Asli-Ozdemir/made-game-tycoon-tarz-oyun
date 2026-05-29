import type { SkillKey, EmployeePersonality } from '@/types/employee'
import type { BackgroundId } from '@/data/backgrounds'

export interface Course {
  id:          string
  name:        string
  targetSkill: SkillKey
  xpBoost:     number    // kurs tamamlandığında eklenen XP (arka plan çarpanı öncesi)
  duration:    number    // hafta cinsinden süre
  cost:        number    // $
  traitId?:    string    // tamamlandığında açılan trait id (opsiyonel)
}

export interface Trait {
  id:          string
  name:        string
  description: string
}

export const COURSES: Course[] = [
  { id: 'prog_temel',    name: 'Algoritma Temelleri',     targetSkill: 'programming', xpBoost: 15, duration: 4, cost: 8000 },
  { id: 'prog_ileri',   name: 'İleri Yazılım Mimarisi',  targetSkill: 'programming', xpBoost: 35, duration: 8, cost: 20000, traitId: 'kod_ustasi' },
  { id: 'design_temel', name: 'Temel Tasarım',            targetSkill: 'design',       xpBoost: 15, duration: 4, cost: 7000 },
  { id: 'design_ileri', name: 'UX Uzmanlığı',             targetSkill: 'design',       xpBoost: 35, duration: 8, cost: 18000, traitId: 'gorsel_deha' },
  { id: 'sound_temel',  name: 'Ses Temelleri',             targetSkill: 'sound',        xpBoost: 15, duration: 4, cost: 6000 },
  { id: 'sound_ileri',  name: 'Profesyonel Ses Tasarımı', targetSkill: 'sound',        xpBoost: 35, duration: 8, cost: 16000, traitId: 'ses_buyucusu' },
  { id: 'mgmt_temel',   name: 'Liderlik 101',              targetSkill: 'management',   xpBoost: 15, duration: 4, cost: 7000 },
  { id: 'mgmt_ileri',   name: 'Stratejik Yönetim',        targetSkill: 'management',   xpBoost: 35, duration: 8, cost: 19000, traitId: 'ekip_lideri' },
]

export const TRAITS: Trait[] = [
  { id: 'kod_ustasi',   name: 'Kod Ustası',   description: 'Programlama konusunda usta — programming 1.5× bonus' },
  { id: 'gorsel_deha',  name: 'Görsel Deha',  description: 'Tasarım konusunda derin kavrayış — design 1.5× bonus' },
  { id: 'ses_buyucusu', name: 'Ses Büyücüsü', description: 'Ses tasarımında üstün yetenek — sound 1.5× bonus' },
  { id: 'ekip_lideri',  name: 'Ekip Lideri',  description: 'Takımı motive eden lider — management 1.5× bonus + atanmamış çalışanlara +2 loyalty/hafta' },
]

export const SKILL_CAPS: Record<EmployeePersonality, Record<SkillKey, number>> = {
  odakli:    { programming: 10, design: 6,  sound: 5,  management: 6  },
  yaratici:  { programming: 5,  design: 10, sound: 8,  management: 5  },
  sosyal:    { programming: 5,  design: 7,  sound: 6,  management: 10 },
  rekabetci: { programming: 8,  design: 8,  sound: 5,  management: 7  },
  sakin:     { programming: 7,  design: 7,  sound: 10, management: 7  },
}

export const BACKGROUND_AFFINITY: Record<BackgroundId, { skills: SkillKey[]; multiplier: number }> = {
  kk_uzmani:         { skills: ['sound', 'management'],                             multiplier: 1.5 },
  yaratici_direktor: { skills: ['design'],                                           multiplier: 1.5 },
  bas_muhendis:      { skills: ['programming'],                                      multiplier: 1.5 },
  yapimci:           { skills: ['management'],                                       multiplier: 1.5 },
  eski_ceo:          { skills: ['programming', 'design', 'sound', 'management'],    multiplier: 1.2 },
}
