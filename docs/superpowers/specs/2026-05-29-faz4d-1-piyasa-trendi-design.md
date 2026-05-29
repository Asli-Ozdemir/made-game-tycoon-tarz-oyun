# Faz 4D-1 — Piyasa & Tür Trendi: Tasarım Dokümanı

**Tarih:** 2026-05-29
**Kapsam:** Tek alt faz — trendStore + gelir entegrasyonu + Piyasa UI
**Önceki faz:** 4C — Rakip Şirket Arc'ı
**Sonraki faz:** 4D-2 (Random Event Sistemi)

---

## Genel Bakış

Her türün (genre) 0–100 arası bir popülerlik skoru vardır. Bu skor, sinüs dalgası tabanlı doğal bir döngüyle yıldan yıla yavaşça değişir; rakiplerin o türde yoğun oyun çıkarması ise "piyasa doygunluğu" yaratarak trendi bastırır. Oyuncu trendde olan türde oyun yaparak gelirini artırabilir. Trendler NewsFeed'e haber olarak düşer ve yeni bir "Piyasa" sekmesiyle takip edilir.

---

## Veri Modeli

### Tür Döngü Parametreleri

`src/data/genres.ts` içindeki `GENRES` kaydına iki yeni alan eklenir:

```typescript
export interface Genre {
  id:           string
  name:         string
  baseSales:    number
  cycleLength:  number   // yıl cinsinden döngü uzunluğu (5–8)
  startPhase:   number   // başlangıç sinüs fazı (0–2π), türe özgü sabit
}
```

Güncellenmiş türler:

| id | name | baseSales | cycleLength | startPhase |
|---|---|---|---|---|
| `aksiyon` | Aksiyon | 1000 | 6 | 0.0 |
| `rpg` | RPG | 800 | 8 | 1.0 |
| `strateji` | Strateji | 600 | 5 | 2.5 |
| `simulasyon` | Simülasyon | 500 | 7 | 4.2 |
| `bulmaca` | Bulmaca | 700 | 6 | 3.1 |

### TrendStore State

**`src/store/trendStore.ts`**

```typescript
interface TrendStore {
  popularity:         Record<string, number>   // genreId → 0–100
  previousPopularity: Record<string, number>   // bir önceki yılın değeri (haber koşulları için)
  phase:              Record<string, number>   // genreId → anlık sinüs fazı (0–2π)

  initTrends:    () => void
  simulateYear:  (year: number, rivalGames: RivalGame[]) => void
  getMultiplier: (genreId: string) => number   // 0.5–1.5
  reset:         () => void
}
```

**`initTrends()`:**
Her tür için `startPhase` değerini `phase[genreId]` olarak atar. İlk popülerliği hesaplar: `50 + sin(startPhase) × 35`, `clamp(5, 95)`.

**`simulateYear(year, rivalGames)`:**
Her tür için:
1. `phase[id] += (2π / cycleLength)` — fazı ilerlet
2. `basePopularity = 50 + sin(phase[id]) × 35`
3. Rakip doygunluğu: `rivalGames` listesindeki o türden oyun sayısı × 3 (max 20)
4. `popularity[id] = clamp(basePopularity - doygunluk, 5, 95)`
5. News haberi koşulları (aşağıda)

**`getMultiplier(genreId)`:**
`0.5 + popularity[genreId] / 100` → trend 0 iken 0.5×, trend 100 iken 1.5×.

---

## News Entegrasyonu

