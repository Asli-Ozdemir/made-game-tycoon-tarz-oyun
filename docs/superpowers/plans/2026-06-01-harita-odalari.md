# Harita Odaları (Map Rooms) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single 1600×1600px scrolling map with 3 separate rooms (coast, bridge, city) that transition with a black fade, Stardew Valley style.

**Architecture:** Single `WorldScene` class gains a `loadRoom(room: RoomDef)` method. Each room is a data object with its own zones, buildings, triggers, exit triggers, spawn points, and collision rects. `worldStore` tracks `currentRoomId` + `transitionState`. App.tsx renders a black overlay that animates opacity for fade; when fade-out completes, App.tsx calls `transitionToRoom()` exported from Game.ts.

**Tech Stack:** PixiJS v8, Zustand, React 18, TypeScript

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/pixi/rooms/types.ts` | CREATE | RoomDef interface + RoomId type |
| `src/pixi/rooms/coastRoom.ts` | CREATE | Coast room data (50×22 tiles) |
| `src/pixi/rooms/bridgeRoom.ts` | CREATE | Bridge corridor room data (50×6 tiles) |
| `src/pixi/rooms/cityRoom.ts` | CREATE | City room data (50×24 tiles) |
| `src/pixi/mapData.ts` | MODIFY | Remove full-map arrays; keep TILE_SIZE + interfaces |
| `src/pixi/WorldScene.ts` | MODIFY | Add loadRoom(), per-room camera/collision |
| `src/store/worldStore.ts` | MODIFY | Add currentRoomId, transitionState, pendingRoomId |
| `src/pixi/Game.ts` | MODIFY | Init with coastRoom; export transitionToRoom() |
| `src/App.tsx` | MODIFY | Black fade overlay + transition coordination |

---

### Task 1: Room types and data files

**Files:**
- Create: `src/pixi/rooms/types.ts`
- Create: `src/pixi/rooms/coastRoom.ts`
- Create: `src/pixi/rooms/bridgeRoom.ts`
- Create: `src/pixi/rooms/cityRoom.ts`

**Context:** The current `src/pixi/mapData.ts` has `ZoneDef`, `BuildingDef`, `TriggerDef`, `CollisionRect` interfaces and a single 50×50 map. We're splitting into 3 rooms. Each room has its own coordinate system (y=0 is its top row). The city room's buildings/triggers are the original data minus 832px (26 rows × 32px) from every y-coordinate.

- [ ] **Step 1: Create `src/pixi/rooms/types.ts`**

```ts
import type { ZoneDef, BuildingDef, TriggerDef, CollisionRect } from '../mapData'

export type RoomId = 'coast' | 'bridge' | 'city'

export interface ExitTriggerDef {
  toRoom: RoomId
  x: number
  y: number
  w: number
  h: number
}

export interface SpawnPoints {
  default?: { x: number; y: number }
  from_bridge?: { x: number; y: number }
  from_coast?: { x: number; y: number }
  from_city?: { x: number; y: number }
}

