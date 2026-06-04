// src/pixi/Game.ts
import { Application } from 'pixi.js'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useWorldStore } from '@/store/worldStore'
import { WorldScene } from './WorldScene'
import { Player } from './Player'
import { TILE_SIZE } from './mapData'
import { coastCenterRoom } from './rooms/coastRoom'
import { bridgeRoom }      from './rooms/bridgeRoom'
import { cityCoreRoom }    from './rooms/cityRoom'
import { cityParkRoom }    from './rooms/parkRoom'
import type { RoomDef }    from './rooms/types'
import type { RoomId }     from './rooms/types'

const ROOMS: Partial<Record<RoomId, RoomDef>> = {
  coast_center: coastCenterRoom,
  bridge:       bridgeRoom,
  city_core:    cityCoreRoom,
  city_park:    cityParkRoom,
}

let app: Application | null = null
let worldScene: WorldScene | null = null
let player: Player | null = null
let sessionId = 0

export async function initGame(container: HTMLDivElement): Promise<Application> {
  destroyGame()
  const mySession = ++sessionId

  const newApp = new Application()
  await newApp.init({
    resizeTo:        container,
    backgroundColor: 0x1a1a2e,
    antialias:       false,
    autoDensity:     true,
    resolution:      window.devicePixelRatio || 1,
  })

  if (mySession !== sessionId) {
    newApp.destroy(true, { children: true })
    return newApp
  }

  app = newApp
  container.appendChild(app.canvas as HTMLCanvasElement)

  worldScene = new WorldScene(app)

  const startRoomId = useWorldStore.getState().currentRoomId
  const startRoom = ROOMS[startRoomId] ?? coastCenterRoom
  worldScene.loadRoom(startRoom)

  const spawn = startRoom.spawnPoints.default ?? { x: 24 * TILE_SIZE + 16, y: 18 * TILE_SIZE + 16 }
  player = new Player(app, worldScene)
  player.setPosition(spawn.x, spawn.y)

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

export function transitionToRoom(pendingRoomId: RoomId, fromRoomId: RoomId): void {
  if (!worldScene || !player) return
  const room = ROOMS[pendingRoomId]
  if (!room) return
  worldScene.loadRoom(room)
  const spawnKey = `from_${fromRoomId}` as `from_${RoomId}`
  const spawn = room.spawnPoints[spawnKey] ?? room.spawnPoints.default ?? { x: 24 * TILE_SIZE + 16, y: TILE_SIZE + 16 }
  player.setPosition(spawn.x, spawn.y)
}

export function destroyGame() {
  sessionId++
  if (app) {
    player?.destroy()
    app.destroy(true, { children: true })
    app = null
    worldScene = null
    player = null
  }
}

export function getApp(): Application | null { return app }
