# Harita Grup 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `coast_home` ve `coast_docks` odalarını oluştur; `coast_center`'daki player evi + balıkçı içeriğini yeni odalara taşı; navigasyon zincirini `coast_home ↔ coast_docks ↔ coast_center ↔ bridge` olarak kur.

**Architecture:** Her oda sol/sağ kenar exit trigger'larıyla bağlanır (x=0 sol çıkış, x=39*TILE_SIZE sağ çıkış). `coast_home`'dan sağa gidince `coast_docks`, oradan sağa gidince `coast_center`. `coast_center`'dan sola gidince `coast_docks`. Oyuncu başlangıç odası `coast_home` olarak güncellenir (ev = başlangıç noktası). `nehir` trigger `coast_docks`'ta tanımlanır ve TriggerSystem'e eklenir.

**Tech Stack:** TypeScript, Vitest, PixiJS RoomDef, Zustand worldStore

---

## Koordinat Referansı

- `TILE_SIZE = 32px`
- Sahil odaları: `widthTiles=40, heightTiles=22`
- Su: rows 0–3 (`coastal_water`), kıyı: rows 4–6 (`coastal_sand`), zemin: rows 7–21 (`coastal`)
- Sol çıkış: `x=0, y=7*TILE_SIZE, w=TILE_SIZE, h=15*TILE_SIZE`
- Sağ çıkış: `x=39*TILE_SIZE, y=7*TILE_SIZE, w=TILE_SIZE, h=15*TILE_SIZE`
- Su çarpışma: `{ x: 0, y: 0, w: 40*TILE_SIZE, h: 4*TILE_SIZE }`

---

## File Structure

| Dosya | İşlem | Sorumluluk |
|-------|-------|-----------|
| `src/pixi/rooms/coastHomeRoom.ts` | Create | coast_home oda tanımı |
| `src/pixi/rooms/coastDocksRoom.ts` | Create | coast_docks oda tanımı |
| `src/pixi/rooms/coastRoom.ts` | Modify | sahil_evi + balikci + 3 trigger kaldır; sol çıkış + spawn ekle |
| `src/pixi/Game.ts` | Modify | ROOMS'a coastHomeRoom + coastDocksRoom ekle |
| `src/store/worldStore.ts` | Modify | currentRoomId default → `'coast_home'` |
| `src/pixi/TriggerSystem.ts` | Modify | LOCATION_MAP'e `nehir: 'nehir'` ekle |
| `src/pixi/rooms/__tests__/rooms.test.ts` | Modify | coast_center testleri güncelle + yeni 2 oda testleri |

---

### Task 1: coast_home room oluştur

**Files:**
- Create: `src/pixi/rooms/coastHomeRoom.ts`

- [ ] **Step 1: Dosyayı oluştur**

`src/pixi/rooms/coastHomeRoom.ts`:

```ts
import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const coastHomeRoom: RoomDef = {
  id: 'coast_home',
  widthTiles: 40,
  heightTiles: 22,
  zones: [
    { rowStart: 0,  rowEnd: 3,  bgColor: 0x071a12, type: 'coastal_water' },
    { rowStart: 4,  rowEnd: 6,  bgColor: 0x0d1f0e, type: 'coastal_sand'  },
    { rowStart: 7,  rowEnd: 21, bgColor: 0x0d1e2a, type: 'coastal'       },
  ],
  buildings: [
    { id: 'sahil_evi', col: 14, row: 9,  cols: 10, rows: 9, label: 'Sahil Evi',    style: 'coastal' },
    { id: 'fener',     col: 2,  row: 3,  cols: 4,  rows: 8, label: 'Deniz Feneri', style: 'coastal' },
    { id: 'bahce',     col: 28, row: 10, cols: 8,  rows: 7, label: 'Bahçe',        style: 'coastal' },
  ],
  triggers: [
    { name: 'studio_desk', x: 512, y: 384, w: 32, h: 32 },
    { name: 'yatak',       x: 576, y: 448, w: 32, h: 32 },
  ],
  exitTriggers: [
    {
      toRoom: 'coast_docks',
      x: 39 * TILE_SIZE,
      y:  7 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 15 * TILE_SIZE,
    },
  ],
  customCollisionRects: [
    { x: 0, y: 0, w: 40 * TILE_SIZE, h: 4 * TILE_SIZE },
  ],
  spawnPoints: {
    default:          { x: 20 * TILE_SIZE + 16, y: 18 * TILE_SIZE + 16 },
    from_coast_docks: { x: 38 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
  },
}
```

