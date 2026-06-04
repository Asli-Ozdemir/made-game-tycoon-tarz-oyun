# Harita Grup 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `coast_west`, `city_culture`, `city_edge` odalarını oluştur; `coast_center`'ın köprü bağlantısını `coast_west` üzerinden yeniden yönlendir; şehir tarafında `city_core → city_culture → city_edge → city_park` yatay zincirini kur; arcade binasını `city_core`'dan `city_culture`'a taşı.

**Architecture:** Sahil tarafında `coast_center`'ın sağ kenarına `coast_west` eklenir, `coast_west`'in alt kenarından `bridge`'e geçilir (mevcut bottom exit mantığı korunur). Şehir tarafında `city_core`'un sağ kenarına `city_culture`, oradan sağa `city_edge`, oradan sağa `city_park` eklenir — tüm şehir odaları sol/sağ kenar geçişiyle bağlanır. Arcade binası `city_core`'dan kaldırılıp `city_culture`'a taşınır.

**Tech Stack:** TypeScript, Vitest, PixiJS RoomDef, TILE_SIZE=32px

---

## Navigasyon Değişim Özeti

| Bağlantı | Öncesi | Sonrası |
|----------|--------|---------|
| coast_center → ??? | bottom exit → bridge | right exit → coast_west |
| bridge top exit | → coast_center | → coast_west |
| city_core right | (yok) | → city_culture |
| city_park left | (yok) | ← city_edge |
| city_park bottom | → city_core | KALDIRILDI |
| arcade | city_core'da | city_culture'da |

**Tam zincir (Grup 3 sonrası):**
```
coast_home ↔ coast_docks ↔ coast_center ↔ coast_west ↔ bridge ↔ city_core ↔ city_culture ↔ city_edge ↔ city_park
```

---

## Koordinat Referansı

- `TILE_SIZE = 32px`
- Sahil odaları: `widthTiles=50, heightTiles=22`  — su: rows 0–3, kıyı: rows 4–6, zemin: rows 7–21
- Şehir odaları (culture/edge): `widthTiles=40, heightTiles=24`  — city: rows 0–13, city_north: rows 14–23
- Sol kenar çıkışı: `x=0, y=7*TILE_SIZE, w=TILE_SIZE, h=15*TILE_SIZE` (sahil) veya `h=17*TILE_SIZE` (şehir)
- Sağ kenar çıkışı (sahil 50 wide): `x=49*TILE_SIZE`
- Sağ kenar çıkışı (şehir 40 wide): `x=39*TILE_SIZE`

---

## File Structure

| Dosya | İşlem | Sorumluluk |
|-------|-------|------------|
| `src/pixi/rooms/coastWestRoom.ts` | Create | coast_west oda tanımı |
| `src/pixi/rooms/cityCultureRoom.ts` | Create | city_culture oda tanımı (arcade buraya taşındı) |
| `src/pixi/rooms/cityEdgeRoom.ts` | Create | city_edge oda tanımı |
| `src/pixi/rooms/coastRoom.ts` | Modify | bridge exit → coast_west right exit; from_bridge spawn → from_coast_west |
| `src/pixi/rooms/bridgeRoom.ts` | Modify | coast_center → coast_west; from_coast_center → from_coast_west |
| `src/pixi/rooms/cityRoom.ts` | Modify | right exit → city_culture ekle; arcade + arcade_door kaldır |
| `src/pixi/rooms/parkRoom.ts` | Modify | bottom exit → left exit to city_edge; from_city_core → from_city_edge |
| `src/pixi/Game.ts` | Modify | ROOMS'a 3 yeni oda ekle |
| `src/pixi/rooms/__tests__/rooms.test.ts` | Modify | yeni 3 oda testleri + değişen oda testleri güncelle |

---

### Task 1: coast_west room oluştur

**Files:**
- Create: `src/pixi/rooms/coastWestRoom.ts`

- [ ] **Step 1: Dosyayı oluştur**

`src/pixi/rooms/coastWestRoom.ts`:

