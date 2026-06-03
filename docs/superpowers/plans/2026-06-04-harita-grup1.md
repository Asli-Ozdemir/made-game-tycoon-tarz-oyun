# Harita Grup 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut `coast/city/park` room ID'lerini `coast_center/city_core/city_park` olarak yeniden adlandır, tüm 9 room ID'yi type'a ekle, ve `npcLocations.ts` ile her NPC'yi bir odaya ata.

**Architecture:** `RoomId` type'ına tüm 9 room ID eklenir (gelecek odalar için forward-declare). Mevcut 4 oda dosyası sadece export adı ve `id` alanıyla yeniden adlandırılır, iç içerik değişmez. `ROOMS` map'i `Partial<Record<RoomId, RoomDef>>` olur — sadece mevcut 4 oda entry içerir, yeni odalar ileriki gruplarda eklenir. `npcLocations.ts` tüm 24 NPC'yi bir odaya eşler.

**Tech Stack:** TypeScript, Vitest, Zustand, `src/pixi/rooms/types.ts`, `src/pixi/Game.ts`

---

## File Structure

| Dosya | İşlem | Sorumluluk |
|-------|-------|-----------|
| `src/pixi/rooms/types.ts` | Modify | RoomId union — tüm 9 ID |
| `src/pixi/rooms/coastRoom.ts` | Modify | export: `coastCenterRoom`, id: `coast_center` |
| `src/pixi/rooms/cityRoom.ts` | Modify | export: `cityCoreRoom`, id: `city_core` |
| `src/pixi/rooms/parkRoom.ts` | Modify | export: `cityParkRoom`, id: `city_park`, exit/spawn fix |
| `src/pixi/rooms/bridgeRoom.ts` | Modify | exit triggers + spawn keys → yeni ID'ler |
| `src/pixi/Game.ts` | Modify | ROOMS Partial map, yeni import adları |
| `src/store/worldStore.ts` | Modify | currentRoomId default → `coast_center` |
| `src/data/detectiveCases.ts` | Modify | location değerleri → yeni ID'ler |
| `src/data/npcDialogues.ts` | Modify | 8 yeni NPC'ye `isRomanceCandidate: true` ekle |
| `src/pixi/rooms/__tests__/rooms.test.ts` | Modify | import adları + toRoom + spawn key'leri |
| `src/data/npcLocations.ts` | Create | `NPC_HOME_ROOMS: Record<NPCId, RoomId>` |
| `src/data/__tests__/npcLocations.test.ts` | Create | npcLocations testleri |

---

### Task 1: Fix isRomanceCandidate on new NPCs

`src/data/npcDialogues.ts` dosyasına en son eklenen 8 NPC'de (rosa, iris, sigrid, liv, bjorn, kai, elias, matteo) `isRomanceCandidate` alanı eksik — TypeScript hatası. Bu task sadece o alanı ekler.

**Files:**
- Modify: `src/data/npcDialogues.ts`

- [ ] **Step 1: Rosa'ya `isRomanceCandidate: true` ekle**

`src/data/npcDialogues.ts` — rosa bloğunu bul (satır ~1873), `gender: 'female'` satırının altına ekle:

```ts
const rosa: NPCDef = {
  id: 'rosa',
  name: 'Rosa',
  role: 'Fırın Çırağı',
  philosophy: 'Romantizm adayı — ...',
  emoji: '🥐',
  gender: 'female',
  isRomanceCandidate: true,   // ← EKLE
  tier2Threshold: 30,
```

Aynı şekilde kalan 7 NPC için de:
- `iris` (satır ~1983): `isRomanceCandidate: true`
- `sigrid` (satır ~2092): `isRomanceCandidate: true`
- `liv` (satır ~2203): `isRomanceCandidate: true`
- `bjorn` (satır ~2313): `isRomanceCandidate: true`
- `kai` (satır ~2423): `isRomanceCandidate: true`
- `elias` (satır ~2533): `isRomanceCandidate: true`
- `matteo` (satır ~2643): `isRomanceCandidate: true`

