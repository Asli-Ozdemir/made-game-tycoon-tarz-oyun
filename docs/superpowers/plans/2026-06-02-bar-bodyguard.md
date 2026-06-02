# Bar Bodyguard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bar bodyguard yan işini — vardiya veri modeli, barStore, DoorScene (Papers Please kapı) ve FightScene (yumruk dövüşü) — çalışır hale getir.

**Architecture:** `barShifts.ts` statik vardiya verisini tutar; `barStore` aktif vardiya durumunu (kapı kararları, gerginlik, dövüş) yönetir ve `lifePathStore.addProgress('emek')` ile `ideaSeedStore.addSeed('kaos')` çağırır. `DoorScene` misafir kartını render eden PixiJS overlay'i, `FightScene` yumruk dövüşü overlay'ini sağlar.

**Tech Stack:** TypeScript, Zustand, Vitest, PixiJS v8.18.1, React 18

---

## Dosya Haritası

| Dosya | İşlem | Sorumluluk |
|-------|-------|------------|
| `src/data/barShifts.ts` | Yeni | Tip tanımları + 3 tam vardiya (shift_01–03) |
| `src/store/barStore.ts` | Yeni | Aktif vardiya, kapı kararları, gerginlik, dövüş, ödül |
| `src/store/__tests__/barStore.test.ts` | Yeni | Store logic testleri |
| `src/pixi/DoorScene.ts` | Yeni | Papers Please kapı arayüzü (PixiJS) |
| `src/pixi/FightScene.ts` | Yeni | Yumruk dövüşü overlay (PixiJS) |

---

## Task 1: barShifts.ts — Tip Tanımları + 3 Vardiya

**Files:**
- Create: `src/data/barShifts.ts`

- [ ] **Adım 1: barShifts.ts oluştur**