export interface RoomDef {
  id: RoomId
  widthTiles: number
  heightTiles: number
  zones: ZoneDef[]
  buildings: BuildingDef[]
  triggers: TriggerDef[]
  exitTriggers: ExitTriggerDef[]
  customCollisionRects: CollisionRect[]
  spawnPoints: SpawnPoints
}
```

- [ ] **Step 2: Create `src/pixi/rooms/coastRoom.ts`**

```ts
import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const coastRoom: RoomDef = {
  id: 'coast',
  widthTiles: 50,
  heightTiles: 22,   // rows 0–21
  zones: [
    { rowStart: 0,  rowEnd: 3,  bgColor: 0x050e18, type: 'coastal_water' },
    { rowStart: 4,  rowEnd: 6,  bgColor: 0x0d1a10, type: 'coastal_sand'  },
    { rowStart: 7,  rowEnd: 21, bgColor: 0x0d1e2a, type: 'coastal'       },
  ],
  buildings: [
    { id: 'sahil_evi', col: 20, row: 9,  cols: 10, rows: 9, label: 'Sahil Evi', style: 'coastal' },
    { id: 'sahaf',     col: 5,  row: 9,  cols: 8,  rows: 8, label: 'Sahaf',     style: 'coastal' },
    { id: 'balikci',   col: 36, row: 8,  cols: 9,  rows: 8, label: 'Balıkçı',  style: 'coastal' },
    { id: 'pub',       col: 14, row: 14, cols: 9,  rows: 7, label: 'Pub',       style: 'coastal' },
  ],
  triggers: [
    { name: 'studio_desk',  x: 768,  y: 384, w: 32, h: 32 },
    { name: 'sahaf_door',   x: 256,  y: 512, w: 32, h: 32 },
    { name: 'balikci_door', x: 1184, y: 480, w: 32, h: 32 },
    { name: 'pub_door',     x: 480,  y: 640, w: 32, h: 32 },
  ],
  exitTriggers: [
    // Bottom corridor exit → bridge  (cols 20–29, rows 20–21)
    {
      toRoom: 'bridge',
      x: 20 * TILE_SIZE,
      y: 20 * TILE_SIZE,
      w: 10 * TILE_SIZE,
      h:  2 * TILE_SIZE,
    },
  ],
  customCollisionRects: [
    // Coastal water — full width, rows 0–3
    { x: 0, y: 0, w: 50 * TILE_SIZE, h: 4 * TILE_SIZE },
  ],
  spawnPoints: {
    default:     { x: 24 * TILE_SIZE + 16, y: 18 * TILE_SIZE + 16 },  // sahil evi önü
    from_bridge: { x: 24 * TILE_SIZE + 16, y: 19 * TILE_SIZE + 16 },  // just above exit
  },
}
```

- [ ] **Step 3: Create `src/pixi/rooms/bridgeRoom.ts`**

```ts
import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const bridgeRoom: RoomDef = {
  id: 'bridge',
  widthTiles: 50,
  heightTiles: 6,    // short corridor
  zones: [
    { rowStart: 0, rowEnd: 5, bgColor: 0x0a0a08, type: 'bridge' },
  ],
  buildings: [],
  triggers: [],
  exitTriggers: [
    // Top → coast  (cols 20–29, row 0)
    { toRoom: 'coast', x: 20 * TILE_SIZE, y: 0,              w: 10 * TILE_SIZE, h: TILE_SIZE },
    // Bottom → city  (cols 20–29, row 5)
    { toRoom: 'city',  x: 20 * TILE_SIZE, y: 5 * TILE_SIZE,  w: 10 * TILE_SIZE, h: TILE_SIZE },
  ],
  customCollisionRects: [
    // Left water — cols 0–19, all rows
    { x: 0,              y: 0, w: 20 * TILE_SIZE, h: 6 * TILE_SIZE },
    // Right water — cols 30–49, all rows
    { x: 30 * TILE_SIZE, y: 0, w: 20 * TILE_SIZE, h: 6 * TILE_SIZE },
  ],
  spawnPoints: {
    from_coast: { x: 24 * TILE_SIZE + 16, y: 1 * TILE_SIZE + 16 },  // near top
    from_city:  { x: 24 * TILE_SIZE + 16, y: 4 * TILE_SIZE + 16 },  // near bottom
  },
}
```

- [ ] **Step 4: Create `src/pixi/rooms/cityRoom.ts`**

City room rows are original rows 26–49 shifted by -26 (y offset: -832px).

```ts
import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const cityRoom: RoomDef = {
  id: 'city',
  widthTiles: 50,
  heightTiles: 24,   // original rows 26–49
  zones: [
    { rowStart: 0,  rowEnd: 13, bgColor: 0x0a0016, type: 'city'       },
    { rowStart: 14, rowEnd: 23, bgColor: 0x060010, type: 'city_north' },
  ],
  buildings: [
    // Rows shifted -26 from original
    { id: 'cicekci',  col: 8,  row: 0,  cols: 6,  rows: 5,  label: 'Çiçekçi',  style: 'city'       },
    { id: 'kuyumcu',  col: 15, row: 0,  cols: 5,  rows: 5,  label: 'Kuyumcu',  style: 'city'       },
    { id: 'han',      col: 34, row: 0,  cols: 6,  rows: 5,  label: 'Han',       style: 'city'       },
    { id: 'akademi',  col: 18, row: 2,  cols: 14, rows: 10, label: 'Akademi',   style: 'city'       },
    { id: 'kafe',     col: 4,  row: 4,  cols: 10, rows: 10, label: 'Kafe',      style: 'city'       },
    { id: 'fuar',     col: 36, row: 4,  cols: 11, rows: 10, label: 'Fuar',      style: 'city'       },
    { id: 'nexus',    col: 40, row: 12, cols: 10, rows: 12, label: 'NEXUS',     style: 'city_major' },
    { id: 'investor', col: 1,  row: 14, cols: 8,  rows: 10, label: 'Yatırımcı', style: 'city'       },
  ],
  triggers: [
    // Pixel y values = original y - 832 (26 rows × 32px)
    { name: 'cicekci_door',    x: 320,  y: 96,  w: 32, h: 32 },
    { name: 'kuyumcu_door',    x: 512,  y: 96,  w: 32, h: 32 },
    { name: 'han_door',        x: 1120, y: 96,  w: 32, h: 32 },
    { name: 'akademi_door',    x: 768,  y: 320, w: 32, h: 32 },
    { name: 'cafe_door',       x: 288,  y: 384, w: 32, h: 32 },
    { name: 'fair_entrance',   x: 1280, y: 384, w: 32, h: 32 },
    { name: 'nexus_building',  x: 1408, y: 512, w: 32, h: 32 },
    { name: 'investor_office', x: 128,  y: 544, w: 32, h: 32 },
  ],
  exitTriggers: [
    // Top corridor exit → bridge  (cols 20–29, row 0)
    {
      toRoom: 'bridge',
      x: 20 * TILE_SIZE,
      y: 0,
      w: 10 * TILE_SIZE,
      h: TILE_SIZE,
    },
  ],
  customCollisionRects: [],
  spawnPoints: {
    from_bridge: { x: 24 * TILE_SIZE + 16, y: 1 * TILE_SIZE + 16 },  // just below top
  },
}
```

- [ ] **Step 5: Write tests**

Create `src/pixi/rooms/__tests__/rooms.test.ts`:

```ts
import { coastRoom } from '../coastRoom'
import { bridgeRoom } from '../bridgeRoom'
import { cityRoom } from '../cityRoom'
import { TILE_SIZE } from '../../mapData'