Her birinde `gender: '...'` satırından hemen sonra `isRomanceCandidate: true,` satırı ekle.

- [ ] **Step 2: TS hatalarının gittiğini doğrula**

```bash
npx tsc --noEmit 2>&1 | grep "isRomanceCandidate"
```

Expected: hiç çıktı yok (o hata satırları gitmiş).

- [ ] **Step 3: Testlerin hâlâ geçtiğini doğrula**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -5
```

Expected: `520 passed`

- [ ] **Step 4: Commit**

```bash
git add src/data/npcDialogues.ts
git commit -m "fix: isRomanceCandidate eksik alan — rosa iris sigrid liv bjorn kai elias matteo"
```

---

### Task 2: RoomId type genişletme

`src/pixi/rooms/types.ts` dosyasına tüm 9 room ID eklenir. Henüz dosyası olmayan odalar (`coast_home`, `coast_docks`, `coast_west`, `city_culture`, `city_edge`) forward-declare edilir — ROOMS map Partial olacağı için TS hatası olmaz.

**Files:**
- Modify: `src/pixi/rooms/types.ts`

- [ ] **Step 1: `types.ts` RoomId'yi güncelle**

`src/pixi/rooms/types.ts` dosyasını aç. Mevcut:

```ts
export type RoomId = 'coast' | 'bridge' | 'city' | 'park'
```

Bununla değiştir:

```ts
export type RoomId =
  // Sahil yakası
  | 'coast_home'
  | 'coast_docks'
  | 'coast_center'
  | 'coast_west'
  // Köprü
  | 'bridge'
  // Şehir yakası
  | 'city_core'
  | 'city_culture'
  | 'city_edge'
  | 'city_park'
