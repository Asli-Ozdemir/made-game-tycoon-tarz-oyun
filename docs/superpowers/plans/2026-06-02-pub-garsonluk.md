# Pub Garsonluk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pub garsonluk yan işinin altyapısını kur — vardiya veri modeli, pubStore, ve ServiceScene (PixiJS masa turu arayüzü).

**Architecture:** `pubShifts.ts` statik vardiya verisini tutar; `pubStore` masa durumlarını (sipariş/pişirme/servis/başarısız) ve ödül hesaplamasını yönetir; `ServiceScene` sabır ve pişirme zamanlayıcılarını çalıştırır, masa etkileşimini yönetir ve doğru/yanlış servis validasyonunu yapar.

**Tech Stack:** TypeScript, Zustand, Vitest, PixiJS v8.18.1, React 18

---

## Dosya Haritası

| Dosya | İşlem | Sorumluluk |
|-------|-------|------------|
| `src/data/pubShifts.ts` | Yeni | Tip tanımları + 3 tam vardiya (pub_shift_01–03) |
| `src/store/pubStore.ts` | Yeni | Masa durumları, sipariş akışı, yanlış servis, ödül |
| `src/store/__tests__/pubStore.test.ts` | Yeni | Store logic testleri |
| `src/pixi/ServiceScene.ts` | Yeni | Masa turu arayüzü: sabır barları, pişirme zamanlayıcısı, sipariş seçim paneli |

---

## Task 1: pubShifts.ts — Tip Tanımları + 3 Vardiya

**Files:**
- Create: `src/data/pubShifts.ts`

- [ ] **Adım 1: pubShifts.ts oluştur**

```ts
// src/data/pubShifts.ts

export interface SpecialRequest {
  type: 'alerji' | 'tercih' | 'not'
  description: string               // "Fıstık alerjisi", "Az buzlu", "Vejetaryen"
  revealedOnInteraction: boolean    // false = brifingde bildirildi, true = masaya gidince ortaya çıkar
}

export interface Customer {
  id: string
  name: string
  visualCues: string[]              // "Takım elbise", "Sinirli görünüyor"
  specialRequests: SpecialRequest[]
}

export interface Table {
  id: string                        // 'table_1' ... 'table_4'
  customers: Customer[]
  orderOptions: string[][]          // her müşteri için olası seçenekler; customers[i] → orderOptions[i]
  correctOrder: string[]            // customers[i] için doğru sipariş; correctOrder[i] ↔ customers[i]
  patienceMs: number                // sabır barı dolma süresi (ms)
}

export interface PubShift {
  id: string                        // 'pub_shift_01' ... 'pub_shift_15'
  briefingNotes: string[]           // vardiya başı patron açıklamaları
  tables: Table[]
}

// ─── VARDIYA 1 — Kolay (3 masa, açık istekler) ───────────────────────────────

const pubShift01: PubShift = {
  id: 'pub_shift_01',
  briefingNotes: [
    'İlk gece, sakin olacak.',
    "Masa 2'deki Kemal'in fıstık alerjisi var — dikkat et.",
  ],
  tables: [
    {
      id: 'table_1',
      customers: [
        {
          id: 'c_ayse_01',
          name: 'Ayşe',
          visualCues: ['Rahat giyinmiş', 'Gülümsüyor'],
          specialRequests: [],
        },
        {
          id: 'c_mert_01',
          name: 'Mert',
          visualCues: ['Takım elbise', 'Yorgun görünüyor'],
          specialRequests: [],
        },
      ],
      orderOptions: [
        ['Bira', 'Şarap', 'Viski'],
        ['Şarap', 'Kola', 'Bira'],
      ],
      correctOrder: ['Bira', 'Şarap'],
      patienceMs: 35000,
    },
    {
      id: 'table_2',
      customers: [
        {
          id: 'c_kemal_01',
          name: 'Kemal',
          visualCues: ['Gözlüklü', 'Kitap okuyor'],
          specialRequests: [
            { type: 'alerji', description: 'Fıstık alerjisi', revealedOnInteraction: false },
          ],
        },
        {
          id: 'c_selin_01',
          name: 'Selin',
          visualCues: ['Kırmızı çanta', 'Arkadaşını bekliyor'],
          specialRequests: [],
        },
      ],
      orderOptions: [
        ['Meze', 'Fıstıksız Meze', 'Salata'],
        ['Meze', 'Fıstıksız Meze', 'Salata'],
      ],
      correctOrder: ['Fıstıksız Meze', 'Meze'],
      patienceMs: 35000,
    },
    {
      id: 'table_3',
      customers: [
        {
          id: 'c_buse_01',
          name: 'Buse',
          visualCues: ['Arkadaşlarıyla gelmiş', 'Neşeli'],
          specialRequests: [],
        },
      ],
      orderOptions: [['Kola', 'Su', 'Bira']],
      correctOrder: ['Kola'],
      patienceMs: 35000,
    },
  ],
}

// ─── VARDIYA 2 — Orta (3 masa, gizli istek) ──────────────────────────────────

const pubShift02: PubShift = {
  id: 'pub_shift_02',
  briefingNotes: [
    'Bugün biraz hareketli.',
    "Masa 3'teki Zeynep Hanım VIP misafirimiz — öncelik onlarda.",
  ],
  tables: [
    {
      id: 'table_1',
      customers: [
        {
          id: 'c_tarik_02',
          name: 'Tarık',
          visualCues: ['Bıyıklı', 'Sakin'],
          specialRequests: [],
        },
        {
          id: 'c_elif_02',
          name: 'Elif',
          visualCues: ['Renkli şal', 'Çantasına bakıyor'],
          specialRequests: [],
        },
      ],
      orderOptions: [
        ['Viski', 'Bira', 'Kola'],
        ['Şarap', 'Viski', 'Su'],
      ],
      correctOrder: ['Viski', 'Şarap'],
      patienceMs: 30000,
    },
    {
      id: 'table_2',
      customers: [
        {
          id: 'c_ozan_02',
          name: 'Ozan',
          visualCues: ['Şapkalı', 'Müzik dinliyor'],
          specialRequests: [
            { type: 'tercih', description: 'Az buzlu içecek istiyor', revealedOnInteraction: true },
          ],
        },
      ],
      orderOptions: [['Viski (Normal)', 'Viski (Az Buzlu)', 'Bira']],
      correctOrder: ['Viski (Az Buzlu)'],
      patienceMs: 30000,
    },
    {
      id: 'table_3',
      customers: [
        {
          id: 'c_zeynep_02',
          name: 'Zeynep Hanım',
          visualCues: ['Şık giyinmiş', 'Özgüvenli'],
          specialRequests: [
            { type: 'tercih', description: 'Vejetaryen', revealedOnInteraction: false },
          ],
        },
      ],
      orderOptions: [['Et Tabağı', 'Vejetaryen Tabak', 'Izgara Balık']],
      correctOrder: ['Vejetaryen Tabak'],
      patienceMs: 30000,
    },
  ],
}

// ─── VARDIYA 3 — Orta+ (4 masa, yoğun gece) ──────────────────────────────────

const pubShift03: PubShift = {
  id: 'pub_shift_03',
  briefingNotes: [
    'Dört masa dolu — yoğun gece.',
    "Masa 2'de vejetaryen var.",
    'Dikkatli ol, bekleyenleri unutma.',
  ],
  tables: [
    {
      id: 'table_1',
      customers: [
        {
          id: 'c_can_03',
          name: 'Can',
          visualCues: ['Dizüstü açık', 'Çalışıyor'],
          specialRequests: [],
        },
        {
          id: 'c_deniz_03',
          name: 'Deniz',
          visualCues: ['Kulaklıklı', 'Telefona bakıyor'],
          specialRequests: [],
        },
      ],
      orderOptions: [
        ['Kola', 'Su', 'Bira'],
        ['Bira', 'Şarap', 'Kola'],
      ],
      correctOrder: ['Kola', 'Bira'],
      patienceMs: 28000,
    },
    {
      id: 'table_2',
      customers: [
        {
          id: 'c_ada_03',
          name: 'Ada',
          visualCues: ['Yeşil çanta', 'Kitap okuyor'],
          specialRequests: [
            { type: 'tercih', description: 'Vejetaryen', revealedOnInteraction: false },
          ],
        },
      ],
      orderOptions: [['Et Tabağı', 'Vejetaryen Tabak', 'Izgara Balık']],
      correctOrder: ['Vejetaryen Tabak'],
      patienceMs: 28000,
    },
    {
      id: 'table_3',
      customers: [
        {
          id: 'c_volkan_03',
          name: 'Volkan',
          visualCues: ['Kravatını gevşetmiş', 'Yorgun'],
          specialRequests: [
            { type: 'not', description: '"Sürpriz bir şey getir" diyor', revealedOnInteraction: true },
          ],
        },
      ],
      orderOptions: [['Viski', 'Gin Tonic', 'Bira']],
      correctOrder: ['Gin Tonic'],
      patienceMs: 28000,
    },
    {
      id: 'table_4',
      customers: [
        {
          id: 'c_irem_03',
          name: 'İrem',
          visualCues: ['Pembe bluz', 'Güler yüzlü'],
          specialRequests: [],
        },
        {
          id: 'c_burak_03',
          name: 'Burak',
          visualCues: ['Spor ayakkabı', 'Maç tartışıyor'],
          specialRequests: [],
        },
      ],
      orderOptions: [
        ['Şarap', 'Bira', 'Su'],
        ['Bira', 'Kola', 'Su'],
      ],
      correctOrder: ['Şarap', 'Bira'],
      patienceMs: 28000,
    },
  ],
}

export const PUB_SHIFTS: PubShift[] = [pubShift01, pubShift02, pubShift03]
```

