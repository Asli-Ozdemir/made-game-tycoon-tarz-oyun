# Balıkçı Yan İşi — Fishing Mechanic Design

**Tarih:** 2026-06-02
**NPC:** Remy (balıkçı, Huzur Yolu)
**Konum:** `balikci` world location
**Seed çıktısı:** nostalji + hikaye → huzur yolu progress

---

## Bağlam

Macenta Koyu'nun mevcut yan işleri şu pattern'ı takip eder:

| İş | Mekanik özeti | Data dosyası | Store |
|---|---|---|---|
| Pub garsonluk | Masa yönetimi, sipariş hafıza | `pubShifts.ts` | `pubStore` |
| Sahaf arşiv | Kitap toplama → tanımlama → eşleştirme | `antiquarianShifts.ts` | `antiquarianStore` |
| Bar bodyguard | Misafir kural kontrolü + gerilim yönetimi | `barShifts.ts` | `barStore` |
| Dedektif asistanlığı | Kanıt zinciri → şüpheli sorgulama → suçlama | `detectiveCases.ts` | `detectiveStore` |

**Balıkçı** bu pattern'ın içine girer:
- `fishingSessions.ts` — 10 session data
- `fishingStore.ts` — state machine
- `FishingScene.ts` — PixiJS mini-scene
- `BalikciPanel.tsx` — güncellenmiş panel (3 phase)

---

## Tasarım Kararları (onaylı)

1. **Phase yapısı:** `briefing → fishing → result`
2. **Core mechanic:** jigging (sol tık ritmi) + scroll reel; spot + lure seçimi
3. **Derinlik:** dedektif seviyesi — session başına 3–4 cast, cast aralarında Remy story beat + dialogue choice
4. **10 session:** 3 story arc boyunca Remy'nin geçmişi açılıyor
5. **Reward:** nostalji + hikaye seeds, huzur path progress

---

## Core Loop (tek session içi)

```
briefing
  └─ Remy konuşur, bugünkü koşulları anlatır
     (story arc'ın bu bölümünü kurar)

fishing (3–4 cast döngüsü)
  ├─ Spot seçimi (2–3 seçenek, Remy'nin ipucu var)
  ├─ Lure seçimi (3 seçenek)
  ├─ Jigging phase
  │    ├─ Sol tık → lure yukarı sıçrar + batar
  │    ├─ Ritim göstergesi: optimal interval (Remy öğretti)
  │    ├─ Fish interest bar dolar / boşalır
  │    └─ Eşiğe gelince: bite tetiklenir
  ├─ Reel phase
  │    ├─ Scroll yukarı = sarma
  │    ├─ Gerilim barı: too fast → ip kırılır, too slow → balık kaçar
  │    └─ Sweet spot → balık tutuldu
  └─ Cast arası: Remy bir story beat anlatır, dialogue choice çıkar
       (seçim → fragment unlock veya boş)

result
  ├─ Yakalanan balıklar log'da (dedektifin evidence listesi gibi)
  ├─ Unlocked story fragment'lar gösterilir
  └─ Seed + progress ödülü
```

---

## Data Yapıları

```typescript
// src/data/fishingSessions.ts

export interface FishingSpot {
  id:        string
  label:     string     // "Open Water", "Rocky Edge", "Pier Tip"
  hint:      string     // Remy'nin bu yerle ilgili söylediği şey
  fishTypes: string[]   // bu noktadan tutulabilecek balık türleri
}

export interface Lure {
  id:         string
  label:      string    // "Live Bait", "Metal Spoon", "Soft Lure"
  targetFish: string[]  // bu yeme gelen balık türleri
}

export interface JiggingProfile {
  optimalIntervalMs: number  // iki tık arası ideal süre (ms)
  toleranceMs:       number  // sapma toleransı
  rhythmLabel:       string  // "Slow and steady" / "Quick short twitches"
}

export interface StoryBeat {
  id:      string
  text:    string  // Remy'nin bu sırada söylediği
  choices: {
    id:         string
    text:       string
    fragmentId: string | null  // null = fragment yok
  }[]
}

export interface FishingSession {
  id:              string          // 'fishing_01' ... 'fishing_10'
  arcId:           string          // 'arc_lighthouse' | 'arc_storm' | 'arc_family'
  briefingText:    string          // Remy'nin açılış cümlesi
  spots:           FishingSpot[]
  lures:           Lure[]
  castCount:       number          // 3 veya 4
  jiggingProfile:  JiggingProfile
  storyBeats:      StoryBeat[]     // cast aralarında sırayla verilir
  difficulty:      'easy' | 'normal' | 'hard'
}

export type CaughtFish = {
  spotId:  string
  lureId:  string
  species: string
}
```

---

## 10 Session — 3 Story Arc

Remy'nin geçmişi 3 bölümde açılır. Her arc 3–4 session. Zorluk kademeli artar.

### Arc 1: The Lighthouse (Sessions 1–3)
Remy'nin büyüdüğü deniz feneri. Babasıyla ilişkisi.

| # | castCount | Spots | Zorluk | Story |
|---|---|---|---|---|
| 01 | 3 | 1 (open water) | easy | Remy çocukken fener kulesi. Babası ilk olta atmayı öğretiyor. |
| 02 | 3 | 2 | easy | Babasının favori tutma noktası. O yerde ne hissetti. |
| 03 | 4 | 2 | normal | Babasının ayrılmadan önceki son sefer. Sessizlik. |

### Arc 2: The Storm (Sessions 4–6)
Onbeş yıl önce kasabayı vuran fırtına. Remy'nin mürettebatı, verilen kararlar.