- [ ] **Step 2: TS derlemesini kontrol et**

```bash
npx tsc --noEmit 2>&1 | grep "coastHomeRoom" | head -10
```

Expected: hata yok (`coast_home` RoomId'si Task 2/Grup1'de zaten tanımlandı).

- [ ] **Step 3: Commit**

```bash
git add src/pixi/rooms/coastHomeRoom.ts
git commit -m "feat: coast_home room — sahil evi, deniz feneri, bahçe"
```

---

### Task 2: coast_docks room oluştur

**Files:**
- Create: `src/pixi/rooms/coastDocksRoom.ts`

- [ ] **Step 1: Dosyayı oluştur**

`src/pixi/rooms/coastDocksRoom.ts`:

```ts
import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const coastDocksRoom: RoomDef = {
  id: 'coast_docks',
  widthTiles: 40,
  heightTiles: 22,
  zones: [
    { rowStart: 0,  rowEnd: 3,  bgColor: 0x071a12, type: 'coastal_water' },
    { rowStart: 4,  rowEnd: 6,  bgColor: 0x0d1f0e, type: 'coastal_sand'  },
    { rowStart: 7,  rowEnd: 21, bgColor: 0x0d1e2a, type: 'coastal'       },
  ],
  buildings: [
    { id: 'iskele',      col: 12, row: 1, cols: 14, rows: 5, label: 'İskele',      style: 'coastal' },
    { id: 'balikci',     col: 3,  row: 8, cols: 9,  rows: 8, label: 'Balıkçı',    style: 'coastal' },
    { id: 'kaptan_evi',  col: 24, row: 9, cols: 8,  rows: 8, label: 'Kaptan Evi', style: 'coastal' },
  ],
  triggers: [
    { name: 'balikci_door', x: 128, y: 480, w: 32, h: 32 },
    { name: 'nehir',        x: 448, y: 160, w: 32, h: 32 },
  ],
  exitTriggers: [
    {
      toRoom: 'coast_home',
      x:  0,
      y:  7 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 15 * TILE_SIZE,
    },
    {
      toRoom: 'coast_center',
      x: 39 * TILE_SIZE,
      y:  7 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 15 * TILE_SIZE,
    },
  ],
  customCollisionRects: [
    { x: 0, y: 0, w: 40 * TILE_SIZE, h: 4 * TILE_SIZE },
  ],
  spawnPoints: {
    default:           { x: 20 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
    from_coast_home:   { x:  1 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
    from_coast_center: { x: 38 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
  },
}
```

- [ ] **Step 2: TS derlemesini kontrol et**

```bash
npx tsc --noEmit 2>&1 | grep "coastDocksRoom" | head -10
```