- [ ] **Adım 2: TypeScript derleme kontrolü**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Beklenen: pubShifts.ts ile ilgili hata yok.

- [ ] **Adım 3: Commit**

```bash
git add src/data/pubShifts.ts
git commit -m "feat: pubShifts — tip tanımları + 3 tam vardiya"
```

---

## Task 2: pubStore.ts + Testler

**Files:**
- Create: `src/store/pubStore.ts`
- Create: `src/store/__tests__/pubStore.test.ts`

- [ ] **Adım 1: Test dosyasını yaz**

```ts
// src/store/__tests__/pubStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { usePubStore } from '../pubStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useLifePathStore } from '../lifePathStore'

const SHIFT_ID  = 'pub_shift_01'
const TABLE_1   = 'table_1'
const TABLE_2   = 'table_2'
const TABLE_3   = 'table_3'

// pub_shift_01 correctOrder değerleri (pubShifts.ts'den)
const CORRECT_T1: string[] = ['Bira', 'Şarap']
const WRONG_T1:   string[] = ['Şarap', 'Bira']   // ters = yanlış
const CORRECT_T2: string[] = ['Fıstıksız Meze', 'Meze']
const CORRECT_T3: string[] = ['Kola']

beforeEach(() => {
  usePubStore.setState({
    activeShift: null,
    tableStates: {},
    mistakes: 0,
    completedShifts: [],
  })
  useIdeaSeedStore.setState(s => ({ seeds: { ...s.seeds, zaman_yonetimi: 0 } }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
})

describe('pubStore — startShift', () => {
  it('aktif vardiyayı set eder, her masa için tableState oluşturur', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    const s = usePubStore.getState()
    expect(s.activeShift?.id).toBe(SHIFT_ID)
    expect(s.tableStates[TABLE_1].status).toBe('waiting')
    expect(s.tableStates[TABLE_1].servedOrder).toBeNull()
    expect(s.tableStates[TABLE_1].revealedRequests).toBe(false)
    expect(s.tableStates[TABLE_2].status).toBe('waiting')
    expect(s.tableStates[TABLE_3].status).toBe('waiting')
    expect(s.mistakes).toBe(0)
  })

  it('bilinmeyen shift_id ile hiçbir şey yapmaz', () => {
    usePubStore.getState().startShift('pub_shift_999')
    expect(usePubStore.getState().activeShift).toBeNull()
  })

  it('aktif vardiya varken yeni vardiya başlatmaz', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().startShift('pub_shift_02')
    expect(usePubStore.getState().activeShift?.id).toBe(SHIFT_ID)
  })
})

describe('pubStore — interactTable', () => {
  it('revealedRequests: true yapar', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().interactTable(TABLE_2)
    expect(usePubStore.getState().tableStates[TABLE_2].revealedRequests).toBe(true)
  })

  it('aktif vardiya yokken hiçbir şey yapmaz', () => {
    usePubStore.getState().interactTable(TABLE_1)
    expect(usePubStore.getState().tableStates[TABLE_1]).toBeUndefined()
  })
})

describe('pubStore — submitOrder', () => {
  it('status: waiting → cooking olur, servedOrder set edilir', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().submitOrder(TABLE_1, CORRECT_T1)
    const s = usePubStore.getState()
    expect(s.tableStates[TABLE_1].status).toBe('cooking')
    expect(s.tableStates[TABLE_1].servedOrder).toEqual(CORRECT_T1)
  })

  it('status: waiting değilse hiçbir şey yapmaz', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().submitOrder(TABLE_1, CORRECT_T1)   // cooking
    usePubStore.getState().submitOrder(TABLE_1, WRONG_T1)     // ignored
    expect(usePubStore.getState().tableStates[TABLE_1].servedOrder).toEqual(CORRECT_T1)
  })
})

describe('pubStore — markReady', () => {
  it('status: cooking → ready olur', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().submitOrder(TABLE_1, CORRECT_T1)
    usePubStore.getState().markReady(TABLE_1)
    expect(usePubStore.getState().tableStates[TABLE_1].status).toBe('ready')
  })

  it('status: cooking değilse hiçbir şey yapmaz', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().markReady(TABLE_1)   // still 'waiting'
    expect(usePubStore.getState().tableStates[TABLE_1].status).toBe('waiting')
  })
})

describe('pubStore — deliverOrder', () => {
  it('status: ready ise → served olur, mistakes artmaz', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().submitOrder(TABLE_1, CORRECT_T1)
    usePubStore.getState().markReady(TABLE_1)
    usePubStore.getState().deliverOrder(TABLE_1)
    const s = usePubStore.getState()
    expect(s.tableStates[TABLE_1].status).toBe('served')
    expect(s.mistakes).toBe(0)
  })

  it('status: ready değilse hiçbir şey yapmaz', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().deliverOrder(TABLE_1)
    expect(usePubStore.getState().tableStates[TABLE_1].status).toBe('waiting')
  })
})

describe('pubStore — wrongDelivery', () => {
  it('status → waiting, servedOrder null, mistakes artar', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().submitOrder(TABLE_1, WRONG_T1)
    usePubStore.getState().markReady(TABLE_1)
    usePubStore.getState().wrongDelivery(TABLE_1)
    const s = usePubStore.getState()
    expect(s.tableStates[TABLE_1].status).toBe('waiting')
    expect(s.tableStates[TABLE_1].servedOrder).toBeNull()
    expect(s.mistakes).toBe(1)
  })

  it('aktif vardiya yokken hiçbir şey yapmaz', () => {
    usePubStore.getState().wrongDelivery(TABLE_1)
    expect(usePubStore.getState().mistakes).toBe(0)
  })
})

describe('pubStore — failTable', () => {
  it('status → failed, mistakes artar', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().failTable(TABLE_3)
    const s = usePubStore.getState()
    expect(s.tableStates[TABLE_3].status).toBe('failed')
    expect(s.mistakes).toBe(1)
  })
})

describe('pubStore — endShift', () => {
  it('0-1 hata → 3 tohum, +5 emek, cross-store güncellenir', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().submitOrder(TABLE_1, CORRECT_T1)
    usePubStore.getState().markReady(TABLE_1)
    usePubStore.getState().deliverOrder(TABLE_1)   // 0 hata
    const result = usePubStore.getState().endShift()
    expect(result?.seeds).toBe(3)
    expect(result?.progress).toBe(5)
    expect(useIdeaSeedStore.getState().seeds.zaman_yonetimi).toBe(3)
    expect(useLifePathStore.getState().progress.emek).toBe(5)
  })

  it('2-3 hata → 2 tohum, +3 emek', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().failTable(TABLE_1)   // 1 hata
    usePubStore.getState().failTable(TABLE_2)   // 2 hata
    const result = usePubStore.getState().endShift()
    expect(result?.seeds).toBe(2)
    expect(result?.progress).toBe(3)
    expect(useIdeaSeedStore.getState().seeds.zaman_yonetimi).toBe(2)
    expect(useLifePathStore.getState().progress.emek).toBe(3)
  })

  it('4+ hata → 1 tohum, +1 emek', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().failTable(TABLE_1)
    usePubStore.getState().failTable(TABLE_2)
    usePubStore.getState().failTable(TABLE_3)
    usePubStore.getState().wrongDelivery(TABLE_1)  // mistake 4
    const result = usePubStore.getState().endShift()
    expect(result?.seeds).toBe(1)
    expect(result?.progress).toBe(1)
  })

  it('endShift completedShifts\'e ekler, activeShift null yapar', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().endShift()
    const s = usePubStore.getState()
    expect(s.completedShifts).toContain(SHIFT_ID)
    expect(s.activeShift).toBeNull()
    expect(s.tableStates).toEqual({})
    expect(s.mistakes).toBe(0)
  })

  it('aktif vardiya yokken null döner', () => {
    const result = usePubStore.getState().endShift()
    expect(result).toBeNull()
  })
})

describe('pubStore — reset', () => {
  it('tüm state sıfırlanır', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().failTable(TABLE_1)
    usePubStore.getState().endShift()           // completedShifts'e eklendi
    usePubStore.getState().reset()
    const s = usePubStore.getState()
    expect(s.activeShift).toBeNull()
    expect(s.tableStates).toEqual({})
    expect(s.mistakes).toBe(0)
    expect(s.completedShifts).toEqual([])
  })
})
```

