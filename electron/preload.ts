import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveGame: (slotId: number, json: string) => ipcRenderer.invoke('save-game', slotId, json),
  loadGame: (slotId: number)               => ipcRenderer.invoke('load-game', slotId),
})