```ts
// src/data/barShifts.ts

export interface Guest {
  id: string
  name: string
  isBlacklisted: boolean
  isVip: boolean
  isDrunk: boolean
  isDangerous: boolean
  visualCues: string[]        // örn. ["Sallanıyor", "Gözleri kızarmış"]
  meetsNightRule: boolean     // gece kuralına uyuyor mu
}

export interface TensionStep {
  text: string                // sahne açıklaması
  options: {
    label: string             // seçenek metni
    tensionDelta: number      // + artış, - azalış (−20 to +30 arası önerilir)
  }[]
}

export interface Incident {
  id: string
  description: string         // "Sarhoş müşteri barmenle tartışıyor"
  tensionSteps: TensionStep[]
  fightIfUnresolved: boolean
}

export interface BarShift {
  id: string                  // 'shift_01' ... 'shift_10'
  nightRule: string           // "Bu gece sadece rezervasyonlular"
  blacklist: string[]         // Guest id listesi
  vipList: string[]           // Guest id listesi
  guests: Guest[]
  incidents: Incident[]
  incidentTriggers: number[]  // hangi misafirden SONRA kesinti (0-bazlı index)
}

// ─── VARDIYA 1 — Kolay (4 misafir, 1 olay) ──────────────────────────────────

const shift01: BarShift = {
  id: 'shift_01',
  nightRule: '18 yaşından küçük alınmaz',
  blacklist: ['guest_volkan_01'],
  vipList: [],
  guests: [
    {
      id: 'guest_ayse_01',
      name: 'Ayşe',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Düzgün giyinmiş', 'Sakin tavır'],
      meetsNightRule: true,
    },
    {
      id: 'guest_mehmet_01',
      name: 'Mehmet',
      isBlacklisted: false,
      isVip: false,
      isDrunk: true,
      isDangerous: false,
      visualCues: ['Sallanıyor', 'Gözleri kızarmış', 'Sesi yüksek'],
      meetsNightRule: true,
    },
    {
      id: 'guest_volkan_01',
      name: 'Volkan',
      isBlacklisted: true,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Sakin görünüyor'],
      meetsNightRule: true,
    },
    {
      id: 'guest_selin_01',
      name: 'Selin',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Grupla gelmiş', 'Normal'],
      meetsNightRule: true,
    },
  ],
  incidents: [
    {
      id: 'inc_tartisma_01',
      description: 'Sarhoş müşteri barmenle sert tartışmaya girdi. Sesler yükseliyor.',
      fightIfUnresolved: true,
      tensionSteps: [
        {
          text: 'Müşteri bardaki bardağı yere fırlattı. Barmen seni çağırdı.',
          options: [
            { label: 'Sakin ama kararlı konuş: "Lütfen sakin olun."', tensionDelta: -25 },
            { label: 'Hemen arasına gir ve müşteriyi dışarı yönlendir', tensionDelta: -10 },
            { label: '"Çık buradan!" diye bağır', tensionDelta: 30 },
          ],
        },
        {
          text: 'Müşteri hâlâ gergin. Barmen tedirgin bakıyor.',
          options: [
            { label: 'Müşteriye kapıya kadar eşlik et', tensionDelta: -30 },
            { label: '"Son uyarı, yoksa polisi ararım"', tensionDelta: -15 },
            { label: 'Gözle izle, bir şey yapma', tensionDelta: 20 },
          ],
        },
      ],
    },
  ],
  incidentTriggers: [1],  // 2. misafirden (index 1) sonra
}

// ─── VARDIYA 2 — Orta (5 misafir, 1 olay) ───────────────────────────────────

const shift02: BarShift = {
  id: 'shift_02',
  nightRule: 'Sadece rezervasyonlular',
  blacklist: [],
  vipList: ['guest_zehra_02'],
  guests: [
    {
      id: 'guest_zehra_02',
      name: 'Zehra Hanım',
      isBlacklisted: false,
      isVip: true,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Şık giyinmiş', 'Özgüvenli yürüyüş'],
      meetsNightRule: true,
    },
    {
      id: 'guest_ali_02',
      name: 'Ali',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Sıradan kıyafet'],
      meetsNightRule: false,  // rezervasyonu yok
    },
    {
      id: 'guest_can_02',
      name: 'Can',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Takım elbise', 'Sakin'],
      meetsNightRule: true,  // rezervasyonu var
    },
    {
      id: 'guest_serkan_02',
      name: 'Serkan',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: true,
      visualCues: ['Sinirli bakışlar', 'Kolları çapraz', 'Gergin duruş'],
      meetsNightRule: true,  // rezervasyonu var ama tehlikeli
    },
    {
      id: 'guest_deniz_02',
      name: 'Deniz',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Arkadaşlarıyla gelmiş', 'Normal'],
      meetsNightRule: true,
    },
  ],
  incidents: [
    {
      id: 'inc_kavga_02',
      description: 'İki müşteri köşe masasında tartışmaya başladı. Sesler yükseliyor.',
      fightIfUnresolved: true,
      tensionSteps: [
        {
          text: 'Biri diğerinin üzerine eğilmiş, parmak sallıyor. Çevreler toplandı.',
          options: [
            { label: 'İkisinin arasına gir, fiziksel ayır', tensionDelta: -20 },
            { label: '"Sakin olun, hep birlikte çözelim"', tensionDelta: -15 },
            { label: 'Barı çağır, sen beklet', tensionDelta: 10 },
          ],
        },
        {
          text: 'Taraflardan biri itmeye başladı.',
          options: [
            { label: 'Birisini nazikçe dışarı yönlendir', tensionDelta: -35 },
            { label: '"Bir adım daha atarsan polis arıyorum"', tensionDelta: -20 },
            { label: 'Aralarında dur ama konuşma', tensionDelta: 15 },
          ],
        },
      ],
    },
  ],
  incidentTriggers: [2],  // 3. misafirden (index 2) sonra
}

// ─── VARDIYA 3 — Orta+ (5 misafir, 1 olay) ──────────────────────────────────

const shift03: BarShift = {
  id: 'shift_03',
  nightRule: 'Kravat zorunlu',
  blacklist: ['guest_omer_03'],
  vipList: [],
  guests: [
    {
      id: 'guest_kerem_03',
      name: 'Kerem',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Kravatlı', 'Takım elbise'],
      meetsNightRule: true,
    },
    {
      id: 'guest_omer_03',
      name: 'Ömer',
      isBlacklisted: true,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Kravatlı', 'Gülümsüyor'],  // görünüşte normal ama yasak listesinde
      meetsNightRule: true,
    },
    {
      id: 'guest_bora_03',
      name: 'Bora',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Kravatı yok', 'Rahat kıyafet'],
      meetsNightRule: false,  // kravat yok
    },
    {
      id: 'guest_nalan_03',
      name: 'Nalan',
      isBlacklisted: false,
      isVip: false,
      isDrunk: true,
      isDangerous: false,
      visualCues: ['Sallanıyor', 'Kravatı var (ama sarhoş)'],
      meetsNightRule: true,  // kravatlı ama sarhoş
    },
    {
      id: 'guest_tamer_03',
      name: 'Tamer',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Kravatlı', 'Sakin'],
      meetsNightRule: true,
    },
  ],
  incidents: [
    {
      id: 'inc_hirsiz_03',
      description: 'Barmen sizi çağırdı: bir müşterinin cüzdanı çalınmış, bir şüpheli var.',
      fightIfUnresolved: true,
      tensionSteps: [
        {
          text: 'Şüpheli köşede oturuyor. İddia edilen kurban sizi bekliyor.',
          options: [
            { label: '"Şüpheliyi dışarı alalım, sakin konuşalım"', tensionDelta: -20 },
            { label: 'Şüpheliyi masada sorgula, herkes duysun', tensionDelta: 25 },
            { label: 'Polisi ara, kurbanı beklet', tensionDelta: -10 },
          ],
        },
        {
          text: 'Şüpheli suçlamayı reddediyor, sesler yükseliyor.',
          options: [
            { label: '"Güvenlik kamerasına bakacağız, sizi bilgilendiririz"', tensionDelta: -30 },
            { label: '"Şimdi çantanı aç"', tensionDelta: 30 },
            { label: 'Her ikisini de barın dışına çıkar', tensionDelta: -15 },
          ],
        },
      ],
    },
  ],
  incidentTriggers: [2],  // 3. misafirden (index 2) sonra
}

export const BAR_SHIFTS: BarShift[] = [shift01, shift02, shift03]
```

