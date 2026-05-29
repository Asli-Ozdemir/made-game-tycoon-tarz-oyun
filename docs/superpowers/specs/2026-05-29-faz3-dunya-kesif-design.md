# Faz 3 — Dünya / Keşif Design Spec
**Tarih:** 2026-05-29  
**Durum:** Onaylandı

---

## Vizyon

Oyuncunun tycoon arayüzünden çıkıp gerçek bir dünyada yürüdüğü keşif modu. Stardew Valley gibi zaman yavaş akar, aksiyonlar saatleri tüketir, gece olunca uyumak zorundasın. PixiJS tile-based dünyada karakter yürür, lokasyonlara fiziksel olarak gider. Masana oturduğunda mevcut tycoon arayüzü overlay olarak açılır — dünya arka planda donmuş, karartılmış olarak görünür.

**Bu fazda yürüyüş devreye giriyor** — Faz 3.5 planı iptal edildi, tam PixiJS dünya Faz 3'te implement edilir.

---

## Mimari

### Katman Sistemi

```
Electron Window
├── <canvas>               ← PixiJS (her zaman render ediyor)
│   ├── Tiled harita
│   ├── Karakter sprite
│   └── NPC'ler (statik, Faz 4'te canlı)
└── <div id="ui-layer">    ← React (position: absolute, top: 0, left: 0)
    ├── HUD                ← her zaman görünür (saat, para, mod)
    ├── CafePanel          ← kafe trigger'ında açılır
    ├── FairPanel          ← fuar trigger'ında açılır (sezonluk)
    └── TycoonOverlay      ← masa trigger'ında açılır (mevcut Dashboard)
```

Mod geçişi `pointer-events` ile yönetilir:
- **Exploration modu:** Canvas tüm inputu alır, TycoonOverlay `pointer-events: none`
- **Tycoon modu:** Canvas `pointer-events: none` + `opacity: 0.6`, TycoonOverlay `pointer-events: all`

### App.tsx Değişimi

```tsx
<div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
  <GameCanvas />
  <HUD />
  {gameMode === 'tycoon' && <TycoonOverlay />}
  {currentLocation === 'cafe' && <CafePanel />}
  {currentLocation === 'fair' && <FairPanel />}
</div>
```

Mevcut Dashboard, ProjectCard, EmployeePanel bileşenlerine dokunulmaz.

---

## Yeni Dosya Yapısı

```
src/
├── pixi/
│   ├── Game.ts            ← PixiJS Application init, game loop
│   ├── WorldScene.ts      ← Tiled harita yükleme, kamera takibi
│   ├── Player.ts          ← Karakter hareket, animasyon, input
│   ├── TriggerSystem.ts   ← Tile trigger tespiti → store event
│   └── assets/
│       ├── tileset.png
│       ├── player.png     ← 4 yön × 4 frame spritesheet
│       └── city.tmx       ← Tiled harita dosyası
├── components/
│   ├── GameCanvas.tsx     ← <canvas> wrapper, PixiJS mount/unmount
│   ├── HUD.tsx            ← Saat, para, mod göstergesi
│   ├── CafePanel.tsx
│   └── FairPanel.tsx
└── store/
    ├── worldStore.ts
    └── timeStore.ts
```

---

## Zustand Store'lar

### worldStore

```ts
type WorldStore = {
  gameMode: 'exploration' | 'tycoon'
  currentLocation: 'cafe' | 'fair' | null
  setGameMode: (mode: 'exploration' | 'tycoon') => void
  setLocation: (loc: 'cafe' | 'fair' | null) => void
}
```

### timeStore

```ts
type TimeStore = {
  hour: number      // 9–23; 24'e ulaşınca endDay() otomatik tetiklenir
  minute: number    // 0–59
  day: number       // 1–7
  week: number
  isPaused: boolean // tycoon modunda true — zaman ilerlemez
  advanceTime: (hours: number) => void
  endDay: () => void  // weeklyTick'i tetikler (7. günde)
}
```

`weeklyTick` yalnızca `endDay()` üzerinden tetiklenir. Direkt çağrı yok.  
Tycoon moduna girildiğinde `isPaused = true` set edilir; çıkılınca `false`. Zaman game loop'ta her frame `isPaused` kontrolü yaparak ilerler.

---

## Harita

