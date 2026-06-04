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