- [ ] **Adım 2: TypeScript derleme kontrolü**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Beklenen: hata yok.

- [ ] **Adım 3: Commit**

```bash
git add src/data/barShifts.ts
git commit -m "feat: barShifts — tip tanımları + 3 tam vardiya"
```

---

## Task 2: barStore.ts + Testler

**Files:**
- Create: `src/store/barStore.ts`
- Create: `src/store/__tests__/barStore.test.ts`

- [ ] **Adım 1: Test dosyasını yaz**

```ts
// src/store/__tests__/barStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useBarStore } from '../barStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useLifePathStore } from '../lifePathStore'

const SHIFT_ID = 'shift_01'

// shift_01'deki guest id'leri
const GUEST_OK       = 'guest_ayse_01'      // admit etmeli
const GUEST_DRUNK    = 'guest_mehmet_01'    // reject etmeli (sarhoş)
const GUEST_BANNED   = 'guest_volkan_01'    // reject etmeli (yasak)

beforeEach(() => {
  useBarStore.setState({
    activeShift: null,
    currentGuestIndex: 0,
    doorDecisions: {},
    wrongDecisions: 0,
    activeIncident: null,
    currentTensionStep: 0,
    tensionLevel: 50,
    incidentOutcome: null,
    fightActive: false,
    playerHealth: 3,
    completedShifts: [],
  })
  useIdeaSeedStore.setState(s => ({ seeds: { ...s.seeds, kaos: 0 } }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
})

describe('barStore — startShift', () => {
  it('aktif vardiyayı set eder, sayaçları sıfırlar', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    const s = useBarStore.getState()
    expect(s.activeShift?.id).toBe(SHIFT_ID)
    expect(s.currentGuestIndex).toBe(0)
    expect(s.wrongDecisions).toBe(0)
    expect(s.doorDecisions).toEqual({})
  })

  it('bilinmeyen shift_id ile hiçbir şey yapmaz', () => {
    useBarStore.getState().startShift('shift_999')
    expect(useBarStore.getState().activeShift).toBeNull()
  })

  it('aktif vardiya varken yeni vardiya başlatmaz', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().startShift('shift_02')
    expect(useBarStore.getState().activeShift?.id).toBe(SHIFT_ID)
  })
})

describe('barStore — makeGuestDecision', () => {
  it('doğru karar (admit için ok misafir) wrongDecisions artırmaz', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_OK, 'admit')
    expect(useBarStore.getState().wrongDecisions).toBe(0)
    expect(useBarStore.getState().doorDecisions[GUEST_OK]).toBe('admit')
  })

  it('sarhoş misafiri içeri alınca wrongDecisions artar', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_DRUNK, 'admit')
    expect(useBarStore.getState().wrongDecisions).toBe(1)
  })

  it('yasak listedeki misafiri içeri alınca wrongDecisions artar', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_BANNED, 'admit')
    expect(useBarStore.getState().wrongDecisions).toBe(1)
  })

  it('ok misafiri reddetmek wrongDecisions artırır', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_OK, 'reject')
    expect(useBarStore.getState().wrongDecisions).toBe(1)
  })

  it('her karar currentGuestIndex\'i bir artırır', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_OK, 'admit')
    expect(useBarStore.getState().currentGuestIndex).toBe(1)
  })
})

describe('barStore — triggerIncident', () => {
  it('olay başlatınca activeIncident set edilir, tensionLevel 50\'ye sıfırlanır', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    const s = useBarStore.getState()
    expect(s.activeIncident?.id).toBe('inc_tartisma_01')
    expect(s.tensionLevel).toBe(50)
    expect(s.currentTensionStep).toBe(0)
  })

  it('bilinmeyen incident id ile hiçbir şey yapmaz', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_unknown')
    expect(useBarStore.getState().activeIncident).toBeNull()
  })
})

describe('barStore — chooseTensionOption', () => {
  it('negatif delta gerginliği düşürür', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    // shift_01 step[0] option[0] delta = -25 → 50 - 25 = 25
    useBarStore.getState().chooseTensionOption(0)
    expect(useBarStore.getState().tensionLevel).toBe(25)
  })

  it('pozitif delta gerginliği artırır', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    // shift_01 step[0] option[2] delta = +30 → 50 + 30 = 80
    useBarStore.getState().chooseTensionOption(2)
    expect(useBarStore.getState().tensionLevel).toBe(80)
  })

  it('gerginlik 0\'a inince olay diyalogla kapanır', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    // Tension 50, option[0] = -25 → 25, tekrar -25 → 0
    useBarStore.getState().chooseTensionOption(0)  // 25
    useBarStore.getState().chooseTensionOption(0)  // 0 veya daha az → kapanır
    const s = useBarStore.getState()
    expect(s.activeIncident).toBeNull()
    expect(s.incidentOutcome).toBe('dialogue')
  })

  it('gerginlik 100\'e çıkınca fightActive true olur', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    // Tension 50, option[2] = +30 → 80, tekrar +30 → 110 (clamp 100)
    useBarStore.getState().chooseTensionOption(2)  // 80
    useBarStore.getState().chooseTensionOption(2)  // >= 100 → fight
    expect(useBarStore.getState().fightActive).toBe(true)
    expect(useBarStore.getState().playerHealth).toBe(3)
  })

  it('aktif olay yokken chooseTensionOption hiçbir şey yapmaz', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().chooseTensionOption(0)
    expect(useBarStore.getState().tensionLevel).toBe(50)  // başlangıç değeri değişmedi
  })
})

describe('barStore — endFight', () => {
  it('playerWon=true → incidentOutcome won_fight, fightActive false', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().endFight(true)
    const s = useBarStore.getState()
    expect(s.fightActive).toBe(false)
    expect(s.incidentOutcome).toBe('won_fight')
    expect(s.activeIncident).toBeNull()
  })

  it('playerWon=false → incidentOutcome lost_fight', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().endFight(false)
    expect(useBarStore.getState().incidentOutcome).toBe('lost_fight')
  })
})

describe('barStore — endShift', () => {
  it('sorunsuz gece (0 hata, dialogue) → 3 tohum, +12 emek', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_OK, 'admit')
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    useBarStore.getState().chooseTensionOption(0)  // tension -25 = 25
    useBarStore.getState().chooseTensionOption(0)  // tension <= 0 → dialogue
    const result = useBarStore.getState().endShift()
    expect(result.seeds).toBe(3)
    expect(result.progress).toBe(12)
    expect(useIdeaSeedStore.getState().seeds.kaos).toBe(3)
    expect(useLifePathStore.getState().progress.emek).toBe(12)
  })

  it('kavga kazanıldı → 2 tohum, +8 emek', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().endFight(true)
    const result = useBarStore.getState().endShift()
    expect(result.seeds).toBe(2)
    expect(result.progress).toBe(8)
  })

  it('kavga kaybedildi → 1 tohum, +3 emek', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().endFight(false)
    const result = useBarStore.getState().endShift()
    expect(result.seeds).toBe(1)
    expect(result.progress).toBe(3)
  })

  it('≥3 yanlış karar → 1 tohum, +3 emek', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_DRUNK, 'admit')    // wrong
    useBarStore.getState().makeGuestDecision(GUEST_BANNED, 'admit')   // wrong
    useBarStore.getState().makeGuestDecision(GUEST_OK, 'reject')      // wrong
    const result = useBarStore.getState().endShift()
    expect(result.seeds).toBe(1)
    expect(result.progress).toBe(3)
  })

  it('endShift vardiyayı completedShifts\'e ekler, activeShift null yapar', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().endShift()
    const s = useBarStore.getState()
    expect(s.completedShifts).toContain(SHIFT_ID)
    expect(s.activeShift).toBeNull()
  })

  it('aktif vardiya yokken endShift null döner', () => {
    const result = useBarStore.getState().endShift()
    expect(result).toBeNull()
  })
})

describe('barStore — reset', () => {
  it('tüm state sıfırlanır', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_OK, 'admit')
    useBarStore.getState().reset()
    const s = useBarStore.getState()
    expect(s.activeShift).toBeNull()
    expect(s.currentGuestIndex).toBe(0)
    expect(s.wrongDecisions).toBe(0)
    expect(s.doorDecisions).toEqual({})
    expect(s.activeIncident).toBeNull()
    expect(s.incidentOutcome).toBeNull()
    expect(s.fightActive).toBe(false)
    expect(s.playerHealth).toBe(3)
    expect(s.completedShifts).toEqual([])
  })
})
```

