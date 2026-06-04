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