```

`SpawnPoints` ve `ExitTriggerDef` tip tanımları aynı kalır — `RoomId` union'ını kullandıkları için otomatik genişler.

- [ ] **Step 2: TS hatalarını kontrol et (ROOMS map hatası bekleniyor)**

```bash
npx tsc --noEmit 2>&1 | grep "RoomId\|ROOMS\|coast\|city\|park" | head -20
```

Bu noktada `Game.ts`'deki `ROOMS` map hatası görünecek (`Partial` olmadığı için). Devam et — Task 3'te düzelecek.

- [ ] **Step 3: Commit**

```bash
git add src/pixi/rooms/types.ts
git commit -m "feat: RoomId — 9 oda ID forward-declare"
```

---

### Task 3: Oda dosyalarını yeniden adlandır

Dört mevcut oda dosyasında sadece export adı ve `id` alanı değişir. `bridgeRoom.ts`'de exit trigger hedefleri ve spawn key'leri güncellenir.

**Files:**
- Modify: `src/pixi/rooms/coastRoom.ts`
- Modify: `src/pixi/rooms/cityRoom.ts`
- Modify: `src/pixi/rooms/parkRoom.ts`
- Modify: `src/pixi/rooms/bridgeRoom.ts`

- [ ] **Step 1: coastRoom.ts güncelle**

`src/pixi/rooms/coastRoom.ts` — iki değişiklik:

```ts
export const coastCenterRoom: RoomDef = {  // ← coast → coastCenter
  id: 'coast_center',                       // ← 'coast' → 'coast_center'
  widthTiles: 50,
  // ... geri kalan içerik değişmez ...
  exitTriggers: [
    {
      toRoom: 'bridge',   // bridge değişmez
      // ...
    },
  ],
  spawnPoints: {
    default:     { x: 24 * TILE_SIZE + 16, y: 18 * TILE_SIZE + 16 },
    from_bridge: { x: 24 * TILE_SIZE + 16, y: 19 * TILE_SIZE + 16 },
  },
}
```

- [ ] **Step 2: cityRoom.ts güncelle**

`src/pixi/rooms/cityRoom.ts` — iki değişiklik:

```ts
export const cityCoreRoom: RoomDef = {  // ← city → cityCore
  id: 'city_core',                       // ← 'city' → 'city_core'
  widthTiles: 50,
  // ... geri kalan içerik değişmez ...
  exitTriggers: [
    {
      toRoom: 'bridge',   // bridge değişmez
      // ...
    },
  ],
  spawnPoints: {
    from_bridge: { x: 24 * TILE_SIZE + 16, y: 1 * TILE_SIZE + 16 },
  },
}
```

- [ ] **Step 3: parkRoom.ts güncelle**

`src/pixi/rooms/parkRoom.ts` — dört değişiklik (export adı, id, exitTrigger toRoom, spawn key):

```ts
export const cityParkRoom: RoomDef = {  // ← park → cityPark
  id: 'city_park',                       // ← 'park' → 'city_park'
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
      toRoom: 'city_core',               // ← 'city' → 'city_core'
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
    default:         { x: 20 * TILE_SIZE + 16, y: 16 * TILE_SIZE + 16 },
    from_city_core:  { x: 20 * TILE_SIZE + 16, y: 17 * TILE_SIZE + 16 },  // ← from_city → from_city_core
  },
}
```

- [ ] **Step 4: bridgeRoom.ts güncelle**

`src/pixi/rooms/bridgeRoom.ts` — exit trigger hedefleri ve spawn key'leri değişir, export adı **değişmez** (bridge = bridge):

```ts
export const bridgeRoom: RoomDef = {
  id: 'bridge',
  widthTiles: 50,
  heightTiles: 6,
  zones: [
    { rowStart: 0, rowEnd: 5, bgColor: 0x0a0a08, type: 'bridge' },
  ],
  buildings: [],
  triggers: [],
  exitTriggers: [
    { toRoom: 'coast_center', x: 20 * TILE_SIZE, y: 0,             w: 10 * TILE_SIZE, h: TILE_SIZE },  // ← 'coast' → 'coast_center'
    { toRoom: 'city_core',    x: 20 * TILE_SIZE, y: 5 * TILE_SIZE, w: 10 * TILE_SIZE, h: TILE_SIZE },  // ← 'city' → 'city_core'
  ],
  customCollisionRects: [
    { x: 0,              y: 0, w: 20 * TILE_SIZE, h: 6 * TILE_SIZE },
    { x: 30 * TILE_SIZE, y: 0, w: 20 * TILE_SIZE, h: 6 * TILE_SIZE },
  ],
  spawnPoints: {
    default:            { x: 24 * TILE_SIZE + 16, y: 3 * TILE_SIZE },
    from_coast_center:  { x: 24 * TILE_SIZE + 16, y: 1 * TILE_SIZE + 16 },  // ← from_coast → from_coast_center
    from_city_core:     { x: 24 * TILE_SIZE + 16, y: 4 * TILE_SIZE + 16 },  // ← from_city → from_city_core
  },
}
```

- [ ] **Step 5: Commit**

```bash
git add src/pixi/rooms/coastRoom.ts src/pixi/rooms/cityRoom.ts src/pixi/rooms/parkRoom.ts src/pixi/rooms/bridgeRoom.ts
git commit -m "refactor: oda dosyaları yeniden adlandır — coast_center city_core city_park"
```

---

### Task 4: Game.ts, worldStore.ts, detectiveCases.ts güncelle

**Files:**
- Modify: `src/pixi/Game.ts`
- Modify: `src/store/worldStore.ts`
- Modify: `src/data/detectiveCases.ts`

- [ ] **Step 1: Game.ts güncelle**

`src/pixi/Game.ts` — import adları ve ROOMS map:

```ts
// Eski importları kaldır, yenileri ekle:
import { coastCenterRoom } from './rooms/coastRoom'
import { bridgeRoom }      from './rooms/bridgeRoom'
import { cityCoreRoom }    from './rooms/cityRoom'
import { cityParkRoom }    from './rooms/parkRoom'
import type { RoomDef }    from './rooms/types'
import type { RoomId }     from './rooms/types'

