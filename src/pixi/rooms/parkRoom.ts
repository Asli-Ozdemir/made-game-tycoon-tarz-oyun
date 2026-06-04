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
