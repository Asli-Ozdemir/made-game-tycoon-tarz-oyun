export {}

declare global {
  interface Window {
    electronAPI?: {
      saveGame: (slotId: number, json: string) => Promise<void>
      loadGame: (slotId: number) => Promise<string | null>
    }
  }
}
