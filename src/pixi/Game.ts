// src/pixi/Game.ts
import { Application } from 'pixi.js'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { WorldScene } from './WorldScene'
import { Player } from './Player'
import { TILE_SIZE } from './mapData'

// Player başlangıç konumu: sahil evinin önü (tile 24, 18)
const PLAYER_START_X = 24 * TILE_SIZE + 16  // 784
const PLAYER_START_Y = 18 * TILE_SIZE + 16  // 592

let app: Application | null = null
let worldScene: WorldScene | null = null
let player: Player | null = null

export async function initGame(container: HTMLDivElement): Promise<Application> {
  app = new Application()
  await app.init({
    resizeTo:        container,
    backgroundColor: 0x1a1a2e,
    antialias:       false,
    autoDensity:     true,
    resolution:      window.devicePixelRatio || 1,
  })

  container.appendChild(app.canvas as HTMLCanvasElement)

  worldScene = new WorldScene(app)

  player = new Player(app, worldScene)
  player.setPosition(PLAYER_START_X, PLAYER_START_Y)

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
