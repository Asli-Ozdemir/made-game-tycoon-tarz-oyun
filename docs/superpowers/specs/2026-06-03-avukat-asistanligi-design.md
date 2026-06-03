# Avukat Asistanlığı Side Job — Tasarım Dokümanı

**Tarih:** 2026-06-03
**NPC:** Clara — Kurumsal Avukat (Kant — Evrensel Ahlak)
**Path:** Emek
**Seed:** `hukuk` (yeni)

---

## Genel Yapı

Standart 4-katman mimarisi:

```
src/data/lawyerShifts.ts         ← Statik veri
src/store/lawyerStore.ts         ← Zustand state machine
src/pixi/LegalScene.ts           ← Split-screen duruşma (PixiJS)
src/components/LawyerPanel.tsx   ← React orchestrator
```

`worldStore` `LocationId`'ye `'lawyers_office'` eklenir. `App.tsx`'e render bloğu eklenir.

---

## Session Yapısı

10 session, 3 arc:

| Arc | Sessions | Arc Sonu | Tema |
|---|---|---|---|
| `arc_indie` | 1, 2, 3 | Cross-exam | Küçük indie stüdyo davası |
| `arc_rival` | 4, 5, 6 | Cross-exam | Orta boy rakip, IP hırsızlığı |
| `arc_nexus` | 7, 8, 9, 10 | Cross-exam | Nexus/Crane, oyuncu stüdyosu hedef |

Session 3, 6, 10 `isArcEnd: true` — normal turns biter → **cross-examination** sahnesi (Clara rakip tanığa soru sorar, oyuncu 2 kart besler, yüksek riskli).

---

## Rakip Şirket Kataloğu

Her arc'ın karşı tarafı tycoon modunda tanıdık bir yüze dönüşür — Clara davaları sayesinde oyuncu rakip sahipleriyle erken tanışır.

| Arc | Rakip Şirket | Dava Konusu |
|---|---|---|
| `arc_indie` | PixelForge (küçük indie) | Telif/lisans ihlali |
| `arc_rival` | Ironclad Games (orta boy) | IP hırsızlığı, eleman transferi |
| `arc_nexus` | Nexus / Crane danışmanları | Oyuncu stüdyosunu hedef alan hukuki baskı |

---

## Mekanikler

### A) Argument Card Sistemi

Session başında oyuncuya 4–6 kart dağıtılır. Her kart **bir kez kullanılabilir** — kullanınca devre dışı kalır. Kaynak yönetimi: hangi kartı hangi turn için saklamalı?

```typescript
interface ArgumentCard {
  id: string
  label: string           // "Teknik Tanık", "Emsal Karar", "Prosedür İtirazı"
  type: 'legal' | 'technical' | 'emotional' | 'procedural'
  power: number           // 1–5, turn skoruna eklenir
  description: string     // kısa flavor text
}
```

Kart tipleri farklı turn tiplerine karşı avantajlı — yanlış eşleşme penalty almaz ama doğru eşleşme bonus verir.

### B) Turn Yapısı

Her session 5–8 `LegalTurn`. Her turda:
1. Rakibin statement'ı ekranda belirir (sol panel)
2. Oyuncu kart seçer veya pas geçer
3. Turn skoru hesaplanır (kart power ± tip bonusu)
4. Sonraki turn

```typescript
interface LegalTurn {
  id: string
  opponentStatement: string
  isCritical: boolean      // true → 8 saniyelik timer devreye girer
  hint?: string            // T1 ilişkide ipucu gösterilir
}
```

### C) Timing — Option C

- Normal turnler: süresiz, oyuncu istediğinde kart oynar
- `isCritical: true` turnler: 8 saniyelik timer — süre dolunca otomatik pas

Süre baskısı yalnızca kritik anlarda hissedilir; oyunun ritmi bozulmaz.

### D) Cross-Examination — sadece arc sonu

Normal turns biter → ayrı overlay açılır. Clara tanığa soru sorar; oyuncu 2 kart seçer (kalan kartlardan). Yüksek riskli: doğru seçim `argumentScore`'a +10, yanlış seçim -5.

---

## Veri Modeli

```typescript
export interface LawyerShift {
  id: string                   // 'lawyer_01' … 'lawyer_10'
  arcId: 'arc_indie' | 'arc_rival' | 'arc_nexus'
  isArcEnd: boolean
  caseTitle: string
  opponentName: string         // tycoon'da tekrar karşına çıkar
  opponentCompany: string
  turns: LegalTurn[]
  availableCards: ArgumentCard[]
  timeLimitSecs: number
  difficulty: 'easy' | 'normal' | 'hard'
  briefingLines: string[]      // placeholder — hikaye diğer PC'den gelecek
  resultLines: {
    good: string[]
    okay: string[]
    bad: string[]
  }
}
```

---

## Store (`lawyerStore.ts`)

### Phase State Machine

```
idle → briefing → session → [arc sonu: cross_exam] → result
```

Normal session: `session` biter → `result`.
Arc sonu session: `session` biter → `cross_exam` → `result`.

### State Alanları

```typescript
interface LawyerStoreState {
  completedShifts: string[]
  activeShift: LawyerShift | null
  phase: 'idle' | 'briefing' | 'session' | 'cross_exam' | 'result'
  usedCardIds: string[]        // bir kez kuralı
  currentTurnIndex: number
  argumentScore: number        // 0–100
  opponentScore: number        // AI karşı koyma gücü
}
```

