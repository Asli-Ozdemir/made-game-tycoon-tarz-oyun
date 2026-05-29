// scripts/generate-placeholder-assets.mjs
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const outDir = join(process.cwd(), 'src/pixi/assets')
mkdirSync(outDir, { recursive: true })

// Minimal 1x1 transparent PNG — placeholder until real art assets are created
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)

writeFileSync(join(outDir, 'tileset.png'), TRANSPARENT_PNG)
writeFileSync(join(outDir, 'player.png'), TRANSPARENT_PNG)
console.log("Placeholder PNG'ler oluşturuldu: tileset.png, player.png")
