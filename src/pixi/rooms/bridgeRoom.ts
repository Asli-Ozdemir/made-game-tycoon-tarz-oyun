import type { RoomDef } from './types'
import { TILE_SIZE } from '../mapData'

export const bridgeRoom: RoomDef = {
  id: 'bridge',
  widthTiles: 50,
  heightTiles: 6,
  zones: [
    { rowStart: 0, rowEnd: 5, bgColor: 0x0a0a08, type: 'bridge' },
  ],
  buildings: [],
  triggers: [],
  exitTriggers: [
    { toRoom: 'coast', x: 20 * TILE_SIZE, y: 0,             w: 10 * TILE_SIZE, h: TILE_SIZE },
    { toRoom: 'city',  x: 20 * TILE_SIZE, y: 5 * TILE_SIZE, w: 10 * TILE_SIZE, h: TILE_SIZE },
  ],
  customCollisionRects: [
    { x: 0,              y: 0, w: 20 * TILE_SIZE, h: 6 * TILE_SIZE },
    { x: 30 * TILE_SIZE, y: 0, w: 20 * TILE_SIZE, h: 6 * TILE_SIZE },
  ],
  spawnPoints: {
    from_coast: { x: 24 * TILE_SIZE + 16, y: 1 * TILE_SIZE + 16 },
    from_city:  { x: 24 * TILE_SIZE + 16, y: 4 * TILE_SIZE + 16 },
  },
}
