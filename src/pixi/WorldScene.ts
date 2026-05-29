// src/pixi/WorldScene.ts
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { parseTriggers, getActiveTrigger, handleTrigger, type TriggerRect } from './TriggerSystem'

const TILE_SIZE = 32

interface MapData {
  width: number
  height: number
  collisionGrid: boolean[][]
  triggers: TriggerRect[]
}

export class WorldScene {
  private container: Container
  private mapData: MapData | null = null
  private app: Application

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    app.stage.addChild(this.container)
  }

  async load(tmxContent: string): Promise<MapData> {
    const parser = new DOMParser()
    const doc = parser.parseFromString(tmxContent, 'text/xml')

    const mapEl = doc.querySelector('map')!
    const mapW  = parseInt(mapEl.getAttribute('width')  ?? '40')
    const mapH  = parseInt(mapEl.getAttribute('height') ?? '30')

    // Parse collision layer
    const collisionGrid: boolean[][] = Array.from(
      { length: mapH }, () => Array(mapW).fill(false)
    )
    doc.querySelectorAll('layer').forEach((layer) => {
      if (layer.getAttribute('name') !== 'collision') return
      const csv = layer.querySelector('data')?.textContent ?? ''
      csv.trim().split(',').forEach((val, i) => {
        const row = Math.floor(i / mapW)
        const col = i % mapW
        if (row < mapH && col < mapW) collisionGrid[row][col] = parseInt(val.trim()) > 0
      })
    })

    // Parse triggers
    const triggerLayer = doc.querySelector('objectgroup[name="triggers"]')
    const triggers = triggerLayer ? parseTriggers(triggerLayer) : []

    this.mapData = { width: mapW, height: mapH, collisionGrid, triggers }
    this.renderPlaceholderMap(mapW, mapH, collisionGrid, triggers)
    return this.mapData
  }

  private renderPlaceholderMap(
    mapW: number, mapH: number,
    collision: boolean[][],
    triggers: TriggerRect[]
  ) {
    this.container.removeChildren()

    // Green ground
    const ground = new Graphics()
    ground.rect(0, 0, mapW * TILE_SIZE, mapH * TILE_SIZE).fill({ color: 0x2d5a1b })
    this.container.addChild(ground)

    // Collision tiles
    collision.forEach((row, r) => {
      row.forEach((blocked, c) => {
        if (!blocked) return
        const wall = new Graphics()
        wall.rect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE).fill({ color: 0x4a4a6a })
        this.container.addChild(wall)
      })
    })

    // Trigger markers (visible during development)
    triggers.forEach((t) => {
      const marker = new Graphics()
      marker.rect(t.x, t.y, t.width, t.height).fill({ color: 0xffaa00, alpha: 0.5 })
      this.container.addChild(marker)

      const label = new Text({
        text: t.name.replace('_', '\n'),
        style: new TextStyle({ fontSize: 8, fill: 0xffffff }),
      })
      label.x = t.x + 2
      label.y = t.y + 2
      this.container.addChild(label)
    })
  }

  isBlocked(worldX: number, worldY: number): boolean {
    if (!this.mapData) return false
    const col = Math.floor(worldX / TILE_SIZE)
    const row = Math.floor(worldY / TILE_SIZE)
    if (row < 0 || row >= this.mapData.height || col < 0 || col >= this.mapData.width) return true
    return this.mapData.collisionGrid[row][col]
  }

  checkTriggers(worldX: number, worldY: number): void {
    if (!this.mapData) return
    const trigger = getActiveTrigger(this.mapData.triggers, worldX, worldY)
    if (trigger) handleTrigger(trigger)
  }

  setCamera(px: number, py: number, screenW: number, screenH: number): void {
    const mapPixelW = (this.mapData?.width  ?? 40) * TILE_SIZE
    const mapPixelH = (this.mapData?.height ?? 30) * TILE_SIZE
    this.container.x = Math.max(screenW - mapPixelW, Math.min(0, screenW / 2 - px))
    this.container.y = Math.max(screenH - mapPixelH, Math.min(0, screenH / 2 - py))
  }

  getContainer(): Container { return this.container }
}