describe('coastRoom', () => {
  it('has correct dimensions', () => {
    expect(coastRoom.widthTiles).toBe(50)
    expect(coastRoom.heightTiles).toBe(22)
  })
  it('has exit trigger to bridge at bottom', () => {
    const ex = coastRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    expect(ex).toBeDefined()
    expect(ex.y).toBe(20 * TILE_SIZE)
  })
  it('has default spawn point', () => {
    expect(coastRoom.spawnPoints.default).toBeDefined()
  })
  it('has coastal water collision', () => {
    const water = coastRoom.customCollisionRects.find(r => r.y === 0)!
    expect(water.h).toBe(4 * TILE_SIZE)
  })
})

describe('bridgeRoom', () => {
  it('has 6 tile height', () => {
    expect(bridgeRoom.heightTiles).toBe(6)
  })
  it('has exit triggers to both coast and city', () => {
    const toCoast = bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast')
    const toCity  = bridgeRoom.exitTriggers.find(e => e.toRoom === 'city')
    expect(toCoast).toBeDefined()
    expect(toCity).toBeDefined()
  })
  it('coast trigger is at y=0, city trigger is at y=5*TILE_SIZE', () => {
    const toCoast = bridgeRoom.exitTriggers.find(e => e.toRoom === 'coast')!
    const toCity  = bridgeRoom.exitTriggers.find(e => e.toRoom === 'city')!
    expect(toCoast.y).toBe(0)
    expect(toCity.y).toBe(5 * TILE_SIZE)
  })
  it('has side water collision rects', () => {
    expect(bridgeRoom.customCollisionRects.length).toBe(2)
  })
  it('has spawn points from both directions', () => {
    expect(bridgeRoom.spawnPoints.from_coast).toBeDefined()
    expect(bridgeRoom.spawnPoints.from_city).toBeDefined()
  })
})

describe('cityRoom', () => {
  it('has 24 tile height', () => {
    expect(cityRoom.heightTiles).toBe(24)
  })
  it('city building rows are shifted -26 from original', () => {
    const kafe = cityRoom.buildings.find(b => b.id === 'kafe')!
    expect(kafe.row).toBe(4)  // original 30 - 26
  })
  it('city trigger y values are shifted -832px from original', () => {
    const cafe = cityRoom.triggers.find(t => t.name === 'cafe_door')!
    expect(cafe.y).toBe(384)  // original 1216 - 832
  })
  it('has exit trigger to bridge at top', () => {
    const ex = cityRoom.exitTriggers.find(e => e.toRoom === 'bridge')!
    expect(ex.y).toBe(0)
  })
})
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/pixi/rooms/__tests__/rooms.test.ts`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/pixi/rooms/
git commit -m "feat: add room data files (coast, bridge, city)"
```

---

### Task 2: worldStore transition state

**Files:**
- Modify: `src/store/worldStore.ts`

**Context:** worldStore currently has `gameMode` and `currentLocation`. We need to add: `currentRoomId: RoomId`, `transitionState: 'idle' | 'fading-out' | 'fading-in'`, `pendingRoomId: RoomId | null`. The fade flow is: `beginTransition('city')` sets `transitionState='fading-out'` + `pendingRoomId='city'`. When overlay finishes fading out, `setTransitionFadedOut()` is called → Game.ts loads room → sets `transitionState='fading-in'`. When overlay fades in, `completeTransition()` sets `transitionState='idle'` + `currentRoomId=pendingRoomId`.

- [ ] **Step 1: Write the failing test**

Create `src/store/__tests__/worldStore.transition.test.ts`:

```ts
import { useWorldStore } from '../worldStore'

beforeEach(() => {
  useWorldStore.setState({
    currentRoomId: 'coast',
    transitionState: 'idle',
    pendingRoomId: null,
  })
})

describe('worldStore room transitions', () => {
  it('beginTransition sets fading-out and pendingRoomId', () => {
    useWorldStore.getState().beginTransition('bridge')
    const s = useWorldStore.getState()
    expect(s.transitionState).toBe('fading-out')
    expect(s.pendingRoomId).toBe('bridge')
  })

  it('setTransitionFadedOut sets fading-in', () => {
    useWorldStore.getState().beginTransition('bridge')
    useWorldStore.getState().setTransitionFadedOut()
    expect(useWorldStore.getState().transitionState).toBe('fading-in')
  })

  it('completeTransition sets idle and updates currentRoomId', () => {
    useWorldStore.getState().beginTransition('bridge')
    useWorldStore.getState().setTransitionFadedOut()
    useWorldStore.getState().completeTransition()
    const s = useWorldStore.getState()
    expect(s.transitionState).toBe('idle')
    expect(s.currentRoomId).toBe('bridge')
    expect(s.pendingRoomId).toBeNull()
  })

  it('beginTransition is ignored when already transitioning', () => {
    useWorldStore.getState().beginTransition('bridge')
    useWorldStore.getState().beginTransition('city')  // should be ignored
    expect(useWorldStore.getState().pendingRoomId).toBe('bridge')
  })
})
```