- [ ] **Adım 2: Test çalıştır — FAIL bekliyoruz**

```bash
npx vitest run src/store/__tests__/barStore.test.ts 2>&1 | head -20
```

Beklenen: `Cannot find module '../barStore'`

- [ ] **Adım 3: barStore.ts yaz**

```ts
// src/store/barStore.ts
import { create } from 'zustand'
import { BAR_SHIFTS } from '@/data/barShifts'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { BarShift, Incident } from '@/data/barShifts'

type IncidentOutcome = 'dialogue' | 'won_fight' | 'lost_fight' | null
type ShiftResult = { seeds: number; progress: number } | null

interface BarStore {
  activeShift: BarShift | null
  currentGuestIndex: number
  doorDecisions: Record<string, 'admit' | 'reject'>
  wrongDecisions: number
  activeIncident: Incident | null
  currentTensionStep: number
  tensionLevel: number          // 0–100, başlangıç 50
  incidentOutcome: IncidentOutcome
  fightActive: boolean
  playerHealth: number          // 3'ten başlar; fight sırasında FightScene yönetir
  completedShifts: string[]

  startShift(shiftId: string): void
  makeGuestDecision(guestId: string, decision: 'admit' | 'reject'): void
  triggerIncident(incidentId: string): void
  chooseTensionOption(optionIndex: number): void
  endFight(playerWon: boolean): void
  endShift(): ShiftResult
  reset(): void
}

function calcReward(wrongDecisions: number, incidentOutcome: IncidentOutcome) {
  if (incidentOutcome === 'lost_fight' || wrongDecisions >= 3) {
    return { seeds: 1, progress: 3 }
  }
  if (incidentOutcome === 'won_fight' || wrongDecisions >= 1) {
    return { seeds: 2, progress: 8 }
  }
  return { seeds: 3, progress: 12 }
}

export const useBarStore = create<BarStore>((set, get) => ({
  activeShift: null,
  currentGuestIndex: 0,
  doorDecisions: {},
  wrongDecisions: 0,
  activeIncident: null,
  currentTensionStep: 0,
  tensionLevel: 50,
  incidentOutcome: null,
  fightActive: false,
  playerHealth: 3,
  completedShifts: [],

  startShift(shiftId) {
    if (get().activeShift !== null) return
    const found = BAR_SHIFTS.find(s => s.id === shiftId)
    if (!found) return
    set({
      activeShift: found,
      currentGuestIndex: 0,
      doorDecisions: {},
      wrongDecisions: 0,
      activeIncident: null,
      currentTensionStep: 0,
      tensionLevel: 50,
      incidentOutcome: null,
      fightActive: false,
      playerHealth: 3,
    })
  },

  makeGuestDecision(guestId, decision) {
    const { activeShift } = get()
    if (!activeShift) return
    const guest = activeShift.guests.find(g => g.id === guestId)
    if (!guest) return

    const shouldAdmit =
      guest.isVip ||
      (!guest.isBlacklisted && !guest.isDrunk && !guest.isDangerous && guest.meetsNightRule)
    const isWrong = (decision === 'admit') !== shouldAdmit

    set(s => ({
      doorDecisions: { ...s.doorDecisions, [guestId]: decision },
      wrongDecisions: isWrong ? s.wrongDecisions + 1 : s.wrongDecisions,
      currentGuestIndex: s.currentGuestIndex + 1,
    }))
  },

  triggerIncident(incidentId) {
    const { activeShift } = get()
    if (!activeShift) return
    const incident = activeShift.incidents.find(i => i.id === incidentId)
    if (!incident) return
    set({ activeIncident: incident, tensionLevel: 50, currentTensionStep: 0 })
  },

  chooseTensionOption(optionIndex) {
    const { activeIncident, tensionLevel, currentTensionStep } = get()
    if (!activeIncident) return
    const step = activeIncident.tensionSteps[currentTensionStep]
    if (!step) return
    const option = step.options[optionIndex]
    if (!option) return

    const newTension = Math.max(0, Math.min(100, tensionLevel + option.tensionDelta))

    if (newTension <= 0) {
      set({ tensionLevel: 0, activeIncident: null, incidentOutcome: 'dialogue' })
      return
    }

    if (newTension >= 100) {
      set({ tensionLevel: 100, fightActive: true, playerHealth: 3 })
      return
    }

    // Sonraki adıma geç (son adımsa aynı adımda kal)
    const nextStep = currentTensionStep + 1 < activeIncident.tensionSteps.length
      ? currentTensionStep + 1
      : currentTensionStep

    set({ tensionLevel: newTension, currentTensionStep: nextStep })
  },

  endFight(playerWon) {
    set({
      fightActive: false,
      incidentOutcome: playerWon ? 'won_fight' : 'lost_fight',
      activeIncident: null,
    })
  },

  endShift(): ShiftResult {
    const { activeShift, wrongDecisions, incidentOutcome } = get()
    if (!activeShift) return null

    const { seeds, progress } = calcReward(wrongDecisions, incidentOutcome)
    useIdeaSeedStore.getState().addSeed('kaos', seeds)
    useLifePathStore.getState().addProgress('emek', progress)

    set(s => ({
      completedShifts: [...s.completedShifts, activeShift.id],
      activeShift: null,
      currentGuestIndex: 0,
      doorDecisions: {},
      wrongDecisions: 0,
      activeIncident: null,
      currentTensionStep: 0,
      tensionLevel: 50,
      incidentOutcome: null,
      fightActive: false,
      playerHealth: 3,
    }))

    return { seeds, progress }
  },

  reset() {
    set({
      activeShift: null,
      currentGuestIndex: 0,
      doorDecisions: {},
      wrongDecisions: 0,
      activeIncident: null,
      currentTensionStep: 0,
      tensionLevel: 50,
      incidentOutcome: null,
      fightActive: false,
      playerHealth: 3,
      completedShifts: [],
    })
  },
}))
```

