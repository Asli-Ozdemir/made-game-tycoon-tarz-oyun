// src/pixi/Game.ts
import { Application } from 'pixi.js'
import { useDayTimeStore } from '@/store/dayTimeStore'

let app: Application | null = null

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

  app.ticker.add((ticker) => {
    const deltaSeconds = ticker.deltaMS / 1000
    useDayTimeStore.getState().advanceRealSeconds(deltaSeconds)
  })

  return app
}

export function destroyGame() {
  if (app) {
    app.destroy(false, { children: true })
    app = null
  }
}

export function getApp(): Application | null {
  return app
}
