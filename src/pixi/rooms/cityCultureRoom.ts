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