- [ ] **Adım 4: Testleri çalıştır — PASS bekliyoruz**

```bash
npx vitest run src/store/__tests__/barStore.test.ts 2>&1 | tail -10
```

Beklenen: tüm testler PASS.

- [ ] **Adım 5: Tüm testler**

```bash
npx vitest run 2>&1 | tail -5
```

Beklenen: tüm testler PASS, regresyon yok.

- [ ] **Adım 6: Commit**

```bash
git add src/store/barStore.ts src/store/__tests__/barStore.test.ts
git commit -m "feat: barStore — vardiya akışı, kapı kararları, gerginlik, dövüş, ödül"
```

---

## Task 3: DoorScene.ts — Papers Please Kapı Arayüzü

**Files:**
- Create: `src/pixi/DoorScene.ts`

- [ ] **Adım 1: Mevcut PixiJS örüntüsünü oku**

`src/pixi/ExamineScene.ts` dosyasını oku. Dikkat et:
- `static async create(options)` factory pattern
- Private constructor
- `render()` methodu
- `destroy()` — `_keyHandler` temizleme + `app.destroy()`
- `Text({ text, style })` constructor formu (v8 API)
- `Graphics` method chaining: `g.rect(...).fill(...)`, `g.roundRect(...).stroke(...)`
- `eventMode = 'static'` ve `cursor = 'pointer'`