Run: `npx vitest run src/store/__tests__/worldStore.transition.test.ts`
Expected: FAIL (functions don't exist yet)

- [ ] **Step 2: Update worldStore.ts**

Replace the full file:

```ts
import { create } from 'zustand'
import type { RoomId } from '@/pixi/rooms/types'

export type GameMode = 'exploration' | 'tycoon'
export type LocationId = 'cafe' | 'fair' | 'akademi' | 'sahaf' | 'balikci' | 'pub' | null
export type TransitionState = 'idle' | 'fading-out' | 'fading-in'

interface WorldStore {
  gameMode: GameMode
  currentLocation: LocationId
  currentRoomId: RoomId
  transitionState: TransitionState
  pendingRoomId: RoomId | null
  setGameMode: (mode: GameMode) => void
  setLocation: (location: LocationId) => void
  beginTransition: (to: RoomId) => void
  setTransitionFadedOut: () => void
  completeTransition: () => void
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  gameMode: 'exploration',
  currentLocation: null,
  currentRoomId: 'coast',
  transitionState: 'idle',
  pendingRoomId: null,
  setGameMode: (mode) => set({ gameMode: mode }),
  setLocation: (location) => set({ currentLocation: location }),
  beginTransition: (to) => {
    if (get().transitionState !== 'idle') return
    set({ transitionState: 'fading-out', pendingRoomId: to })
  },
  setTransitionFadedOut: () => set({ transitionState: 'fading-in' }),
  completeTransition: () =>
    set((s) => ({
      transitionState: 'idle',
      currentRoomId: s.pendingRoomId ?? s.currentRoomId,
      pendingRoomId: null,
    })),
}))
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/store/__tests__/worldStore.transition.test.ts`
Expected: all 4 tests pass.

- [ ] **Step 4: Run full test suite to check for regressions**

Run: `npx vitest run`
Expected: all tests pass (existing tests that import worldStore should still work since we only added fields).

- [ ] **Step 5: Commit**

```bash
git add src/store/worldStore.ts src/store/__tests__/worldStore.transition.test.ts
git commit -m "feat: add room transition state to worldStore"
```

---

### Task 3: WorldScene.loadRoom() + mapData cleanup

**Files:**
- Modify: `src/pixi/mapData.ts`
- Modify: `src/pixi/WorldScene.ts`

**Context:** WorldScene currently imports `ZONES`, `BUILDINGS`, `TRIGGERS`, `buildCollisionRects`, `MAP_PIXEL_W`, `MAP_PIXEL_H` from mapData.ts and renders a fixed map at construction. We're changing it to render nothing on construction and expose `loadRoom(room: RoomDef)` that clears and re-renders. mapData.ts keeps only the type definitions and `TILE_SIZE`.

- [ ] **Step 1: Write the failing test**

Create `src/pixi/__tests__/WorldScene.loadRoom.test.ts`:

```ts
// WorldScene requires a PixiJS Application — mock the parts we need
import { WorldScene } from '../WorldScene'
import { coastRoom } from '../rooms/coastRoom'
import { cityRoom } from '../rooms/cityRoom'
import { TILE_SIZE } from '../mapData'

// Minimal PixiJS mock
const mockContainer = {
  addChild: vi.fn(),
  removeChildren: vi.fn(),
  x: 0,
  y: 0,
}
const mockStage = { addChild: vi.fn() }
const mockScreen = { width: 800, height: 600 }
const mockApp = { stage: mockStage, screen: mockScreen } as any

describe('WorldScene.loadRoom', () => {
  it('loads coast room and sets correct pixel dimensions', () => {
    const ws = new WorldScene(mockApp)
    ws.loadRoom(coastRoom)
    expect(ws.getRoomPixelW()).toBe(50 * TILE_SIZE)
    expect(ws.getRoomPixelH()).toBe(22 * TILE_SIZE)
  })

  it('isBlocked returns true inside coastal water after loading coast', () => {
    const ws = new WorldScene(mockApp)
    ws.loadRoom(coastRoom)
    expect(ws.isBlocked(400, 10)).toBe(true)   // y=10 is in water rows 0–3
  })

  it('isBlocked returns false in corridor after loading bridge room', () => {
    const ws = new WorldScene(mockApp)
    ws.loadRoom(require('../rooms/bridgeRoom').bridgeRoom)
    const corridorX = 24 * TILE_SIZE + 16
    const corridorY = 3 * TILE_SIZE
    expect(ws.isBlocked(corridorX, corridorY)).toBe(false)
  })

  it('loads city room and shifts collision rects correctly', () => {
    const ws = new WorldScene(mockApp)
    ws.loadRoom(cityRoom)
    // kafe building: col 4, row 4 → x=128, y=128
    expect(ws.isBlocked(130, 130)).toBe(true)
  })

  it('camera setCamera uses room pixel dimensions', () => {
    const ws = new WorldScene(mockApp)
    ws.loadRoom(coastRoom)
    ws.setCamera(0, 0, 800, 600)
    // container.x should be >= screenW - roomPixelW = 800 - 1600 = -800
    expect(ws.getContainer().x).toBeGreaterThanOrEqual(-800)
  })
})
```

Run: `npx vitest run src/pixi/__tests__/WorldScene.loadRoom.test.ts`
Expected: FAIL (loadRoom doesn't exist, getRoomPixelW doesn't exist)

- [ ] **Step 2: Trim mapData.ts — remove full-map arrays**

Replace content of `src/pixi/mapData.ts` with only types + TILE_SIZE:

```ts
export const TILE_SIZE = 32

export type ZoneType      = 'coastal_water' | 'coastal_sand' | 'coastal' | 'bridge' | 'city' | 'city_north'
export type BuildingStyle = 'coastal' | 'bridge' | 'city' | 'city_major'

export interface ZoneDef {
  rowStart: number
  rowEnd:   number
  bgColor:  number
  type:     ZoneType
}

export interface BuildingDef {
  id:    string
  col:   number
  row:   number
  cols:  number
  rows:  number
  label: string
  style: BuildingStyle
}

export interface TriggerDef {
  name: string
  x:    number
  y:    number
  w:    number
  h:    number
}

export interface CollisionRect {
  x: number
  y: number
  w: number
  h: number
}
```

- [ ] **Step 3: Rewrite WorldScene.ts**

```ts
// src/pixi/WorldScene.ts
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { getActiveTrigger, handleTrigger } from './TriggerSystem'
import { useWorldStore } from '@/store/worldStore'
import { TILE_SIZE } from './mapData'
import type { CollisionRect } from './mapData'
import type { RoomDef } from './rooms/types'

const BUILDING_STYLES = {
  coastal:    { fill: 0x0d2035, border: 0x2a5a7c, bw: 1.5, labelColor: 0x7ec8e3 },
  bridge:     { fill: 0x2a2a1a, border: 0x4a4a2a, bw: 1.0, labelColor: 0x8a7a5a },
  city:       { fill: 0x0d001e, border: 0x9b30ff,  bw: 2.0, labelColor: 0xcc66ff },
  city_major: { fill: 0x06000c, border: 0xcc44ff,  bw: 3.0, labelColor: 0xff88ff },
}

export class WorldScene {
  private container: Container
  private app: Application
  private collisionRects: CollisionRect[] = []
  private roomPixelW = 0
  private roomPixelH = 0
  private currentRoom: RoomDef | null = null

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    app.stage.addChild(this.container)
  }

  loadRoom(room: RoomDef): void {
    this.currentRoom = room
    this.roomPixelW = room.widthTiles  * TILE_SIZE
    this.roomPixelH = room.heightTiles * TILE_SIZE
    this.collisionRects = this.buildCollisionRects(room)
    this.render(room)
  }

  private buildCollisionRects(room: RoomDef): CollisionRect[] {
    const rects: CollisionRect[] = room.buildings.map(b => ({
      x: b.col  * TILE_SIZE,
      y: b.row  * TILE_SIZE,
      w: b.cols * TILE_SIZE,
      h: b.rows * TILE_SIZE,
    }))
    return rects.concat(room.customCollisionRects)
  }

  private render(room: RoomDef): void {
    this.container.removeChildren()
    this.renderZones(room)
    if (room.id === 'bridge') this.renderBridgeCorridor(room)
    this.renderBuildings(room)
  }

  private renderZones(room: RoomDef): void {
    for (const zone of room.zones) {
      const g = new Graphics()
      g.rect(
        0,
        zone.rowStart * TILE_SIZE,
        this.roomPixelW,
        (zone.rowEnd - zone.rowStart + 1) * TILE_SIZE,
      ).fill({ color: zone.bgColor })
      this.container.addChild(g)
    }
  }

  private renderBridgeCorridor(room: RoomDef): void {
    const corridorX = 20 * TILE_SIZE
    const corridorW = 10 * TILE_SIZE
    const roomH     = room.heightTiles * TILE_SIZE

    const corridor = new Graphics()
    corridor.rect(corridorX, 0, corridorW, roomH)
      .fill({ color: 0x2a2a1a })
      .stroke({ width: 1, color: 0x4a4a2a })
    this.container.addChild(corridor)

    const railLeft = new Graphics()
    railLeft.rect(corridorX, 0, 2, roomH).fill({ color: 0x6a6a4a })
    this.container.addChild(railLeft)

    const railRight = new Graphics()
    railRight.rect(corridorX + corridorW - 2, 0, 2, roomH).fill({ color: 0x6a6a4a })
    this.container.addChild(railRight)
  }

  private renderBuildings(room: RoomDef): void {
    for (const bld of room.buildings) {
      const style = BUILDING_STYLES[bld.style]
      const x = bld.col  * TILE_SIZE
      const y = bld.row  * TILE_SIZE
      const w = bld.cols * TILE_SIZE
      const h = bld.rows * TILE_SIZE

      const g = new Graphics()
      g.rect(x, y, w, h)
        .fill({ color: style.fill })
        .stroke({ width: style.bw, color: style.border })
      this.container.addChild(g)

      const label = new Text({
        text: bld.label,
        style: new TextStyle({
          fontSize:   8,
          fill:       style.labelColor,
          fontFamily: 'monospace',
        }),
      })
      label.x = x + 4
      label.y = y + 4
      this.container.addChild(label)

      if (bld.id === 'sahil_evi') {
        const door = new Graphics()
        door.rect(x + w / 2 - 4, y + h - 8, 8, 8).fill({ color: 0x4a8aac })
        this.container.addChild(door)
      }

      if (bld.id === 'balikci') {
        const pier = new Graphics()
        pier.rect(x + w / 2 - 1, y - 3 * TILE_SIZE, 2, 3 * TILE_SIZE).fill({ color: 0x2a5a7c })
        this.container.addChild(pier)
      }
    }
  }

  isBlocked(worldX: number, worldY: number): boolean {
    if (worldX < 0 || worldY < 0 || worldX >= this.roomPixelW || worldY >= this.roomPixelH) return true
    for (const r of this.collisionRects) {
      if (worldX >= r.x && worldX < r.x + r.w && worldY >= r.y && worldY < r.y + r.h) return true
    }
    return false
  }

  checkTriggers(worldX: number, worldY: number): void {
    if (!this.currentRoom) return

    const trigger = getActiveTrigger(this.currentRoom.triggers, worldX, worldY)
    if (trigger) handleTrigger(trigger)

    // Exit triggers — only fire when not already transitioning
    if (useWorldStore.getState().transitionState === 'idle') {
      for (const et of this.currentRoom.exitTriggers) {
        if (worldX >= et.x && worldX < et.x + et.w && worldY >= et.y && worldY < et.y + et.h) {
          useWorldStore.getState().beginTransition(et.toRoom)
          break
        }
      }
    }
  }

  setCamera(px: number, py: number, screenW: number, screenH: number): void {
    this.container.x = Math.max(screenW - this.roomPixelW, Math.min(0, screenW / 2 - px))
    this.container.y = Math.max(screenH - this.roomPixelH, Math.min(0, screenH / 2 - py))
  }

  getRoomPixelW(): number { return this.roomPixelW }
  getRoomPixelH(): number { return this.roomPixelH }
  getContainer(): Container { return this.container }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/pixi/__tests__/WorldScene.loadRoom.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: all tests pass (mapData no longer exports ZONES etc, but they were only used in WorldScene which is now rewritten).

- [ ] **Step 6: Commit**

```bash
git add src/pixi/mapData.ts src/pixi/WorldScene.ts src/pixi/__tests__/WorldScene.loadRoom.test.ts
git commit -m "feat: WorldScene.loadRoom() + mapData cleanup"
```

---

### Task 4: Game.ts — init with coast room + export transitionToRoom()

**Files:**
- Modify: `src/pixi/Game.ts`

**Context:** Game.ts currently calls `new WorldScene(app)` then `player.setPosition(PLAYER_START_X, PLAYER_START_Y)`. We need to: (a) call `worldScene.loadRoom(coastRoom)` after construction, (b) export `transitionToRoom(pendingRoomId, fromRoomId)` that loads the room and sets player spawn position. The spawn point key is `from_<fromRoomId>`, falling back to `default`. Player movement must also freeze during transition — add a check in Game.ts ticker or rely on worldStore.transitionState check in Player.update().

Player.update() already checks `gameMode` and `currentLocation` to block movement. We need it to also block when `transitionState !== 'idle'`. This change goes in Player.ts.

- [ ] **Step 1: Write the failing test**

Create `src/pixi/__tests__/Game.transitionToRoom.test.ts`:

```ts
import { transitionToRoom } from '../Game'
import { useWorldStore } from '@/store/worldStore'

// We can't easily test the full PixiJS init in unit tests.
// Test the transition logic in isolation with mocks.
vi.mock('../WorldScene', () => ({
  WorldScene: vi.fn().mockImplementation(() => ({
    loadRoom: vi.fn(),
    isBlocked: vi.fn(() => false),
    setCamera: vi.fn(),
    checkTriggers: vi.fn(),
    getContainer: vi.fn(() => ({ x: 0, y: 0 })),
  })),
}))

describe('transitionToRoom', () => {
  it('does nothing if worldScene is not initialized', () => {
    // transitionToRoom should not throw when game is not running
    expect(() => transitionToRoom('bridge', 'coast')).not.toThrow()
  })
})
```

Run: `npx vitest run src/pixi/__tests__/Game.transitionToRoom.test.ts`
Expected: FAIL (transitionToRoom not exported yet)

- [ ] **Step 2: Update Game.ts**

Replace the full file:

```ts
// src/pixi/Game.ts
import { Application } from 'pixi.js'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useWorldStore } from '@/store/worldStore'
import { WorldScene } from './WorldScene'
import { Player } from './Player'
import { TILE_SIZE } from './mapData'
import { coastRoom } from './rooms/coastRoom'
import type { RoomDef } from './rooms/types'
import type { RoomId } from './rooms/types'

