# Endüstri Etkinlikleri Tasarım Dokümanı

**Tarih:** 2026-05-31  
**Kapsam:** Takvim bazlı endüstri etkinlikleri (GDC, E3, Gamescom, Indie Fuarı, Oyun Ödülleri); pasif boost + aktif katılım sistemi

---

## Genel Bakış

Yılda 6 etkinlik belirli haftalarda gerçekleşir. Etkinlikler iki etki üretir:

1. **Pasif boost** — Etkinlik haftasında ilgili türlerin popülaritesi otomatik artar, ilgili platformların satış çarpanı yükselir.
2. **Aktif katılım** — Oyuncu para ödeyerek bir proje için sunum seçer (Teaser / Demo / Büyük Duyuru). Katılım, o projenin satış çarpanına birkaç hafta boyunca ek bonus verir.

Oyun Ödülleri (TGA) farklı çalışır: katılım ücretsizdir, yılın en yüksek skorlu oyunu otomatik aday olur, kazanırsa itibar bonusu alınır.

---

## Etkinlik Takvimi

Oyun yılı 16 hafta: ilkbahar (hf 1-4) → yaz (hf 1-4) → sonbahar (hf 1-4) → kış (hf 1-4).

| Etkinlik | Sezon | Hafta | Tür | Platform Odağı | Tür Odağı |
|---|---|---|---|---|---|
| GDC | ilkbahar | 2 | major | pc | strateji, simulasyon, bulmaca |
| İndie Fuarı İlkbahar | ilkbahar | 4 | indie | pc, mobil | hepsi |
| E3 / Summer Game Fest | yaz | 2 | major | konsol | aksiyon, rpg |
| Gamescom | sonbahar | 1 | major | pc, mobil | strateji, simulasyon |
| İndie Fuarı Sonbahar | sonbahar | 3 | indie | pc | hepsi |
| Oyun Ödülleri (TGA) | kış | 4 | award | — | hepsi |

---

## Pasif Boost Değerleri

Etkinlik başladığı hafta 1 hafta sürer:

- **major:** odak türlerin `trendStore` popülaritesi +8
- **indie:** odak türlerin `trendStore` popülaritesi +4
- **award:** pasif boost yok

Popülarite 0-100 aralığında clamp edilir.

---

## Aktif Katılım

### Sunum Türleri

| Tür | Maliyet | Satış Multiplier | İtibar | Süre (hafta) |
|---|---|---|---|---|
| teaser | 5.000$ | ×1.10 | +5 | 2 |
| demo | 15.000$ | ×1.25 | +10 | 3 |
| duyuru | 35.000$ | ×1.40 | +20 | 3 |

**Odak eşleşmesi:** Seçilen projenin türü etkinliğin `focusGenres` listesindeyse multiplier değeri ×1.5 ek çarpanla ölçeklenir (sadece multiplier kısmı: `(multiplier - 1.0) * 1.5 + 1.0`).

Örnekler:
- demo (×1.25) + odak eşleşmesi: `(1.25 - 1) * 1.5 + 1 = 1.375`
- duyuru (×1.40) + odak eşleşmesi: `(1.40 - 1) * 1.5 + 1 = 1.60`

### Katılım Kısıtları

- Aynı proje aynı etkinliğe sadece bir kez katılabilir.
- Proje `gelistirme` veya `yayinlandi` statüsünde olmalıdır.
- `gameStore.money >= maliyet` olmalıdır.
- `indie` etkinliğine katılmak için projenin bütçesi ≤ 50.000$ olmalıdır (`budget` alanı).

### Oyun Ödülleri (award)

- Katılım ücretsiz, otomatik.
- O yıl yayınlanan (yani o yılın ilkbahar-kış döneminde `yayinlandi` statüsüne geçen) projeler arasında en yüksek `publishScore` olanı aday gösterilir. Şart: `publishScore >= 75`.
- Kazanma: aday proje varsa `gainReputation(+30)`, `newsStore.addItem(...)` eklenir.
- Aday yoksa (yıl içinde score ≥ 75 oyun çıkmadıysa): bildirim yok.

---

## Mimari