- [ ] **Adım 2: DoorScene.ts oluştur**

```ts
// src/pixi/DoorScene.ts
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js'
import type { Guest } from '@/data/barShifts'

export interface DoorSceneOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  guest: Guest
  nightRule: string
  onAdmit: () => void
  onReject: () => void
}

export class DoorScene {
  private app: Application
  private options: DoorSceneOptions
  private destroyed = false
  private _keyHandler?: (e: KeyboardEvent) => void

  private constructor(app: Application, options: DoorSceneOptions) {
    this.app = app
    this.options = options
  }

  static async create(options: DoorSceneOptions): Promise<DoorScene> {
    const app = new Application()
    await app.init({
      canvas: options.canvas,
      width: options.width,
      height: options.height,
      backgroundColor: 0x08060a,
      antialias: true,
    })
    const scene = new DoorScene(app, options)
    scene.render()
    return scene
  }

  private render() {
    const { app, options } = this
    const { width, height, guest, nightRule } = options
    app.stage.removeChildren()

    // ── Arkaplan ──────────────────────────────────────────────────────────
    const bg = new Graphics()
    bg.rect(0, 0, width, height).fill({ color: 0x08060a, alpha: 1 })
    app.stage.addChild(bg)

    // ── Gece Kuralı (üst) ─────────────────────────────────────────────────
    const ruleBg = new Graphics()
    ruleBg.rect(0, 0, width, 36).fill({ color: 0x1a0a00, alpha: 1 })
    app.stage.addChild(ruleBg)

    const ruleStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#ffaa44' })
    const ruleText = new Text({ text: `Gece Kuralı: ${nightRule}`, style: ruleStyle })
    ruleText.x = 12
    ruleText.y = 10
    app.stage.addChild(ruleText)

    // ── Misafir Kartı ─────────────────────────────────────────────────────
    const cardW = width * 0.55
    const cardH = height * 0.55
    const cardX = (width - cardW) / 2
    const cardY = height * 0.12

    const card = new Graphics()
    card.roundRect(cardX, cardY, cardW, cardH, 8)
      .fill({ color: 0x12100a, alpha: 1 })
      .stroke({ width: 1.5, color: guest.isBlacklisted ? 0xaa2222 : 0x443322, alpha: 0.9 })
    app.stage.addChild(card)

    // İsim
    const nameStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 16, fill: '#ffeecc' })
    const nameText = new Text({ text: guest.name, style: nameStyle })
    nameText.x = cardX + 16
    nameText.y = cardY + 14
    app.stage.addChild(nameText)

    // VIP rozeti
    if (guest.isVip) {
      const vipStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#ffd700' })
      const vipText = new Text({ text: '★ VIP', style: vipStyle })
      vipText.x = cardX + cardW - 52
      vipText.y = cardY + 16
      app.stage.addChild(vipText)
    }

    // Yasak rozeti
    if (guest.isBlacklisted) {
      const banStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#ff4444' })
      const banText = new Text({ text: '⚠ YASAK LİSTE', style: banStyle })
      banText.x = cardX + 16
      banText.y = cardY + 38
      app.stage.addChild(banText)
    }

    // Görünüm ipuçları
    const cueStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#8080a0', wordWrap: true, wordWrapWidth: cardW - 32 })
    const cueText = new Text({ text: guest.visualCues.join('\n'), style: cueStyle })
    cueText.x = cardX + 16
    cueText.y = cardY + (guest.isBlacklisted ? 60 : 44)
    app.stage.addChild(cueText)

    // ── Karar Butonları ────────────────────────────────────────────────────
    const btnY = cardY + cardH + 24
    const btnW = cardW * 0.42
    const btnH = 40

    // İçeri Al butonu
    const admitBg = new Graphics()
    admitBg.roundRect(cardX, btnY, btnW, btnH, 6)
      .fill({ color: 0x0a2a0a, alpha: 1 })
      .stroke({ width: 1.5, color: 0x228822, alpha: 0.9 })
    admitBg.eventMode = 'static'
    admitBg.cursor = 'pointer'
    admitBg.on('pointerdown', () => {
      if (this.destroyed) return
      options.onAdmit()
    })
    app.stage.addChild(admitBg)

    const admitStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#44cc44' })
    const admitText = new Text({ text: 'İçeri Al  [A]', style: admitStyle })
    admitText.anchor.set(0.5, 0.5)
    admitText.x = cardX + btnW / 2
    admitText.y = btnY + btnH / 2
    app.stage.addChild(admitText)

    // Reddet butonu
    const rejectBg = new Graphics()
    rejectBg.roundRect(cardX + cardW - btnW, btnY, btnW, btnH, 6)
      .fill({ color: 0x2a0a0a, alpha: 1 })
      .stroke({ width: 1.5, color: 0x882222, alpha: 0.9 })
    rejectBg.eventMode = 'static'
    rejectBg.cursor = 'pointer'
    rejectBg.on('pointerdown', () => {
      if (this.destroyed) return
      options.onReject()
    })
    app.stage.addChild(rejectBg)

    const rejectStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#cc4444' })
    const rejectText = new Text({ text: 'Reddet  [D]', style: rejectStyle })
    rejectText.anchor.set(0.5, 0.5)
    rejectText.x = cardX + cardW - btnW / 2
    rejectText.y = btnY + btnH / 2
    app.stage.addChild(rejectText)

    // ── Klavye kısayolları ─────────────────────────────────────────────────
    const onKey = (e: KeyboardEvent) => {
      if (this.destroyed) return
      if (e.key === 'a' || e.key === 'A') options.onAdmit()
      if (e.key === 'd' || e.key === 'D') options.onReject()
    }
    window.addEventListener('keydown', onKey)
    this._keyHandler = onKey
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler)
    this.app.destroy()
  }
}
```

