# Rex Arcade Side Job — Tasarım Dokümanı

**Tarih:** 2026-06-03
**NPC:** Rex — Arcade Sahibi (Kirenaik Hedonizm)
**Path:** Huzur
**Seeds:** `game_history` (yeni) + `nostalji`

---

## Genel Yapı

Standart 4-katman mimarisi:

```
src/data/arcadeShifts.ts       ← Statik veri
src/store/arcadeStore.ts       ← Zustand state machine
src/pixi/ArcadeShiftScene.ts   ← Müşteri + tamir (PixiJS)
src/pixi/RetroGameScene.ts     ← Split-screen retro oyun (PixiJS)
src/components/ArcadePanel.tsx ← React orchestrator
```

worldStore `LocationId`'ye `'arcade'` eklenir. App.tsx'e render bloğu eklenir.

---

## Session Yapısı

10 session, 3 arc:

| Arc | Sessions | Retro Oyun (arc sonu) | Tema |
|---|---|---|---|
| `arc_glory` | 1, 2, 3 | Pong | Şan günleri |
| `arc_denial` | 4, 5, 6 | Space Invaders | İnkâr |
| `arc_truth` | 7, 8, 9, 10 | Breakout | Gerçekle yüz yüze |

Session 3, 6, 10 `isArcEnd: true` — bu sessionlar normal shift'in ardından retro oyun + makine kapatma seçimi içerir.

---

## Mekanikler

### A) Token & Ödül Yönetimi

Müşteriler sıraya girer. Her müşterinin token talebi ve oyun sonrası beklediği ödül kategorisi var. Oyuncu:
1. Doğru miktarda token verir
2. Müşteri oynar (otomatik, animasyon)
3. Kazandığı puana göre ödül listesinden seçer

Yanlış ödül → müşteri mutsuzluğu → gerilim artar. Zorluk arttıkça müşteri sayısı ve özel istekler artar ("sadece büyük ödül istiyor", "aceleyle gidiyor").

Bu katman React'ta yönetilir (PixiJS değil) — metin ve buton ağırlıklı.

### B) Makine Tamiri (ArcadeShiftScene)

Her session 1–3 makine arızalı başlar. ArcadeShiftScene ekranında makine ızgarası görünür; arızalı makineler yanıp söner. Oyuncu arızalı makineye tıklar → basit tamir puzzle'ı açılır (PixiJS Graphics sürükle-bırak: kablo bağlantısı veya parça yerleştirme). Tamir edilmezse makine o gece kapalı kalır → daha az müşteri kapasitesi → skor düşer.

### C) Split-Screen Retro Oyun (RetroGameScene) — sadece arc sonu

Canvas ortadan ikiye bölünür. Sol: oyuncu. Sağ: Rex (AI). Aynı anda aynı oyunu oynarlar.

| Arc | Oyun | Mekanik |
|---|---|---|
| arc_glory | **Pong** | Paddle yukarı/aşağı, top karşıya geçirme |
| arc_denial | **Space Invaders** | Her taraf kendi sütununu savunur |
| arc_truth | **Breakout** | Her taraf kendi bloklarını kırar |

Rex AI zorluğu arc içinde sabit ama arc'lar arası artar. Rex bazen kasıtlı hata yapar — refleksler yavaşlıyor teması. Süre dolunca veya biri önce hedefine ulaşınca `onComplete(winner: 'player' | 'rex')` tetiklenir.

### D) Makine Kapatma Seçimi — sadece arc sonu

Retro oyun bittikten sonra Rex 2–3 makineyi gösterir. Oyuncu birini seçer. Seçim yalnızca hikayeyi etkiler (Rex diyaloğunu belirler). Gameplay etkisi yok.

---

## Ödül Sistemi

Session sonu iki puan toplanır: müşteri skoru + tamir skoru.

| Tier | Koşul | game_history | nostalji | huzur progress |
|---|---|---|---|---|
| İyi | Müşteri memnuniyeti yüksek + tüm makineler tamirli | 3 | 2 | 5 |
| Orta | Birinde eksik | 2 | 1 | 3 |
| Kötü | İkisinde de eksik | 1 | 0 | 1 |

Arc sonu bonus: Rex'i yenersen +1 `game_history`.
Session 10 bonus: `game_history` +5 (standart son-session bonusu).

---

## Veri Modeli (`arcadeShifts.ts`)