### Actions

- `startShift(id)` — phase guard: activeShift null olmalı
- `advanceFromBriefing()` — briefing → session
- `playCard(cardId)` — usedCardIds'e ekle, skoru güncelle, turn ilerlet
- `skipTurn()` — turn ilerlet (pas)
- `advanceTurn()` — currentTurnIndex++; son turn ise session'ı bitir
- `recordCrossExamResult(cardIds)` — cross_exam → result, skor düzelt
- `endShift()` — result → idle, ödülleri dağıt, sıfırla
- `reset()`

Stale-closure kuralı: PixiJS callback'lerinde `lawyerStore.getState()` kullanılır.

---

## PixiJS Sahne (`LegalScene.ts`)

Split-screen (sol 60% / sağ 40%):

**Sol — Toplantı Odası:**
- Clara + karşı taraf avukatı masada oturur (Graphics dikdörtgenler + label)
- Aktif turn'de opponent statement kayarak belirir
- Clara'nın tepki animasyonu (renk pulse): oyuncunun kartına göre — iyi eşleşme yeşil, zayıf eşleşme sarı
- Cross-exam sahnesinde tanık sandalyesi eklenir

**Sağ — Oyuncunun Masası:**
- Kart grid (4–6 kart, tıklanabilir Graphics dikdörtgenler)
- Kullanılmış kartlar grileşir + üzeri çizilir
- Kartın üzerine gelince `description` tooltip

**Timer Bar:**
- Yalnızca `isCritical: true` turnlarda görünür
- Ekranın en üstünde, 8 saniye, kırmızıya döner

**Callbacks:**
- `onCardPlayed(cardId: string)` — oyuncu kart seçti
- `onTurnSkipped()` — oyuncu pas geçti
- `onSessionEnd()` — tüm turnler tamamlandı

Static `async create()` factory. Arrow function event handlers. `destroy()` cleanup.

---

## React Panel (`LawyerPanel.tsx`)

```
PanelPhase: 'briefing' | 'session' | 'cross_exam' | 'result'
```

- `briefing`: dava özeti, rakip şirket adı + sahibi, zorluk göstergesi, "Başla" butonu
- `session`: LegalScene canvas mount
- `cross_exam`: overlay — "Clara tanığa soruyor" başlık, kalan kartlar listelenir, 2 seçim zorunlu
- `result`: skor (argumentScore vs opponentScore), hukuk seed kazancı, tycoon ipucu satırı (rakip şirket sahibi hakkında)

`cancelled` flag: her `useEffect` cleanup'ında.

---

## Ödül Sistemi

Session sonu: `argumentScore` vs `opponentScore` karşılaştırılır.

| Tier | Koşul | hukuk | emek progress |
|---|---|---|---|
| İyi | argumentScore ≥ opponentScore + 15 | 3 | 5 |
| Orta | fark < 15, her iki yönde | 2 | 3 |
| Kötü | argumentScore < opponentScore | 1 | 1 |

Arc sonu bonus (cross_exam kazanılırsa): `hukuk` +1.
Session 10 bonus: `hukuk` +5.

---

## Yeni Seed: `hukuk`

`IdeaSeedType` union'ına `'hukuk'` eklenir.

```typescript
hukuk: {
  label: 'Hukuk',
  color: '#6366f1',
  emoji: '⚖️',
  description: 'Hukuki süreçlerde deneyim — telif, sözleşme ve anlaşmazlık maliyetlerini azaltır.'
}
```

Tycoon etkisi: telif davaları otomatik çözüm bonusu, personel anlaşmazlık olaylarında kötü sonuç ihtimali düşer, sözleşme maliyetleri azalır.

---

## Entegrasyon

- `worldStore.ts`: `LocationId`'ye `'lawyers_office'` eklenir
- `TriggerSystem.ts`: `LOCATION_MAP`'e `clara_door: 'lawyers_office'` eklenir
- `cityRoom.ts`: Clara ofisi trigger eklenir (ev yakası veya neon yaka — tasarım kararı implementasyona bırakılır)
- `PATH_NPC_MAP`: `emek: ['theo', 'soren', 'clara']` olarak güncellenir
- `App.tsx`: `currentLocation === 'lawyers_office'` bloğu + `LawyerPanel` import
- `npcDialogues.ts`: `IdeaSeedType`'a `'hukuk'` eklenir, `IDEA_SEED_META`'ya tanımı eklenir
- `ideaSeedStore.ts`: `EMPTY` sabitine `hukuk: 0` eklenir

---

## Hikaye

Tüm `briefingLines` ve `resultLines` placeholder. Hikaye içeriği diğer PC'den gelecek. Arc temaları:

- **arc_indie**: Küçük stüdyonun haksız yere köşeye sıkıştırılması — Clara sistemi içeriden görür
- **arc_rival**: IP hırsızlığı davası, Ironclad'ın sahibiyle karşı karşıya — tycoon'da tekrar görünür
- **arc_nexus**: Crane'in hukuki eli oyuncuya uzanıyor — Clara'nın neyi savunduğunu anlar

---

## Kapsam Dışı

- Hikaye içeriği (diğer PC)
- `hukuk` seed'inin tycoon sistemine tam entegrasyonu (ayrı tur)
- Ses efektleri
- Clara'nın NPC diyaloglarında bu arc'lara referans vermesi (diyalog sistemi ayrı)
