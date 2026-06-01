# Oyun Durum Dosyası
_Son güncelleme: 2026-06-01 (akşam)_

## Tamamlananlar

### Harita Odaları (2026-06-01)
- 3 ayrı harita odası: coast (50×22), bridge (50×6), city (50×24)
- `src/pixi/rooms/`: types.ts, coastRoom.ts, bridgeRoom.ts, cityRoom.ts
- `WorldScene.loadRoom(room)`: per-oda rendering ve collision
- `worldStore`: currentRoomId, transitionState, pendingRoomId + geçiş aksiyonları
- `Game.ts`: `transitionToRoom(pendingRoomId, fromRoomId)` export
- `App.tsx`: siyah fade overlay (400ms CSS transition) — oda geçişlerini koordine eder
- Player hareketi geçiş sırasında dondurulur
- 297+ test geçiyor

### Harita Yeniden Tasarımı (2026-06-01)
- 50×50 tile harita (1600×1600px) — sahil + köprü + neon şehir
- `mapData.ts`: ZONES, BUILDINGS (12), TRIGGERS (12), buildCollisionRects()
- `WorldScene.ts`: zone/bina rendering, collision, kamera
- `TriggerSystem.ts`: sahaf, balıkçı, pub, placeholder trigger'lar
- `Game.ts`: yeni player başlangıç konumu (tile 24,18 = sahil evi önü)
- `SahafPanel`, `BalikciPanel`, `PubPanel`: placeholder paneller
- 296 test geçiyor

### Bug Fixes (2026-06-01)
- **Beyaz ekran**: React StrictMode + Game.ts module-level `app` race condition → `sessionId` ile düzeltildi
- **NewsFeed sonsuz döngü**: `s.items.slice(0,10)` her render'da yeni array → `allItems = s.items` ile düzeltildi
- **CutscenePlayer görünmüyor**: `overflow: hidden` parent içinde `fixed` → main div dışına taşındı
- **Electron BG**: `backgroundColor: '#0d1117'` eklendi
- **DevTools**: dev modunda otomatik açılıyor

---

## Yarın Yapılacaklar

### Harita Odaları — TAMAMLANDI (2026-06-01)
Coast/bridge/city oda mimarisi, fade geçişler ve 297 test ile tamamlandı.

### Cutscene (Düşük Öncelik)
- Kovulma cutscene şu an CharacterCreationWizard'da `startCutsceneForce` ile tetikleniyor
- Yeni oyun başlatınca görünmesi lazım — oda mimarisi tamamlandı, artık test edilebilir

### Sıradaki Büyük Görevler
- Köprü geçişinde otobüs animasyonu (isteğe bağlı)
- NPC sprite'ları harita üzerinde
- Sahaf / Balıkçı / Pub panel içerikleri (Marcus, Remy, Theo)
- DevTools otomatik açma production'dan kaldır (`electron/main.ts`)

---

## Teknik Notlar
- PixiJS v8.18.1, React 18 StrictMode, Electron + electron-vite
- `sessionId` pattern: Game.ts'de async init race condition'ı önler
- DevTools: `electron/main.ts`'de `openDevTools({ mode: 'detach' })` — production'da kaldır
- Harita yönü: kuzey yukarı (sahil), güney aşağı (şehir) — mevcut tasarımda ters görünüyor, oda mimarisinde düzelir