// ROOMS tipi Partial olur (gelecek odalar henüz dosyası yok):
const ROOMS: Partial<Record<RoomId, RoomDef>> = {
  coast_center: coastCenterRoom,
  bridge:       bridgeRoom,
  city_core:    cityCoreRoom,
  city_park:    cityParkRoom,
}
```

`transitionToRoom` fonksiyonunda room lookup guard ekle:

```ts
export function transitionToRoom(pendingRoomId: RoomId, fromRoomId: RoomId): void {
  if (!worldScene || !player) return
  const room = ROOMS[pendingRoomId]
  if (!room) return                          // ← EKLE: oda henüz implement edilmemişse dur
  worldScene.loadRoom(room)
  const spawnKey = `from_${fromRoomId}` as `from_${RoomId}`
  const spawn = room.spawnPoints[spawnKey] ?? room.spawnPoints.default ?? { x: 24 * TILE_SIZE + 16, y: TILE_SIZE + 16 }
  player.setPosition(spawn.x, spawn.y)
}
```

`initGame` içindeki `startRoom` lookup'ı da guard'a alır — mevcut 47-50. satırlar civarı:

```ts
const startRoomId = useWorldStore.getState().currentRoomId
const startRoom = ROOMS[startRoomId] ?? coastCenterRoom  // ← fallback ekle
worldScene.loadRoom(startRoom)
```

- [ ] **Step 2: worldStore.ts güncelle**

`src/store/worldStore.ts` — default `currentRoomId`:

Mevcut:
```ts
currentRoomId: 'coast',
```

Yeni:
```ts
currentRoomId: 'coast_center',
```

- [ ] **Step 3: detectiveCases.ts güncelle**

`src/data/detectiveCases.ts` — 3 location değeri:

```ts
// Vaka 1 (satır ~71):
location: 'city_park',    // ← 'park' → 'city_park'

// Vaka 2 (satır ~165):
location: 'city_core',    // ← 'city' → 'city_core'

// Vaka 3 (satır ~279):
location: 'coast_center', // ← 'coast' → 'coast_center'
```

- [ ] **Step 4: TS hatalarını kontrol et**

```bash
npx tsc --noEmit 2>&1 | grep -v "npcDialogues\|savegameEngine\|scoreEngine" | head -20
```

`Game.ts`, `worldStore.ts`, `detectiveCases.ts` kaynaklı hata kalmamalı.

- [ ] **Step 5: Commit**

```bash
git add src/pixi/Game.ts src/store/worldStore.ts src/data/detectiveCases.ts
git commit -m "refactor: Game.ts worldStore detectiveCases — yeni RoomId'lere güncelle"
```

---

### Task 5: Oda testlerini güncelle

**Files:**
- Modify: `src/pixi/rooms/__tests__/rooms.test.ts`

- [ ] **Step 1: Testleri çalıştır, mevcut hataları gör**

```bash
npx vitest run src/pixi/rooms/__tests__/rooms.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: import hataları veya `toRoom === 'coast'` başarısızlıkları görünür.

- [ ] **Step 2: rooms.test.ts dosyasının tamamını yeni içerikle yaz**

