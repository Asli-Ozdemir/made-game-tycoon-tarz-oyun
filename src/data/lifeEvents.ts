import type { LifeEvent } from '@/types/lifeEvent'

// Spec A çekirdek olayları. NPC yaşam-olayı içeriği (evlilik/doğum/ölüm/miras) Spec B'de
// bu listeye veri olarak eklenir; motor değişmez.
export const LIFE_EVENTS: LifeEvent[] = [
  {
    id: 'emeklilik',
    trigger: { kind: 'yearsElapsed', years: 30 },
    effect:  { kind: 'setFlag', flag: 'arcEnd' },
  },
]