```
src/data/industryEvents.ts          — statik etkinlik tanımları
src/store/industryEventStore.ts     — durum, katılımlar, weeklyTick
src/components/IndustryEventPanel.tsx   — takvim paneli
src/components/IndustryEventModal.tsx   — etkinlik başlangıcı katılım modalı
```

Dokunulan mevcut dosyalar:
- `src/App.tsx` — weeklyTick entegrasyonu + modal render
- `src/engine/scoreEngine.ts` — `eventSalesMultiplier` eklenir
- `src/components/HUD.tsx` — 📅 butonu
- `src/engine/savegameEngine.ts` — serialize/deserialize
- `src/components/SaveLoadPanel.tsx` — `reset()` çağrısı

---

## Veri Modeli

### `industryEvents.ts`

```typescript
export type IndustryEventType = 'major' | 'indie' | 'award'
export type PresentationType = 'teaser' | 'demo' | 'duyuru'

export interface IndustryEventDef {
  id:           string
  name:         string
  description:  string
  season:       'ilkbahar' | 'yaz' | 'sonbahar' | 'kis'
  week:         number                           // 1-4
  type:         IndustryEventType
  focusPlatforms: ('pc' | 'konsol' | 'mobil')[] // boş = hepsi
  focusGenres:  string[]                        // boş = hepsi; genre id'leri
  passivePopBoost: number                       // major=8, indie=4, award=0
}

export interface PresentationConfig {
  type:             PresentationType
  cost:             number
  salesMultiplier:  number
  reputationBonus:  number
  durationWeeks:    number
}

export const PRESENTATION_CONFIGS: Record<PresentationType, PresentationConfig>
export const INDUSTRY_EVENTS: IndustryEventDef[]
```

6 etkinlik tanımı (sabit):

```typescript
export const INDUSTRY_EVENTS: IndustryEventDef[] = [
  {
    id: 'gdc',
    name: 'GDC',
    description: 'Geliştirici konferansı. Strateji ve simülasyon oyunları öne çıkar.',
    season: 'ilkbahar', week: 2, type: 'major',
    focusPlatforms: ['pc'],
    focusGenres: ['strateji', 'simulasyon', 'bulmaca'],
    passivePopBoost: 8,
  },
  {
    id: 'indie_ilkbahar',
    name: 'İndie Fuarı İlkbahar',
    description: 'Bağımsız geliştirici festivali. Her türden küçük bütçeli oyunlar için fırsat.',
    season: 'ilkbahar', week: 4, type: 'indie',
    focusPlatforms: ['pc', 'mobil'],
    focusGenres: [],
    passivePopBoost: 4,
  },
  {
    id: 'e3',
    name: 'E3 / Summer Game Fest',
    description: 'Yılın en büyük oyun fuarı. Konsol, aksiyon ve RPG oyunları parlıyor.',
    season: 'yaz', week: 2, type: 'major',
    focusPlatforms: ['konsol'],
    focusGenres: ['aksiyon', 'rpg'],
    passivePopBoost: 8,
  },
  {
    id: 'gamescom',
    name: 'Gamescom',
    description: 'Avrupa\'nın en büyük oyun fuarı. PC ve mobil odaklı.',
    season: 'sonbahar', week: 1, type: 'major',
    focusPlatforms: ['pc', 'mobil'],
    focusGenres: ['strateji', 'simulasyon'],
    passivePopBoost: 8,
  },
  {
    id: 'indie_sonbahar',
    name: 'İndie Fuarı Sonbahar',
    description: 'Sonbahar indie festivali. PC odaklı küçük bütçeli oyunlar.',
    season: 'sonbahar', week: 3, type: 'indie',
    focusPlatforms: ['pc'],
    focusGenres: [],
    passivePopBoost: 4,
  },
  {
    id: 'tga',
    name: 'Oyun Ödülleri',
    description: 'Yılın en iyi oyunları seçiliyor. Score ≥ 75 ile yayınladıysan aday olabilirsin.',
    season: 'kis', week: 4, type: 'award',
    focusPlatforms: [],
    focusGenres: [],
    passivePopBoost: 0,
  },
]
```

### `industryEventStore.ts`

