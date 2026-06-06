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
  // Evlilik — Daniel & Sigrid (koşullu: oyuncu ikisini de romantize etmediyse).
  // player_romance_* bayrakları Spec C/romantizm-arc tarafından set edilir; B yalnız okur.
  {
    id: 'evlilik_daniel_sigrid',
    trigger: {
      kind: 'condition',
      test: (ctx) =>
        ctx.yearsElapsed >= 9 &&
        !ctx.hasFlag('player_romance_daniel') &&
        !ctx.hasFlag('player_romance_sigrid'),
    },
    effect: { kind: 'setFlag', flag: 'married_daniel_sigrid' },
  },
  // Aldo ileri yaşta vefat eder → Rosa fırını devralır (Rosa'nın "yeğen→sahibi" arc'ını kapatır).
  {
    id: 'aldo_olum',
    trigger: { kind: 'yearsElapsed', years: 14 },
    effect:  { kind: 'retireNpc', npcId: 'aldo', reason: 'yaşlılık' },
  },
  {
    id: 'firin_devri_rosa',
    trigger: { kind: 'yearsElapsed', years: 14 },
    effect:  { kind: 'setFlag', flag: 'devir_firin_rosa' },
  },
  {
    id: 'emeklilik',
    trigger: { kind: 'yearsElapsed', years: 30 },
    effect:  { kind: 'setFlag', flag: 'arcEnd' },
  },
]
