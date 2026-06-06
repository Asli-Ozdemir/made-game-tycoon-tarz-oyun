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
      toRoom: 'city_park',
      x: 49 * TILE_SIZE,
      y:  5 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 14 * TILE_SIZE,
    },
    {
      toRoom: 'city_culture',
      x: 15 * TILE_SIZE,
      y: 23 * TILE_SIZE,
      w: 20 * TILE_SIZE,
      h:      TILE_SIZE,
    },
  ],
  customCollisionRects: [],
  spawnPoints: {
    from_bridge:       { x: 24 * TILE_SIZE + 16, y:  1 * TILE_SIZE + 16 },
    from_city_park:    { x: 48 * TILE_SIZE + 16, y: 12 * TILE_SIZE + 16 },
    from_city_culture: { x: 24 * TILE_SIZE + 16, y: 22 * TILE_SIZE + 16 },
  },
}