`src/pixi/rooms/__tests__/rooms.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { coastCenterRoom } from '../coastRoom'
import { bridgeRoom }      from '../bridgeRoom'
import { cityCoreRoom }    from '../cityRoom'
import { cityParkRoom }    from '../parkRoom'
import { TILE_SIZE }       from '../../mapData'

describe('coastCenterRoom', () => {
  it('has correct dimensions', () => {
    expect(coastCenterRoom.widthTiles).toBe(50)
    expect(coastCenterRoom.heightTiles).toBe(22)
  })
  it('id is coast_center', () => {
    expect(coastCenterRoom.id).toBe('coast_center')
  })
  it('has exit trigger to bridge at bottom', () => {
    const ex = coastCenterRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    expect(ex).toBeDefined()
    expect(ex.y).toBe(20 * TILE_SIZE)
  })
  it('has default spawn point', () => {
    expect(coastCenterRoom.spawnPoints.default).toBeDefined()
  })
  it('has coastal water collision', () => {
    const water = coastCenterRoom.customCollisionRects.find(r => r.y === 0)!
    expect(water.h).toBe(4 * TILE_SIZE)
  })
})

describe('bridgeRoom', () => {
  it('has 6 tile height', () => {
    expect(bridgeRoom.heightTiles).toBe(6)
  })
  it('has exit triggers to coast_center and city_core', () => {
    const toCoast = bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast_center')
    const toCity  = bridgeRoom.exitTriggers.find(e => e.toRoom === 'city_core')
    expect(toCoast).toBeDefined()
    expect(toCity).toBeDefined()
  })
  it('coast_center trigger is at y=0, city_core trigger is at y=5*TILE_SIZE', () => {
    const toCoast = bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast_center')!
    const toCity  = bridgeRoom.exitTriggers.find(e => e.toRoom === 'city_core')!
    expect(toCoast.y).toBe(0)
    expect(toCity.y).toBe(5 * TILE_SIZE)
  })
  it('has side water collision rects', () => {
    expect(bridgeRoom.customCollisionRects.length).toBe(2)
  })
  it('has spawn points from both directions', () => {
    expect(bridgeRoom.spawnPoints.from_coast_center).toBeDefined()
    expect(bridgeRoom.spawnPoints.from_city_core).toBeDefined()
  })
})

describe('cityCoreRoom', () => {
  it('has 24 tile height', () => {
    expect(cityCoreRoom.heightTiles).toBe(24)
  })
  it('id is city_core', () => {
    expect(cityCoreRoom.id).toBe('city_core')
  })
  it('city building rows are shifted -26 from original', () => {
    const kafe = cityCoreRoom.buildings.find(b => b.id === 'kafe')!
    expect(kafe.row).toBe(4)
  })
  it('city trigger y values are shifted -832px from original', () => {
    const cafe    = cityCoreRoom.triggers.find(t => t.name === 'cafe_door')!
    const nexus   = cityCoreRoom.triggers.find(t => t.name === 'nexus_building')!
    const akademi = cityCoreRoom.triggers.find(t => t.name === 'akademi_door')!
    expect(cafe.y).toBe(384)
    expect(nexus.y).toBe(512)
    expect(akademi.y).toBe(320)
  })
  it('has exit trigger to bridge at top', () => {
    const ex = cityCoreRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    expect(ex.y).toBe(0)
  })
})

describe('cityParkRoom', () => {
  it('has correct dimensions', () => {
    expect(cityParkRoom.widthTiles).toBe(40)
    expect(cityParkRoom.heightTiles).toBe(20)
  })
  it('id is city_park', () => {
    expect(cityParkRoom.id).toBe('city_park')
  })
  it('has exit trigger to city_core', () => {
    const ex = cityParkRoom.exitTriggers.find(e => e.toRoom === 'city_core')!
    expect(ex).toBeDefined()
  })
  it('has spawn point from_city_core', () => {
    expect(cityParkRoom.spawnPoints.from_city_core).toBeDefined()
  })
})
```

- [ ] **Step 3: Testleri çalıştır**

```bash
npx vitest run src/pixi/rooms/__tests__/rooms.test.ts --reporter=verbose 2>&1 | tail -15
```

Expected: tüm testler PASS.

- [ ] **Step 4: Tüm test suite'i çalıştır**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -5
```

Expected: `≥ 520 passed` (yeni parkRoom testleri eklendiği için 4+ daha fazla olabilir).

- [ ] **Step 5: Commit**

```bash
git add src/pixi/rooms/__tests__/rooms.test.ts
git commit -m "test: rooms.test.ts — yeni RoomId'ler, cityParkRoom testleri ekle"
```

---

### Task 6: npcLocations.ts oluştur

**Files:**
- Create: `src/data/__tests__/npcLocations.test.ts`
- Create: `src/data/npcLocations.ts`

- [ ] **Step 1: Failing test yaz**

`src/data/__tests__/npcLocations.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { NPC_HOME_ROOMS } from '../npcLocations'

const ALL_NPC_IDS = [
  // Felsefe
  'marcus', 'remy', 'theo', 'bruno', 'magnus', 'yevgeni',
  'marta', 'clara', 'aldo', 'rex', 'vivian', 'soren',
  // Romantizm
  'elise', 'daniel', 'nadia', 'cassian', 'rosa', 'iris',
  'sigrid', 'liv', 'bjorn', 'kai', 'elias', 'matteo',
] as const

