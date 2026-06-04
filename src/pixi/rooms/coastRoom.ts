import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const coastCenterRoom: RoomDef = {
  id: 'coast_center',
  widthTiles: 50,
  heightTiles: 22,   // rows 0–21
  zones: [
    { rowStart: 0,  rowEnd: 3,  bgColor: 0x071a12, type: 'river'         },
    { rowStart: 4,  rowEnd: 6,  bgColor: 0x0d1f0e, type: 'river_bank'    },
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
    { name: 'yatak',        x: 832,  y: 448, w: 32, h: 32 },
  ],
  exitTriggers: [
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
    default:     { x: 24 * TILE_SIZE + 16, y: 18 * TILE_SIZE + 16 },
    from_bridge: { x: 24 * TILE_SIZE + 16, y: 19 * TILE_SIZE + 16 },
  },
}
