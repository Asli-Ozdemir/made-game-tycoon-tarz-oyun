export const MAP_WIDTH  = 50
export const MAP_HEIGHT = 50
export const TILE_SIZE  = 32
export const MAP_PIXEL_W = MAP_WIDTH  * TILE_SIZE  // 1600
export const MAP_PIXEL_H = MAP_HEIGHT * TILE_SIZE  // 1600

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

export const ZONES: ZoneDef[] = [
  { rowStart: 0,  rowEnd: 3,  bgColor: 0x050e18, type: 'coastal_water' },
  { rowStart: 4,  rowEnd: 6,  bgColor: 0x0d1a10, type: 'coastal_sand'  },
  { rowStart: 7,  rowEnd: 21, bgColor: 0x0d1e2a, type: 'coastal'       },
  { rowStart: 22, rowEnd: 25, bgColor: 0x1a1a12, type: 'bridge'        },
  { rowStart: 26, rowEnd: 39, bgColor: 0x0a0016, type: 'city'          },
  { rowStart: 40, rowEnd: 49, bgColor: 0x060010, type: 'city_north'    },
]

export const BUILDINGS: BuildingDef[] = [
  // Sahil
  { id: 'sahil_evi', col: 20, row: 9,  cols: 10, rows: 9,  label: 'Sahil Evi', style: 'coastal'    },
  { id: 'sahaf',     col: 5,  row: 9,  cols: 8,  rows: 8,  label: 'Sahaf',     style: 'coastal'    },
  { id: 'balikci',   col: 36, row: 8,  cols: 9,  rows: 8,  label: 'Balıkçı',  style: 'coastal'    },
  { id: 'pub',       col: 14, row: 14, cols: 9,  rows: 7,  label: "Pub",       style: 'coastal'    },
  // Şehir — küçük dükkanlar (giriş bölgesi)
  { id: 'cicekci',   col: 8,  row: 26, cols: 6,  rows: 5,  label: 'Çiçekçi', style: 'city'       },
  { id: 'kuyumcu',   col: 15, row: 26, cols: 5,  rows: 5,  label: 'Kuyumcu',  style: 'city'       },
  { id: 'han',       col: 34, row: 26, cols: 6,  rows: 5,  label: 'Han',       style: 'city'       },
  // Şehir — ana binalar
  { id: 'akademi',   col: 18, row: 28, cols: 14, rows: 10, label: 'Akademi',   style: 'city'       },
  { id: 'kafe',      col: 4,  row: 30, cols: 10, rows: 10, label: 'Kafe',      style: 'city'       },
  { id: 'fuar',      col: 36, row: 30, cols: 11, rows: 10, label: 'Fuar',      style: 'city'       },
  // Şehir kuzey
  { id: 'nexus',     col: 40, row: 38, cols: 10, rows: 12, label: 'NEXUS',     style: 'city_major' },
  { id: 'investor',  col: 1,  row: 40, cols: 8,  rows: 10, label: 'Yatırımcı', style: 'city'      },
]

export const TRIGGERS: TriggerDef[] = [
  // Sahil
  { name: 'studio_desk',     x: 768,  y: 384,  w: 32, h: 32 },
  { name: 'sahaf_door',      x: 256,  y: 512,  w: 32, h: 32 },
  { name: 'balikci_door',    x: 1184, y: 480,  w: 32, h: 32 },
  { name: 'pub_door',        x: 480,  y: 640,  w: 32, h: 32 },
  // Şehir — dükkanlar
  { name: 'cicekci_door',    x: 320,  y: 928,  w: 32, h: 32 },
  { name: 'kuyumcu_door',    x: 512,  y: 928,  w: 32, h: 32 },
  { name: 'han_door',        x: 1120, y: 928,  w: 32, h: 32 },
  // Şehir — ana
  { name: 'akademi_door',    x: 768,  y: 1152, w: 32, h: 32 },
  { name: 'cafe_door',       x: 288,  y: 1216, w: 32, h: 32 },
  { name: 'fair_entrance',   x: 1280, y: 1216, w: 32, h: 32 },
  // Şehir kuzey
  { name: 'nexus_building',  x: 1408, y: 1344, w: 32, h: 32 },
  { name: 'investor_office', x: 128,  y: 1376, w: 32, h: 32 },
]

export function buildCollisionRects(): CollisionRect[] {
  const rects: CollisionRect[] = BUILDINGS.map(b => ({
    x: b.col  * TILE_SIZE,
    y: b.row  * TILE_SIZE,
    w: b.cols * TILE_SIZE,
    h: b.rows * TILE_SIZE,
  }))
  // Sahil suyu — tüm genişlik, row 0-3
  rects.push({ x: 0,             y: 0,              w: MAP_PIXEL_W,      h: 4 * TILE_SIZE })
  // Köprü sol suyu — col 0-19, row 22-25
  rects.push({ x: 0,             y: 22 * TILE_SIZE, w: 20 * TILE_SIZE,   h: 4 * TILE_SIZE })
  // Köprü sağ suyu — col 30-49, row 22-25
  rects.push({ x: 30 * TILE_SIZE, y: 22 * TILE_SIZE, w: 20 * TILE_SIZE,  h: 4 * TILE_SIZE })
  return rects
}