- [ ] **Adım 2: Test çalıştır — FAIL bekliyoruz**

```bash
npx vitest run src/store/__tests__/pubStore.test.ts 2>&1 | head -10
```

Beklenen: `Cannot find module '../pubStore'`

- [ ] **Adım 3: pubStore.ts yaz**

```ts
// src/store/pubStore.ts
import { create } from 'zustand'
import { PUB_SHIFTS } from '@/data/pubShifts'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { PubShift } from '@/data/pubShifts'

export type TableStatus = 'waiting' | 'ordered' | 'cooking' | 'ready' | 'served' | 'failed'

export interface TableState {
  tableId: string
  status: TableStatus
  servedOrder: string[] | null
  revealedRequests: boolean
  startedAt: number                    // Date.now() — sabır hesabı için ServiceScene kullanır
}

type ShiftResult = { seeds: number; progress: number } | null

interface PubStore {
  activeShift: PubShift | null
  tableStates: Record<string, TableState>
  mistakes: number
  completedShifts: string[]

  startShift(shiftId: string): void
  interactTable(tableId: string): void
  submitOrder(tableId: string, order: string[]): void
  markReady(tableId: string): void
  deliverOrder(tableId: string): void
  wrongDelivery(tableId: string): void
  failTable(tableId: string): void
  endShift(): ShiftResult
  reset(): void
}

function calcReward(mistakes: number): { seeds: number; progress: number } {
  if (mistakes >= 4) return { seeds: 1, progress: 1 }
  if (mistakes >= 2) return { seeds: 2, progress: 3 }
  return { seeds: 3, progress: 5 }
}

export const usePubStore = create<PubStore>((set, get) => ({
  activeShift: null,
  tableStates: {},
  mistakes: 0,
  completedShifts: [],

  startShift(shiftId) {
    if (get().activeShift !== null) return
    const found = PUB_SHIFTS.find(s => s.id === shiftId)
    if (!found) return
    const now = Date.now()
    const tableStates: Record<string, TableState> = {}
    for (const table of found.tables) {
      tableStates[table.id] = {
        tableId: table.id,
        status: 'waiting',
        servedOrder: null,
        revealedRequests: false,
        startedAt: now,
      }
    }
    set({ activeShift: found, tableStates, mistakes: 0 })
  },

  interactTable(tableId) {
    if (!get().activeShift) return
    set(s => ({
      tableStates: {
        ...s.tableStates,
        [tableId]: { ...s.tableStates[tableId], revealedRequests: true },
      },
    }))
  },

  submitOrder(tableId, order) {
    const ts = get().tableStates[tableId]
    if (!ts || ts.status !== 'waiting') return
    set(s => ({
      tableStates: {
        ...s.tableStates,
        [tableId]: { ...s.tableStates[tableId], status: 'cooking', servedOrder: order },
      },
    }))
  },

  markReady(tableId) {
    const ts = get().tableStates[tableId]
    if (!ts || ts.status !== 'cooking') return
    set(s => ({
      tableStates: {
        ...s.tableStates,
        [tableId]: { ...s.tableStates[tableId], status: 'ready' },
      },
    }))
  },

  deliverOrder(tableId) {
    const ts = get().tableStates[tableId]
    if (!ts || ts.status !== 'ready') return
    set(s => ({
      tableStates: {
        ...s.tableStates,
        [tableId]: { ...s.tableStates[tableId], status: 'served' },
      },
    }))
  },

  wrongDelivery(tableId) {
    if (!get().activeShift) return
    set(s => ({
      mistakes: s.mistakes + 1,
      tableStates: {
        ...s.tableStates,
        [tableId]: {
          ...s.tableStates[tableId],
          status: 'waiting',
          servedOrder: null,
        },
      },
    }))
  },

  failTable(tableId) {
    set(s => ({
      mistakes: s.mistakes + 1,
      tableStates: {
        ...s.tableStates,
        [tableId]: { ...s.tableStates[tableId], status: 'failed' },
      },
    }))
  },

  endShift(): ShiftResult {
    const { activeShift, mistakes } = get()
    if (!activeShift) return null

    const { seeds, progress } = calcReward(mistakes)
    useIdeaSeedStore.getState().addSeed('zaman_yonetimi', seeds)
    useLifePathStore.getState().addProgress('emek', progress)

    set(s => ({
      completedShifts: [...s.completedShifts, s.activeShift!.id],
      activeShift: null,
      tableStates: {},
      mistakes: 0,
    }))

    return { seeds, progress }
  },

  reset() {
    set({
      activeShift: null,
      tableStates: {},
      mistakes: 0,
      completedShifts: [],
    })
  },
}))
```