Expected: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/pixi/rooms/coastDocksRoom.ts
git commit -m "feat: coast_docks room — iskele, balıkçı, kaptan evi"
```

---

### Task 3: coast_center güncelle

`sahil_evi` ve `balikci` yeni odalara taşındı — artık coast_center'da olmamalı. `studio_desk`, `yatak`, `balikci_door` trigger'ları da kaldırılır. Sol tarafta coast_docks'a çıkış eklenir.

**Files:**
- Modify: `src/pixi/rooms/coastRoom.ts`

- [ ] **Step 1: coastRoom.ts'i yeni içerikle yaz**

`src/pixi/rooms/coastRoom.ts` dosyasının tüm içeriğini şununla değiştir:

```ts
import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const coastCenterRoom: RoomDef = {
  id: 'coast_center',
  widthTiles: 50,
  heightTiles: 22,
  zones: [
    { rowStart: 0,  rowEnd: 3,  bgColor: 0x071a12, type: 'coastal_water' },
    { rowStart: 4,  rowEnd: 6,  bgColor: 0x0d1f0e, type: 'coastal_sand'  },
    { rowStart: 7,  rowEnd: 21, bgColor: 0x0d1e2a, type: 'coastal'       },
  ],
  buildings: [
    { id: 'sahaf', col: 5,  row: 9,  cols: 8, rows: 8, label: 'Sahaf', style: 'coastal' },
    { id: 'pub',   col: 14, row: 14, cols: 9, rows: 7, label: 'Pub',   style: 'coastal' },
  ],
  triggers: [
    { name: 'sahaf_door', x: 256, y: 512, w: 32, h: 32 },
    { name: 'pub_door',   x: 480, y: 640, w: 32, h: 32 },
  ],
  exitTriggers: [
    {
      toRoom: 'coast_docks',
      x:  0,
      y:  7 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 15 * TILE_SIZE,
    },
    {
      toRoom: 'bridge',
      x: 20 * TILE_SIZE,
      y: 20 * TILE_SIZE,
      w: 10 * TILE_SIZE,
      h:  2 * TILE_SIZE,
    },
  ],
  customCollisionRects: [
    { x: 0, y: 0, w: 50 * TILE_SIZE, h: 4 * TILE_SIZE },
  ],
  spawnPoints: {
    default:           { x: 24 * TILE_SIZE + 16, y: 18 * TILE_SIZE + 16 },
    from_bridge:       { x: 24 * TILE_SIZE + 16, y: 19 * TILE_SIZE + 16 },
    from_coast_docks:  { x:  1 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
  },
}
```

**Değişiklik özeti:**
- Kaldırıldı: `sahil_evi` ve `balikci` binalar → coast_home ve coast_docks'a taşındı
- Kaldırıldı: `studio_desk`, `yatak`, `balikci_door` trigger'ları → coast_home ve coast_docks'a taşındı
- Zone type'ları: `'river'` → `'coastal_water'`, `'river_bank'` → `'coastal_sand'` (geçerli ZoneType değerleri)
- Eklendi: sol çıkış `coast_docks`'a, sağ çıkış `bridge`'e (mevcut)
- Eklendi: `from_coast_docks` spawn noktası

- [ ] **Step 2: TS derlemesini kontrol et**

```bash
npx tsc --noEmit 2>&1 | grep "coastRoom\|coast_center" | head -10
```

Expected: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/pixi/rooms/coastRoom.ts
git commit -m "refactor: coast_center — sahil_evi/balikci taşındı, sol çıkış coast_docks eklendi"
```

---

### Task 4: Game.ts, worldStore, TriggerSystem güncelle

**Files:**
- Modify: `src/pixi/Game.ts`
- Modify: `src/store/worldStore.ts`
- Modify: `src/pixi/TriggerSystem.ts`

- [ ] **Step 1: Game.ts güncelle**

`src/pixi/Game.ts` — yeni importlar ve ROOMS girişleri ekle:

Dosyanın başındaki importlara ekle:
```ts
import { coastHomeRoom }  from './rooms/coastHomeRoom'
import { coastDocksRoom } from './rooms/coastDocksRoom'
```

`ROOMS` map'ine iki yeni satır ekle:
```ts
const ROOMS: Partial<Record<RoomId, RoomDef>> = {
  coast_home:   coastHomeRoom,   // ← EKLE
  coast_docks:  coastDocksRoom,  // ← EKLE
  coast_center: coastCenterRoom,
  bridge:       bridgeRoom,
  city_core:    cityCoreRoom,
  city_park:    cityParkRoom,
}
```

- [ ] **Step 2: worldStore.ts güncelle**

`src/store/worldStore.ts` — başlangıç odası:

Mevcut:
```ts
currentRoomId: 'coast_center',
```

Yeni:
```ts
currentRoomId: 'coast_home',
```

- [ ] **Step 3: TriggerSystem.ts güncelle**

`src/pixi/TriggerSystem.ts` — LOCATION_MAP'e `nehir` ekle:

```ts
const LOCATION_MAP: Record<string, LocationId> = {
  cafe_door:     'cafe',
  fair_entrance: 'fair',
  akademi_door:  'akademi',
  sahaf_door:    'sahaf',
  balikci_door:  'balikci',
  pub_door:      'pub',
  yatak:         'sleep',
  arcade_door:   'arcade',
  clara_door:    'lawyers_office',
  nehir:         'nehir',   // ← EKLE
}
```

- [ ] **Step 4: TS derlemesini kontrol et**

```bash
npx tsc --noEmit 2>&1 | grep -v "npcDialogues\|savegameEngine\|scoreEngine\|TileRenderer\|saveStore\|coastRoom" | head -15
```

Expected: Game.ts, worldStore.ts, TriggerSystem.ts kaynaklı hata yok.

- [ ] **Step 5: Testlerin geçtiğini doğrula**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -5
```

Expected: `≥533 passed`

- [ ] **Step 6: Commit**

```bash
git add src/pixi/Game.ts src/store/worldStore.ts src/pixi/TriggerSystem.ts
git commit -m "feat: ROOMS coast_home/coast_docks ekle, başlangıç odası coast_home, nehir trigger"
```

---

### Task 5: Testleri güncelle

**Files:**
- Modify: `src/pixi/rooms/__tests__/rooms.test.ts`

- [ ] **Step 1: Testleri çalıştır, mevcut durumu gör**

```bash
npx vitest run src/pixi/rooms/__tests__/rooms.test.ts --reporter=verbose 2>&1 | tail -15
```

Beklenen: `coastCenterRoom` testleri sahil_evi/balikci/studio_desk/yatak varlığını kontrol eden testlerde FAIL görülecek.

- [ ] **Step 2: rooms.test.ts'i yeni içerikle yaz**

`src/pixi/rooms/__tests__/rooms.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { coastHomeRoom }   from '../coastHomeRoom'
import { coastDocksRoom }  from '../coastDocksRoom'
import { coastCenterRoom } from '../coastRoom'
import { bridgeRoom }      from '../bridgeRoom'
import { cityCoreRoom }    from '../cityRoom'
import { cityParkRoom }    from '../parkRoom'
import { TILE_SIZE }       from '../../mapData'

describe('coastHomeRoom', () => {
  it('has correct dimensions', () => {
    expect(coastHomeRoom.widthTiles).toBe(40)
    expect(coastHomeRoom.heightTiles).toBe(22)
  })
  it('id is coast_home', () => {
    expect(coastHomeRoom.id).toBe('coast_home')
  })
  it('has sahil_evi building', () => {
    expect(coastHomeRoom.buildings.find(b => b.id === 'sahil_evi')).toBeDefined()
  })
  it('has studio_desk and yatak triggers', () => {
    expect(coastHomeRoom.triggers.find(t => t.name === 'studio_desk')).toBeDefined()
    expect(coastHomeRoom.triggers.find(t => t.name === 'yatak')).toBeDefined()
  })
  it('has exit trigger to coast_docks on right edge', () => {
    const ex = coastHomeRoom.exitTriggers.find(e => e.toRoom === 'coast_docks')!
    expect(ex).toBeDefined()
    expect(ex.x).toBe(39 * TILE_SIZE)
  })
  it('has spawn point from_coast_docks', () => {
    expect(coastHomeRoom.spawnPoints.from_coast_docks).toBeDefined()
  })
  it('has water collision at top', () => {
    expect(coastHomeRoom.customCollisionRects[0].h).toBe(4 * TILE_SIZE)
  })
})

describe('coastDocksRoom', () => {
  it('has correct dimensions', () => {
    expect(coastDocksRoom.widthTiles).toBe(40)
    expect(coastDocksRoom.heightTiles).toBe(22)
  })
  it('id is coast_docks', () => {
    expect(coastDocksRoom.id).toBe('coast_docks')
  })
  it('has balikci building', () => {
    expect(coastDocksRoom.buildings.find(b => b.id === 'balikci')).toBeDefined()
  })
  it('has balikci_door and nehir triggers', () => {
    expect(coastDocksRoom.triggers.find(t => t.name === 'balikci_door')).toBeDefined()
    expect(coastDocksRoom.triggers.find(t => t.name === 'nehir')).toBeDefined()
  })
  it('has exit triggers to coast_home (left) and coast_center (right)', () => {
    const toHome   = coastDocksRoom.exitTriggers.find(e => e.toRoom === 'coast_home')!
    const toCenter = coastDocksRoom.exitTriggers.find(e => e.toRoom === 'coast_center')!
    expect(toHome).toBeDefined()
    expect(toHome.x).toBe(0)
    expect(toCenter).toBeDefined()
    expect(toCenter.x).toBe(39 * TILE_SIZE)
  })
  it('has spawn points from both directions', () => {
    expect(coastDocksRoom.spawnPoints.from_coast_home).toBeDefined()
    expect(coastDocksRoom.spawnPoints.from_coast_center).toBeDefined()
  })
})

describe('coastCenterRoom', () => {
  it('has correct dimensions', () => {
    expect(coastCenterRoom.widthTiles).toBe(50)
    expect(coastCenterRoom.heightTiles).toBe(22)
  })
  it('id is coast_center', () => {
    expect(coastCenterRoom.id).toBe('coast_center')
  })
  it('has sahaf and pub buildings (no sahil_evi or balikci)', () => {
    expect(coastCenterRoom.buildings.find(b => b.id === 'sahaf')).toBeDefined()
    expect(coastCenterRoom.buildings.find(b => b.id === 'pub')).toBeDefined()
    expect(coastCenterRoom.buildings.find(b => b.id === 'sahil_evi')).toBeUndefined()
    expect(coastCenterRoom.buildings.find(b => b.id === 'balikci')).toBeUndefined()
  })
  it('has sahaf_door and pub_door triggers (no studio_desk or yatak)', () => {
    expect(coastCenterRoom.triggers.find(t => t.name === 'sahaf_door')).toBeDefined()
    expect(coastCenterRoom.triggers.find(t => t.name === 'pub_door')).toBeDefined()
    expect(coastCenterRoom.triggers.find(t => t.name === 'studio_desk')).toBeUndefined()
    expect(coastCenterRoom.triggers.find(t => t.name === 'yatak')).toBeUndefined()
  })
  it('has exit to coast_docks on left and exit to bridge at bottom', () => {
    const toDocks  = coastCenterRoom.exitTriggers.find(e => e.toRoom === 'coast_docks')!
    const toBridge = coastCenterRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    expect(toDocks).toBeDefined()
    expect(toDocks.x).toBe(0)
    expect(toBridge).toBeDefined()
    expect(toBridge.y).toBe(20 * TILE_SIZE)
  })
  it('has spawn point from_coast_docks', () => {
    expect(coastCenterRoom.spawnPoints.from_coast_docks).toBeDefined()
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
npx vitest run src/pixi/rooms/__tests__/rooms.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: tüm testler PASS.

- [ ] **Step 4: Tüm suite'i çalıştır**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -5
```

Expected: tüm testler PASS (yeni odalar için ~14 yeni test eklendi).

- [ ] **Step 5: Commit**

```bash
git add src/pixi/rooms/__tests__/rooms.test.ts
git commit -m "test: rooms.test.ts — coast_home coast_docks testleri, coast_center güncellendi"
```