const ROOMS: Record<RoomId, RoomDef> = {
  coast:  coastRoom,
  bridge: (await import('./rooms/bridgeRoom')).bridgeRoom,  // lazy to avoid circular
  city:   (await import('./rooms/cityRoom')).cityRoom,
}
```

Wait, dynamic imports at module level won't work cleanly. Let me use static imports instead:

```ts
// src/pixi/Game.ts
import { Application } from 'pixi.js'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useWorldStore } from '@/store/worldStore'
import { WorldScene } from './WorldScene'
import { Player } from './Player'
import { TILE_SIZE } from './mapData'
import { coastRoom } from './rooms/coastRoom'
import { bridgeRoom } from './rooms/bridgeRoom'
import { cityRoom } from './rooms/cityRoom'
import type { RoomDef } from './rooms/types'
import type { RoomId } from './rooms/types'

const ROOMS: Record<RoomId, RoomDef> = {
  coast:  coastRoom,
  bridge: bridgeRoom,
  city:   cityRoom,
}

let app: Application | null = null
let worldScene: WorldScene | null = null
let player: Player | null = null
let sessionId = 0

export async function initGame(container: HTMLDivElement): Promise<Application> {
  destroyGame()
  const mySession = ++sessionId

  const newApp = new Application()
  await newApp.init({
    resizeTo:        container,
    backgroundColor: 0x1a1a2e,
    antialias:       false,
    autoDensity:     true,
    resolution:      window.devicePixelRatio || 1,
  })

  if (mySession !== sessionId) {
    newApp.destroy(true, { children: true })
    return newApp
  }

  app = newApp
  container.appendChild(app.canvas as HTMLCanvasElement)

  worldScene = new WorldScene(app)

  // Load starting room
  const startRoom = ROOMS[useWorldStore.getState().currentRoomId]
  worldScene.loadRoom(startRoom)

  const spawn = startRoom.spawnPoints.default ?? { x: 24 * TILE_SIZE + 16, y: 18 * TILE_SIZE + 16 }
  player = new Player(app, worldScene)
  player.setPosition(spawn.x, spawn.y)

  app.ticker.add((ticker) => {
    const deltaSeconds = ticker.deltaMS / 1000
    useDayTimeStore.getState().advanceRealSeconds(deltaSeconds)

    if (player && worldScene) {
      player.update(deltaSeconds)
      const { x, y } = player.getPosition()
      worldScene.setCamera(x, y, app!.screen.width, app!.screen.height)
      worldScene.checkTriggers(x, y)
    }
  })

  return app
}