const VALID_ROOM_IDS = [
  'coast_home', 'coast_docks', 'coast_center', 'coast_west',
  'bridge',
  'city_core', 'city_culture', 'city_edge', 'city_park',
] as const

describe('NPC_HOME_ROOMS', () => {
  it('her NPCId için bir oda tanımlı', () => {
    for (const id of ALL_NPC_IDS) {
      expect(NPC_HOME_ROOMS[id], `${id} için oda eksik`).toBeDefined()
    }
  })

  it('atanan her oda geçerli bir RoomId', () => {
    for (const [id, room] of Object.entries(NPC_HOME_ROOMS)) {
      expect(VALID_ROOM_IDS, `${id} → "${room}" geçersiz RoomId`).toContain(room)
    }
  })

  it('marcus coast_center\'da yaşıyor', () => {
    expect(NPC_HOME_ROOMS['marcus']).toBe('coast_center')
  })

  it('clara city_core\'da yaşıyor', () => {
    expect(NPC_HOME_ROOMS['clara']).toBe('city_core')
  })

  it('remy coast_docks\'ta yaşıyor', () => {
    expect(NPC_HOME_ROOMS['remy']).toBe('coast_docks')
  })

  it('rex city_culture\'da yaşıyor', () => {
    expect(NPC_HOME_ROOMS['rex']).toBe('city_culture')
  })

  it('tam olarak 24 NPC var', () => {
    expect(Object.keys(NPC_HOME_ROOMS).length).toBe(24)
  })
})
```

- [ ] **Step 2: Test'in başarısız olduğunu doğrula**

```bash
npx vitest run src/data/__tests__/npcLocations.test.ts --reporter=verbose 2>&1 | tail -10
```

Expected: FAIL — "Cannot find module '../npcLocations'"

- [ ] **Step 3: `npcLocations.ts` oluştur**

`src/data/npcLocations.ts`:

```ts
import type { NPCId } from './npcDialogues'
import type { RoomId } from '@/pixi/rooms/types'

export const NPC_HOME_ROOMS: Record<NPCId, RoomId> = {
  // coast_home — Konut, bahçe, deniz feneri
  aldo:    'coast_home',
  liv:     'coast_home',
  cassian: 'coast_home',

  // coast_docks — Balıkçı rıhtımı, su kıyısı
  remy:    'coast_docks',
  soren:   'coast_docks',
  sigrid:  'coast_docks',
  daniel:  'coast_docks',

  // coast_center — Pub, sahaf, fırın, klinik (mevcut coastRoom)
  marcus:  'coast_center',
  theo:    'coast_center',
  marta:   'coast_center',
  rosa:    'coast_center',
  bjorn:   'coast_center',
  nadia:   'coast_center',

  // coast_west — Kafe, atölye, park
  bruno:   'coast_west',
  magnus:  'coast_west',
  elise:   'coast_west',

  // city_core — Stüdyo, hukuk, akademi, basın (mevcut cityRoom)
  clara:   'city_core',
  vivian:  'city_core',
  iris:    'city_core',

  // city_culture — Arcade, atölye, bistro
  rex:     'city_culture',
  yevgeni: 'city_culture',
  matteo:  'city_culture',

  // city_edge — Klinik, havuz
  elias:   'city_edge',
  kai:     'city_edge',
}
```

- [ ] **Step 4: Testleri çalıştır**

```bash
npx vitest run src/data/__tests__/npcLocations.test.ts --reporter=verbose 2>&1 | tail -15
```

Expected: tüm 7 test PASS.

- [ ] **Step 5: Tüm suite'i çalıştır**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -5
```

Expected: tüm testler PASS (öncekinden daha fazla).

- [ ] **Step 6: Commit**

```bash
git add src/data/npcLocations.ts src/data/__tests__/npcLocations.test.ts
git commit -m "feat: npcLocations.ts — 24 NPC → 9 oda eşlemesi"
```
