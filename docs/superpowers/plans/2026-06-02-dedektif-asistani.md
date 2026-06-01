# Dedektif Asistanı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dedektif asistanı yan işini — analiz tohum tipi, vaka veri modeli, detectiveStore, park odası ve ExamineScene overlay — çalışır hale getir.

**Architecture:** `detectiveCases.ts` statik vaka verisini tutar; `detectiveStore` aktif vaka durumunu yönetir ve `lifePathStore.addProgress('emek')` ile `ideaSeedStore.addSeed('analiz')` çağırır. `ExamineScene` PixiJS tabanlı React component'i olarak sahne inceleme overlay'ini sağlar. `parkRoom` mevcut oda mimarisine üçüncü şehir tarafı odası olarak eklenir.

**Tech Stack:** TypeScript, Zustand, Vitest, PixiJS v8.18.1, React 18

---

## Dosya Haritası

| Dosya | İşlem | Sorumluluk |
|-------|-------|------------|
| `src/data/npcDialogues.ts` | Değişiklik | `IdeaSeedType`'a `'analiz'` eklenir |
| `src/store/ideaSeedStore.ts` | Değişiklik | `EMPTY` sayacına `analiz: 0` eklenir |
| `src/data/skillTree.ts` | Değişiklik | 3 yeni analiz node'u eklenir |
| `src/pixi/rooms/types.ts` | Değişiklik | `RoomId`'ye `'park'` eklenir |
| `src/pixi/rooms/parkRoom.ts` | Yeni | Park odası tanımı |
| `src/data/detectiveCases.ts` | Yeni | Tip tanımları + 3 tam vaka |
| `src/store/detectiveStore.ts` | Yeni | Aktif vaka, gün sayacı, kanıt zinciri, ödül dağıtımı |
| `src/store/__tests__/detectiveStore.test.ts` | Yeni | Store logic testleri |
| `src/pixi/ExamineScene.ts` | Yeni | PixiJS zoom overlay — tıklanabilir kanıt noktaları |

---

## Task 1: analiz tohum tipi

**Files:**
- Modify: `src/data/npcDialogues.ts`
- Modify: `src/store/ideaSeedStore.ts`
- Modify: `src/data/skillTree.ts`

- [ ] **Adım 1: npcDialogues.ts — IdeaSeedType ve meta güncelle**

`src/data/npcDialogues.ts` dosyasını oku. İlk iki satırı şöyle değiştir:

```ts
export type IdeaSeedType = 'nostalji' | 'hikaye' | 'kaos' | 'zaman_yonetimi' | 'analiz'

export const IDEA_SEED_META: Record<IdeaSeedType, { label: string; color: string; emoji: string }> = {
  nostalji:       { label: 'Nostalji',       color: '#a78bfa', emoji: '🌙' },
  hikaye:         { label: 'Hikaye',          color: '#60a5fa', emoji: '📖' },
  kaos:           { label: 'Kaos',            color: '#f87171', emoji: '🌪️' },
  zaman_yonetimi: { label: 'Zaman Yönetimi',  color: '#34d399', emoji: '⏳' },
  analiz:         { label: 'Analiz',          color: '#fbbf24', emoji: '🔍' },
}
```

- [ ] **Adım 2: ideaSeedStore.ts — EMPTY'ye analiz ekle**

`src/store/ideaSeedStore.ts` dosyasını oku. `EMPTY` objesini şöyle güncelle:

```ts
const EMPTY: SeedCounts = {
  nostalji:       0,
  hikaye:         0,
  kaos:           0,
  zaman_yonetimi: 0,
  analiz:         0,
}
```

- [ ] **Adım 3: skillTree.ts — 3 analiz node'u ekle**