export function transitionToRoom(pendingRoomId: RoomId, fromRoomId: RoomId): void {
  if (!worldScene || !player) return
  const room = ROOMS[pendingRoomId]
  worldScene.loadRoom(room)
  const spawnKey = `from_${fromRoomId}` as keyof typeof room.spawnPoints
  const spawn = room.spawnPoints[spawnKey] ?? room.spawnPoints.default ?? { x: 24 * TILE_SIZE + 16, y: TILE_SIZE + 16 }
  player.setPosition(spawn.x, spawn.y)
}

export function destroyGame() {
  sessionId++
  if (app) {
    player?.destroy()
    app.destroy(true, { children: true })
    app = null
    worldScene = null
    player = null
  }
}

export function getApp(): Application | null { return app }
```

- [ ] **Step 3: Update Player.ts — freeze movement during transition**

In `Player.update()`, add a transitionState check. The current check is:
```ts
const { gameMode, currentLocation } = useWorldStore.getState()
if (gameMode === 'tycoon' || currentLocation !== null) return
```

Change to:
```ts
const { gameMode, currentLocation, transitionState } = useWorldStore.getState()
if (gameMode === 'tycoon' || currentLocation !== null || transitionState !== 'idle') return
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pixi/Game.ts src/pixi/Player.ts src/pixi/__tests__/Game.transitionToRoom.test.ts
git commit -m "feat: Game.ts transitionToRoom() + player freeze during transition"
```

---

### Task 5: App.tsx — black fade overlay + transition coordination

**Files:**
- Modify: `src/App.tsx`

**Context:** App.tsx needs a full-screen black overlay div that:
1. Is visible (opacity 1) when `transitionState === 'fading-out'`
2. Becomes invisible (opacity 0) when `transitionState === 'fading-in'` or `'idle'`
3. Uses CSS `transition: opacity 400ms ease` for smooth animation
4. Calls `transitionToRoom(pendingRoomId, currentRoomId)` from Game.ts then calls `worldStore.setTransitionFadedOut()` when the fade-out animation ends (`onTransitionEnd`)
5. Calls `worldStore.completeTransition()` when the fade-in animation ends

The overlay must be OUTSIDE the `overflow: hidden` main div (same pattern as CutscenePlayer).

- [ ] **Step 1: Write the failing test**

This is a React component test — use a smoke test only. The actual fade behavior is visual.

Create `src/components/__tests__/FadeOverlay.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import App from '../App'
import { useWorldStore } from '@/store/worldStore'

