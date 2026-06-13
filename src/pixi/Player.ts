// src/pixi/Player.ts
import { Application, Graphics, Container } from 'pixi.js'
import { useWorldStore } from '@/store/worldStore'
import type { WorldScene } from './WorldScene'

const SPEED = 120 // pixels per second

export class Player {
  private container: Container
  private sprite: Graphics
  private x: number
  private y: number
  private keys: Set<string> = new Set()
  private app: Application
  private scene: WorldScene
  private onKeyDown: (e: KeyboardEvent) => void
  private onKeyUp: (e: KeyboardEvent) => void
  private onBlur: () => void

  constructor(app: Application, scene: WorldScene) {
    this.app = app
    this.scene = scene
    this.x = 400
    this.y = 300

    this.container = new Container()
    this.sprite = new Graphics()
    this.drawSprite()
    this.container.addChild(this.sprite)
    app.stage.addChild(this.container)

    this.onKeyDown = (e) => this.keys.add(e.code)
    this.onKeyUp   = (e) => this.keys.delete(e.code)
    this.onBlur    = () => this.keys.clear()
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup',   this.onKeyUp)
    window.addEventListener('blur',    this.onBlur)
  }

  private drawSprite() {
    this.sprite.clear()
    this.sprite.rect(-8, -24, 16, 24).fill({ color: 0xff6600 })  // body
    this.sprite.circle(0, -30, 8).fill({ color: 0xffcc99 })       // head
  }

  setPosition(x: number, y: number) {
    this.x = x
    this.y = y
  }

  getPosition() { return { x: this.x, y: this.y } }

  update(dt: number) {
    const { gameMode, currentLocation, transitionState } = useWorldStore.getState()
    if (gameMode === 'tycoon' || currentLocation !== null || transitionState !== 'idle') return

    const dist = SPEED * dt
    let dx = 0
    let dy = 0

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp'))    dy -= dist
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown'))  dy += dist
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft'))  dx -= dist
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += dist

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707
      dy *= 0.707
    }

    // Separate-axis collision check
    const newX = this.x + dx
    const newY = this.y + dy
    if (!this.scene.isBlocked(newX, this.y)) this.x = newX
    if (!this.scene.isBlocked(this.x, newY)) this.y = newY

    this.syncSpritePosition()
  }

  private syncSpritePosition() {
    const sceneContainer = this.scene.getContainer()
    this.container.x = this.x + sceneContainer.x
    this.container.y = this.y + sceneContainer.y
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup',   this.onKeyUp)
    window.removeEventListener('blur',    this.onBlur)
    this.app.stage.removeChild(this.container)
  }
}
