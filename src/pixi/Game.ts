// src/pixi/Game.ts
import { Application } from 'pixi.js'
import cityTmx from './assets/city.tmx?raw'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { WorldScene } from './WorldScene'
import { Player } from './Player'

let app: Application | null = null
let worldScene: WorldScene | null = null
let player: Player | null = null

export async function initGame(container: HTMLDivElement): Promise<Application> {
  app = new Application()
  await app.init({
    resizeTo: container,
    backgroundColor: 0x1a1a2e,
    antialias: false,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  })

  // PixiJS kendi canvas'ını oluşturdu — container'a ekle
  container.appendChild(app.canvas as HTMLCanvasElement)

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
    app.destroy(true, { children: true })
    app = null
    worldScene = null
    player = null
  }
}

export function getApp(): Application | null { return app }
