import type { RoomDef } from './types'
import { TILE_SIZE as T } from '../mapData'

// Sahil Evi bounds
const HX = 14 * T   // 448  — left edge
const HY = 9  * T   // 288  — top edge
const HW = 10 * T   // 320  — width
const HH = 9  * T   // 288  — height
const WALL   = 2 * T  // 64  — wall thickness
const DOOR_W = 2 * T  // 64  — door opening
const DOOR_X = HX + HW / 2 - DOOR_W / 2  // 576

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
    // noCollision: true — duvarlar customCollisionRects'te ayrıca tanımlı
    { id: 'sahil_evi', col: 14, row: 9, cols: 10, rows: 9, label: 'Sahil Evi', style: 'coastal', noCollision: true },
    { id: 'fener',     col: 2,  row: 3, cols: 4,  rows: 8, label: 'Deniz Feneri', style: 'coastal' },
    { id: 'bahce',     col: 28, row: 10, cols: 8, rows: 7, label: 'Bahçe',        style: 'coastal' },
  ],
  triggers: [
    // İnterior: x:512-704, y:352-512
    { name: 'studio_desk', x: 520, y: 360, w: 80, h: 80 },  // sol köşe — masa/PC
    { name: 'yatak',       x: 636, y: 400, w: 64, h: 80 },  // sağ köşe — yatak
  ],
  exitTriggers: [
    {
      toRoom: 'coast_docks',
      x: 39 * T,
      y:  7 * T,
      w:      T,
      h: 15 * T,
    },
  ],
  customCollisionRects: [
    // Üst sınır (su/kum bölgesi geçit engeli)
    { x: 0, y: 0, w: 40 * T, h: 4 * T },
    // Sahil Evi duvarları (kapı açıklığı: x:576-640, altta)
    { x: HX,             y: HY,             w: HW,              h: WALL },   // üst duvar
    { x: HX,             y: HY,             w: WALL,            h: HH   },   // sol duvar
    { x: HX + HW - WALL, y: HY,             w: WALL,            h: HH   },   // sağ duvar
    { x: HX,             y: HY + HH - WALL, w: DOOR_X - HX,     h: WALL },   // alt-sol (kapıya kadar)
    { x: DOOR_X + DOOR_W, y: HY + HH - WALL, w: HX + HW - DOOR_X - DOOR_W, h: WALL }, // alt-sağ
  ],
  spawnPoints: {
    default:          { x: 608, y: 432 },   // ev içi merkez
    from_coast_docks: { x: 38 * T + 16, y: 15 * T + 16 },
  },
}
