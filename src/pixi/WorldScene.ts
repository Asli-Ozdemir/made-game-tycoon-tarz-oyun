// src/pixi/WorldScene.ts
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { getActiveTrigger, handleTrigger } from './TriggerSystem'
import { useWorldStore } from '@/store/worldStore'
import { TILE_SIZE } from './mapData'
import { DEMO_MODE, DEMO_BLOCKED_ROOMS } from '@/config'
import type { CollisionRect } from './mapData'
import type { RoomDef } from './rooms/types'

const BUILDING_STYLES = {
  coastal:    { fill: 0x0d2035, border: 0x2a5a7c, bw: 1.5, labelColor: 0x7ec8e3 },
  bridge:     { fill: 0x2a2a1a, border: 0x4a4a2a, bw: 1.0, labelColor: 0x8a7a5a },
  city:       { fill: 0x0d001e, border: 0x9b30ff,  bw: 2.0, labelColor: 0xcc66ff },
  city_major: { fill: 0x06000c, border: 0xcc44ff,  bw: 3.0, labelColor: 0xff88ff },
}

export class WorldScene {
  private container: Container
  private app: Application
  private collisionRects: CollisionRect[] = []
  private roomPixelW = 0
  private roomPixelH = 0
  private currentRoom: RoomDef | null = null
  private lastTrigger: string | null = null

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    app.stage.addChild(this.container)
  }

  loadRoom(room: RoomDef): void {
    this.currentRoom = room
    this.roomPixelW = room.widthTiles  * TILE_SIZE
    this.roomPixelH = room.heightTiles * TILE_SIZE
    this.collisionRects = this.buildCollisionRects(room)
    this.lastTrigger = null
    this.render(room)
  }

  private buildCollisionRects(room: RoomDef): CollisionRect[] {
    const rects: CollisionRect[] = room.buildings
      .filter(b => !b.noCollision)
      .map(b => ({
        x: b.col  * TILE_SIZE,
        y: b.row  * TILE_SIZE,
        w: b.cols * TILE_SIZE,
        h: b.rows * TILE_SIZE,
      }))
    return rects.concat(room.customCollisionRects)
  }

  private render(room: RoomDef): void {
    this.container.removeChildren()
    this.renderZones(room)
    if (room.id === 'bridge') this.renderBridgeCorridor(room)
    this.renderBuildings(room)
  }

  private renderZones(room: RoomDef): void {
    for (const zone of room.zones) {
      const g = new Graphics()
      g.rect(
        0,
        zone.rowStart * TILE_SIZE,
        this.roomPixelW,
        (zone.rowEnd - zone.rowStart + 1) * TILE_SIZE,
      ).fill({ color: zone.bgColor })
      this.container.addChild(g)
    }
  }

  private renderBridgeCorridor(room: RoomDef): void {
    const corridorX = 20 * TILE_SIZE
    const corridorW = 10 * TILE_SIZE
    const roomH     = room.heightTiles * TILE_SIZE

    const corridor = new Graphics()
    corridor.rect(corridorX, 0, corridorW, roomH)
      .fill({ color: 0x2a2a1a })
      .stroke({ width: 1, color: 0x4a4a2a })
    this.container.addChild(corridor)

    const railLeft = new Graphics()
    railLeft.rect(corridorX, 0, 2, roomH).fill({ color: 0x6a6a4a })
    this.container.addChild(railLeft)

    const railRight = new Graphics()
    railRight.rect(corridorX + corridorW - 2, 0, 2, roomH).fill({ color: 0x6a6a4a })
    this.container.addChild(railRight)
  }

  private renderBuildings(room: RoomDef): void {
    for (const bld of room.buildings) {
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

      if (bld.id === 'sahil_evi') {
        const door = new Graphics()
        door.rect(x + w / 2 - 32, y + h - 16, 64, 16).fill({ color: 0x4a8aac })
        this.container.addChild(door)
      }

      if (bld.id === 'balikci') {
        const pier = new Graphics()
        pier.rect(x + w / 2 - 1, y - 3 * TILE_SIZE, 2, 3 * TILE_SIZE).fill({ color: 0x2a5a7c })
        this.container.addChild(pier)
      }
    }
  }

  isBlocked(worldX: number, worldY: number): boolean {
    if (worldX < 0 || worldY < 0 || worldX >= this.roomPixelW || worldY >= this.roomPixelH) return true
    for (const r of this.collisionRects) {
      if (worldX >= r.x && worldX < r.x + r.w && worldY >= r.y && worldY < r.y + r.h) return true
    }
    return false
  }

  checkTriggers(worldX: number, worldY: number): void {
    if (!this.currentRoom) return

    const trigger = getActiveTrigger(this.currentRoom.triggers, worldX, worldY)
    if (trigger !== this.lastTrigger) {
      this.lastTrigger = trigger
      if (trigger) handleTrigger(trigger)
    }

    if (useWorldStore.getState().transitionState === 'idle') {
      for (const et of this.currentRoom.exitTriggers) {
        if (worldX >= et.x && worldX < et.x + et.w && worldY >= et.y && worldY < et.y + et.h) {
          if (DEMO_MODE && DEMO_BLOCKED_ROOMS.has(et.toRoom)) {
            console.info('🌉 Şehir merkezi tam sürümde açılıyor — neon ışıklar seni bekliyor')
            break
          }
          useWorldStore.getState().beginTransition(et.toRoom)
          break
        }
      }
    }
  }

  setCamera(px: number, py: number, screenW: number, screenH: number): void {
    this.container.x = Math.max(screenW - this.roomPixelW, Math.min(0, screenW / 2 - px))
    this.container.y = Math.max(screenH - this.roomPixelH, Math.min(0, screenH / 2 - py))
  }

  getRoomPixelW(): number { return this.roomPixelW }
  getRoomPixelH(): number { return this.roomPixelH }
  getContainer(): Container { return this.container }
}