```ts
import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const coastWestRoom: RoomDef = {
  id: 'coast_west',
  widthTiles: 50,
  heightTiles: 22,
  zones: [
    { rowStart: 0,  rowEnd: 3,  bgColor: 0x071a12, type: 'coastal_water' },
    { rowStart: 4,  rowEnd: 6,  bgColor: 0x0d1f0e, type: 'coastal_sand'  },
    { rowStart: 7,  rowEnd: 21, bgColor: 0x0d1e2a, type: 'coastal'       },
  ],
  buildings: [
    { id: 'kafe_west',  col: 5,  row: 9,  cols: 9, rows: 8, label: 'Kafe',   style: 'coastal' },
    { id: 'atolye',     col: 22, row: 10, cols: 9, rows: 8, label: 'Atölye', style: 'coastal' },
    { id: 'bahce_park', col: 37, row: 12, cols: 8, rows: 7, label: 'Park',   style: 'coastal' },
  ],
  triggers: [
    { name: 'kafe_west_door', x: 192, y: 480, w: 32, h: 32 },
    { name: 'atolye_door',    x: 736, y: 512, w: 32, h: 32 },
  ],
  exitTriggers: [
    {
      toRoom: 'coast_center',
      x:  0,
      y:  7 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 15 * TILE_SIZE,
    },
    {
      toRoom: 'bridge',
      x: 20 * TILE_SIZE,
      y: 21 * TILE_SIZE,
      w: 10 * TILE_SIZE,
      h:      TILE_SIZE,
    },
  ],
  customCollisionRects: [
    { x: 0, y: 0, w: 50 * TILE_SIZE, h: 4 * TILE_SIZE },
  ],
  spawnPoints: {
    default:           { x: 24 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
    from_coast_center: { x:  1 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
    from_bridge:       { x: 24 * TILE_SIZE + 16, y: 20 * TILE_SIZE + 16 },
  },
}
```

- [ ] **Step 2: TS derlemesini kontrol et**

```bash
npx tsc --noEmit 2>&1 | grep "coastWestRoom" | head -10
```

