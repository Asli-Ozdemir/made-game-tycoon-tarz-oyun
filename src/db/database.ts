import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = join(app.getPath('userData'), 'save.db')
    db = new Database(dbPath)
    db.exec(`
      CREATE TABLE IF NOT EXISTS saves (
        id INTEGER PRIMARY KEY,
        data TEXT NOT NULL,
        saved_at TEXT NOT NULL
      )
    `)
  }
  return db
}

export function saveGame(state: unknown): void {
  const d = getDb()
  d.prepare('DELETE FROM saves').run()
  d.prepare('INSERT INTO saves (data, saved_at) VALUES (?, ?)').run(
    JSON.stringify(state),
    new Date().toISOString()
  )
}

export function loadGame(): unknown | null {
  const row = getDb()
    .prepare('SELECT data FROM saves ORDER BY id DESC LIMIT 1')
    .get() as { data: string } | undefined
  return row ? JSON.parse(row.data) : null
}
