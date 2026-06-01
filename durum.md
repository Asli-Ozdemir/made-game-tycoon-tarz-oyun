# Oyun Durum Dosyası
_Son güncelleme: 2026-06-01_

## Tamamlananlar

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

### Harita Odaları (Öncelik: Yüksek)
Mevcut mimari: tek büyük scrolling canvas (1600×1600px). Kullanıcı isteği: Stardew Valley gibi **ayrı harita odaları**:
- **Oda 1 — Sahil**: sahil evi, sahaf, balıkçı, pub
- **Oda 2 — Köprü**: geçiş odası (yürüyerek geçilir, kısa)
- **Oda 3 — Şehir**: kafe, fuar, akademi, nexus, yatırımcı

Geçiş mekanizması: odadan çıkınca siyah fade → yeni oda yüklenir → fade-in.
Köprü kendi başına bir oda (otobüs/yürüyüş geçiş alanı).

Mimari değişiklik gerekiyor:
- `mapData.ts`'i per-oda veriye böl
- `WorldScene`'e "aktif oda" kavramı ekle
- Geçiş trigger'ları → oda değiştir
- Oyuncu pozisyonu oda-koordinatına göre reset

### Cutscene (Düşük Öncelik)
- Kovulma cutscene şu an CharacterCreationWizard'da `startCutsceneForce` ile tetikleniyor
- Yeni oyun başlatınca görünmesi lazım — oda mimarisi sonrası test et

---

## Teknik Notlar
- PixiJS v8.18.1, React 18 StrictMode, Electron + electron-vite
- `sessionId` pattern: Game.ts'de async init race condition'ı önler
- DevTools: `electron/main.ts`'de `openDevTools({ mode: 'detach' })` — production'da kaldır
- Harita yönü: kuzey yukarı (sahil), güney aşağı (şehir) — mevcut tasarımda ters görünüyor, oda mimarisinde düzelir
