import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveGame: (_state: unknown) => Promise.resolve(),
  loadGame: () => Promise.resolve(null)
})