```typescript
export interface EventParticipation {
  eventId:         string
  projectId:       string
  type:            PresentationType
  salesMultiplier: number   // hesaplanmış (odak eşleşmesi dahil)
  reputationBonus: number
  bonusUntilTick:  number
}

interface IndustryEventStore {
  participations:  EventParticipation[]
  pendingModal:    string | null   // eventId; etkinlik başladığında set edilir
  showPanel:       boolean

  weeklyTick:      () => void
  participate:     (eventId: string, projectId: string, type: PresentationType) => void
  dismissModal:    () => void
  openPanel:       () => void
  closePanel:      () => void
  reset:           () => void
}
```

---

## `industryEventStore.ts` Davranışları

### `weeklyTick()`

1. **Etkinlik başlangıcı:** `INDUSTRY_EVENTS` içinde `season === date.season && week === date.week` olan etkinlikler için:
   - `type !== 'award'` → `pendingModal = event.id`
   - `type === 'award'` → TGA hesabı (aşağıda)
2. **Pasif boost:** Başlayan etkinliklerin `focusGenres` listesindeki her tür için `trendStore.boostPopularity(genreId, passivePopBoost)` çağrısı. `focusGenres` boşsa boost uygulanmaz (TGA: `passivePopBoost=0` zaten; indie fuarları: `focusGenres=[]` olduğundan uygulanmaz).