- [ ] **Adım 3: TypeScript derleme kontrolü**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Beklenen: DoorScene ile ilgili hata yok.

- [ ] **Adım 4: Tüm testler**

```bash
npx vitest run 2>&1 | tail -5
```

Beklenen: tüm testler PASS.

- [ ] **Adım 5: Commit**

```bash
git add src/pixi/DoorScene.ts
git commit -m "feat: DoorScene — Papers Please kapı arayüzü"
```

---

## Task 4: FightScene.ts + durum.md

**Files:**
- Create: `src/pixi/FightScene.ts`
- Modify: `durum.md`

- [ ] **Adım 1: FightScene.ts oluştur**

```ts
// src/pixi/FightScene.ts
import { Application, Graphics, Text, TextStyle } from 'pixi.js'

export interface FightSceneOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  onFightEnd: (playerWon: boolean) => void
}

export class FightScene {
  private app: Application
  private options: FightSceneOptions
  private destroyed = false
  private _keyHandler?: (e: KeyboardEvent) => void
  private _enemyTimer: ReturnType<typeof setInterval> | null = null

  private _playerHealth = 3
  private _enemyHealth = 3
  private readonly ENEMY_ATTACK_INTERVAL_MS = 2500

  private constructor(app: Application, options: FightSceneOptions) {
    this.app = app
    this.options = options
  }

  static async create(options: FightSceneOptions): Promise<FightScene> {
    const app = new Application()
    await app.init({
      canvas: options.canvas,
      width: options.width,
      height: options.height,
      backgroundColor: 0x100808,
      antialias: true,
    })
    const scene = new FightScene(app, options)
    scene._startEnemyTimer()
    scene._setupInput()
    scene._render()
    return scene
  }

  private _render() {
    const { app } = this
    const { width, height } = this.options
    app.stage.removeChildren()

    // ── Arkaplan ──────────────────────────────────────────────────────────
    const bg = new Graphics()
    bg.rect(0, 0, width, height).fill({ color: 0x100808, alpha: 1 })
    app.stage.addChild(bg)

    // ── Başlık ────────────────────────────────────────────────────────────
    const titleStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#ff4444' })
    const titleText = new Text({ text: '⚠ KAVGA', style: titleStyle })
    titleText.anchor.set(0.5, 0)
    titleText.x = width / 2
    titleText.y = 12
    app.stage.addChild(titleText)

    // ── Oyuncu sağlık barı (sol) ───────────────────────────────────────────
    this._drawHealthBar(40, height - 60, 120, 'OYUNCU', this._playerHealth, 0x44cc44)

    // ── Düşman sağlık barı (sağ) ──────────────────────────────────────────
    this._drawHealthBar(width - 160, height - 60, 120, 'DÜŞMAN', this._enemyHealth, 0xcc4444)

    // ── Figürler ──────────────────────────────────────────────────────────
    this._drawFigure(width * 0.28, height * 0.45, 0x4488ff, false)  // oyuncu
    this._drawFigure(width * 0.72, height * 0.45, 0xff4444, true)   // düşman

    // ── Kontrol ipucu ─────────────────────────────────────────────────────
    const hintStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#4a4a60' })
    const hintText = new Text({ text: 'Z / Sol Tık = Yumruk', style: hintStyle })
    hintText.anchor.set(0.5, 0)
    hintText.x = width / 2
    hintText.y = height - 22
    app.stage.addChild(hintText)

    // ── Tıklama ile yumruk ────────────────────────────────────────────────
    app.stage.eventMode = 'static'
    app.stage.on('pointerdown', () => {
      if (this.destroyed) return
      this._playerPunch()
    })
  }

  private _drawHealthBar(x: number, y: number, barWidth: number, label: string, health: number, color: number) {
    const { app } = this
    const barH = 12
    const maxHealth = 3

    const labelStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 9, fill: '#888888' })
    const labelText = new Text({ text: label, style: labelStyle })
    labelText.x = x
    labelText.y = y - 16
    app.stage.addChild(labelText)

    // Arkaplan
    const barBg = new Graphics()
    barBg.roundRect(x, y, barWidth, barH, 3).fill({ color: 0x221111, alpha: 1 })
    app.stage.addChild(barBg)

    // Dolu kısım
    const fillW = (health / maxHealth) * barWidth
    if (fillW > 0) {
      const barFill = new Graphics()
      barFill.roundRect(x, y, fillW, barH, 3).fill({ color, alpha: 1 })
      app.stage.addChild(barFill)
    }

    // Sayı
    const numStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#cccccc' })
    const numText = new Text({ text: `${health}/3`, style: numStyle })
    numText.x = x + barWidth + 6
    numText.y = y
    app.stage.addChild(numText)
  }

  private _drawFigure(cx: number, cy: number, color: number, isEnemy: boolean) {
    const { app } = this
    const fig = new Graphics()
    // Kafa
    fig.circle(cx, cy - 28, 14).fill({ color, alpha: 0.9 })
    // Gövde
    fig.rect(cx - 10, cy - 14, 20, 30).fill({ color, alpha: 0.9 })
    // Kollar
    fig.rect(cx - 22, cy - 12, 12, 8).fill({ color, alpha: 0.7 })
    fig.rect(cx + 10, cy - 12, 12, 8).fill({ color, alpha: 0.7 })
    // Bacaklar
    fig.rect(cx - 10, cy + 16, 8, 20).fill({ color, alpha: 0.9 })
    fig.rect(cx + 2, cy + 16, 8, 20).fill({ color, alpha: 0.9 })
    app.stage.addChild(fig)

    if (isEnemy) {
      const nameStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 9, fill: '#ff8888' })
      const nameText = new Text({ text: 'DÜŞMAN', style: nameStyle })
      nameText.anchor.set(0.5, 0)
      nameText.x = cx
      nameText.y = cy + 42
      app.stage.addChild(nameText)
    }
  }

  private _playerPunch() {
    if (this.destroyed || this._enemyHealth <= 0) return
    this._enemyHealth = Math.max(0, this._enemyHealth - 1)
    this._render()
    if (this._enemyHealth <= 0) {
      this._end(true)
    }
  }

  private _enemyPunch() {
    if (this.destroyed || this._playerHealth <= 0) return
    this._playerHealth = Math.max(0, this._playerHealth - 1)
    this._render()
    if (this._playerHealth <= 0) {
      this._end(false)
    }
  }

  private _end(playerWon: boolean) {
    this._stopEnemyTimer()
    if (this.destroyed) return
    this.destroyed = true
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler)
    this.options.onFightEnd(playerWon)
  }

  private _startEnemyTimer() {
    this._enemyTimer = setInterval(() => {
      if (!this.destroyed) this._enemyPunch()
    }, this.ENEMY_ATTACK_INTERVAL_MS)
  }

  private _stopEnemyTimer() {
    if (this._enemyTimer !== null) {
      clearInterval(this._enemyTimer)
      this._enemyTimer = null
    }
  }

  private _setupInput() {
    const onKey = (e: KeyboardEvent) => {
      if (this.destroyed) return
      if (e.key === 'z' || e.key === 'Z') this._playerPunch()
    }
    window.addEventListener('keydown', onKey)
    this._keyHandler = onKey
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this._stopEnemyTimer()
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler)
    this.app.destroy()
  }
}
```