```typescript
export interface ArcadeCustomer {
  id: string
  name: string
  tokenRequest: number
  desiredPrizeTier: 'small' | 'medium' | 'large'
  isImpatient: boolean
}

export interface BrokenMachine {
  id: string
  label: string
  puzzleType: 'cable' | 'parts'
}

export interface ArcadeShift {
  id: string                  // 'arcade_01' … 'arcade_10'
  arcId: 'arc_glory' | 'arc_denial' | 'arc_truth'
  isArcEnd: boolean
  retroGame?: 'pong' | 'space_invaders' | 'breakout'
  customers: ArcadeCustomer[]
  brokenMachines: BrokenMachine[]
  machineChoices?: string[]   // arc sonu: kapatılacak makine seçenekleri
  timeLimitSecs: number       // ArcadeShiftScene sayacı
  briefingLines: string[]     // placeholder — hikaye diğer PC'den gelecek
  resultLines: {
    good: string[]
    okay: string[]
    bad: string[]
  }
  difficulty: 'easy' | 'normal' | 'hard'
}
```

---

## Store (`arcadeStore.ts`)

### Phase State Machine

```
idle → briefing → shift → [arc sonu: retro_game → machine_choice] → result
```

Normal session: `shift` biter → `result`.
Arc sonu session: `shift` biter → `retro_game` → `machine_choice` → `result`.

### State Alanları

```typescript
interface ArcadeStoreState {
  completedShifts: string[]
  activeShift: ArcadeShift | null
  phase: ArcadePhase
  customerScore: number        // 0–100
  repairScore: number          // 0–100
  retroWinner: 'player' | 'rex' | null
  machineChoice: string | null
}
```

### Actions

- `startShift(id)` — phase guard: activeShift null olmalı
- `advanceFromBriefing()` — briefing → shift
- `recordShiftResult(customerScore, repairScore)` — shift → retro_game veya result
- `recordRetroResult(winner)` — retro_game → machine_choice
- `chooseMachine(machineId)` — machine_choice → result
- `endShift()` — result → idle, ödülleri dağıt, sıfırla
- `reset()`

---

## PixiJS Scenes

### ArcadeShiftScene

- Makine ızgarası (4–6 makine, Graphics rectangles)
- Arızalı makineler kırmızı yanıp söner
- Tıkla → tamir overlay açılır (cable: iki noktayı bağla; parts: doğru parçayı yerine sürükle)
- Tamir tamamlanınca makine yeşile döner
- `onShiftEnd(customerScore, repairScore)` callback — shift süresi dolunca tetiklenir
- Müşteri token/ödül işlemleri React katmanında (canvas dışı)

### RetroGameScene

- Canvas ikiye bölünür (sol oyuncu, sağ Rex)
- Internal phase: `pong` | `space_invaders` | `breakout`
- Pong: W/S veya yukarı/aşağı ok, top fiziği
- Space Invaders: A/D hareket, space ateş — sadece oyuncunun sütunu
- Breakout: A/D paddle, top fiziği — sadece oyuncunun yarısı
- Rex AI: her arc'ta bir öncekinden yavaş hata oranı artar
- `onComplete(winner: 'player' | 'rex')` callback

---

## React Panel (`ArcadePanel.tsx`)

```
PanelPhase: 'briefing' | 'customer' | 'shift' | 'retro_game' | 'machine_choice' | 'result'
```

- `briefing`: session seçici (tamamlanmayanlar listelenir)
- `customer`: token + ödül seçimi (React UI, canvas yok)
- `shift`: ArcadeShiftScene canvas mount
- `retro_game`: RetroGameScene canvas mount (arc sonu)
- `machine_choice`: makine listesi, seçim butonları
- `result`: skor + seed özeti

Stale-closure kuralı: PixiJS callback'lerinde `arcadeStore.getState()` kullanılır.
`cancelled` flag: her `useEffect` cleanup'ında.

---

## Yeni Seed: `game_history`

`IdeaSeedType` union'ına `'game_history'` eklenir.
`ideaSeedData.ts`'de label, description, tycoon etkisi tanımlanır.
Tycoon etkisi: retro/nostaljik oyun türlerinde kalite bonusu (ör. Arcade, Bulmaca türlerine +%15).

---

## Entegrasyon

- `worldStore.ts`: `LocationId`'ye `'arcade'` eklenir
- `App.tsx`: `currentLocation === 'arcade'` bloğu + `ArcadePanel` import
- `lifePathData.ts`: rex zaten `huzur` listesinde — ek değişiklik yok
- `ideaSeedStore.ts` + `ideaSeedData.ts`: `game_history` eklenir

---

## Hikaye

Tüm `briefingLines` ve `resultLines` placeholder. Hikaye içeriği diğer PC'den gelecek. Arc temaları:

- **arc_glory**: Rex'in şan günleri, gurur, "o zamanlar..."
- **arc_denial**: Refleksler yavaşlıyor ama kabul etmiyor
- **arc_truth**: Kaçtığı acının yüzeye çıkması, ışıkları söndürme korkusu

---

## Kapsam Dışı

- Hikaye içeriği (diğer PC)
- `game_history` seed'inin tycoon sistemine tam entegrasyonu (ayrı tur)
- Retro oyunların ses efektleri
- Multiplayer / leaderboard