Expected: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/pixi/rooms/coastWestRoom.ts
git commit -m "feat: coast_west room — kafe, atölye, bahçe"
```

---

### Task 2: city_culture room oluştur

**Files:**
- Create: `src/pixi/rooms/cityCultureRoom.ts`

Arcade `city_core`'dan bu odaya taşınıyor. `arcade_door` trigger zaten TriggerSystem LOCATION_MAP'te var — yeni bir şey eklemeye gerek yok.

- [ ] **Step 1: Dosyayı oluştur**

`src/pixi/rooms/cityCultureRoom.ts`:

```ts
import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const cityCultureRoom: RoomDef = {
  id: 'city_culture',
  widthTiles: 40,
  heightTiles: 24,
  zones: [
    { rowStart: 0,  rowEnd: 13, bgColor: 0x0a0016, type: 'city'       },
    { rowStart: 14, rowEnd: 23, bgColor: 0x060010, type: 'city_north' },
  ],
  buildings: [
    { id: 'arcade', col: 2,  row: 2,  cols: 10, rows: 10, label: 'Arcade', style: 'city' },
    { id: 'atolye', col: 14, row: 4,  cols: 10, rows: 10, label: 'Atölye', style: 'city' },
    { id: 'bistro', col: 26, row: 5,  cols: 10, rows: 9,  label: 'Bistro', style: 'city' },
  ],
  triggers: [
    { name: 'arcade_door', x: 64, y: 320, w: 32, h: 32 },
  ],
  exitTriggers: [
    {
      toRoom: 'city_core',
      x:  0,
      y:  7 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 17 * TILE_SIZE,
    },
    {
      toRoom: 'city_edge',
      x: 39 * TILE_SIZE,
      y:  7 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 17 * TILE_SIZE,
    },
  ],
  customCollisionRects: [],
  spawnPoints: {
    default:        { x: 20 * TILE_SIZE + 16, y: 18 * TILE_SIZE + 16 },
    from_city_core: { x:  1 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
    from_city_edge: { x: 38 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
  },
}
```

- [ ] **Step 2: TS derlemesini kontrol et**

```bash
npx tsc --noEmit 2>&1 | grep "cityCultureRoom" | head -10
```

Expected: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/pixi/rooms/cityCultureRoom.ts
git commit -m "feat: city_culture room — arcade, atölye, bistro"
```

---

### Task 3: city_edge room oluştur

**Files:**
- Create: `src/pixi/rooms/cityEdgeRoom.ts`

- [ ] **Step 1: Dosyayı oluştur**

`src/pixi/rooms/cityEdgeRoom.ts`:

```ts
import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const cityEdgeRoom: RoomDef = {
  id: 'city_edge',
  widthTiles: 40,
  heightTiles: 24,
  zones: [
    { rowStart: 0,  rowEnd: 13, bgColor: 0x0d0a16, type: 'city'       },
    { rowStart: 14, rowEnd: 23, bgColor: 0x080812, type: 'city_north' },
  ],
  buildings: [
    { id: 'klinik', col: 3,  row: 3,  cols: 12, rows: 10, label: 'Klinik', style: 'city' },
    { id: 'havuz',  col: 22, row: 4,  cols: 14, rows: 10, label: 'Havuz',  style: 'city' },
  ],
  triggers: [
    { name: 'klinik_door', x: 96,  y: 352, w: 32, h: 32 },
    { name: 'havuz_door',  x: 704, y: 384, w: 32, h: 32 },
  ],
  exitTriggers: [
    {
      toRoom: 'city_culture',
      x:  0,
      y:  7 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 17 * TILE_SIZE,
    },
    {
      toRoom: 'city_park',
      x: 39 * TILE_SIZE,
      y:  7 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 17 * TILE_SIZE,
    },
  ],
  customCollisionRects: [],
  spawnPoints: {
    default:           { x: 20 * TILE_SIZE + 16, y: 18 * TILE_SIZE + 16 },
    from_city_culture: { x:  1 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
    from_city_park:    { x: 38 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
  },
}
```

- [ ] **Step 2: TS derlemesini kontrol et**

```bash
npx tsc --noEmit 2>&1 | grep "cityEdgeRoom" | head -10
```

Expected: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/pixi/rooms/cityEdgeRoom.ts
git commit -m "feat: city_edge room — klinik, havuz"
```

---

### Task 4: coast_center + bridge navigasyonunu güncelle

`coast_center`'ın alt köprü çıkışı kaldırılıp sağ kenarda `coast_west` çıkışıyla değiştirilir. `bridge`'in üst çıkışı `coast_center`'dan `coast_west`'e çevrilir.

**Files:**
- Modify: `src/pixi/rooms/coastRoom.ts`
- Modify: `src/pixi/rooms/bridgeRoom.ts`

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
      toRoom: 'coast_west',
      x: 49 * TILE_SIZE,
      y:  7 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 15 * TILE_SIZE,
    },
  ],
  customCollisionRects: [
    { x: 0, y: 0, w: 50 * TILE_SIZE, h: 4 * TILE_SIZE },
  ],
  spawnPoints: {
    default:           { x: 24 * TILE_SIZE + 16, y: 18 * TILE_SIZE + 16 },
    from_coast_docks:  { x:  1 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
    from_coast_west:   { x: 48 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
  },
}
```

**Değişiklikler:**
- Kaldırıldı: `{ toRoom: 'bridge', x: 20*TILE_SIZE, y: 20*TILE_SIZE, ... }` (alt köprü çıkışı)
- Eklendi: `{ toRoom: 'coast_west', x: 49*TILE_SIZE, y: 7*TILE_SIZE, ... }` (sağ kenar çıkışı)
- `from_bridge` spawn → `from_coast_west`

- [ ] **Step 2: bridgeRoom.ts'i yeni içerikle yaz**

`src/pixi/rooms/bridgeRoom.ts` dosyasının tüm içeriğini şununla değiştir:

```ts
import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

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
    { toRoom: 'coast_west', x: 20 * TILE_SIZE, y: 0,             w: 10 * TILE_SIZE, h: TILE_SIZE },
    { toRoom: 'city_core',  x: 20 * TILE_SIZE, y: 5 * TILE_SIZE, w: 10 * TILE_SIZE, h: TILE_SIZE },
  ],
  customCollisionRects: [
    { x: 0,              y: 0, w: 20 * TILE_SIZE, h: 6 * TILE_SIZE },
    { x: 30 * TILE_SIZE, y: 0, w: 20 * TILE_SIZE, h: 6 * TILE_SIZE },
  ],
  spawnPoints: {
    default:          { x: 24 * TILE_SIZE + 16, y: 3 * TILE_SIZE },
    from_coast_west:  { x: 24 * TILE_SIZE + 16, y: 1 * TILE_SIZE + 16 },
    from_city_core:   { x: 24 * TILE_SIZE + 16, y: 4 * TILE_SIZE + 16 },
  },
}
```

**Değişiklikler:**
- `toRoom: 'coast_center'` → `toRoom: 'coast_west'`
- `from_coast_center` → `from_coast_west`

- [ ] **Step 3: TS derlemesini kontrol et**

```bash
npx tsc --noEmit 2>&1 | grep "coastRoom\|bridgeRoom\|coast_center\|coast_west" | head -15
```

Expected: hata yok.

- [ ] **Step 4: Commit**

```bash
git add src/pixi/rooms/coastRoom.ts src/pixi/rooms/bridgeRoom.ts
git commit -m "refactor: coast_center sağa coast_west, bridge üst çıkışı coast_west"
```

---

### Task 5: city_core + city_park navigasyonunu güncelle

`city_core`'a sağ kenarda `city_culture` çıkışı eklenir; arcade binası ve arcade_door trigger `city_core`'dan kaldırılır (artık `city_culture`'da). `city_park`'ın alt `city_core` çıkışı sol kenar `city_edge` çıkışıyla değiştirilir.

**Files:**
- Modify: `src/pixi/rooms/cityRoom.ts`
- Modify: `src/pixi/rooms/parkRoom.ts`

- [ ] **Step 1: cityRoom.ts'i yeni içerikle yaz**

`src/pixi/rooms/cityRoom.ts` dosyasının tüm içeriğini şununla değiştir:

```ts
import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const cityCoreRoom: RoomDef = {
  id: 'city_core',
  widthTiles: 50,
  heightTiles: 24,
  zones: [
    { rowStart: 0,  rowEnd: 13, bgColor: 0x0a0016, type: 'city'       },
    { rowStart: 14, rowEnd: 23, bgColor: 0x060010, type: 'city_north' },
  ],
  buildings: [
    { id: 'cicekci',    col: 8,  row: 0,  cols: 6,  rows: 5,  label: 'Çiçekçi',       style: 'city'       },
    { id: 'kuyumcu',    col: 15, row: 0,  cols: 5,  rows: 5,  label: 'Kuyumcu',       style: 'city'       },
    { id: 'law_office', col: 24, row: 0,  cols: 6,  rows: 5,  label: 'Hukuk Bürosu',  style: 'city' as const },
    { id: 'akademi',    col: 18, row: 2,  cols: 14, rows: 10, label: 'Akademi',        style: 'city'       },
    { id: 'kafe',       col: 4,  row: 4,  cols: 10, rows: 10, label: 'Kafe',           style: 'city'       },
    { id: 'fuar',       col: 36, row: 4,  cols: 11, rows: 10, label: 'Fuar',           style: 'city'       },
    { id: 'nexus',      col: 40, row: 12, cols: 10, rows: 12, label: 'NEXUS',          style: 'city_major' },
    { id: 'investor',   col: 1,  row: 14, cols: 8,  rows: 10, label: 'Yatırımcı',      style: 'city'       },
  ],
  triggers: [
    { name: 'cicekci_door',    x: 320,  y: 96,  w: 32, h: 32 },
    { name: 'kuyumcu_door',    x: 512,  y: 96,  w: 32, h: 32 },
    { name: 'clara_door',      x: 800,  y: 96,  w: 32, h: 32 },
    { name: 'akademi_door',    x: 768,  y: 320, w: 32, h: 32 },
    { name: 'cafe_door',       x: 288,  y: 384, w: 32, h: 32 },
    { name: 'fair_entrance',   x: 1280, y: 384, w: 32, h: 32 },
    { name: 'nexus_building',  x: 1408, y: 512, w: 32, h: 32 },
    { name: 'investor_office', x: 128,  y: 544, w: 32, h: 32 },
  ],
  exitTriggers: [
    {
      toRoom: 'bridge',
      x: 20 * TILE_SIZE,
      y: 0,
      w: 10 * TILE_SIZE,
      h: TILE_SIZE,
    },
    {
      toRoom: 'city_culture',
      x: 49 * TILE_SIZE,
      y:  7 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 17 * TILE_SIZE,
    },
  ],
  customCollisionRects: [],
  spawnPoints: {
    from_bridge:        { x: 24 * TILE_SIZE + 16, y: 1 * TILE_SIZE + 16 },
    from_city_culture:  { x: 48 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
  },
}
```

**Değişiklikler:**
- Kaldırıldı: `arcade` binası (→ city_culture'a taşındı)
- Kaldırıldı: `arcade_door` trigger (→ city_culture'a taşındı)
- Eklendi: `{ toRoom: 'city_culture', x: 49*TILE_SIZE, y: 7*TILE_SIZE, ... }` exit trigger
- Eklendi: `from_city_culture` spawn noktası

- [ ] **Step 2: parkRoom.ts'i yeni içerikle yaz**

`src/pixi/rooms/parkRoom.ts` dosyasının tüm içeriğini şununla değiştir:

```ts
import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const cityParkRoom: RoomDef = {
  id: 'city_park',
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
      toRoom: 'city_edge',
      x:  0,
      y:  7 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 13 * TILE_SIZE,
    },
  ],
  customCollisionRects: [
    { x: 0, y: 0, w: 40 * TILE_SIZE, h: 1 * TILE_SIZE },
  ],
  spawnPoints: {
    default:        { x: 20 * TILE_SIZE + 16, y: 16 * TILE_SIZE + 16 },
    from_city_edge: { x:  1 * TILE_SIZE + 16, y: 14 * TILE_SIZE + 16 },
  },
}
```

**Değişiklikler:**
- Kaldırıldı: `{ toRoom: 'city_core', x: 15*TILE_SIZE, y: 18*TILE_SIZE, ... }` (alt çıkış)
- Eklendi: `{ toRoom: 'city_edge', x: 0, y: 7*TILE_SIZE, ... }` (sol kenar çıkışı)
- `from_city_core` spawn → `from_city_edge`

- [ ] **Step 3: TS derlemesini kontrol et**

```bash
npx tsc --noEmit 2>&1 | grep "cityRoom\|parkRoom\|city_core\|city_park" | head -15
```

Expected: hata yok.

- [ ] **Step 4: Testlerin mevcut durumunu gör (bazıları fail etmeli)**

```bash
npx vitest run src/pixi/rooms/__tests__/rooms.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|✓|×" | head -20
```

Expected: cityCoreRoom ve cityParkRoom testlerinden bazıları FAIL (arcade ve city_core exit testleri).

- [ ] **Step 5: Commit**

```bash
git add src/pixi/rooms/cityRoom.ts src/pixi/rooms/parkRoom.ts
git commit -m "refactor: city_core arcade→culture, city_park sol çıkış city_edge"
```

---

### Task 6: Game.ts güncelle

**Files:**
- Modify: `src/pixi/Game.ts`

- [ ] **Step 1: Game.ts güncelle**

`src/pixi/Game.ts`'e yeni importları ve ROOMS girişlerini ekle.

Mevcut importlara ekle (diğer room importlarının yanına):
```ts
import { coastWestRoom }    from './rooms/coastWestRoom'
import { cityCultureRoom }  from './rooms/cityCultureRoom'
import { cityEdgeRoom }     from './rooms/cityEdgeRoom'
```

ROOMS map'ini güncelle:
```ts
const ROOMS: Partial<Record<RoomId, RoomDef>> = {
  coast_home:    coastHomeRoom,
  coast_docks:   coastDocksRoom,
  coast_center:  coastCenterRoom,
  coast_west:    coastWestRoom,    // ← EKLE
  bridge:        bridgeRoom,
  city_core:     cityCoreRoom,
  city_culture:  cityCultureRoom,  // ← EKLE
  city_edge:     cityEdgeRoom,     // ← EKLE
  city_park:     cityParkRoom,
}
```

- [ ] **Step 2: TS derlemesini kontrol et**

```bash
npx tsc --noEmit 2>&1 | grep -v "npcDialogues\|savegameEngine\|scoreEngine\|TileRenderer\|saveStore" | head -15
```

Expected: Game.ts kaynaklı hata yok.

- [ ] **Step 3: Testleri çalıştır**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -5
```

Expected: ≥547 passed (bazı rooms testleri hâlâ fail edebilir — Task 7'de düzelecek).

- [ ] **Step 4: Commit**

```bash
git add src/pixi/Game.ts
git commit -m "feat: ROOMS coast_west, city_culture, city_edge ekle"
```

---

### Task 7: Testleri güncelle

**Files:**
- Modify: `src/pixi/rooms/__tests__/rooms.test.ts`

- [ ] **Step 1: Mevcut test durumunu gör**

```bash
npx vitest run src/pixi/rooms/__tests__/rooms.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: coastCenterRoom (bridge exit), bridgeRoom (coast_center spawn), cityCoreRoom (arcade), cityParkRoom (city_core exit) testlerinde FAIL.

- [ ] **Step 2: rooms.test.ts'i yeni içerikle yaz**

`src/pixi/rooms/__tests__/rooms.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { coastHomeRoom }    from '../coastHomeRoom'
import { coastDocksRoom }   from '../coastDocksRoom'
import { coastCenterRoom }  from '../coastRoom'
import { coastWestRoom }    from '../coastWestRoom'
import { bridgeRoom }       from '../bridgeRoom'
import { cityCoreRoom }     from '../cityRoom'
import { cityCultureRoom }  from '../cityCultureRoom'
import { cityEdgeRoom }     from '../cityEdgeRoom'
import { cityParkRoom }     from '../parkRoom'
import { TILE_SIZE }        from '../../mapData'

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
    expect(toHome.x).toBe(0)
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
  it('has exit to coast_docks on left and exit to coast_west on right', () => {
    const toDocks = coastCenterRoom.exitTriggers.find(e => e.toRoom === 'coast_docks')!
    const toWest  = coastCenterRoom.exitTriggers.find(e => e.toRoom === 'coast_west')!
    expect(toDocks.x).toBe(0)
    expect(toWest.x).toBe(49 * TILE_SIZE)
  })
  it('has no direct exit to bridge', () => {
    expect(coastCenterRoom.exitTriggers.find(e => e.toRoom === 'bridge')).toBeUndefined()
  })
  it('has spawn point from_coast_west', () => {
    expect(coastCenterRoom.spawnPoints.from_coast_west).toBeDefined()
  })
})

describe('coastWestRoom', () => {
  it('has correct dimensions', () => {
    expect(coastWestRoom.widthTiles).toBe(50)
    expect(coastWestRoom.heightTiles).toBe(22)
  })
  it('id is coast_west', () => {
    expect(coastWestRoom.id).toBe('coast_west')
  })
  it('has kafe_west and atolye buildings', () => {
    expect(coastWestRoom.buildings.find(b => b.id === 'kafe_west')).toBeDefined()
    expect(coastWestRoom.buildings.find(b => b.id === 'atolye')).toBeDefined()
  })
  it('has exit to coast_center (left) and bridge (bottom)', () => {
    const toCenter = coastWestRoom.exitTriggers.find(e => e.toRoom === 'coast_center')!
    const toBridge = coastWestRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    expect(toCenter.x).toBe(0)
    expect(toBridge.y).toBe(21 * TILE_SIZE)
  })
  it('has spawn points from both directions', () => {
    expect(coastWestRoom.spawnPoints.from_coast_center).toBeDefined()
    expect(coastWestRoom.spawnPoints.from_bridge).toBeDefined()
  })
  it('has water collision at top', () => {
    expect(coastWestRoom.customCollisionRects[0].h).toBe(4 * TILE_SIZE)
  })
})

describe('bridgeRoom', () => {
  it('has 6 tile height', () => {
    expect(bridgeRoom.heightTiles).toBe(6)
  })
  it('has exit triggers to coast_west and city_core', () => {
    const toWest = bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast_west')
    const toCity = bridgeRoom.exitTriggers.find(e => e.toRoom === 'city_core')
    expect(toWest).toBeDefined()
    expect(toCity).toBeDefined()
  })
  it('coast_west trigger is at y=0, city_core trigger is at y=5*TILE_SIZE', () => {
    const toWest = bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast_west')!
    const toCity = bridgeRoom.exitTriggers.find(e => e.toRoom === 'city_core')!
    expect(toWest.y).toBe(0)
    expect(toCity.y).toBe(5 * TILE_SIZE)
  })
  it('has no exit to coast_center', () => {
    expect(bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast_center')).toBeUndefined()
  })
  it('has spawn points from_coast_west and from_city_core', () => {
    expect(bridgeRoom.spawnPoints.from_coast_west).toBeDefined()
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
  it('has exit to bridge (top) and city_culture (right)', () => {
    const toBridge  = cityCoreRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    const toCulture = cityCoreRoom.exitTriggers.find(e => e.toRoom === 'city_culture')!
    expect(toBridge.y).toBe(0)
    expect(toCulture.x).toBe(49 * TILE_SIZE)
  })
  it('has no arcade building (moved to city_culture)', () => {
    expect(cityCoreRoom.buildings.find(b => b.id === 'arcade')).toBeUndefined()
  })
  it('has no arcade_door trigger (moved to city_culture)', () => {
    expect(cityCoreRoom.triggers.find(t => t.name === 'arcade_door')).toBeUndefined()
  })
  it('has spawn point from_city_culture', () => {
    expect(cityCoreRoom.spawnPoints.from_city_culture).toBeDefined()
  })
})

describe('cityCultureRoom', () => {
  it('has correct dimensions', () => {
    expect(cityCultureRoom.widthTiles).toBe(40)
    expect(cityCultureRoom.heightTiles).toBe(24)
  })
  it('id is city_culture', () => {
    expect(cityCultureRoom.id).toBe('city_culture')
  })
  it('has arcade building', () => {
    expect(cityCultureRoom.buildings.find(b => b.id === 'arcade')).toBeDefined()
  })
  it('has arcade_door trigger', () => {
    expect(cityCultureRoom.triggers.find(t => t.name === 'arcade_door')).toBeDefined()
  })
  it('has exit to city_core (left) and city_edge (right)', () => {
    const toCore = cityCultureRoom.exitTriggers.find(e => e.toRoom === 'city_core')!
    const toEdge = cityCultureRoom.exitTriggers.find(e => e.toRoom === 'city_edge')!
    expect(toCore.x).toBe(0)
    expect(toEdge.x).toBe(39 * TILE_SIZE)
  })
  it('has spawn points from both directions', () => {
    expect(cityCultureRoom.spawnPoints.from_city_core).toBeDefined()
    expect(cityCultureRoom.spawnPoints.from_city_edge).toBeDefined()
  })
})

describe('cityEdgeRoom', () => {
  it('has correct dimensions', () => {
    expect(cityEdgeRoom.widthTiles).toBe(40)
    expect(cityEdgeRoom.heightTiles).toBe(24)
  })
  it('id is city_edge', () => {
    expect(cityEdgeRoom.id).toBe('city_edge')
  })
  it('has klinik and havuz buildings', () => {
    expect(cityEdgeRoom.buildings.find(b => b.id === 'klinik')).toBeDefined()
    expect(cityEdgeRoom.buildings.find(b => b.id === 'havuz')).toBeDefined()
  })
  it('has exit to city_culture (left) and city_park (right)', () => {
    const toCulture = cityEdgeRoom.exitTriggers.find(e => e.toRoom === 'city_culture')!
    const toPark    = cityEdgeRoom.exitTriggers.find(e => e.toRoom === 'city_park')!
    expect(toCulture.x).toBe(0)
    expect(toPark.x).toBe(39 * TILE_SIZE)
  })
  it('has spawn points from both directions', () => {
    expect(cityEdgeRoom.spawnPoints.from_city_culture).toBeDefined()
    expect(cityEdgeRoom.spawnPoints.from_city_park).toBeDefined()
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
  it('has exit trigger to city_edge on left', () => {
    const ex = cityParkRoom.exitTriggers.find(e => e.toRoom === 'city_edge')!
    expect(ex).toBeDefined()
    expect(ex.x).toBe(0)
  })
  it('has no exit to city_core', () => {
    expect(cityParkRoom.exitTriggers.find(e => e.toRoom === 'city_core')).toBeUndefined()
  })
  it('has spawn point from_city_edge', () => {
    expect(cityParkRoom.spawnPoints.from_city_edge).toBeDefined()
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

Expected: tüm testler PASS (≥561 passed — 14 yeni test eklendi).

- [ ] **Step 5: Commit**

```bash
git add src/pixi/rooms/__tests__/rooms.test.ts
git commit -m "test: rooms.test.ts — coast_west city_culture city_edge testleri, köprü/şehir güncellemeleri"
```
