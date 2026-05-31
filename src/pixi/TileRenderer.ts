// src/pixi/TileRenderer.ts
import { Assets, Texture } from 'pixi.js'

const TILE_SRC_SIZE = 16   // px — colored.png tile boyutu
const TILE_SPACING  = 1    // px — tile'lar arası boşluk
const TILES_PER_ROW = 49   // colored.png grid genişliği

// Tile ID'leri colored.png'yi bir image viewer'da açarak doğrula.
// Her tile 16x16px, sıralama soldan sağa, yukarıdan aşağıya.
// id = row * 49 + col (0-indexed)
export const GROUND_TILE_IDS = {
  coastal_water: 0,   // ilk tile — koyu tonu
  coastal_sand:  2,   // açık ton
  coastal:       1,   // genel kara
  bridge:        99,  // taş tonu
  city:          50,  // koyu asfalt
  city_north:    50,
} as const

export class TileRenderer {
  private texture: Texture | null = null

  async load(assetUrl: string): Promise<void> {
    this.texture = await Assets.load(assetUrl)
  }

  isLoaded(): boolean {
    return this.texture !== null
  }

  /** Tileset'ten belirli bir tile'ın Texture'ını döner. */
  getTileTexture(tileId: number): Texture {
    if (!this.texture) throw new Error('TileRenderer: load() çağrılmadı')
    const col = tileId % TILES_PER_ROW
    const row = Math.floor(tileId / TILES_PER_ROW)
    const sx  = col * (TILE_SRC_SIZE + TILE_SPACING)
    const sy  = row * (TILE_SRC_SIZE + TILE_SPACING)
    return new Texture({
      source: this.texture.source,
      frame:  { x: sx, y: sy, width: TILE_SRC_SIZE, height: TILE_SRC_SIZE },
    })
  }
}