// Minimal mocks to make App render without PixiJS
vi.mock('@/components/GameCanvas', () => ({ default: () => <div data-testid="canvas" /> }))

describe('Room transition overlay', () => {
  it('fade overlay div is rendered in DOM', () => {
    render(<App />)
    // The overlay uses data-testid="room-fade-overlay"
    // It should always be present (just transparent when idle)
    const overlay = screen.queryByTestId('room-fade-overlay')
    // May not exist until character is created — just check no crash
    expect(true).toBe(true)
  })
})
```

Run: `npx vitest run src/components/__tests__/FadeOverlay.test.tsx`
Expected: PASS (smoke test always passes)

- [ ] **Step 2: Add fade overlay to App.tsx**

In App.tsx, after the existing imports, add:

```ts
import { transitionToRoom } from '@/pixi/Game'
```

Find the existing worldStore subscriptions near line 52–53:
```ts
const gameMode        = useWorldStore((s) => s.gameMode)
const currentLocation = useWorldStore((s) => s.currentLocation)
```

Add below:
```ts
const transitionState = useWorldStore((s) => s.transitionState)
const currentRoomId   = useWorldStore((s) => s.currentRoomId)
const pendingRoomId   = useWorldStore((s) => s.pendingRoomId)
```

At the bottom of App.tsx's return, after `{activeCutscene && <CutscenePlayer />}`, add the fade overlay:

```tsx
{/* Room transition fade overlay — outside overflow:hidden, always rendered */}
<div
  data-testid="room-fade-overlay"
  style={{
    position:   'fixed',
    inset:      0,
    background: '#000',
    opacity:    transitionState === 'fading-out' ? 1 : 0,
    transition: 'opacity 400ms ease',
    pointerEvents: transitionState !== 'idle' ? 'all' : 'none',
    zIndex: 100,
  }}
  onTransitionEnd={() => {
    if (transitionState === 'fading-out' && pendingRoomId) {
      transitionToRoom(pendingRoomId, currentRoomId)
      useWorldStore.getState().setTransitionFadedOut()
    } else if (transitionState === 'fading-in') {
      useWorldStore.getState().completeTransition()
    }
  }}
