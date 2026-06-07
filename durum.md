# Oyun Durum Dosyası
_Son güncelleme: 2026-06-07_

## Tamamlananlar

### Git Altyapısı (2026-06-07)
- Shared `.githooks/pre-push` hook: push öncesi remote'dan geride olunup olunmadığını kontrol eder, gerideyse durdurup `git pull --rebase` ister
- `setup.sh`: `core.hooksPath .githooks` + `pull.rebase true` — her PC'de bir kez çalıştırılır
- Bu PC'de `bash setup.sh` çalıştırıldı, senkron sağlandı
- **731/731 test geçiyor**

### Diğer PC'den Gelen (2026-06-07 pull)
- `arcadeStore` — 25 test (2de4bad)
- Game flow: karakter yaratma intro cutscene öncesine alındı; harita HTML dokümantasyonu; Lua scriptleri (create_river_flow, zoom_out_bg) eklendi (94be51d)

### Onboarding + Objektif Sistemi (2026-06-06)
- `tryStartOnboarding` useEffect + `ObjectiveBanner` / `MovementHint` / `StudioDeskPointer` App.tsx'e eklendi

### DEMO_MODE (2026-06-06)
- `src/config.ts`: tek kaynak `DEMO_MODE = true` bayrağı
- Köprü/şehir odaları kilitli (`DEMO_BLOCKED_ROOMS`), pub/balıkçı/nehir trigger'ları kilitli (`DEMO_BLOCKED_LOCATIONS`)
- Sahaf (Marcus) açık — istisna
- HUD: Pazarlama butonu gizli; Dashboard: Çalışanlar sekmesi gizli; SleepOverlay: Zihin sekmesi gizli
- NewProjectModal: Sequel/DLC/Güncelleme seçenekleri gizli
- Test: `triggerSystem.demo-on` + `triggerSystem.demo-off`

### Ses Sistemi (2026-06-06)
- `src/store/audioStore.ts`: masterVolume/sfxVolume/musicVolume/muted + localStorage kalıcılık
- `src/audio/soundService.ts`: @pixi/sound singleton, graceful fail, double-init guard, tryLoad timeout
- `src/components/AudioPanel.tsx`: volume sliderları + mute toggle (HUD'dan açılır)
- SFX: click (HUD), project_start (NewProjectModal), sleep (SleepOverlay), objective (objectiveStore), publish (PublishResult), npc (DialogueView)
- Müzik: StartScreen → menü loop, playing fazı → sahil ambiyans (fade geçişli)
- 8 audioStore + 4 soundService testi



### Antiquarian's Assistant Infrastructure (2026-06-02)
- `src/data/antiquarianShifts.ts`: interfaces + 3 full sessions (antiq_shift_01–03)
- `src/store/antiquarianStore.ts`: 4-phase state machine (briefing/search/identify/match), reward calculation, cross-store
- `src/pixi/AntiquarianScene.ts`: briefing display, location select, book grid, identify selectors, match UI

### Pub Garsonluk Altyapısı (2026-06-02)
- `src/data/pubShifts.ts`: tip tanımları + 3 tam vardiya (pub_shift_01–03)
- `src/store/pubStore.ts`: masa akışı, sipariş/pişirme/servis/başarısız, yanlış servis cezası, ödül hesaplama
- `src/pixi/ServiceScene.ts`: masa turu arayüzü, sabır barları, pişirme zamanlayıcısı, sipariş seçim paneli

### Bar Bodyguard Altyapısı (2026-06-02)
- `src/data/barShifts.ts`: tip tanımları + 3 tam vardiya (shift_01–03)
- `src/store/barStore.ts`: startShift, makeGuestDecision, triggerIncident, chooseTensionOption, endFight, endShift, ödül hesaplama
- `src/pixi/DoorScene.ts`: Papers Please kapı arayüzü, A/D klavye kısayolları
- `src/pixi/FightScene.ts`: yumruk dövüşü overlay, düşman otomatik saldırı, Z/sol tık

### Dedektif Asistanı Altyapısı (2026-06-02)
- `src/data/npcDialogues.ts`: analiz tohum tipi eklendi
- `src/store/ideaSeedStore.ts`: analiz sayacı eklendi
- `src/data/skillTree.ts`: analiz_t1/t2/t3 node'ları eklendi
- `src/pixi/rooms/parkRoom.ts`: park odası + RoomId'ye 'park' eklendi
- `src/data/detectiveCases.ts`: vaka veri modeli + 3 tam vaka (case_01–03)
- `src/store/detectiveStore.ts`: startCase, collectEvidence, advanceDay, makeAccusation, ödül dağıtımı
- `src/pixi/ExamineScene.ts`: zoom-in overlay, iç içe point&click kanıt inceleme

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

### NPC Kadrosu (2026-06-07 itibarıyla)
32 NPC: Felsefe 12/12 ✅ · Romantizm 12/12 (motor+veri ✅, UI/cutscene ❌) · Gamer kasabalı 4/4 ✅ · Minör kohort 4/4 ✅

### Sıradaki Büyük Görevler
- **Romantizm UI (C1 kalan)**: confess/date/propose butonları, itiraf/düğün cutscene, çiçekçi/kuyumcu jest maliyetleri
- Yan iş entegrasyonu: dedektif + bar + antiquarian için posta kutusu, harita girişleri
- Yaşam olayları içeriği: eski meslektaş (3-dallı), çocuk anları, tükenmişlik, yas
- DevTools otomatik açmayı production'dan kaldır (`electron/main.ts`)

---

## Teknik Notlar
- PixiJS v8.18.1, React 18 StrictMode, Electron + electron-vite
- `sessionId` pattern: Game.ts'de async init race condition'ı önler
- DevTools: `electron/main.ts`'de `openDevTools({ mode: 'detach' })` — production'da kaldır
- Harita yönü: kuzey yukarı (sahil), güney aşağı (şehir) — mevcut tasarımda ters görünüyor, oda mimarisinde düzelir