`src/data/skillTree.ts` dosyasını oku. `SKILL_NODES` dizisinin sonuna (T5 node'larından ÖNCE) şu 3 node'u ekle:

```ts
  // ── Analiz node'ları (Emek yolu yan iş tohumları) ──────────────────────
  {
    id: 'analiz_t1',
    tier: 1,
    name: 'Keskin Göz',
    description: 'Hiçbir detay gözünden kaçmaz.',
    cost: [{ type: 'analiz', amount: 1 }],
    effect: { type: 'bug_reduce', value: 0.05 },
    dependsOn: [],
  },
  {
    id: 'analiz_t2',
    tier: 2,
    name: 'Sistem Okuyucu',
    description: 'Simülasyon oyunlarında gerçekçilik çıtasını yükseltirsin.',
    cost: [{ type: 'analiz', amount: 2 }],
    effect: { type: 'tycoon_bonus', stat: 'sim_quality', value: 0.08 },
    dependsOn: ['analiz_t1'],
  },
  {
    id: 'analiz_t3',
    tier: 3,
    name: 'Demir Mantık',
    description: 'Sistematik düşünce hataları elimine eder.',
    cost: [{ type: 'analiz', amount: 2 }, { type: 'zaman_yonetimi', amount: 1 }],
    effect: { type: 'bug_reduce', value: 0.15 },
    dependsOn: ['analiz_t2', 'zmn_t2'],
  },
```

- [ ] **Adım 4: Testleri çalıştır**

```bash
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun"
npm test -- --run
```

Beklenen: tüm testler PASS. TypeScript derleyici `analiz` tipini tanımalı; `IdeaSeedType` union genişledi, `EMPTY` güncellendi.

- [ ] **Adım 5: Commit**

```bash
git add src/data/npcDialogues.ts src/store/ideaSeedStore.ts src/data/skillTree.ts
git commit -m "feat: analiz tohum tipi + 3 skill tree node"
```

---

## Task 2: parkRoom + RoomId güncelleme

**Files:**
- Modify: `src/pixi/rooms/types.ts`
- Create: `src/pixi/rooms/parkRoom.ts`

- [ ] **Adım 1: types.ts — RoomId'ye 'park' ekle**

`src/pixi/rooms/types.ts` dosyasını oku. `RoomId` satırını değiştir:

```ts
export type RoomId = 'coast' | 'bridge' | 'city' | 'park'
```

- [ ] **Adım 2: parkRoom.ts oluştur**

```ts
// src/pixi/rooms/parkRoom.ts
import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const parkRoom: RoomDef = {
  id: 'park',
  widthTiles: 40,
  heightTiles: 20,
  zones: [
    { rowStart: 0,  rowEnd: 7,  bgColor: 0x060e05, type: 'city'    },
    { rowStart: 8,  rowEnd: 19, bgColor: 0x0a1408, type: 'coastal' },
  ],
  buildings: [
    { id: 'park_kulube', col: 30, row: 2, cols: 6, rows: 5, label: 'Kulübe', style: 'coastal' },
    { id: 'park_cati',   col: 2,  row: 1, cols: 8, rows: 6, label: 'Çatı',   style: 'city'    },
  ],
  triggers: [
    { name: 'park_bench_1', x: 7  * TILE_SIZE, y: 12 * TILE_SIZE, w: 32, h: 32 },
    { name: 'park_bench_2', x: 20 * TILE_SIZE, y: 14 * TILE_SIZE, w: 32, h: 32 },
    { name: 'park_tree',    x: 15 * TILE_SIZE, y: 10 * TILE_SIZE, w: 32, h: 32 },
  ],
  exitTriggers: [
    {
      toRoom: 'city',
      x: 15 * TILE_SIZE,
      y: 18 * TILE_SIZE,
      w: 10 * TILE_SIZE,
      h:  2 * TILE_SIZE,
    },
  ],
  customCollisionRects: [
    { x: 0, y: 0, w: 40 * TILE_SIZE, h: 1 * TILE_SIZE },
  ],
  spawnPoints: {
    default:     { x: 20 * TILE_SIZE + 16, y: 16 * TILE_SIZE + 16 },
    from_city:   { x: 20 * TILE_SIZE + 16, y: 17 * TILE_SIZE + 16 },
  },
}
```

- [ ] **Adım 3: Testleri çalıştır**

```bash
npm test -- --run
```

Beklenen: tüm testler PASS. TypeScript `RoomId = 'park'` hatası yoksa doğru.

- [ ] **Adım 4: Commit**

```bash
git add src/pixi/rooms/types.ts src/pixi/rooms/parkRoom.ts
git commit -m "feat: parkRoom + RoomId genişletildi"
```

---

## Task 3: detectiveCases.ts

**Files:**
- Create: `src/data/detectiveCases.ts`

- [ ] **Adım 1: detectiveCases.ts oluştur**

```ts
// src/data/detectiveCases.ts
import type { RoomId } from '@/pixi/rooms/types'

export interface ExamineItem {
  id: string
  label: string          // "Açık fermuar cep"
  description: string    // "İçinde küçük bir not kağıdı var."
  xNorm: number          // nesne üzerindeki konum (0–1)
  yNorm: number
  radius: number         // piksel cinsinden tıklama alanı yarıçapı
  revealsClue?: string   // bu itemi inceleyince ortaya çıkan kanıt id'si
}

export interface EvidenceNode {
  id: string
  label: string          // "Deri çanta"
  description: string    // "Sol cepçiği açık, zorla açılmış izleri var."
  sceneXNorm: number     // sahne üzerinde konum (0–1)
  sceneYNorm: number
  pointsTo: string       // suspect id veya sonraki kanıt id
  examineItems?: ExamineItem[]
}

export interface DayClue {
  day: number            // kaçıncı günün ipucu (1-based)
  text: string           // "Dün gece parkta biri onu görmüş, git konuş"
}

export interface Suspect {
  id: string
  name: string
  location: string       // haritada açıklama ("Park'taki bankta oturuyor")
  isGuilty: boolean
  dialogue: {
    greeting: string
    accuseCorrect: string   // doğru suçlama diyalogu
    accuseWrong: string     // yanlış suçlama diyalogu
    detectiveComment: string // dedektif yanı sıra ne söyler
  }
}

export interface DetectiveCase {
  id: string
  title: string
  dayLimit: number
  location: RoomId
  evidence: EvidenceNode[]
  suspects: Suspect[]
  culpritId: string          // suspects içindeki doğru suçlunun id'si
  dayClues: DayClue[]
  detectiveMood: 1 | 2 | 3 | 4  // 1=keskin, 2=yorgun, 3=gölgede, 4=son vaka
}

// ─── VAKA 1 — Parkta Kayıp Evrak ────────────────────────────────────────────

const case01: DetectiveCase = {
  id: 'case_01',
  title: 'Parkta Kayıp Evrak',
  dayLimit: 4,
  location: 'park',
  detectiveMood: 1,
  culpritId: 'suspect_mete',
  dayClues: [
    { day: 1, text: 'Şehir muhasebecisi kayıp — evraklar parkta bulundu. Olay yerine git.' },
    { day: 2, text: 'Banka yakınında biri şüpheli birini görmüş. Bul ve konuş.' },
    { day: 3, text: 'Sigara izinden parmak izi çıktı. Mete\'nin kaydına bak.' },
    { day: 4, text: 'Son gün. Kanıtlar yeterli, kararını ver.' },
  ],
  evidence: [
    {
      id: 'ev_canta',
      label: 'Deri çanta',
      description: 'Sol cepçiği zorla açılmış izleri var.',
      sceneXNorm: 0.55,
      sceneYNorm: 0.72,
      pointsTo: 'suspect_dilara',
      examineItems: [
        {
          id: 'ev_canta_not',
          label: 'Kırışık not kağıdı',
          description: '"Yarın park — M." yazıyor. M harfi kimin baş harfi?',
          xNorm: 0.3,
          yNorm: 0.4,
          radius: 18,
          revealsClue: 'ev_sigara',
        },
        {
          id: 'ev_canta_kart',
          label: 'Kartvizit',
          description: 'Mete Doğan — Finansal Danışman',
          xNorm: 0.65,
          yNorm: 0.6,
          radius: 16,
        },
      ],
    },
    {
      id: 'ev_sigara',
      label: 'Sigara izmariti',
      description: 'Bank yanında. Pahalı marka — şehirde sadece iki kişi bu markayı içiyor.',
      sceneXNorm: 0.3,
      sceneYNorm: 0.8,
      pointsTo: 'suspect_mete',
    },
  ],
  suspects: [
    {
      id: 'suspect_dilara',
      name: 'Dilara',
      location: 'Parkın kuzey girişinde yürüyor',
      isGuilty: false,
      dialogue: {
        greeting: 'Ben sadece parkta yürüyüş yapıyordum. Çantayı tanımıyorum.',
        accuseCorrect: '',
        accuseWrong: 'Bu nasıl bir suçlama? Benim burada işim yok dedektif bey.',
        detectiveComment: 'Elleri titremiyor — masumiyeti gerçek gibi görünüyor.',
      },
    },
    {
      id: 'suspect_mete',
      name: 'Mete Doğan',
      location: 'Park kulübesinin arkasında',
      isGuilty: true,
      dialogue: {
        greeting: 'Ben... sadece bir müşterimi bekliyordum burada.',
        accuseCorrect: 'Tamam, tamam. Evrakları aldım. Ama beni zorladılar — yemin ederim.',
        accuseWrong: '',
        detectiveComment: 'Bu adam biliyor. Gözlerini kaçırıyor.',
      },
    },
  ],
}

// ─── VAKA 2 — Kuyumcu Soygunu ────────────────────────────────────────────────

const case02: DetectiveCase = {
  id: 'case_02',
  title: 'Kuyumcu Soygunu',
  dayLimit: 5,
  location: 'city',
  detectiveMood: 1,
  culpritId: 'suspect_kadir',
  dayClues: [
    { day: 1, text: 'Sabah kuyumcudan yüzük çalınmış. Dükkân sahibi sigorta şirketini arıyor.' },
    { day: 2, text: 'Güvenlik görüntüsünde hoody giyen biri var. Kafedeki tanıkla konuş.' },
    { day: 3, text: 'Tanık o geceyi tam hatırlamıyor ama koku dedi — sigara değil, solvent.' },
    { day: 4, text: 'Kadir tamirci — solvent kullanıyor. Ama ona bağlayan ne var?' },
    { day: 5, text: 'Son gün. Kamerada yakalanan ayak izi boyutu Kadir\'inkiyle uyuşuyor.' },
  ],
  evidence: [
    {
      id: 'ev_cam',
      label: 'Kırık vitrin camı',
      description: 'İçeriden kırılmış. Çekiç izi değil, kesici alet.',
      sceneXNorm: 0.5,
      sceneYNorm: 0.6,
      pointsTo: 'suspect_zehra',
      examineItems: [
        {
          id: 'ev_cam_iz',
          label: 'Kesik izi',
          description: 'Cam kesici — profesyonel alet. Amatör iş değil.',
          xNorm: 0.5,
          yNorm: 0.5,
          radius: 20,
          revealsClue: 'ev_eldiven',
        },
      ],
    },
    {
      id: 'ev_eldiven',
      label: 'Siyah lastik eldiven',
      description: 'Kuyumcu arkasında. Solvent kokusu sinmiş.',
      sceneXNorm: 0.7,
      sceneYNorm: 0.75,
      pointsTo: 'suspect_kadir',
    },
    {
      id: 'ev_ayak',
      label: 'Toz ayak izi',
      description: '44 numara. Büyük beden.',
      sceneXNorm: 0.35,
      sceneYNorm: 0.85,
      pointsTo: 'suspect_kadir',
    },
  ],
  suspects: [
    {
      id: 'suspect_zehra',
      name: 'Zehra Hanım',
      location: 'Kuyumcu önünde bekliyor',
      isGuilty: false,
      dialogue: {
        greeting: 'Ben dükkân sahibiyim! Siz beni mi suçluyorsunuz?',
        accuseCorrect: '',
        accuseWrong: 'Aklınız var mı sizin! Kendi dükkânımı soyacak değilim!',
        detectiveComment: 'Öfkesi gerçek. Bu dışarıdan gelen iş.',
      },
    },
    {
      id: 'suspect_kadir',
      name: 'Kadir Usta',
      location: 'Kafenin yanındaki tamirci dükkanında',
      isGuilty: true,
      dialogue: {
        greeting: 'Ben tam gece buradaydım, kimseyi görmedim.',
        accuseCorrect: 'Nasıl buldunuz... Borca battım, başka çarem yoktu.',
        accuseWrong: '',
        detectiveComment: 'Elleri solventtan sararmış. Gözleri tavana kaçıyor.',
      },
    },
    {
      id: 'suspect_ali',
      name: 'Ali',
      location: 'Kafede oturuyor',
      isGuilty: false,
      dialogue: {
        greeting: 'Ben sadece kahvemi içiyordum. O gece özel bir şey görmedim ki.',
        accuseCorrect: '',
        accuseWrong: 'Beni bırakın, ben hiçbir şey yapmadım!',
        detectiveComment: 'Sinirli ama masum sinirlilik bu.',
      },
    },
  ],
}

// ─── VAKA 3 — Balıkçı Limanı ─────────────────────────────────────────────────

const case03: DetectiveCase = {
  id: 'case_03',
  title: 'Limanın Kayıp Teknesi',
  dayLimit: 5,
  location: 'coast',
  detectiveMood: 2,
  culpritId: 'suspect_nikos',
  dayClues: [
    { day: 1, text: 'Balıkçının teknesi battı — ama hasarın yeri kasıtlı gibi görünüyor.' },
    { day: 2, text: 'Remy bir şey duymuş geceleri. Git onunla konuş.' },
    { day: 3, text: 'Limanda yabancı biri varmış o gece. Tekne sahibiyle anlaşmazlık mı?' },
    { day: 4, text: 'Tekne sigortası — Nikos faydalananlar arasında.' },
    { day: 5, text: 'Son gün. Dalış maskesi izinden parmak izi çıktı.' },
  ],
  evidence: [
    {
      id: 'ev_tekne',
      label: 'Batmış tekne gövdesi',
      description: 'Alt kısımda bilerek açılmış bir delik.',
      sceneXNorm: 0.5,
      sceneYNorm: 0.65,
      pointsTo: 'suspect_remy_witness',
      examineItems: [
        {
          id: 'ev_tekne_delik',
          label: 'Kesik kenar',
          description: 'Alet izi temiz — deneyimli biri yapmış.',
          xNorm: 0.5,
          yNorm: 0.7,
          radius: 22,
          revealsClue: 'ev_maske',
        },
      ],
    },
    {
      id: 'ev_maske',
      label: 'Dalış maskesi',
      description: 'Sahil kayalıklarında bulundu. İç yüzünde yağ izi.',
      sceneXNorm: 0.25,
      sceneYNorm: 0.78,
      pointsTo: 'suspect_nikos',
    },
  ],
  suspects: [
    {
      id: 'suspect_remy_witness',
      name: 'Remy',
      location: 'Balıkçı kulübesinin önünde',
      isGuilty: false,
      dialogue: {
        greeting: 'Geceleri garip sesler duydum limandan. Biri suda hareket ediyordu.',
        accuseCorrect: '',
        accuseWrong: 'Arkadaşım benim! Ben böyle bir şey yapmam!',
        detectiveComment: 'Remy açık yürekli biri. Tanıklığı önemli.',
      },
    },
    {
      id: 'suspect_nikos',
      name: 'Nikos',
      location: 'Limanın en uç noktasında teknesini tamir ediyor',
      isGuilty: true,
      dialogue: {
        greeting: 'Ben o gece evdeydim. Sorma bana limanı.',
        accuseCorrect: 'Sigortayı almak istedim, başka yolum yoktu. Aile borca battı.',
        accuseWrong: '',
        detectiveComment: 'Maskeyi gösterince titredi. Bu adamın işi.',
      },
    },
  ],
}

export const DETECTIVE_CASES: DetectiveCase[] = [case01, case02, case03]

// Vakaların tamamı (7 tanesi aynı yapıyla içerik olarak eklenecek)
// case_04 → case_10: aynı DetectiveCase yapısı, farklı lokasyon ve şüpheliler
```

- [ ] **Adım 2: Testleri çalıştır (derleme kontrolü)**

```bash
npm test -- --run
```

Beklenen: tüm testler PASS. TypeScript derleme hatası yoksa veri modeli doğru.

- [ ] **Adım 3: Commit**

```bash
git add src/data/detectiveCases.ts
git commit -m "feat: detectiveCases — tip tanımları + 3 tam vaka"
```

---

## Task 4: detectiveStore + testler

**Files:**
- Create: `src/store/detectiveStore.ts`
- Create: `src/store/__tests__/detectiveStore.test.ts`

- [ ] **Adım 1: Test dosyasını yaz**

```ts
// src/store/__tests__/detectiveStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useDetectiveStore } from '../detectiveStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useLifePathStore } from '../lifePathStore'

const CASE_ID = 'case_01'
const CULPRIT = 'suspect_mete'
const INNOCENT = 'suspect_dilara'

beforeEach(() => {
  useDetectiveStore.setState({
    activeCase: null,
    dayCount: 0,
    collectedEvidence: [],
    chainPosition: null,
    completedCases: [],
  })
  useIdeaSeedStore.setState(s => ({
    seeds: { ...s.seeds, analiz: 0 },
  }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
})

describe('detectiveStore — startCase', () => {
  it('aktif vakayı set eder ve gün sayacını başlatır', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    const s = useDetectiveStore.getState()
    expect(s.activeCase?.id).toBe(CASE_ID)
    expect(s.dayCount).toBe(1)
    expect(s.collectedEvidence).toEqual([])
    expect(s.chainPosition).toBeNull()
  })

  it('zaten aktif vaka varken yeni vaka başlatmaz', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().startCase('case_02')
    expect(useDetectiveStore.getState().activeCase?.id).toBe(CASE_ID)
  })

  it('bilinmeyen case_id ile startCase hiçbir şey yapmaz', () => {
    useDetectiveStore.getState().startCase('case_999')
    expect(useDetectiveStore.getState().activeCase).toBeNull()
  })
})

describe('detectiveStore — collectEvidence', () => {
  it('kanıt toplanınca collectedEvidence listesine eklenir', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().collectEvidence('ev_canta')
    expect(useDetectiveStore.getState().collectedEvidence).toContain('ev_canta')
  })

  it('aynı kanıt iki kez eklenemez', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().collectEvidence('ev_canta')
    useDetectiveStore.getState().collectEvidence('ev_canta')
    expect(useDetectiveStore.getState().collectedEvidence.filter(e => e === 'ev_canta')).toHaveLength(1)
  })

  it('aktif vaka yokken collectEvidence hiçbir şey yapmaz', () => {
    useDetectiveStore.getState().collectEvidence('ev_canta')
    expect(useDetectiveStore.getState().collectedEvidence).toHaveLength(0)
  })
})

describe('detectiveStore — advanceDay', () => {
  it('gün sayacını artırır', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().advanceDay()
    expect(useDetectiveStore.getState().dayCount).toBe(2)
  })

  it('aktif vaka yokken advanceDay hiçbir şey yapmaz', () => {
    useDetectiveStore.getState().advanceDay()
    expect(useDetectiveStore.getState().dayCount).toBe(0)
  })
})

describe('detectiveStore — makeAccusation', () => {
  it('doğru suçlu ile correct döner ve analiz tohumu verir', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    const result = useDetectiveStore.getState().makeAccusation(CULPRIT)
    expect(result).toBe('correct')
    expect(useIdeaSeedStore.getState().seeds.analiz).toBe(3)
  })

  it('doğru suçlu son günde correct döner ve 2 tohum verir', () => {
    useDetectiveStore.getState().startCase(CASE_ID) // dayLimit=4
    useDetectiveStore.getState().advanceDay()
    useDetectiveStore.getState().advanceDay()
    useDetectiveStore.getState().advanceDay() // dayCount=4 = dayLimit
    const result = useDetectiveStore.getState().makeAccusation(CULPRIT)
    expect(result).toBe('correct')
    expect(useIdeaSeedStore.getState().seeds.analiz).toBe(2)
  })

  it('yanlış suçlu ile wrong döner ve 1 tohum verir', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    const result = useDetectiveStore.getState().makeAccusation(INNOCENT)
    expect(result).toBe('wrong')
    expect(useIdeaSeedStore.getState().seeds.analiz).toBe(1)
  })

  it('gün limiti dolduğunda timeout döner', () => {
    useDetectiveStore.getState().startCase(CASE_ID) // dayLimit=4
    useDetectiveStore.getState().advanceDay()
    useDetectiveStore.getState().advanceDay()
    useDetectiveStore.getState().advanceDay()
    useDetectiveStore.getState().advanceDay() // dayCount=5 > dayLimit=4
    const result = useDetectiveStore.getState().makeAccusation(CULPRIT)
    expect(result).toBe('timeout')
    expect(useIdeaSeedStore.getState().seeds.analiz).toBe(1)
  })

  it('doğru suçlama emek progressi artırır', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().makeAccusation(CULPRIT)
    expect(useLifePathStore.getState().progress.emek).toBe(12)
  })

  it('yanlış suçlama emek progressi az artırır (+3)', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().makeAccusation(INNOCENT)
    expect(useLifePathStore.getState().progress.emek).toBe(3)
  })

  it('makeAccusation sonrası vaka tamamlanmış sayılır', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().makeAccusation(CULPRIT)
    expect(useDetectiveStore.getState().completedCases).toContain(CASE_ID)
    expect(useDetectiveStore.getState().activeCase).toBeNull()
  })

  it('aktif vaka yokken makeAccusation null döner', () => {
    const result = useDetectiveStore.getState().makeAccusation(CULPRIT)
    expect(result).toBeNull()
  })
})

describe('detectiveStore — reset', () => {
  it('tüm state sıfırlanır', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().collectEvidence('ev_canta')
    useDetectiveStore.getState().reset()
    const s = useDetectiveStore.getState()
    expect(s.activeCase).toBeNull()
    expect(s.dayCount).toBe(0)
    expect(s.collectedEvidence).toEqual([])
    expect(s.completedCases).toEqual([])
  })
})
```

- [ ] **Adım 2: Testi çalıştır — FAIL bekliyoruz**

```bash
npm test -- --run src/store/__tests__/detectiveStore.test.ts
```

Beklenen: `Cannot find module '../detectiveStore'`

- [ ] **Adım 3: detectiveStore.ts yaz**

```ts
// src/store/detectiveStore.ts
import { create } from 'zustand'
import { DETECTIVE_CASES } from '@/data/detectiveCases'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { DetectiveCase } from '@/data/detectiveCases'

type AccusationResult = 'correct' | 'wrong' | 'timeout' | null

interface DetectiveStore {
  activeCase: DetectiveCase | null
  dayCount: number
  collectedEvidence: string[]
  chainPosition: string | null
  completedCases: string[]

  startCase(caseId: string): void
  collectEvidence(evidenceId: string): void
  advanceDay(): void
  makeAccusation(suspectId: string): AccusationResult
  reset(): void
}

function calcReward(result: 'correct' | 'wrong' | 'timeout', dayCount: number, dayLimit: number) {
  if (result === 'wrong' || result === 'timeout') {
    return { seeds: 1, progress: 3 }
  }
  // correct: son gün mü?
  if (dayCount >= dayLimit) {
    return { seeds: 2, progress: 8 }
  }
  return { seeds: 3, progress: 12 }
}

export const useDetectiveStore = create<DetectiveStore>((set, get) => ({
  activeCase: null,
  dayCount: 0,
  collectedEvidence: [],
  chainPosition: null,
  completedCases: [],

  startCase(caseId) {
    if (get().activeCase !== null) return
    const found = DETECTIVE_CASES.find(c => c.id === caseId)
    if (!found) return
    set({ activeCase: found, dayCount: 1, collectedEvidence: [], chainPosition: null })
  },

  collectEvidence(evidenceId) {
    if (!get().activeCase) return
    set(s => {
      if (s.collectedEvidence.includes(evidenceId)) return s
      return { collectedEvidence: [...s.collectedEvidence, evidenceId] }
    })
  },

  advanceDay() {
    if (!get().activeCase) return
    set(s => ({ dayCount: s.dayCount + 1 }))
  },

  makeAccusation(suspectId): AccusationResult {
    const { activeCase, dayCount, completedCases } = get()
    if (!activeCase) return null

    let result: 'correct' | 'wrong' | 'timeout'
    if (dayCount > activeCase.dayLimit) {
      result = 'timeout'
    } else if (suspectId === activeCase.culpritId) {
      result = 'correct'
    } else {
      result = 'wrong'
    }

    const { seeds, progress } = calcReward(result, dayCount, activeCase.dayLimit)
    useIdeaSeedStore.getState().addSeed('analiz', seeds)
    useLifePathStore.getState().addProgress('emek', progress)

    set({
      activeCase: null,
      dayCount: 0,
      collectedEvidence: [],
      chainPosition: null,
      completedCases: [...completedCases, activeCase.id],
    })

    return result
  },

  reset() {
    set({
      activeCase: null,
      dayCount: 0,
      collectedEvidence: [],
      chainPosition: null,
      completedCases: [],
    })
  },
}))
```

- [ ] **Adım 4: Testi çalıştır — PASS bekliyoruz**

```bash
npm test -- --run src/store/__tests__/detectiveStore.test.ts
```

Beklenen: 14 test PASS

- [ ] **Adım 5: Tüm testler**

```bash
npm test -- --run
```

Beklenen: tüm testler PASS

- [ ] **Adım 6: Commit**

```bash
git add src/store/detectiveStore.ts src/store/__tests__/detectiveStore.test.ts
git commit -m "feat: detectiveStore — vaka akışı, kanıt toplama, suçlama, ödül dağıtımı"
```

---

## Task 5: ExamineScene — PixiJS overlay

**Files:**
- Create: `src/pixi/ExamineScene.ts`

- [ ] **Adım 1: Mevcut PixiJS kullanımını anla**

`src/components/SkillTreeCanvas.tsx` dosyasını oku. Dikkat et:
- `Application` nasıl oluşturuluyor (`new Application()`, `await app.init(...)`)
- `Graphics` nasıl kullanılıyor (v8 API: `g.circle(...).fill(...)`)
- `Text` nasıl oluşturuluyor
- `on('pointerdown', ...)` ile tıklama olayları nasıl ekleniyor
- `app.destroy()` cleanup

- [ ] **Adım 2: ExamineScene.ts oluştur**

```ts
// src/pixi/ExamineScene.ts
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js'
import type { EvidenceNode, ExamineItem } from '@/data/detectiveCases'

export interface ExamineHotspot {
  id: string
  label: string
  description: string
  xNorm: number
  yNorm: number
  radius: number
}

export interface ExamineSceneOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  evidenceNode: EvidenceNode
  onItemFound: (itemId: string) => void
  onClose: () => void
}

export class ExamineScene {
  private app: Application
  private options: ExamineSceneOptions
  private destroyed = false

  private constructor(app: Application, options: ExamineSceneOptions) {
    this.app = app
    this.options = options
  }

  static async create(options: ExamineSceneOptions): Promise<ExamineScene> {
    const app = new Application()
    await app.init({
      canvas: options.canvas,
      width: options.width,
      height: options.height,
      backgroundColor: 0x060408,
      antialias: true,
    })
    const scene = new ExamineScene(app, options)
    scene.render()
    return scene
  }

  private render() {
    const { app, options } = this
    const { width, height, evidenceNode } = options
    app.stage.removeChildren()

    // ── Arkaplan ──────────────────────────────────────────────────────────
    const bg = new Graphics()
    bg.rect(0, 0, width, height).fill({ color: 0x060408, alpha: 1 })
    // Vinyette
    bg.circle(width / 2, height / 2, Math.max(width, height) * 0.7)
      .fill({ color: 0x000000, alpha: 0 })
    app.stage.addChild(bg)

    // ── Nesne alanı (merkez panel) ────────────────────────────────────────
    const panelW = width * 0.6
    const panelH = height * 0.55
    const panelX = (width - panelW) / 2
    const panelY = height * 0.12

    const panel = new Graphics()
    panel.roundRect(panelX, panelY, panelW, panelH, 8)
      .fill({ color: 0x0d0a08, alpha: 1 })
      .stroke({ width: 1.5, color: 0x443322, alpha: 0.8 })
    app.stage.addChild(panel)

    // ── Kanıt başlığı ─────────────────────────────────────────────────────
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 14,
      fill: '#ffcc88',
    })
    const title = new Text({ text: evidenceNode.label, style: titleStyle })
    title.x = panelX + 12
    title.y = panelY - 22
    app.stage.addChild(title)

    // ── Açıklama ──────────────────────────────────────────────────────────
    const descStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: '#7070a0',
      wordWrap: true,
      wordWrapWidth: panelW - 24,
    })
    const desc = new Text({ text: evidenceNode.description, style: descStyle })
    desc.x = panelX + 12
    desc.y = panelY + panelH + 10
    app.stage.addChild(desc)

    // ── Tıklanabilir noktalar (examineItems) ──────────────────────────────
    const items = evidenceNode.examineItems ?? []
    items.forEach((item) => {
      const cx = panelX + item.xNorm * panelW
      const cy = panelY + item.yNorm * panelH

      const hotspot = new Graphics()
      hotspot.circle(0, 0, item.radius)
        .fill({ color: 0xff6644, alpha: 0.15 })
        .stroke({ width: 1.5, color: 0xff6644, alpha: 0.8 })
      hotspot.x = cx
      hotspot.y = cy
      hotspot.eventMode = 'static'
      hotspot.cursor = 'pointer'

      // Pulsing inner dot
      const dot = new Graphics()
      dot.circle(0, 0, 4).fill({ color: 0xff8866, alpha: 1 })
      hotspot.addChild(dot)

      // Label
      const labelStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 9, fill: '#ff8866' })
      const label = new Text({ text: item.label, style: labelStyle })
      label.x = -label.width / 2
      label.y = item.radius + 4
      hotspot.addChild(label)

      hotspot.on('pointerdown', () => {
        if (this.destroyed) return
        this.showItemDetail(item)
        options.onItemFound(item.id)
      })

      app.stage.addChild(hotspot)
    })

    // ── ESC ipucu ─────────────────────────────────────────────────────────
    const escStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#3a3a60' })
    const escHint = new Text({ text: '[ESC] geri', style: escStyle })
    escHint.x = width - escHint.width - 12
    escHint.y = 10
    app.stage.addChild(escHint)

    // ── Klavye ESC dinleyici ──────────────────────────────────────────────
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !this.destroyed) {
        options.onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    // Cleanup kaydı — destroy içinde temizlenecek
    ;(this as unknown as { _keyHandler: typeof onKey })._keyHandler = onKey
  }

  private showItemDetail(item: ExamineItem) {
    // Detay popup: ekranın alt kısmına overlay olarak
    const { app, options: { width, height } } = this
    const existing = app.stage.getChildByLabel('item-detail')
    if (existing) app.stage.removeChild(existing)

    const container = new Container()
    container.label = 'item-detail'

    const bg = new Graphics()
    bg.roundRect(20, height - 110, width - 40, 90, 6)
      .fill({ color: 0x000000, alpha: 0.85 })
      .stroke({ width: 1, color: 0x2a2a60, alpha: 1 })
    container.addChild(bg)

    const titleStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#ffcc88' })
    const t = new Text({ text: item.label, style: titleStyle })
    t.x = 32
    t.y = height - 100
    container.addChild(t)

    const descStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 10, fill: '#8080c0',
      wordWrap: true, wordWrapWidth: width - 80,
    })
    const d = new Text({ text: item.description, style: descStyle })
    d.x = 32
    d.y = height - 82
    container.addChild(d)

    app.stage.addChild(container)
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    const handler = (this as unknown as { _keyHandler?: (e: KeyboardEvent) => void })._keyHandler
    if (handler) window.removeEventListener('keydown', handler)
    this.app.destroy()
  }
}
```

- [ ] **Adım 3: TypeScript derleme kontrolü**

```bash
npm run typecheck 2>&1 | head -30
```

Eğer `typecheck` script yoksa:

```bash
npx tsc --noEmit 2>&1 | head -30
```

Beklenen: ExamineScene ile ilgili hata yok.

- [ ] **Adım 4: Testleri çalıştır**

```bash
npm test -- --run
```

Beklenen: tüm testler PASS (ExamineScene için otomatik test yok — PixiJS bileşenleri UI test ortamında çalışmaz).

- [ ] **Adım 5: durum.md güncelle**

`durum.md` dosyasını oku. `Tamamlananlar` bölümüne şunu ekle:

```markdown
### Dedektif Asistanı Altyapısı (2026-06-02)
- `src/data/npcDialogues.ts`: analiz tohum tipi eklendi
- `src/store/ideaSeedStore.ts`: analiz sayacı eklendi
- `src/data/skillTree.ts`: analiz_t1/t2/t3 node'ları eklendi
- `src/pixi/rooms/parkRoom.ts`: park odası + RoomId'ye 'park' eklendi
- `src/data/detectiveCases.ts`: vaka veri modeli + 3 tam vaka (case_01–03)
- `src/store/detectiveStore.ts`: startCase, collectEvidence, advanceDay, makeAccusation, ödül dağıtımı
- `src/pixi/ExamineScene.ts`: zoom-in overlay, iç içe point&click kanıt inceleme
```

`Sıradaki Büyük Görevler` bölümüne ekle:

```markdown
- Dedektif asistanı entegrasyonu: posta kutusu altyapısı, companion NPC, günlük akış, case_04–10 içeriği
```

- [ ] **Adım 6: Commit**

```bash
git add src/pixi/ExamineScene.ts durum.md
git commit -m "feat: ExamineScene — zoom overlay, iç içe point&click"
git push
```

---

## Kapsam Notu

Bu plan dedektif işinin **altyapısını** kurar — store, veri modeli, overlay component ve park odası. Aşağıdakiler sonraki ayrı speclere bırakıldı:

- **Posta kutusu sistemi** — diğer yan işlerde de kullanılacak, ayrı altyapı spec
- **Companion NPC mekaniği** — dedektifin oyuncuyu takip etmesi, WorldScene değişikliği gerektirir
- **Vakaların oyun haritasına bağlanması** — TriggerSystem entegrasyonu
- **case_04–case_10 içeriği** — case_01–03 ile aynı yapı, içerik çalışması
- **Günlük akış (advanceDay)** — uyku tetikleyicisine bağlanması