| # | castCount | Spots | Zorluk | Story |
|---|---|---|---|---|
| 04 | 3 | 3 (tümü açık) | normal | Fırtına öncesi son sakin gün. Mürettebat güler. |
| 05 | 4 | 3 | hard | Fırtınanın ortasında alınan karar. Hızlı jigging. |
| 06 | 4 | 3 | hard | Kayıplar. Kim gitti, kim kaldı. Balık zor gelir. |

### Arc 3: The Family (Sessions 7–10)
Remy'nin kızı. Neden kıyıda kaldı. Ne umduğu.

| # | castCount | Spots | Zorluk | Story |
|---|---|---|---|---|
| 07 | 4 | 3 | normal | Kızından bahseder. Sesi değişir. |
| 08 | 4 | 3 | hard | Uzaklaşma. Kızı şehre gitti. |
| 09 | 4 | 3 | hard | Yeniden görüşme denemesi. Sonucu belirsiz. |
| 10 | 3 | 2 | normal | Kabul. "Burada olmayı seçtim." Full arc tamamlanır. |

---

## PixiJS Scene — FishingScene

Pier'dan **yan görünüm** (side view):

```
[ Gökyüzü gradient ]
[ Uzak deniz + ufuk ]
[ Pier tahtaları (yatay) ]
[ Remy silueti — oturuyor ]
  |
  | ← fishing line (Graphics, frame-by-frame çizilir)
  |
[ Su yüzeyi — hafif dalgalanma ]
  |
  🪝 ← lure sprite (jigging'de yukarı/aşağı)
  🐠 ← balık gölgesi (interest bar threshold'dan sonra görünür, lure'a yaklaşır)
```

**UI overlays (PixiJS Container):**
- **Sol üst:** Jigging ritim göstergesi — metronom tarzı pulse, optimal interval renkli bölge
- **Sağ:** Fish interest bar (jigging phase) / Tension bar (reel phase) — aynı konum, farklı state
- **Alt sol:** Remy portrait + konuşma balonu (story beat + choice butonları)
- **Üst orta:** Cast #N / castCount + yakalanan balık sayısı
- **Sağ alt:** Seçili spot + lure etiketi

**Input:**
- `mousedown` (left) → jig event, timestamp kaydet → interval hesapla → interest bar güncelle
- `wheel` (reel phase) → scroll delta → tension bar güncelle → catch/fail kararı

---

## fishingStore — Phase State Machine

```
idle
  └─[startSession]→ briefing
briefing
  └─[advanceFromBriefing]→ spot_select
spot_select
  └─[selectSpot]→ lure_select
lure_select
  └─[selectLure]→ jigging
jigging
  ├─[recordJigClick]→ jigging (interest bar günceller)
  └─[triggerBite]→ reeling
reeling
  ├─[recordScroll]→ reeling (tension bar günceller)
  ├─[lineBroke | fishEscaped]→ cast_end (miss)
  └─[fishCaught]→ cast_end (hit)
cast_end
  ├─[morecastsLeft]→ story_beat
  └─[lastCast]→ result
story_beat
  └─[chooseDialogue]→ spot_select
result
  └─[endSession]→ idle
```

**FishingPhase union:**
```typescript
type FishingPhase =
  | 'idle'
  | 'briefing'
  | 'spot_select'
  | 'lure_select'
  | 'jigging'
  | 'reeling'
  | 'cast_end'
  | 'story_beat'
  | 'result'
```

**Bite tetikleme:** Interest bar 100'e ulaşınca store otomatik `triggerBite()` çağırır → phase `jigging → reeling`.

**Cast sonu akışı:** Son cast (currentCastIndex === castCount - 1) tamamlandığında doğrudan `result` phase'e geçilir; ara castlar `story_beat` phase'e geçer, seçim yapılınca `spot_select`'e döner.

**Store state:**
```typescript
interface FishingStoreState {
  completedSessions: string[]
  activeSession:     FishingSession | null
  phase:             FishingPhase
  currentCastIndex:  number
  selectedSpotId:    string | null
  selectedLureId:    string | null
  jigTimestamps:     number[]       // son N tık zamanı → interval hesabı
  interestBar:       number         // 0–100; 100'de bite tetiklenir
  tensionBar:        number         // 0–100; 40–60 sweet spot, >80 = kopma, <20 = kaçma
  catchLog:          CaughtFish[]
  unlockedFragments: string[]
  storyBeatIndex:    number         // storyBeats[storyBeatIndex] cast_end'de gösterilir
}
```

---

## Reward Hesabı

| Performans | nostalji | hikaye | huzur progress |
|---|---|---|---|
| 0 balık | +1 | +0 | +1 |
| 1–2 balık | +2 | +1 | +3 |
| 3+ balık | +3 | +2 | +5 |
| +story fragment unlocked | — | +1 bonus | — |

Session 10 tamamlandığında (Remy arc tam): `hikaye +5` ek bonus.

---

## Dosya Listesi (implementasyon)

```
src/data/fishingSessions.ts          — 10 session data
src/store/fishingStore.ts            — state machine
src/pixi/scenes/FishingScene.ts      — PixiJS mini-scene
src/components/BalikciPanel.tsx      — mevcut stub'ı replace et
```

`worldStore.ts`'e `'balikci'` zaten ekli.

---

## Kapsam Dışı

- Balık türleri için ayrı katalog/collection sistemi (ileride Rex ile bağlanabilir)
- Hava durumu / mevsim etkisi (scope creep)
- Multiplier effect on game quality (Huzur yolu skill tree zaten hallediyor)