- [ ] **Adım 4: Testleri çalıştır — PASS bekliyoruz**

```bash
npx vitest run src/store/__tests__/pubStore.test.ts 2>&1 | tail -10
```

Beklenen: tüm testler PASS.

- [ ] **Adım 5: Tüm testler**

```bash
npx vitest run 2>&1 | tail -5
```

Beklenen: tüm testler PASS, regresyon yok.

- [ ] **Adım 6: Commit**

```bash
git add src/store/pubStore.ts src/store/__tests__/pubStore.test.ts
git commit -m "feat: pubStore — masa akışı, sipariş/pişirme/servis, ödül hesaplama"
```

---

## Task 3: ServiceScene.ts + durum.md

**Files:**
- Create: `src/pixi/ServiceScene.ts`
- Modify: `durum.md`

- [ ] **Adım 1: Mevcut PixiJS örüntüsünü oku**

`src/pixi/FightScene.ts` dosyasını oku. Dikkat et:
- `static async create(options)` factory pattern — private constructor
- `_render()` her değişiklikte `app.stage.removeChildren()` çağırır ve baştan çizer
- `setInterval` ile zamanlayıcı (`_startEnemyTimer` / `_stopEnemyTimer` pattern)
- `_setupInput()` — `addEventListener` öncesinde eski handler temizlenir
- `destroyed` flag her callback'te kontrol edilir
- `destroy()` — zamanlayıcıları durdurur, listener'ları kaldırır, `app.destroy()` çağırır
- `Text({ text, style })` constructor formu (PixiJS v8 API)
- `Graphics` method chaining: `g.rect(...).fill(...)`, `g.roundRect(...).stroke(...)`
- `eventMode = 'static'` ve `cursor = 'pointer'`

