import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const cityEdgeRoom: RoomDef = {
  id: 'city_edge',
  widthTiles: 40,
  heightTiles: 24,
  zones: [
    { rowStart: 0,  rowEnd: 13, bgColor: 0x0d0a16, type: 'city'       },
    { rowStart: 14, rowEnd: 23, bgColor: 0x080812, type: 'city_north' },
  ],
  buildings: [
    { id: 'klinik', col: 3,  row: 3,  cols: 12, rows: 10, label: 'Klinik', style: 'city' },
    { id: 'havuz',  col: 22, row: 4,  cols: 14, rows: 10, label: 'Havuz',  style: 'city' },
  ],
  triggers: [
    { name: 'klinik_door', x: 96,  y: 352, w: 32, h: 32 },
    { name: 'havuz_door',  x: 704, y: 384, w: 32, h: 32 },
  ],
  exitTriggers: [
    {
      toRoom: 'city_culture',
      x:  0,
      y:  7 * TILE_SIZE,
      w:      TILE_SIZE,
      h: 17 * TILE_SIZE,
    },
    {
      toRoom: 'city_park',
      x: 10 * TILE_SIZE,
      y: 0,
      w: 20 * TILE_SIZE,
      h:      TILE_SIZE,
    },
  ],
  customCollisionRects: [],
  spawnPoints: {
    default:           { x: 20 * TILE_SIZE + 16, y: 12 * TILE_SIZE + 16 },
    from_city_culture: { x:  1 * TILE_SIZE + 16, y: 15 * TILE_SIZE + 16 },
    from_city_park:    { x: 20 * TILE_SIZE + 16, y:  1 * TILE_SIZE + 16 },
  },
}
