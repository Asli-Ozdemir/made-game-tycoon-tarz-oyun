// src/pixi/Player.ts
import { Application, Graphics } from 'pixi.js'
import type { WorldScene } from './WorldScene'

export class Player {
  private sprite: Graphics
  private x = 400
  private y = 300
  private app: Application

  constructor(app: Application, _scene: WorldScene) {
    this.app = app
    this.sprite = new Graphics()
    this.sprite.rect(-8, -16, 16, 16).fill({ color: 0xff6600 })
    app.stage.addChild(this.sprite)
  }

  setPosition(x: number, y: number) {
    this.x = x
    this.y = y
  }

  getPosition() { return { x: this.x, y: this.y } }

  update(_dt: number) {
    // Stub: no movement yet — Task 10 implements this
    this.sprite.x = this.x
    this.sprite.y = this.y
  }

  destroy() {
    this.app.stage.removeChild(this.sprite)
  }
}