- [ ] **Adım 2: ServiceScene.ts oluştur**

```ts
// src/pixi/ServiceScene.ts
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js'
import type { PubShift, Table } from '@/data/pubShifts'
import type { TableStatus } from '@/store/pubStore'

// ─── Statik stiller ────────────────────────────────────────────────────────────
const STYLE_HEADER = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#ffaa44' })
const STYLE_TABLE_TITLE = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#ffeecc' })
const STYLE_CUSTOMER = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#8080a0' })
const STYLE_STATUS = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#4a4a60' })
const STYLE_READY  = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#44ff88' })
const STYLE_FAILED = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#ff4444' })
const STYLE_REQUEST_KNOWN = new TextStyle({ fontFamily: 'monospace', fontSize: 9, fill: '#ff8844' })
const STYLE_PANEL_TITLE = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#ffeecc' })
const STYLE_BTN_NORMAL  = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#8080c0' })
const STYLE_BTN_SELECTED = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#44ccff' })
const STYLE_CONFIRM = new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: '#44cc44' })
const STYLE_CANCEL  = new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: '#cc4444' })
const STYLE_HINT    = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#3a3a50' })

// ─── Durum renkleri ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<TableStatus, number> = {
  waiting:  0x1a1a2e,
  ordered:  0x1a1a2e,
  cooking:  0x1a1200,
  ready:    0x0a1a0a,
  served:   0x0a2a0a,
  failed:   0x2a0a0a,
}

const STATUS_BORDER: Record<TableStatus, number> = {
  waiting:  0x334466,
  ordered:  0x334466,
  cooking:  0x664400,
  ready:    0x44cc44,
  served:   0x228822,
  failed:   0x882222,
}

// ─── Pişirme süresi ───────────────────────────────────────────────────────────
const DEFAULT_COOKING_DELAY_MS = 4000

// ─── Sabır cezası (yanlış servis) ─────────────────────────────────────────────
const WRONG_DELIVERY_PATIENCE_PENALTY_MS = 8000

export interface ServiceSceneOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  shift: PubShift
  cookingDelayMs?: number
  onInteractTable: (tableId: string) => void
  onSubmitOrder: (tableId: string, order: string[]) => void
  onMarkReady: (tableId: string) => void
  onDeliverOrder: (tableId: string) => void
  onWrongDelivery: (tableId: string) => void
  onFailTable: (tableId: string) => void
  onShiftEnd: () => void
}

type InternalStatus = TableStatus

interface InternalTable {
  tableId: string
  status: InternalStatus
  servedOrder: string[] | null
  revealedRequests: boolean
  patienceStart: number
  patiencePenaltyMs: number
  patienceTimer: ReturnType<typeof setInterval> | null
  cookingTimer: ReturnType<typeof setTimeout> | null
}

export class ServiceScene {
  private app: Application
  private options: ServiceSceneOptions
  private destroyed = false

  private _tables: Record<string, InternalTable> = {}
  private _activeOrderTable: string | null = null
  private _pendingSelections: Record<number, string> = {}

  private readonly _cookingDelayMs: number

  private constructor(app: Application, options: ServiceSceneOptions) {
    this.app = app
    this.options = options
    this._cookingDelayMs = options.cookingDelayMs ?? DEFAULT_COOKING_DELAY_MS
  }

  static async create(options: ServiceSceneOptions): Promise<ServiceScene> {
    const app = new Application()
    await app.init({
      canvas: options.canvas,
      width: options.width,
      height: options.height,
      backgroundColor: 0x06050a,
      antialias: true,
    })
    const scene = new ServiceScene(app, options)
    scene._initTables()
    scene._render()
    return scene
  }

  // ─── Masa başlatma ──────────────────────────────────────────────────────────
  private _initTables() {
    const now = Date.now()
    for (const table of this.options.shift.tables) {
      this._tables[table.id] = {
        tableId: table.id,
        status: 'waiting',
        servedOrder: null,
        revealedRequests: false,
        patienceStart: now,
        patiencePenaltyMs: 0,
        patienceTimer: setInterval(() => this._tickPatience(table.id), 100),
        cookingTimer: null,
      }
    }
  }

  // ─── Sabır zamanlayıcısı ────────────────────────────────────────────────────
  private _tickPatience(tableId: string) {
    if (this.destroyed) return
    const t = this._tables[tableId]
    if (!t || t.status === 'served' || t.status === 'failed') return

    const tableData = this.options.shift.tables.find(x => x.id === tableId)
    if (!tableData) return

    const elapsed = Date.now() - t.patienceStart + t.patiencePenaltyMs
    if (elapsed >= tableData.patienceMs) {
      this._doFailTable(tableId)
    } else {
      this._render()
    }
  }

  private _doFailTable(tableId: string) {
    const t = this._tables[tableId]
    if (!t || t.status === 'served' || t.status === 'failed') return
    this._stopPatienceTimer(tableId)
    this._stopCookingTimer(tableId)
    t.status = 'failed'
    this.options.onFailTable(tableId)
    this._render()
    this._checkShiftEnd()
  }

  private _stopPatienceTimer(tableId: string) {
    const t = this._tables[tableId]
    if (t?.patienceTimer !== null) {
      clearInterval(t.patienceTimer!)
      t.patienceTimer = null
    }
  }

  private _stopCookingTimer(tableId: string) {
    const t = this._tables[tableId]
    if (t?.cookingTimer !== null) {
      clearTimeout(t.cookingTimer!)
      t.cookingTimer = null
    }
  }

  // ─── Pişirme zamanlayıcısı ──────────────────────────────────────────────────
  private _startCookingTimer(tableId: string) {
    const t = this._tables[tableId]
    if (!t) return
    t.cookingTimer = setTimeout(() => {
      if (this.destroyed) return
      t.status = 'ready'
      t.cookingTimer = null
      this.options.onMarkReady(tableId)
      this._render()
    }, this._cookingDelayMs)
  }

  // ─── Masa tıklama ───────────────────────────────────────────────────────────
  private _onTableClick(tableId: string) {
    if (this.destroyed) return
    const t = this._tables[tableId]
    if (!t) return

    if (t.status === 'served' || t.status === 'failed') return

    if (t.status === 'ready') {
      this._doDeliver(tableId)
      return
    }

    if (t.status === 'cooking') return  // pişiyor, bekle

    // waiting: ilk tıkta istekleri göster, ikincisinde sipariş panelini aç
    if (!t.revealedRequests) {
      t.revealedRequests = true
      this.options.onInteractTable(tableId)
      this._render()
      return
    }

    // İstekler zaten görünür → sipariş paneli
    this._openOrderPanel(tableId)
  }

  // ─── Sipariş paneli ─────────────────────────────────────────────────────────
  private _openOrderPanel(tableId: string) {
    const tableData = this.options.shift.tables.find(t => t.id === tableId)
    if (!tableData) return
    this._activeOrderTable = tableId
    // Her müşteri için ilk seçenek varsayılan olarak seçili
    this._pendingSelections = {}
    tableData.customers.forEach((_, i) => {
      this._pendingSelections[i] = tableData.orderOptions[i][0]
    })
    this._render()
  }

  private _closeOrderPanel() {
    this._activeOrderTable = null
    this._pendingSelections = {}
    this._render()
  }

  private _confirmOrder() {
    const tableId = this._activeOrderTable
    if (!tableId) return
    const tableData = this.options.shift.tables.find(t => t.id === tableId)
    if (!tableData) return

    const order = tableData.customers.map((_, i) => this._pendingSelections[i] ?? tableData.orderOptions[i][0])
    const t = this._tables[tableId]
    t.status = 'cooking'
    t.servedOrder = order
    this.options.onSubmitOrder(tableId, order)
    this._startCookingTimer(tableId)
    this._closeOrderPanel()
  }

  // ─── Teslimat ───────────────────────────────────────────────────────────────
  private _doDeliver(tableId: string) {
    const t = this._tables[tableId]
    const tableData = this.options.shift.tables.find(x => x.id === tableId)
    if (!t || !tableData || t.status !== 'ready') return

    const isCorrect = t.servedOrder !== null &&
      t.servedOrder.length === tableData.correctOrder.length &&
      t.servedOrder.every((item, i) => item === tableData.correctOrder[i])

    if (isCorrect) {
      this._stopPatienceTimer(tableId)
      t.status = 'served'
      this.options.onDeliverOrder(tableId)
      this._render()
      this._checkShiftEnd()
    } else {
      // Yanlış servis — ceza + sıfırla
      t.status = 'waiting'
      t.servedOrder = null
      t.patiencePenaltyMs += WRONG_DELIVERY_PATIENCE_PENALTY_MS
      this.options.onWrongDelivery(tableId)
      this._render()
    }
  }

  // ─── Vardiya bitiş kontrolü ─────────────────────────────────────────────────
  private _checkShiftEnd() {
    const allDone = Object.values(this._tables).every(
      t => t.status === 'served' || t.status === 'failed'
    )
    if (allDone) {
      this.options.onShiftEnd()
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  private _render() {
    if (this.destroyed) return
    const { app } = this
    const { width, height, shift } = this.options
    app.stage.removeChildren()

    // Arkaplan
    const bg = new Graphics()
    bg.rect(0, 0, width, height).fill({ color: 0x06050a, alpha: 1 })
    app.stage.addChild(bg)

    // Üst brifing notu
    const headerBg = new Graphics()
    headerBg.rect(0, 0, width, 36).fill({ color: 0x100a00, alpha: 1 })
    app.stage.addChild(headerBg)
    const headerText = new Text({ text: `☕ ${shift.briefingNotes[0]}`, style: STYLE_HEADER })
    headerText.x = 12
    headerText.y = 10
    app.stage.addChild(headerText)

    // Masa kartları
    shift.tables.forEach((table, idx) => {
      this._renderTableCard(table, idx, shift.tables.length)
    })

    // İpucu
    const hintText = new Text({ text: 'Tıkla: Sipariş al   |   Yeşil kart: Servis et', style: STYLE_HINT })
    hintText.anchor.set(0.5, 0)
    hintText.x = width / 2
    hintText.y = height - 20
    app.stage.addChild(hintText)

    // Sipariş paneli (açıksa üste çiz)
    if (this._activeOrderTable !== null) {
      this._renderOrderPanel()
    }
  }

  // ─── Masa kartı ─────────────────────────────────────────────────────────────
  private _renderTableCard(table: Table, index: number, totalTables: number) {
    const { app } = this
    const { width, height } = this.options
    const CARD_W = 210
    const CARD_H = 185
    const MARGIN = 14

    let cardX: number
    let cardY: number

    if (totalTables <= 3) {
      const totalW = totalTables * CARD_W + (totalTables - 1) * MARGIN
      cardX = (width - totalW) / 2 + index * (CARD_W + MARGIN)
      cardY = 46 + (height - 46 - 30 - CARD_H) / 2
    } else {
      // 2×2 grid
      const col = index % 2
      const row = Math.floor(index / 2)
      const gridW = 2 * CARD_W + MARGIN
      const gridH = 2 * CARD_H + MARGIN
      cardX = (width - gridW) / 2 + col * (CARD_W + MARGIN)
      cardY = 46 + (height - 46 - 30 - gridH) / 2 + row * (CARD_H + MARGIN)
    }

    const t = this._tables[table.id]
    if (!t) return

    const bgColor = STATUS_COLORS[t.status]
    const borderColor = STATUS_BORDER[t.status]

    // Kart arka planı
    const card = new Graphics()
    card.roundRect(cardX, cardY, CARD_W, CARD_H, 8)
      .fill({ color: bgColor, alpha: 1 })
      .stroke({ width: 1.5, color: borderColor, alpha: 0.9 })
    card.eventMode = 'static'
    card.cursor = 'pointer'
    card.on('pointerdown', () => this._onTableClick(table.id))
    app.stage.addChild(card)

    // Masa başlığı
    const titleText = new Text({ text: `Masa ${index + 1}`, style: STYLE_TABLE_TITLE })
    titleText.x = cardX + 10
    titleText.y = cardY + 10
    app.stage.addChild(titleText)

    // Durum rozeti
    let statusLabel = ''
    let statusStyle = STYLE_STATUS
    if (t.status === 'cooking') { statusLabel = '🍳 Pişiyor…'; statusStyle = STYLE_STATUS }
    else if (t.status === 'ready') { statusLabel = '✓ Hazır — Tıkla!'; statusStyle = STYLE_READY }
    else if (t.status === 'served') { statusLabel = '✓ Servis edildi'; statusStyle = STYLE_READY }
    else if (t.status === 'failed') { statusLabel = '✗ Sabır tükendi'; statusStyle = STYLE_FAILED }

    if (statusLabel) {
      const statusText = new Text({ text: statusLabel, style: statusStyle })
      statusText.x = cardX + CARD_W - statusText.width - 10
      statusText.y = cardY + 12
      app.stage.addChild(statusText)
    }

    // Müşteri isimleri
    const names = table.customers.map(c => c.name).join(', ')
    const namesText = new Text({ text: names, style: STYLE_CUSTOMER })
    namesText.x = cardX + 10
    namesText.y = cardY + 32
    app.stage.addChild(namesText)

    // Brifingde bilinen özel istekler
    const knownRequests = table.customers.flatMap(c =>
      c.specialRequests.filter(r => !r.revealedOnInteraction).map(r => `⚠ ${r.description}`)
    )
    if (knownRequests.length > 0) {
      const reqText = new Text({ text: knownRequests.join('\n'), style: STYLE_REQUEST_KNOWN })
      reqText.x = cardX + 10
      reqText.y = cardY + 50
      app.stage.addChild(reqText)
    }

    // Masaya gidince ortaya çıkan istekler (revealedRequests sonrası)
    if (t.revealedRequests) {
      const hiddenRequests = table.customers.flatMap(c =>
        c.specialRequests.filter(r => r.revealedOnInteraction).map(r => `💬 ${r.description}`)
      )
      hiddenRequests.forEach((req, i) => {
        const reqText = new Text({ text: req, style: STYLE_REQUEST_KNOWN })
        reqText.x = cardX + 10
        reqText.y = cardY + 50 + knownRequests.length * 14 + i * 14
        app.stage.addChild(reqText)
      })
    }

    // Sabır barı
    this._renderPatienceBar(cardX, cardY + CARD_H - 22, CARD_W, table, t)
  }

  // ─── Sabır barı ─────────────────────────────────────────────────────────────
  private _renderPatienceBar(x: number, y: number, barW: number, table: Table, t: InternalTable) {
    const { app } = this
    const barH = 10

    const barBg = new Graphics()
    barBg.roundRect(x + 8, y, barW - 16, barH, 3).fill({ color: 0x1a1a1a, alpha: 1 })
    app.stage.addChild(barBg)

    if (t.status === 'served' || t.status === 'failed') return

    const elapsed = Date.now() - t.patienceStart + t.patiencePenaltyMs
    const ratio = Math.min(1, elapsed / table.patienceMs)
    const fillW = (barW - 16) * (1 - ratio)

    if (fillW > 0) {
      // Renk: yeşil → sarı → kırmızı
      const r = Math.round(ratio * 255)
      const g = Math.round((1 - ratio) * 200)
      const color = (r << 16) | (g << 8)
      const barFill = new Graphics()
      barFill.roundRect(x + 8, y, fillW, barH, 3).fill({ color, alpha: 1 })
      app.stage.addChild(barFill)
    }
  }

  // ─── Sipariş seçim paneli ───────────────────────────────────────────────────
  private _renderOrderPanel() {
    const { app } = this
    const { width, height, shift } = this.options
    const tableId = this._activeOrderTable!
    const tableData = shift.tables.find(t => t.id === tableId)
    if (!tableData) return

    // Karartma overlay
    const overlay = new Graphics()
    overlay.rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0.65 })
    overlay.eventMode = 'static'
    app.stage.addChild(overlay)

    // Panel
    const panelW = Math.min(460, width - 40)
    const panelH = 80 + tableData.customers.length * 80 + 60
    const panelX = (width - panelW) / 2
    const panelY = (height - panelH) / 2

    const panel = new Graphics()
    panel.roundRect(panelX, panelY, panelW, panelH, 10)
      .fill({ color: 0x0e0c14, alpha: 1 })
      .stroke({ width: 1.5, color: 0x554477, alpha: 0.9 })
    app.stage.addChild(panel)

    // Panel başlığı
    const panelTitle = new Text({ text: `Sipariş Ver — Masa ${shift.tables.indexOf(tableData) + 1}`, style: STYLE_PANEL_TITLE })
    panelTitle.anchor.set(0.5, 0)
    panelTitle.x = panelX + panelW / 2
    panelTitle.y = panelY + 14
    app.stage.addChild(panelTitle)

    // Her müşteri için seçenek butonları
    tableData.customers.forEach((customer, custIdx) => {
      const rowY = panelY + 44 + custIdx * 80

      const custLabel = new Text({ text: `${customer.name}:`, style: STYLE_CUSTOMER })
      custLabel.x = panelX + 16
      custLabel.y = rowY
      app.stage.addChild(custLabel)

      const options = tableData.orderOptions[custIdx]
      const btnW = Math.floor((panelW - 32 - (options.length - 1) * 8) / options.length)

      options.forEach((opt, optIdx) => {
        const btnX = panelX + 16 + optIdx * (btnW + 8)
        const btnY = rowY + 20
        const isSelected = this._pendingSelections[custIdx] === opt

        const btnBg = new Graphics()
        btnBg.roundRect(btnX, btnY, btnW, 32, 5)
          .fill({ color: isSelected ? 0x1a1040 : 0x0e0c14, alpha: 1 })
          .stroke({ width: 1.5, color: isSelected ? 0x44ccff : 0x333355, alpha: 0.9 })
        btnBg.eventMode = 'static'
        btnBg.cursor = 'pointer'
        btnBg.on('pointerdown', () => {
          if (this.destroyed) return
          this._pendingSelections[custIdx] = opt
          this._render()
        })
        app.stage.addChild(btnBg)

        const btnStyle = isSelected ? STYLE_BTN_SELECTED : STYLE_BTN_NORMAL
        const btnText = new Text({ text: opt, style: btnStyle })
        btnText.anchor.set(0.5, 0.5)
        btnText.x = btnX + btnW / 2
        btnText.y = btnY + 16
        app.stage.addChild(btnText)
      })
    })

    // İptal butonu
    const cancelX = panelX + panelW / 2 - 100
    const confirmX = panelX + panelW / 2 + 10
    const actionY = panelY + panelH - 46

    const cancelBg = new Graphics()
    cancelBg.roundRect(cancelX, actionY, 88, 34, 6)
      .fill({ color: 0x2a0a0a, alpha: 1 })
      .stroke({ width: 1.5, color: 0x882222, alpha: 0.9 })
    cancelBg.eventMode = 'static'
    cancelBg.cursor = 'pointer'
    cancelBg.on('pointerdown', () => { if (!this.destroyed) this._closeOrderPanel() })
    app.stage.addChild(cancelBg)
    const cancelText = new Text({ text: 'İptal', style: STYLE_CANCEL })
    cancelText.anchor.set(0.5, 0.5)
    cancelText.x = cancelX + 44
    cancelText.y = actionY + 17
    app.stage.addChild(cancelText)

    // Onayla butonu
    const confirmBg = new Graphics()
    confirmBg.roundRect(confirmX, actionY, 88, 34, 6)
      .fill({ color: 0x0a2a0a, alpha: 1 })
      .stroke({ width: 1.5, color: 0x228822, alpha: 0.9 })
    confirmBg.eventMode = 'static'
    confirmBg.cursor = 'pointer'
    confirmBg.on('pointerdown', () => { if (!this.destroyed) this._confirmOrder() })
    app.stage.addChild(confirmBg)
    const confirmText = new Text({ text: 'Onayla', style: STYLE_CONFIRM })
    confirmText.anchor.set(0.5, 0.5)
    confirmText.x = confirmX + 44
    confirmText.y = actionY + 17
    app.stage.addChild(confirmText)
  }

  // ─── Destroy ────────────────────────────────────────────────────────────────
  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    for (const tableId of Object.keys(this._tables)) {
      this._stopPatienceTimer(tableId)
      this._stopCookingTimer(tableId)
    }
    this.app.destroy()
  }
}
```

