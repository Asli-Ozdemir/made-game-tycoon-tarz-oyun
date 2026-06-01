# Faz 4C — Rakip Şirket Arc'ı: Tasarım Dokümanı

**Tarih:** 2026-05-29  
**Kapsam:** İki alt faz — 4C-1 (altyapı) + 4C-2 (olaylar ve çözüm)  
**Önceki faz:** 4B — Ara Sahne Sistemi  
**Sonraki faz:** 4D (belirlenmedi)

---

## Genel Bakış

Oyuncunun stüdyosu büyüdükçe sektördeki diğer şirketlerle dinamik bir rekabet ilişkisi kurulur. Başlarda oyuncuyu takmayan rakipler, belirli eşiklere ulaşıldığında fark eder, rekabete girer ve nihayetinde çatışma bir çözüm seçeneğiyle sonuçlanır. Sistem iki alt fazda hayata geçirilir.

---

## Alt Faz 4C-1: Altyapı

### Rakip Şirketler

6 sabit (pre-defined) rakip + oyun başında üretilen 4 prosedürel indie rakip.

**Sabit Rakipler:**

| ID | İsim | Tier | Kişilik | noticeThreshold (fame) | isFormerEmployer |
|---|---|---|---|---|---|
| `nexus` | Nexus Games | major | aggressive | 80,000 | ✅ |
| `pixelforge` | PixelForge | mid | friendly | 20,000 | ❌ |
| `ironclad` | Ironclad Studios | mid | aggressive | 25,000 | ❌ |
| `starlight` | Starlight Interactive | mid | secretive | 30,000 | ❌ |
| `tinyworlds` | Tiny Worlds | indie | friendly | 5,000 | ❌ |
| `glitchlab` | Glitch Lab | indie | defensive | 8,000 | ❌ |

**Prosedürel indie rakipler:** `initRivals()` sırasında 4 adet üretilir. Rastgele isim (ön ek + son ek kombinasyonu), rastgele kişilik, düşük threshold (1,000–4,000 fame).

### Veri Tipleri

**`src/types/rival.ts`**

```typescript
export type RivalTier = 'indie' | 'mid' | 'major'
export type RivalPersonality = 'aggressive' | 'friendly' | 'defensive' | 'secretive'
export type RelationshipStatus =
  | 'unknown'    // henüz fark etmedi
  | 'noticed'    // fark etti
  | 'rival'      // aktif rekabet
  | 'nemesis'    // düşman
  | 'ally'       // müttefik (merge için önkoşul)
  | 'merged'     // birleşildi (oyun biter)
  | 'destroyed'  // yok edildi

export interface RivalGame {
  id: string
  title: string
  genre: string
  score: number        // 1–100
  revenue: number
  releasedYear: number
}

export interface RivalCompany {
  id: string
  name: string
  tier: RivalTier
  personality: RivalPersonality
  foundedYear: number
  genres: string[]
  relationship: RelationshipStatus
  fame: number
  revenue: number
  games: RivalGame[]
  noticeThreshold: number
  isFormerEmployer: boolean
  isProcedural: boolean
}

export type NewsType =
  | 'rival_release'
  | 'rival_award'
  | 'rival_scandal'
  | 'rival_notice'
  | 'player_mention'

export interface NewsItem {
  id: string
  type: NewsType
  rivalId: string | null
  text: string
  year: number
  month: number
  seen: boolean
}

export type ResolutionChoice = 'buyout' | 'destroy' | 'forgive' | 'merge'

export interface AwardsNominee {
  name: string      // oyun adı
  studio: string    // stüdyo adı
  score: number
  isPlayer: boolean
}

export interface AwardsEvent {
  year: number
  nominees: AwardsNominee[]
  winnerId: string  // 'player' veya rivalId
}
```

### Store: `src/store/rivalStore.ts`