- Boyut: ~40×30 tile, tile boyutu 32px → 1280×960px dünya
- Editör: Tiled (geliştirici aracı, repo'ya commit edilmez)
- Format: `.tmx` (XML tabanlı)
- Paket: `@pixi/tilemap`

### Harita Katmanları

| Katman | İçerik |
|--------|--------|
| `ground` | Zemin tile'ları |
| `decoration` | Ağaçlar, objeler |
| `collision` | Geçilemeyen tile'lar |
| `triggers` | Özel tile'lar — lokasyon girişleri |

### Trigger Tile'ları

| Trigger ID | Aksiyon |
|-----------|---------|
| `studio_desk` | `gameMode = 'tycoon'` |
| `cafe_door` | `currentLocation = 'cafe'` |
| `fair_entrance` | `currentLocation = 'fair'` (sezon aktifse) |
| `rival_door` | Toast: "Faz 4'te açılacak" |
| `investor_door` | Toast: "Faz 4'te açılacak" |
| `arcade_door` | Toast: "Faz 4'te açılacak" |

---

## Karakter

- WASD veya ok tuşları ile hareket
- Spritesheet: 4 yön (up/down/left/right) × 4 yürüyüş frame
- Kamera karakteri takip eder (viewport ortalama)
- Tycoon modunda tüm input dondurulur
- Gece 00:00'da otomatik stüdyoya ışınlanır

---

## Zaman Sistemi

Stardew Valley mantığı:

| Kural | Değer |
|-------|-------|
| Günlük başlangıç | 09:00 |
| Günlük bitiş | 00:00 (ertesi gün) |
| Gerçek süre | 1 oyun saati ≈ 2 dakika gerçek zaman |
| Yürümek | Zaman tüketmez |
| Aksiyonlar | Zaman tüketir (aşağıda) |
| Gece 00:00 | `endDay()` → uyku, stüdyoya ışınlan |
| 7. gün sonu | `weeklyTick` tetiklenir |

### Aksiyon Zaman Maliyeti

| Aksiyon | Maliyet |
|---------|---------|
| Kafede tanışma | 1 saat |
| Dedikodu dinle | 1 saat |
| Fuarda demo sun | 2 saat |
| Fuarda rakipleri izle | 1 saat |
| Tycoon modunda çalışma | Zaman duruyor (`isPaused = true`); haftalık tick yine de günlük bazda birikir |

---

## Lokasyon Ekranları

### 🏢 Stüdyo — Masa

Stüdyo binasının içi ana şehir haritasının bir bölümüdür (ayrı scene yok). Karakter kapıdan girer, iç mekana geçer, masaya dokunur:
- `gameMode = 'tycoon'` → mevcut React Dashboard overlay açılır
- Canvas `opacity: 0.6`, `pointer-events: none`
- ESC veya "Masadan Kalk" butonu → `gameMode = 'exploration'`

### ☕ Kafe

`CafePanel` — minimal React overlay:
- Günlük 2–3 NPC kartı (isim, kısa tanım)
- **Tanış** → 1 saat harcar, `generateCandidates` çağrılır, aday havuzuna eklenir
- **Dedikodu dinle** → 1 saat, random sektör trendi toast gösterir
- Kapat → `currentLocation = null`

### 🎮 Oyun Fuarı

Her 8 haftada bir aktif. Kapalıyken kapıya yaklaşınca "X gün sonra açılıyor" toast.

`FairPanel` — aktif sezon:
- **Demo sun** → 2 saat, tamamlanmış oyunlar listesi, seçilen oyuna hype bonusu
- **Rakipleri izle** → 1 saat, rakip oyun puanı açıklanır (random, Faz 4'te gerçek rakip sistemi)
- **Ödül töreni** (sezonun son günü) → en yüksek hype puanlı oyun ödül alır, satış bonusu

### 🔒 Diğer 3 Lokasyon (Placeholder)

Haritada görünür ve gezilebilir. Kapıya yaklaşınca isim tooltip. Girmek → `"[İsim] — Faz 4'te açılacak"` toast.

---

## Hata Yönetimi

| Durum | Davranış |
|-------|---------|
| Asset yükleme hatası | PixiJS loader callback'te yakalanır, hata ekranı gösterilir |
| `weeklyTick` çift tetik | Mümkün değil — sadece `endDay()` tetikler |
| Tycoon modunda klavye inputu | `Player.ts` `gameMode` dinler, `tycoon`'da input handler'lar devre dışı |
| Fuar kapalıyken trigger | Toast gösterilir, panel açılmaz |

---

## Test Yaklaşımı

| Alan | Yöntem |
|------|--------|
| `timeStore` | Unit test — `advanceTime`, `endDay`, `weeklyTick` tetiklenme |
| `TriggerSystem` | Unit test — koordinat → trigger eşleşmesi |
| `worldStore` | Unit test — mod geçişi state akışı |
| `CafePanel` / `FairPanel` | React Testing Library |
| PixiJS render / animasyon | Manuel test — Electron'da görsel doğrulama |

---

## Paket Değişiklikleri

**Eklenecek:**
- `pixi.js`
- `@pixi/tilemap`

**Değiştirilmeyecek:** Mevcut tüm paketler, React, Zustand, Electron, SQLite.

---

## Kapsam Dışı (Bu Faz)

- Karakter yaratma / arkaplan seçimi (Faz 4)
- NPC'lerin haritada yürümesi (Faz 4)
- Gerçek diyalog sistemi (Faz 4)
- Rakip şirket mekanikleri (Faz 4)
- Yatırımcı ofisi, Rakip stüdyo, Arcade etkileşimleri (Faz 4)
- Ses / müzik
- Kaydedilmiş dünya state'i (karakter pozisyonu SQLite'a) — Faz 3 sonunda eklenebilir
