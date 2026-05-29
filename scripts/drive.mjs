import { _electron as electron } from 'playwright-core'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/game-dev-life-shots'
mkdirSync(SHOT_DIR, { recursive: true })

const electronBin = join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')

async function ss(page, name) {
  const f = join(SHOT_DIR, name + '.png')
  await page.screenshot({ path: f })
  console.log('screenshot:', f)
}

async function run() {
  console.log('Launching...')
  const app = await electron.launch({
    executablePath: electronBin,
    args: [APP_DIR],
    env: { ...process.env }
  })

  await new Promise(r => setTimeout(r, 4000))
  const page = app.windows().find(w => !w.url().startsWith('devtools://'))
    ?? await app.firstWindow()
  console.log('window:', page.url())

  // 1. Başlangıç ekranı
  await ss(page, '01-initial')

  // 2. Hızı normal yap
  await page.click('button:has-text("▶")')
  await new Promise(r => setTimeout(r, 300))
  await ss(page, '02-speed-running')

  // 3. Yeni Proje modalını aç
  await page.click('button:has-text("Yeni Proje")')
  await page.waitForSelector('input[placeholder]')
  await ss(page, '03-modal-open')

  // 4. Formu doldur — page.fill() React onChange'i düzgün tetikler
  await page.fill('input[placeholder]', 'Uzay Macerası')
  await page.locator('select').nth(0).selectOption('aksiyon')   // Tür
  await page.locator('select').nth(1).selectOption('uzay')      // Konu
  await page.locator('select').nth(2).selectOption('pc')        // Platform
  await page.click('button:has-text("Küçük")')                  // 8 hafta — hızlı test
  await new Promise(r => setTimeout(r, 200))
  await ss(page, '04-form-filled')

  // 5. Projeyi başlat
  await page.click('button:has-text("Projeyi Başlat")')
  await new Promise(r => setTimeout(r, 500))
  await ss(page, '05-project-created')

  // 6. Çok hızlı moda geç → 8 hafta × 100ms = ~800ms
  await page.click('button:has-text("▶▶▶")')
  await new Promise(r => setTimeout(r, 2500))
  await ss(page, '06-project-complete')

  // 7. Yayınla butonu var mı?
  const pubBtn = page.locator('button:has-text("Yayınla")')
  if (await pubBtn.isVisible()) {
    await pubBtn.click()
    await new Promise(r => setTimeout(r, 600))
    await ss(page, '07-publish-result')
    // 8. Devam et
    const continueBtn = page.locator('button:has-text("Devam")')
    if (await continueBtn.isVisible()) {
      await continueBtn.click()
      await new Promise(r => setTimeout(r, 400))
      await ss(page, '08-after-publish')
    }
  } else {
    console.log('Yayınla butonu görünmüyor — proje henüz bitmemiş olabilir')
    await ss(page, '06b-still-developing')
  }

  await app.close()
  console.log('Done.')
}

run().catch(e => { console.error(e.message); process.exit(1) })