```typescript
interface RivalStore {
  rivals: RivalCompany[]
  lastSimYear: number
  pendingResolution: { rivalId: string } | null

  initRivals: () => void
  simulateYear: (currentYear: number) => void
  noticeCheck: (playerReputation: number) => void
  escalationCheck: () => void                      // nemesis kontrolü, noticeCheck'ten ayrı
  setRelationship: (rivalId: string, status: RelationshipStatus) => void
  resolveRival: (rivalId: string, choice: ResolutionChoice) => void
  clearPendingResolution: () => void
  reset: () => void
}
```

**`initRivals()`:** Sabit 6 rakibi başlangıç değerleriyle yükler, `generateProceduralRivals(4)` ile 4 indie ekler. `lastSimYear = 0`.

**`simulateYear(year)`:**
- `year === lastSimYear` ise çıkar (çift tetik önlemi)
- Her rakip için genres'ten rastgele bir oyun üretir:
  - score: `indie` → 30–70, `mid` → 40–80, `major` → 50–90 (uniform random)
  - revenue: `score × tier_multiplier` (indie: 500, mid: 2000, major: 8000)
- `newsStore.addItem()` ile `rival_release` haberi
- Her rakip için %15 ihtimalle (`aggressive` kişilik: %25) `rival_scandal` haberi
- `lastSimYear = year`

