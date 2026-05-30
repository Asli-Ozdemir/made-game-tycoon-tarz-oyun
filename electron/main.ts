import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true
    }
  })
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function savesDir() {
  return join(app.getPath('userData'), 'saves')
}

ipcMain.handle('save-game', async (_event, slotId: number, json: string) => {
  const dir = savesDir()
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(join(dir, `slot-${slotId}.json`), json, 'utf-8')
})

ipcMain.handle('load-game', async (_event, slotId: number) => {
  const file = join(savesDir(), `slot-${slotId}.json`)
  try {
    return await fs.readFile(file, 'utf-8')
  } catch {
    return null
  }
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
