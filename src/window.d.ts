/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    saveGame: (state: unknown) => Promise<boolean>
    loadGame: () => Promise<unknown | null>
  }
}
