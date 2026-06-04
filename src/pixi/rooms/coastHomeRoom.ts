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