**`noticeCheck(playerFame)`:**
- `relationship === 'unknown'` olan tüm rakipler kontrol edilir
- `playerFame >= noticeThreshold` ise `relationship = 'noticed'`
- `newsStore.addItem()` ile `rival_notice` haberi
- `isFormerEmployer === true` olan rakip için: `cutsceneStore.getState().startCutscene('nexus_notice')` (Faz 4C-2 sahnesi; Faz 4C-1'de stub olarak tanımlanır)

**`resolveRival(rivalId, choice)`:**
- `buyout` → `relationship = 'destroyed'`, `gameStore.addMoney(-2_000_000)`
- `destroy` → `relationship = 'destroyed'`
- `forgive` → `relationship = 'ally'`
- `merge` → `relationship = 'merged'` (yalnızca `ally` ise izin verilir)
- `newsStore.addItem()` ile `player_mention`

### Store: `src/store/newsStore.ts`

```typescript
interface NewsStore {
  items: NewsItem[]
  unreadCount: number

  addItem: (item: Omit<NewsItem, 'id' | 'seen'>) => void
  markSeen: (id: string) => void
  markAllSeen: () => void
  reset: () => void
}
```

- `items` maksimum 50 tutulur; yeni eklenince en eski düşer
- `unreadCount`: `items.filter(i => !i.seen).length` ile hesaplanır
- `addItem` öncesinde `crypto.randomUUID()` ile id üretilir

### Entegrasyon Noktaları (4C-1)

**`Dashboard.tsx`:**
```typescript
// useEffect — yıl değişiminde simülasyon
useEffect(() => {
  rivalStore.simulateYear(currentYear)
}, [currentYear])

// handlePublish sonrası
rivalStore.noticeCheck(gameStore.reputation)
```

**`App.tsx`:** Değişiklik yok (4C-1'de yeni ekran eklenmez).

**`CharacterCreationWizard.tsx`:** handleFinalize içinde `rivalStore.initRivals()` çağrısı eklenir.

**`Dashboard.tsx` handleNewGame:**
```typescript
rivalStore.reset()
newsStore.reset()
```

### UI Bileşenleri (4C-1)

**`src/components/NewsFeed.tsx`**
- Dashboard'un sağ köşesine sabit küçük panel
- `newsStore.items` listeler (en yeni üstte, max 10 görünür)
- Okunmamış → bold, okunmuş → soluk
- Item'a tıklayınca `markSeen(id)` çağrılır
- "Tümünü okundu işaretle" linki → `markAllSeen()`
- Başlığın yanında `unreadCount > 0` ise kırmızı badge

**`src/components/RivalsPanel.tsx`**
- Dashboard'a yeni "Rakipler" sekmesi
- Her rakip satır: isim, tier yıldızları (★), fame, relationship badge (renk kodlu)
- `relationship` renkleri: `unknown` → gri, `noticed` → sarı, `rival` → turuncu, `nemesis` → kırmızı, `ally` → yeşil, `merged`/`destroyed` → soluk italik
- Küçük indie rakipler için "Hamle Yap" butonu aktif
- Büyük rakipler (mid/major) için buton disabled, tooltip: "Henüz zamanı değil"

---

## Alt Faz 4C-2: Olaylar ve Çözüm

### Yeni Cutscene ID'leri

`src/types/cutscene.ts` içindeki `CutsceneId` genişletilir:

```typescript
export type CutsceneId =
  | 'kovulma'
  | 'ilk_yayin'
  | 'nexus_notice'
  | 'awards_win'
  | 'awards_lose_to_nexus'
  | `rival_resolution_${string}`  // dinamik: rivalId'ye göre
```

### Awards Sistemi

**`src/store/awardsStore.ts`**

```typescript
interface AwardsStore {
  history: AwardsEvent[]
  pendingEvent: AwardsEvent | null

  checkAwards: (year: number, playerBestGame: { name: string; score: number } | null) => void
  clearPending: () => void
  reset: () => void
}
```

**`checkAwards(year, playerBestGame)`:**
- `dayTimeStore.month === 12` kontrolü dışarıda (Dashboard.useEffect) yapılır
- O yılki tüm rakip oyunları + oyuncunun o yıl çıkardığı en yüksek skorlu oyun karşılaştırılır
- En yüksek skorlu 3 aday → `pendingEvent` set edilir
- Kazanan belirlenir: `isPlayer === true` ise `cutsceneStore.startCutscene('awards_win')` çağrılır; Nexus kazanırsa `awards_lose_to_nexus`

**Arka Plan Varyasyonu (`awards_win` sahnesi):**

`characterStore.background` (`BackgroundId`) değerine göre `CutsceneFrame.background` alanı değişir:
- `kk_uzmani` → `'server_room'` (yeni background tipi)
- `yaratici_direktor` → `'gallery'` (yeni background tipi)
- `bas_muhendis` → `'server_room'` (yeni background tipi)
- `yapimci` → `'boardroom'` (yeni background tipi)
- `eski_ceo` → `'boardroom'` (yeni background tipi)

`CutsceneFrame.background` tipi genişletilir: `'office' | 'bedroom' | 'studio' | 'server_room' | 'gallery' | 'boardroom'`

Bu varyasyon `cutscenes.ts` içinde `awards_win` sahnesi `frames` dizisi olarak tanımlanır (her background için ayrı frame, yalnızca biri gösterilir).

> **Not:** `CutscenePlayer.tsx`'in `background` prop'u `'office' | 'bedroom' | 'studio'` dışındaki değerleri destekleyecek şekilde genişletilir.

### Resolution Ekranı

**`src/components/ResolutionScreen.tsx`**

Tam ekran `fixed inset-0 z-50` — `CutscenePlayer` ile aynı katman, onu takip eder.

```
┌───────────────────────────────────────────────────┐
│                                                   │
│   [Rakip logo/silüet]                             │
│   Nexus Games bir hamle bekliyor.                 │
│                                                   │
│   ┌─────────────┐  ┌─────────────┐               │
│   │  Satın Al   │  │   Yok Et    │               │
│   │ $2,000,000  │  │ Skandalını  │               │
│   │  gerekli    │  │   ifşa et   │               │
│   └─────────────┘  └─────────────┘               │
│   ┌─────────────┐  ┌─────────────┐               │
│   │    Affet    │  │   Birleş    │               │
│   │  Geç ve unut│  │ (ally ise   │               │
│   │             │  │  mümkün)    │               │
│   └─────────────┘  └─────────────┘               │
│                                                   │
└───────────────────────────────────────────────────┘
```

- `buyout` için yeterli para yoksa buton disabled
- `merge` için `relationship !== 'ally'` ise disabled
- Seçim sonrası: `rivalStore.resolveRival(rivalId, choice)` → `cutsceneStore.startCutscene('rival_resolution_...')` → sahne bitince `ResolutionScreen` kapanır

**`App.tsx` entegrasyonu:**
```tsx
if (activeCutscene)  return <CutscenePlayer />
if (pendingResolution) return <ResolutionScreen />
```

`pendingResolution`: `rivalStore` içinde `pendingResolution: { rivalId: string } | null` alanı.

### Büyük Rakip Resolution Tetikleyicisi

`noticeCheck` içinde, `isFormerEmployer` olan rakip `'nemesis'` ilişkisine ulaşınca (ayrı bir `escalationCheck` fonksiyonu):
- `rivalStore.pendingResolution = { rivalId: 'nexus' }` set edilir
- `App.tsx` bunu izler ve `ResolutionScreen` render eder

`relationship` `'nemesis'` olma koşulu: player awards'ı kazanınca ve Nexus `'rival'` durumundaysa otomatik escalate edilir.

### Asistan Entegrasyonu

Asistan aktifken `rivalStore.rivals`'dan context okunur:

```typescript
const noticedRivals = rivals.filter(r => r.relationship !== 'unknown')
// Mesaj şablonları:
// noticed: "Dikkat: {name} sizi fark etti."
// rival:   "{name} sizinle aynı türde oyun çıkardı, dikkatli olun."
// nemesis: "{name} sizi geçmeye çok yakın."
```

---

## Test Stratejisi

### `tests/store/rivalStore.test.ts`
1. `initRivals` — 6 sabit + 4 prosedürel rakip yüklenir
2. `simulateYear` — her rakip için oyun üretilir, news eklenir
3. `simulateYear` — aynı yıl iki kez çağrılınca çift tetik olmaz
4. `noticeCheck` — threshold'un altında fark etmez
5. `noticeCheck` — threshold'a ulaşınca `noticed` olur, news eklenir
6. `noticeCheck` — `isFormerEmployer` threshold'a ulaşınca cutscene tetiklenir
7. `resolveRival buyout` — ilişki `destroyed`, revenue düşer
8. `resolveRival merge` — `ally` değilse hata, `ally` ise `merged` olur
9. `reset` — tüm state temizlenir

### `tests/store/newsStore.test.ts`
1. `addItem` — item eklenir, unreadCount artar
2. `markSeen` — tek item okunur, unreadCount düşer
3. `markAllSeen` — hepsi okunur
4. Max 50 limit — 51. item eklenince en eski düşer

### `tests/store/awardsStore.test.ts`
1. `checkAwards` — player kazanınca `pendingEvent.winnerId === 'player'`
2. `checkAwards` — rakip kazanınca doğru rivalId
3. `clearPending` — pendingEvent null olur

### `tests/data/rivals.test.ts`
1. Her sabit rakibin zorunlu alanları dolu
2. `isFormerEmployer` tam olarak bir rakipte true
3. Prosedürel rakip üretici benzersiz isimler üretir

---

## Riskler

| Risk | Çözüm |
|---|---|
| `simulateYear` yıl geçişinde iki kez tetiklenirse | `lastSimYear` guard |
| Awards sahnesi `CutsceneId` genişlemesi 4B testlerini bozar | `cutscenes.test.ts` dinamik `Object.keys(CUTSCENES)` kullanıyor, etkilenmez |
| `rival_resolution_${rivalId}` dinamik ID tip güvenliği | Template literal type, TypeScript destekler |
| `merge` seçeneği `ally` olmadan erişilebilirse | `resolveRival` içinde guard, UI'da disabled |

---

## Kapsam Dışı (Faz 4C)

- Gerçek pixel art asset'leri rakip logolar için
- Rakip şirketlerin oyunlarının türüne göre oyuncu piyasa payını etkilemesi (market share mekaniği)
- Save/load'da `rivals` ve `news` persist edilmesi
- 4C sonrası sahneler / 4D içeriği
