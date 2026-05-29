// src/pixi/Game.ts
import { Application } from 'pixi.js'
import cityTmx from './assets/city.tmx?raw'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { WorldScene } from './WorldScene'
import { Player } from './Player'

let app: Application | null = null
let worldScene: WorldScene | null = null
let player: Player | null = null

export async function initGame(canvas: HTMLCanvasElement): Promise<Application> {
  app = new Application()
  await app.init({
    canvas,
    width: canvas.clientWidth || window.innerWidth,
    height: canvas.clientHeight || window.innerHeight,
    backgroundColor: 0x1a1a2e,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
  })

  worldScene = new WorldScene(app)
  await worldScene.load(cityTmx)

  player = new Player(app, worldScene)
  player.setPosition(400, 300)

  app.ticker.add((ticker) => {
    const deltaSeconds = ticker.deltaMS / 1000
    useDayTimeStore.getState().advanceRealSeconds(deltaSeconds)

    if (player && worldScene) {
      player.update(deltaSeconds)
      const { x, y } = player.getPosition()
      worldScene.setCamera(x, y, app!.screen.width, app!.screen.height)
      worldScene.checkTriggers(x, y)
    }
  })

  return app
}

export function destroyGame() {
  if (app) {
    player?.destroy()
    app.destroy(false, { children: true })
    app = null
    worldScene = null
    player = null
  }
}

export function getApp(): Application | null { return app }
