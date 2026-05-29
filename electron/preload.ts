import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveGame: (state: unknown) => ipcRenderer.invoke('save-game', state),
  loadGame: () => ipcRenderer.invoke('load-game')
})
