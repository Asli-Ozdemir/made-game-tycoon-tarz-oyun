import type { LifeEvent } from '@/types/lifeEvent'

// Spec A çekirdek olayları. NPC yaşam-olayı içeriği (evlilik/doğum/ölüm/miras) Spec B'de
// bu listeye veri olarak eklenir; motor değişmez.
export const LIFE_EVENTS: LifeEvent[] = [
  // Yeni nesil — Tessa 18'inde reşit olur, stüdyoya junior programcı adayı olarak gelir.
  {
    id: 'tessa_resit',
    trigger: { kind: 'npcAge', npcId: 'tessa', age: 18 },
    effect:  { kind: 'unlockRole', npcId: 'tessa', role: 'hireable' },
  },
  // Bea 18'inde köprü ayağına ilk muralini yapar (epilog/Spec C bu bayrağı okur).
  {
    id: 'bea_mural',
    trigger: { kind: 'npcAge', npcId: 'bea', age: 18 },
    effect:  { kind: 'setFlag', flag: 'bea_mural_yapildi' },
  },
  {
    id: 'emeklilik',
    trigger: { kind: 'yearsElapsed', years: 30 },
    effect:  { kind: 'setFlag', flag: 'arcEnd' },
  },
]
