// src/data/backgrounds.ts
export type BackgroundId =
  | 'kk_uzmani'
  | 'yaratici_direktor'
  | 'bas_muhendis'
  | 'yapimci'
  | 'eski_ceo'

export interface ProfessionStats {
  programlama:   number
  tasarim:       number
  ses:           number
  projeyonetimi: number
}

export interface PersonalityStats {
  karisma:       number
  odak:          number
  rekabetcilik:  number
  yaraticilik:   number
  isZekasi:      number
}

type BackgroundSpecial =
  | { type: 'rival_early' }
  | { type: 'rep_loss_multiplier'; multiplier: 2 }
  | { type: 'no_bugs' }

export interface BackgroundDef {
  id:          BackgroundId
  emoji:       string
  title:       string
  story:       string
  houseStory:  string
  houseSale:   number
  startRep:    number
  profession:  ProfessionStats
  advantage:   string
  special?:    BackgroundSpecial
}

export const BACKGROUNDS: BackgroundDef[] = [
  {
    id: 'kk_uzmani',
    emoji: '🔍',
    title: 'KK Uzmanı',
    story: 'Otomasyon bahanesiyle çıkarıldın. On yıllık emeğin bir e-postayla bitti.',
    houseStory: 'Küçük daireni $30,000\'a sattın. Az, ama başlangıç için yeterli.',
    houseSale: 30_000,
    startRep: 0,
    profession: { programlama: 4, tasarim: 4, ses: 5, projeyonetimi: 5 },
    advantage: 'Playtesting bonusu — yayınlanan oyunlarda bug olmaz.',
    special: { type: 'no_bugs' },
  },
  {
    id: 'yaratici_direktor',
    emoji: '🎨',
    title: 'Yaratıcı Direktör',
    story: 'En iyi fikrin çalındı, sen çıkarıldın. İmzasız kalan bir oyun senin eserindi.',
    houseStory: 'Sanat atölyeni $40,000\'a kaptırdın. Resimler gitti, hayaller kaldı.',
    houseSale: 40_000,
    startRep: 0,
    profession: { programlama: 2, tasarim: 9, ses: 4, projeyonetimi: 3 },
    advantage: 'Görsel kalite yüksek (Faz 5\'te aktif olur).',
  },
  {
    id: 'bas_muhendis',
    emoji: '💻',
    title: 'Baş Mühendis',
    story: 'Başarısız projenin faturası sana kesildi. Takım başarısızken sen günah keçisi oldun.',
    houseStory: 'Eve dönüp çantanı topladın. $50,000\'lık bir başlangıç, başka şansın yok.',
    houseSale: 50_000,
    startRep: 0,
    profession: { programlama: 8, tasarim: 3, ses: 2, projeyonetimi: 4 },
    advantage: 'Solo oyun yapabilir, programlama kalite bonusu yüksek.',
  },
  {
    id: 'yapimci',
    emoji: '📋',
    title: 'Yapımcı',
    story: 'Yeni CEO "kültürel uyum yok" dedi. Aslında çok şey biliyordun.',
    houseStory: 'Geniş apartman dairesini $75,000\'a sattın. Aileni ikna etmek daha zordu.',
    houseSale: 75_000,
    startRep: 0,
    profession: { programlama: 1, tasarim: 4, ses: 3, projeyonetimi: 9 },
    advantage: 'En yüksek ekip verimliliği (Faz 5\'te aktif olur).',
  },
  {
    id: 'eski_ceo',
    emoji: '👔',
    title: 'Eski CEO',
    story: 'Yönetim kurulu seni devirdi. Hisseler düşünce ilk feda edilensin.',
    houseStory: 'Villanı $120,000\'a sattın. Basın bunu da haber yaptı.',
    houseSale: 120_000,
    startRep: 20,
    profession: { programlama: 3, tasarim: 3, ses: 2, projeyonetimi: 7 },
    advantage: 'Yüksek başlangıç parası ve itibar — ama herkes seni izliyor.',
    special: { type: 'rep_loss_multiplier', multiplier: 2 },
  },
]
