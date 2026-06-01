# Oyun Durum Dosyası
_Son güncelleme: 2026-06-01 (gece)_

## Tamamlananlar

### Zihin Geliştirme Ağacı (2026-06-01)
- 30 node, 5 tier, radyal nöron layout
- `src/data/skillTree.ts`: SkillNode tipleri + 30 node tanımı
- `src/store/skillTreeStore.ts`: canUnlock, unlockNode, getNodeState, getActiveEffects
- `src/components/SkillTreeCanvas.tsx`: PixiJS nöron rendering (loblu soma, dendrit, myelin akson)
- `src/components/SkillTreePanel.tsx`: seed sayaçları, hover tooltip
- `src/components/SleepOverlay.tsx`: uyku fade + gün sonu
- Yatak trigger: coastRoom tile (26,14) → 'sleep' location

### NPC Diyalog Sistemi (2026-06-01)
- T1/T2/T3 tier sistemi: dostluk 0→30→70 eşiğiyle açılır
- Marcus (Stoacı Sahaf), Remy (Balıkçı), Theo (Pub) — her biri 5 diyalog
- `src/data/npcDialogues.ts`: NPCDef, Dialogue, DialogueLine, DialogueChoice tipleri + içerik
- `src/store/npcStore.ts`: relationship tracking, tier hesaplama, seenDialogues
- `src/store/ideaSeedStore.ts`: Nostalji/Hikaye/Kaos/Zaman Yönetimi tohumları
- `src/components/DialogueView.tsx`: paylaşımlı diyalog UI (liste → okuma → ödül)
- SahafPanel / BalikciPanel / PubPanel güncellendi — DialogueView kullanıyor
- Nehir değişikliği: coastRoom'daki `coastal_water` → `river` (renk 0x071a12)
- 297 test geçiyor

### Hayat Yolu Altyapısı (2026-06-01)
- `src/data/lifePathData.ts`: PATH_THRESHOLD=100, PATH_NPC_MAP
- `src/store/lifePathStore.ts`: serbest/kilitli faz, addProgress, switchPath (NPC cezası + progress reset)
- `src/store/npcStore.ts`: gainMultiplier + penalizeNpc — yol değiştirince ilişki zayıflar
- `src/components/SkillTreeCanvas.tsx`: dış halka yay göstergesi (Huzur/Hırs/Emek)
- T5 node'ları artık lifePathStore üzerinden açılıyor

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
- Hayat Yolu seçimi (Hırs / Huzur / Emek) — kalıcı seçim mekanik
- DevTools otomatik açma production'dan kaldır (`electron/main.ts`)
- Yan işler — mini oyun brainstorming (Hırs/Emek/Huzur per iş)

---

## Teknik Notlar
- PixiJS v8.18.1, React 18 StrictMode, Electron + electron-vite
- `sessionId` pattern: Game.ts'de async init race condition'ı önler
- DevTools: `electron/main.ts`'de `openDevTools({ mode: 'detach' })` — production'da kaldır
- Harita yönü: kuzey yukarı (sahil), güney aşağı (şehir) — mevcut tasarımda ters görünüyor, oda mimarisinde düzelir