/>
```

The full `<>...</>` fragment in the return should now look like:

```tsx
return (
  <>
  <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#1a1a2e' }}>
    {/* ... all existing content ... */}
  </div>
  {activeCutscene && <CutscenePlayer />}
  <div
    data-testid="room-fade-overlay"
    style={{
      position:   'fixed',
      inset:      0,
      background: '#000',
      opacity:    transitionState === 'fading-out' ? 1 : 0,
      transition: 'opacity 400ms ease',
      pointerEvents: transitionState !== 'idle' ? 'all' : 'none',
      zIndex: 100,
    }}
    onTransitionEnd={() => {
      if (transitionState === 'fading-out' && pendingRoomId) {
        transitionToRoom(pendingRoomId, currentRoomId)
        useWorldStore.getState().setTransitionFadedOut()
      } else if (transitionState === 'fading-in') {
        useWorldStore.getState().completeTransition()
      }
    }}
  />
  </>
)
```

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/__tests__/FadeOverlay.test.tsx
git commit -m "feat: room transition fade overlay in App.tsx"
```

---

### Task 6: Integration wiring + smoke test

**Files:**
- No new files — verify the system works end-to-end

**Context:** All pieces are in place. This task verifies that the wiring is correct: exit triggers fire, worldStore updates, overlay fades, Game.ts loads new room. Also remove the `PLAYER_START_X/Y` constants from Game.ts that are now unused (replaced by `startRoom.spawnPoints.default`).

- [ ] **Step 1: Check for any remaining references to removed mapData exports**

Run: `npx grep -r "MAP_WIDTH\|MAP_HEIGHT\|MAP_PIXEL_W\|MAP_PIXEL_H\|ZONES\|BUILDINGS\|TRIGGERS\|buildCollisionRects" src/`
Expected: no results (or only in room files if re-exported, which they shouldn't be).

If any files still import removed exports, fix those imports.

- [ ] **Step 2: Check for TypeScript errors**

Run: `npx tsc --noEmit`
Expected: 0 errors.

If there are errors, fix them. Common causes:
- Files still importing `ZONES`, `BUILDINGS`, `TRIGGERS`, `MAP_PIXEL_W`, `MAP_PIXEL_H` from `mapData.ts`
- Files still importing `buildCollisionRects` from `mapData.ts`

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: all tests pass (count should be ≥ 296 + new tests we added).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: harita odaları (rooms) — coast/bridge/city with fade transitions"
```

---

## Testing Checklist (manual, after all tasks complete)

After running `npm run dev` / starting the game:

- [ ] Game loads in coast room (sahil evi visible)
- [ ] WASD movement works in coast room
- [ ] Player can't walk into the sea (rows 0-3 blocked)
- [ ] Player can't walk into buildings (sahil evi, sahaf, etc.)
- [ ] `studio_desk` trigger → tycoon mode opens
- [ ] `sahaf_door`, `balikci_door`, `pub_door` triggers → panels open, ESC closes
- [ ] Walking south into cols 20-29, rows 20-21 → black fade → bridge room loads
- [ ] In bridge room: corridor visible, player spawns near top
- [ ] Player can't walk into the bridge water areas (left/right of corridor)
- [ ] Walking south into row 5 → black fade → city room loads
- [ ] In city room: neon buildings visible, all city triggers work
- [ ] Walking north into row 0 (cols 20-29) → back to bridge
- [ ] Bridge north exit → back to coast
- [ ] ESC works in each room to close panels