`simulateYear` içinde her tür için bir önceki yılın popülerliğiyle karşılaştırılır (store'da `previousPopularity` tutulur):

| Koşul | Haber metni |
|---|---|
| `popularity > 75` | `"[Tür] oyunları bu yıl patlama yaşıyor!"` |
| `popularity < 25` | `"[Tür] piyasası durgun görünüyor."` |
| `popularity - prev > 20` | `"[Tür] trende girdi — iyi bir fırsat!"` |
| `prev - popularity > 20` | `"[Tür] ivme kaybediyor."` |

`newsStore.addItem` ile `type: 'rival_release'` yerine yeni bir `NewsType`: `'market_trend'`. `src/types/rival.ts` içindeki `NewsType` genişletilir:

```typescript
export type NewsType =
  | 'rival_release'
  | 'rival_award'
  | 'rival_scandal'
  | 'rival_notice'
  | 'player_mention'
  | 'market_trend'    // ← yeni
```

`rivalId: null` olarak set edilir (türe özgü haber, belirli bir rakibe ait değil).

---

## Gelir Entegrasyonu

`Dashboard.handlePublish` içinde `calculatePublishResult` çağrısından dönen `result.revenue` trend çarpanıyla güncellenir:

```typescript
const trendMultiplier = useTrendStore.getState().getMultiplier(project.genreId)
const adjustedRevenue = Math.round(result.revenue * trendMultiplier)
addMoney(adjustedRevenue)   // result.revenue yerine adjustedRevenue kullanılır
```

`publishResult` içindeki `revenue` alanı değiştirilmez (orijinal skor motoru çıktısı korunur); yalnızca `addMoney` çağrısı trend çarpanını uygular.

---

## UI Bileşenleri

### `src/components/MarketPanel.tsx`

Dashboard'a yeni "Piyasa" sekmesi. Tab tipi genişler: `'studyo' | 'calisanlar' | 'rakipler' | 'piyasa'`.

```
┌──────────────────────────────────────┐
│  Piyasa Durumu          [yıl: 2003]  │
│                                      │
│  Aksiyon    ████████░░  78  🔥       │
│  RPG        █████░░░░░  52  →        │
│  Strateji   ███░░░░░░░  28  ↓        │
│  Simülasyon ██████████  91  🔥🔥     │
│  Bulmaca    ████░░░░░░  41  →        │
└──────────────────────────────────────┘
```

- Popülerlik bar'ı: 10 bloklu, `Math.round(popularity / 10)` blok dolu
- İkon: 🔥 popularity ≥ 70, `→` 30–69, `↓` < 30
- Bar rengi: `≥70` yeşil, `30–69` sarı, `<30` kırmızı
- Başlık yanında mevcut in-game yılı

### Yeni Proje Modal — Tür Seçimi

`src/components/NewProjectModal.tsx` içinde tür listesine trend ikonu eklenir. Her tür satırına `useTrendStore.getState().getMultiplier(genreId)` bazlı küçük bir etiket:

- `≥ 1.3×` → `🔥 Trendde`
- `≤ 0.7×` → `↓ Düşüş`
- Arası → gösterim yok

---

## Entegrasyon Noktaları

| Dosya | Değişiklik |
|---|---|
| `src/data/genres.ts` | `cycleLength` ve `startPhase` alanları eklenir |
| `src/types/rival.ts` | `NewsType`'a `'market_trend'` eklenir |
| `src/store/trendStore.ts` | Yeni dosya |
| `src/components/Dashboard.tsx` | `trendStore.simulateYear` year useEffect'e eklenir; `addMoney` trend çarpanıyla; Piyasa sekmesi; `trendStore.reset()` handleNewGame'e |
| `src/components/CharacterCreationWizard.tsx` | `trendStore.initTrends()` handleFinalize'a |
| `src/components/MarketPanel.tsx` | Yeni dosya |
| `src/components/NewProjectModal.tsx` | Tür satırlarına trend etiketi |

---

## Test Stratejisi

### `tests/store/trendStore.test.ts`

1. `initTrends` — her tür için `popularity` 5–95 arasında, `phase` dolu
2. `simulateYear` — faz ilerler, popularity güncellenir
3. `simulateYear` — yüksek rakip doygunluğu popularity'yi düşürür (max 20 puan)
4. `simulateYear` — popularity 5'in altına düşmez, 95'in üstüne çıkmaz
5. `getMultiplier` — popularity 0 → 0.5, popularity 100 → 1.5, popularity 50 → 1.0
6. `simulateYear` — `>75` popülerlikte market_trend haberi eklenir
7. `simulateYear` — `<25` popülerlikte market_trend haberi eklenir
8. `reset` — tüm state temizlenir

---

## Kapsam Dışı (Faz 4D-1)

- Oyuncunun kendi oyunlarının tür trendini etkilemesi (viral hit mekanizması)
- Trendlerin save/load'da persist edilmesi
- 5'ten fazla tür desteği
- Tür trendinin rakip davranışını etkilemesi (rakiplerin trend türleri tercih etmesi)
