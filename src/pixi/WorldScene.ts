// src/pixi/WorldScene.ts
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { getActiveTrigger, handleTrigger } from './TriggerSystem'
import {
  ZONES, BUILDINGS, TRIGGERS, buildCollisionRects,
  MAP_PIXEL_W, MAP_PIXEL_H, TILE_SIZE,
  type CollisionRect,
} from './mapData'

const BUILDING_STYLES = {
  coastal:    { fill: 0x0d2035, border: 0x2a5a7c, bw: 1.5, labelColor: 0x7ec8e3 },
  bridge:     { fill: 0x2a2a1a, border: 0x4a4a2a, bw: 1.0, labelColor: 0x8a7a5a },
  city:       { fill: 0x0d001e, border: 0x9b30ff,  bw: 2.0, labelColor: 0xcc66ff },
  city_major: { fill: 0x06000c, border: 0xcc44ff,  bw: 3.0, labelColor: 0xff88ff },
}

export class WorldScene {
  private container: Container
  private app: Application
  private collisionRects: CollisionRect[]

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    app.stage.addChild(this.container)
    this.collisionRects = buildCollisionRects()
    this.render()
  }

  private render(): void {
    this.container.removeChildren()
    this.renderZones()
    this.renderBridge()
    this.renderBuildings()
  }

  private renderZones(): void {
    for (const zone of ZONES) {
      const g = new Graphics()
      g.rect(
        0,
        zone.rowStart * TILE_SIZE,
        MAP_PIXEL_W,
        (zone.rowEnd - zone.rowStart + 1) * TILE_SIZE,
      ).fill({ color: zone.bgColor })
      this.container.addChild(g)
    }
  }

  /** Köprü koridoru — taş rengi zemin + yan su kenarlığı */
  private renderBridge(): void {
    const bridgeY = 22 * TILE_SIZE
    const bridgeH = 4 * TILE_SIZE
    const corridorX = 20 * TILE_SIZE
    const corridorW = 10 * TILE_SIZE

    // Yürünebilir koridor (taş rengi)
    const corridor = new Graphics()
    corridor.rect(corridorX, bridgeY, corridorW, bridgeH)
      .fill({ color: 0x2a2a1a })
      .stroke({ width: 1, color: 0x4a4a2a })
    this.container.addChild(corridor)

    // Koridor kenar çizgileri (köprü küpeşteleri hissi)
    const railLeft  = new Graphics()
    railLeft.rect(corridorX, bridgeY, 2, bridgeH).fill({ color: 0x6a6a4a })
    this.container.addChild(railLeft)

    const railRight = new Graphics()
    railRight.rect(corridorX + corridorW - 2, bridgeY, 2, bridgeH).fill({ color: 0x6a6a4a })
    this.container.addChild(railRight)
  }

  private renderBuildings(): void {
    for (const bld of BUILDINGS) {
      const style = BUILDING_STYLES[bld.style]
      const x = bld.col  * TILE_SIZE
      const y = bld.row  * TILE_SIZE
      const w = bld.cols * TILE_SIZE
      const h = bld.rows * TILE_SIZE

      const g = new Graphics()
      g.rect(x, y, w, h)
        .fill({ color: style.fill })
        .stroke({ width: style.bw, color: style.border })
      this.container.addChild(g)

      // Bina etiketi
      const label = new Text({
        text: bld.label,
        style: new TextStyle({
          fontSize:   8,
          fill:       style.labelColor,
          fontFamily: 'monospace',
        }),
      })
      label.x = x + 4
      label.y = y + 4
      this.container.addChild(label)

      // Sahil evi kapı detayı
      if (bld.id === 'sahil_evi') {
        const door = new Graphics()
        door.rect(x + w / 2 - 4, y + h - 8, 8, 8).fill({ color: 0x4a8aac })
        this.container.addChild(door)
      }

      // Balıkçı iskele çizgisi
      if (bld.id === 'balikci') {
        const pier = new Graphics()
        pier.rect(x + w / 2 - 1, y - 3 * TILE_SIZE, 2, 3 * TILE_SIZE).fill({ color: 0x2a5a7c })
        this.container.addChild(pier)
      }
    }
  }

  isBlocked(worldX: number, worldY: number): boolean {
    if (worldX < 0 || worldY < 0 || worldX >= MAP_PIXEL_W || worldY >= MAP_PIXEL_H) return true
    for (const r of this.collisionRects) {
      if (worldX >= r.x && worldX < r.x + r.w && worldY >= r.y && worldY < r.y + r.h) {
        return true
      }
    }
    return false
  }

  checkTriggers(worldX: number, worldY: number): void {
    const trigger = getActiveTrigger(TRIGGERS, worldX, worldY)
    if (trigger) handleTrigger(trigger)
  }

  setCamera(px: number, py: number, screenW: number, screenH: number): void {
    this.container.x = Math.max(screenW - MAP_PIXEL_W, Math.min(0, screenW / 2 - px))
    this.container.y = Math.max(screenH - MAP_PIXEL_H, Math.min(0, screenH / 2 - py))
  }

  getContainer(): Container { return this.container }
}
