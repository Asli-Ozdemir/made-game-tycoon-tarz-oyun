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