- [ ] **Adım 3: TypeScript derleme kontrolü**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Beklenen: ServiceScene ile ilgili hata yok. (Önceden var olan JSX config hataları normaldir.)

- [ ] **Adım 4: Tüm testler**

```bash
npx vitest run 2>&1 | tail -5
```

Beklenen: tüm testler PASS.

- [ ] **Adım 5: durum.md güncelle**

`durum.md` dosyasını oku. `Tamamlananlar` bölümüne şunu ekle:

```markdown
### Pub Garsonluk Altyapısı (2026-06-02)
- `src/data/pubShifts.ts`: tip tanımları + 3 tam vardiya (pub_shift_01–03)
- `src/store/pubStore.ts`: masa akışı, sipariş/pişirme/servis/başarısız, yanlış servis cezası, ödül hesaplama
- `src/pixi/ServiceScene.ts`: masa turu arayüzü, sabır barları, pişirme zamanlayıcısı, sipariş seçim paneli
```

`Sıradaki Büyük Görevler` bölümüne ekle:

```markdown
- Pub garsonluk entegrasyonu: posta kutusu altyapısı, pub_shift_04–15 içeriği, harita entegrasyonu
```

- [ ] **Adım 6: Commit**

```bash
git add src/pixi/ServiceScene.ts durum.md
git commit -m "feat: ServiceScene — masa turu arayüzü, sabır/pişirme zamanlayıcısı, sipariş paneli"
```

---

## Kapsam Notu

Bu plan pub garsonluk işinin **altyapısını** kurar. Aşağıdakiler ayrı spec/planlara bırakıldı:

- **Posta kutusu sistemi** — vardiya daveti için gerekli altyapı
- **Harita entegrasyonu** — pub'ın bir odaya/lokasyona bağlanması
- **pub_shift_04–pub_shift_15 içeriği** — aynı yapıyla daha zorlu vardiyalar
- **React entegrasyon katmanı** — ServiceScene + pubStore'u birleştiren bileşen