- [ ] **Adım 2: TypeScript derleme kontrolü**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Beklenen: FightScene ile ilgili hata yok.

- [ ] **Adım 3: Tüm testler**

```bash
npx vitest run 2>&1 | tail -5
```

Beklenen: tüm testler PASS.

- [ ] **Adım 4: durum.md güncelle**

`durum.md` dosyasını oku. `Tamamlananlar` bölümüne şunu ekle:

```markdown
### Bar Bodyguard Altyapısı (2026-06-02)
- `src/data/barShifts.ts`: tip tanımları + 3 tam vardiya (shift_01–03)
- `src/store/barStore.ts`: startShift, makeGuestDecision, triggerIncident, chooseTensionOption, endFight, endShift, ödül hesaplama
- `src/pixi/DoorScene.ts`: Papers Please kapı arayüzü, A/D klavye kısayolları
- `src/pixi/FightScene.ts`: yumruk dövüşü overlay, düşman otomatik saldırı, Z/sol tık
```

`Sıradaki Büyük Görevler` bölümüne ekle:

```markdown
- Bar bodyguard entegrasyonu: posta kutusu altyapısı, shift_04–10 içeriği, harita entegrasyonu
```

- [ ] **Adım 5: Commit**

```bash
git add src/pixi/FightScene.ts durum.md
git commit -m "feat: FightScene — yumruk dövüşü overlay, düşman zamanlayıcı"
```

---

## Kapsam Notu

Bu plan bar bodyguard işinin **altyapısını** kurar. Aşağıdakiler ayrı spec/planlara bırakıldı:

- **Posta kutusu sistemi** — vardiya daveti için gerekli altyapı
- **Harita entegrasyonu** — barın bir odaya/lokasyona bağlanması
- **shift_04–shift_10 içeriği** — aynı yapıyla daha zorlu vardiyalar
- **Animasyonlar** — oyuncu karakterinin kapıda görünmesi