3. **Süresi dolan katılımlar:** `currentTick >= bonusUntilTick` olanları filtrele (`isActive` boolean'ı yok; `bonusUntilTick` karşılaştırması scoreEngine'de yapılır — store'da temizlemeye gerek yok ama temizlemek UI için temiz).

### TGA Hesabı (`weeklyTick` içinde, award etkinliği tetiklendiğinde)

```typescript
const thisYear = date.year
const publishedThisYear = useProjectStore.getState().projects.filter(
  p => p.status === 'yayinlandi' && p.publishYear === thisYear && (p.publishScore ?? 0) >= 75
)
if (publishedThisYear.length > 0) {
  const winner = publishedThisYear.reduce((best, p) =>
    (p.publishScore ?? 0) > (best.publishScore ?? 0) ? p : best
  )
  useGameStore.getState().gainReputation(30)
  useNewsStore.getState().addItem(`🏆 "${winner.name}" Yılın Oyunu seçildi!`)
}
```

`GameProject`'e `publishYear: number` ve `publishScore: number` alanları eklenmesi gerekir — `publishProject` çağrısında set edilir.

### `participate(eventId, projectId, type)`

Guard koşulları:
- Etkinlik bu hafta aktif değilse (`season + week` mevcut tarihle eşleşmiyorsa) → engelle
- Zaten bu etkinlik + proje için katılım var → engelle
- Proje `gelistirme` veya `yayinlandi` değilse → engelle
- `indie` tipi etkinlik ve `project.budget > 50000` → engelle
- `gameStore.money < config.cost` → engelle

Geçerliyse:
- `gameStore.addMoney(-config.cost)`
- `gameStore.gainReputation(config.reputationBonus)`
- `salesMultiplier` hesapla (odak eşleşmesi kontrolüyle)
- `participations` listesine ekle
- `newsStore.addItem(...)`

### `boostPopularity` — trendStore'a eklenen yardımcı

`trendStore`'a `boostPopularity(genreId: string, amount: number): void` metodu eklenir. Mevcut `popularity[genreId]` değerine `amount` ekler, 0-100 clamp.

---

## scoreEngine Entegrasyonu

`calculatePublishResult` sonunda, `preLaunchMultiplier`'ın ardından:

```typescript
import { usIndustryEventStore } from '@/store/industryEventStore'

const currentTick = useTimeStore.getState().tickCount
const activeEventBonus = useIndustryEventStore.getState().participations
  .filter(p => p.projectId === project.id && currentTick < p.bonusUntilTick)
  .reduce((max, p) => Math.max(max, p.salesMultiplier), 1.0)

const sales = Math.round(
  baseSales
  * salesMultiplier
  * fanBaseMultiplier
  * trendMultiplier
  * platformShareMultiplier
  * featuredMultiplier
  * exclusiveMultiplier
  * priceCutMultiplier
  * preLaunchMultiplier
  * activeEventBonus      // ← yeni
  * (score / 50)
  * (1 + opts.reputation / 100)
)
```

---

## UI Detayları

### `HUD.tsx`

📅 butonu, `📊`'den önce eklenir:

```tsx
<button onClick={openPanel} title="Etkinlik Takvimi" className="relative ...">
  📅
  {hasActiveEvent && (
    <span className="absolute -top-1 -right-1 bg-orange-500 text-black text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
      !
    </span>
  )}
</button>
```

`hasActiveEvent`: `INDUSTRY_EVENTS` içinde `season === date.season && week === date.week` olan varsa true.

### `IndustryEventPanel.tsx`

2 sekme: **Takvim** | **Detay**

**Takvim sekmesi:**
- 16 satır (4 sezon × 4 hafta), her satırda: sezon/hafta etiketi + etkinlik adı (varsa) + durum rozeti (bekleniyor / aktif / bitti)
- Mevcut hafta vurgulanır
- Bir etkinlik satırına tıklanınca Detay sekmesine geçer

**Detay sekmesi:**
- Etkinlik adı, açıklama, odak platform/tür
- Pasif boost bilgisi
- Sunum seçenekleri: 3 kart (teaser/demo/duyuru) — maliyet, multiplier, süre, "Katıl" butonu
- Odak eşleşmesi varsa kart vurgulu + "Odak Eşleşmesi: ×1.5 ek bonus" etiketi
- Zaten katıldıysa "Katılındı — X hafta bonusu devam ediyor"
- Etkinlik bu hafta değilse "Bu etkinlik X hafta sonra başlıyor" + butonlar devre dışı
- TGA sekmesi: "Bu yılın en yüksek skorlu oyunu otomatik aday. Score ≥ 75 gerekli."

### `IndustryEventModal.tsx`

`pendingModal !== null` iken render (campaign'daki `pendingToast` mantığı gibi):
- Etkinlik başlığı + kısa açıklama
- 3 sunum kartı (teaser/demo/duyuru) — seçince `participate()` çağrısı
- "Şimdi Değil" → `dismissModal()`
- Modal ESC ile kapatılabilir

---

## savegameEngine Güncellemesi

```typescript
// serialize
industryEvent: {
  participations: ies.participations,
}

// deserialize
useIndustryEventStore.setState({
  participations: data.industryEvent?.participations ?? [],
  pendingModal: null,
  showPanel: false,
})
```

---

## GameProject Değişikliği

`GameProject` tipine 2 alan eklenir:

```typescript
publishYear?:  number   // yayınlandığı oyun yılı
publishScore?: number   // publish anındaki nihai skor
```

`publishProject()` action'ında:
```typescript
publishYear:  useTimeStore.getState().date.year,
publishScore: result.score,
```

---

## Test Stratejisi

### `tests/data/industryEvents.test.ts` (3 test)

1. `INDUSTRY_EVENTS` 6 etkinlik içeriyor
2. Her etkinliğin `season + week` kombinasyonu benzersiz (çakışma yok)
3. `PRESENTATION_CONFIGS` 3 tür içeriyor, multiplier değerleri doğru

### `tests/store/industryEventStore.test.ts` (7 test)

1. `weeklyTick`: doğru sezon+haftada `pendingModal` set edilir
2. `weeklyTick`: yanlış haftada `pendingModal` null kalır
3. `participate`: cost düşer, itibar artar, participations'a eklenir
4. `participate`: aynı etkinlik+proje tekrarı engellenir
5. `participate`: para yetersizse engellenir
6. Odak eşleşmesi: multiplier `(base-1)*1.5+1` formülüyle hesaplanır
7. Odak eşleşmesi yok: multiplier değişmez

### `tests/store/industryEventStore.tga.test.ts` (3 test)

1. TGA haftasında score ≥ 75 oyun varsa itibar +30 alınır
2. TGA haftasında score < 75 ise itibar değişmez
3. TGA haftasında yayınlanmış oyun yoksa itibar değişmez

---

## Kapsam Dışı

- Rakip NPC'lerin etkinliklere katılması
- Etkinlik kazanma/kaybetme ödülleri (TGA dışında)
- Çok yıllı etkinlik geçmişi paneli
- Platforma özgü etkinlik lock-out (örn. konsol üreticisinin indie'yi engellemesi)
