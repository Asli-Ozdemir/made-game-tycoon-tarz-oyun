# Faz 6B — Platform & Pazar Dinamikleri Tasarım Dokümanı

**Tarih:** 2026-05-30
**Kapsam:** Platform pazar payı simülasyonu, tür trend entegrasyonu, platform fırsat olayları, pazar analizi paneli

---

## Genel Bakış

İki temel mekanizma eklenir: (1) Platform pazar payları tarihsel eğri + reaktif düzeltme ile her hafta hesaplanır ve satışları etkiler. (2) Tür trend çarpanı (`trendStore` zaten hesaplıyor) `scoreEngine`'e bağlanır. Bunlara ek olarak platform fırsat olayları (exclusive deal, featured placement) ve pazar analizi paneli gelir.

---

## Mimari

```
src/engine/marketEngine.ts      — saf hesap fonksiyonları (pay eğrisi, reaktif delta, çarpanlar)
src/store/marketStore.ts        — platform payları, reaktif delta'lar, aktif fırsat
src/components/MarketPanel.tsx  — analiz overlay (3 sekme)
```

Mevcut dokunuşlar:
- `src/engine/scoreEngine.ts` → trend + platform share çarpanı eklenir
- `src/App.tsx` → haftalık tick'e market adımları
- `src/components/HUD.tsx` → trending tür rozeti + 📊 butonu
- `src/types/index.ts` → `BaseProject`'e `featuredUntilTick`, `exclusivePlatformId`
- `src/engine/savegameEngine.ts` → `marketStore` snapshot

`trendStore` ve `rivalStore` değişmez — sadece okunur.

---

## Veri Modeli

### Platform Payı Tarihsel Eğrisi

`src/engine/marketEngine.ts`'te sabit tablo:

| Yıl | PC | Konsol | Mobil |
|-----|----|----|-----|
| 1   | 60 | 30 | 10  |
| 5   | 50 | 30 | 20  |
| 10  | 40 | 28 | 32  |

Arası lineer interpolasyon. Yıl 10 sonrası sabit.

### `MarketStore`

```typescript
interface PlatformShareState {
  share:         number   // 0–100, normalize edilmiş
  reactiveDelta: number   // ±15 ile sınırlı
}

type PendingOffer =
  | { type: 'exclusive';  projectId: string; platformId: string; expiresAtTick: number }
  | { type: 'featured';   projectId: string; platformId: string; expiresAtTick: number }
  | { type: 'price_cut';  platformId: string; expiresAtTick: number }
  | null

interface MarketStore {
  platforms:            Record<string, PlatformShareState>  // pc | konsol | mobil
  offerCooldownUntil:   number   // tick — bu ticke kadar yeni teklif gelmez
  pendingOffer:         PendingOffer
  priceCutActive:       { platformId: string; untilTick: number } | null
  showMarketPanel:      boolean
  marketPanelTab:       'platforms' | 'trends' | 'offers'

  // Actions
  updatePlatformShares: () => void           // haftalık tick: eğri + reaktif hesap
  applyReactiveDelta:   (platformId: string, delta: number) => void  // proje yayınlandığında
  schedulerTick:        () => void           // haftalık: fırsat üret (cooldown kontrolü)
  acceptOffer:          () => void
  declineOffer:         () => void
  openMarketPanel:      (tab?: MarketStore['marketPanelTab']) => void
  closeMarketPanel:     () => void
  reset:                () => void
}
```

### `BaseProject` eklentisi (`src/types/index.ts`)

```typescript
featuredUntilTick:   number | null  // featured placement aktifken, bitiş tick'i
exclusivePlatformId: string | null  // exclusive deal kabul edildiyse platform id
```

---

## `marketEngine.ts`

```typescript
// Platform payı baz eğrisi — yıla göre lineer interpolasyon
export function computeBaseCurve(year: number): Record<string, number>
// Döner: { pc: 50, konsol: 30, mobil: 20 } gibi (toplam ≈ 100)

// Reaktif delta sonrası normalize edilmiş pay
export function computeNormalizedShares(
  baseCurve: Record<string, number>,
  reactiveDeltas: Record<string, number>
): Record<string, number>
// Her platform: clamp(base + delta, 5, 80), sonra /toplam × 100

// Platforma özgü satış çarpanı
export function computePlatformShareMultiplier(share: number): number
// share > 50 → 1.0 + (share - 50) / 100   (max ~1.3 pay=80'de)
// share < 20 → 0.7 + (share - 5) / 50     (min ~0.4 pay=5'te)
// 20–50 arası → 1.0

// Reaktif delta decay (her hafta %20 sönümlenir)
export function decayReactiveDelta(delta: number): number
// delta * 0.8, |delta| < 0.5 ise 0
```

---

## scoreEngine Entegrasyonu

`calculatePublishResult` içinde, mevcut `salesAdjusted` hesabından önce iki çarpan eklenir:

```typescript
import { computePlatformShareMultiplier } from '@/engine/marketEngine'
import { useTrendStore }   from '@/store/trendStore'
import { useMarketStore }  from '@/store/marketStore'

const trendMultiplier        = useTrendStore.getState().getMultiplier(project.genreId)
const platformShare          = useMarketStore.getState().platforms[project.platformId]?.share ?? 50
const platformShareMultiplier = computePlatformShareMultiplier(platformShare)

// Featured placement bonusu
const featuredMultiplier = (
  project.featuredUntilTick !== null &&
  currentTick <= project.featuredUntilTick
) ? 1.2 : 1.0

// Exclusive deal bonusu
const exclusiveMultiplier = project.exclusivePlatformId !== null ? 1.4 : 1.0

// Platform fiyat indirimi bonusu
const priceCut = useMarketStore.getState().priceCutActive
const priceCutMultiplier = (
  priceCut !== null &&
  priceCut.platformId === project.platformId &&
  currentTick <= priceCut.untilTick
) ? 1.5 : 1.0

const sales = Math.round(
  baseSales
  * platform.salesMultiplier
  * trendMultiplier
  * platformShareMultiplier
  * featuredMultiplier
  * exclusiveMultiplier
  * priceCutMultiplier
  * (score / 50)
  * (1 + reputation / 100)
)
```

---

## Platform Fırsat Olayları

### Teklif Türleri

| Tür | Koşul | Bedel | Fayda |
|-----|-------|-------|-------|
| `exclusive` | Yayında en az 1 proje var | Teklife konu proje `exclusivePlatformId` set edilir; o proje tek bu platformda satılır | `exclusiveMultiplier: 1.4` (o projenin gelecekteki satış hesaplarında)
| `featured` | — | 5.000$ anında düşer | `featuredUntilTick = currentTick + 2` (2 hafta) |
| `price_cut` | — | Bedelsiz | `marketStore.priceCutActive: { platformId, untilTick }` set edilir; `scoreEngine` yayın hesabında bu haftaki bonus çarpanı uygular (×1.5, 1 hafta) |

### Tetikleme

`marketStore.schedulerTick()` her hafta çağrılır:
- `currentTick < offerCooldownUntil` ise atla
- `pendingOffer !== null` ise atla
- `random() < 0.12` (≈%12/hafta, ortalama her ~8 haftada bir) ise rastgele teklif oluştur
- `offerCooldownUntil = currentTick + 8` set edilir (kabul veya red sonrası da bu)

### `OfferModal.tsx`

`pendingOffer !== null` iken App.tsx render eder. Kapatılamaz (ESC yok, backdrop yok). Kabul veya Geç butonu zorunlu.

---

## Pasif Haberler

`marketStore.updatePlatformShares()` içinde, pay değişimi ±10% geçerse `newsStore.addItem(...)` çağrılır:

```
"Mobil pazar bu sezon %12 büyüdü — oyuncu tabanı genişliyor."
"PC platformu bu çeyrekte %8 geriledi."
```

`trendStore`'da trend eşiği haberleri zaten var (`>75 boom`, `<25 sluggish`) — bunlara dokunulmaz.

---

## Haftalık Tick Entegrasyonu

`App.tsx`'teki weekly tick'e ekonomi adımlarının ardından:

```typescript
useMarketStore.getState().updatePlatformShares()   // eğri + reaktif + haber
useMarketStore.getState().schedulerTick()           // fırsat üret
```

Proje `publishProject` çağrıldığında `marketStore.applyReactiveDelta(platformId, -3)` çağrılır — o platforma çok oyun gelirse pay aşınır.

---

## MarketPanel.tsx

Dashboard üstünde overlay. HUD'daki 📊 butonuyla açılır.

### Platform Payları Sekmesi

```
[PC]      ████████████░░░░░░░░  52%  ↑
[Konsol]  ████████░░░░░░░░░░░░  28%  →
[Mobil]   ██████░░░░░░░░░░░░░░  20%  ↑
```

Bar genişliği Tailwind `style={{ width: share + '%' }}` ile. Ok ikonu: önceki haftaya göre ±3% değişim eşiği.

### Tür Trendleri Sekmesi

Her tür için: ad + doluluk çubuğu + durum etiketi.

Durum etiketleri (popülerliğe göre):
- ≥ 75: BOOM
- 55–74: Yükselen
- 35–54: Sakin
- 15–34: Düşen
- < 15: Ölü

Bu haftaki rakip çıkışları: "Bu hafta 2 rakip aksiyon oyunu yayımladı" notu.

### Fırsatlar Sekmesi

`pendingOffer` varsa kart: tür, proje adı (varsa), bedel, fayda, [Kabul] [Geç]. Yoksa "Şu an aktif teklif yok."

---

## HUD Değişiklikleri

```typescript
const trendingGenre = // trendStore'dan en yüksek popülerlikli tür adı
```

HUD'a eklenen:
```tsx
{trendingGenre && (
  <span className="text-xs text-yellow-400">🔥 {trendingGenre}</span>
)}
<button onClick={openMarketPanel}>📊</button>
```

---

## savegameEngine Güncellemesi

```typescript
market: {
  platforms:          ms.platforms,
  offerCooldownUntil: ms.offerCooldownUntil,
  pendingOffer:       ms.pendingOffer,
}
```

`deserialize`'da `useMarketStore.setState(...)` ile yüklenir.

---

## Entegrasyon Noktaları

| Dosya | Değişiklik |
|---|---|
| `src/engine/marketEngine.ts` | Yeni: baz eğrisi, normalize, share çarpanı, decay |
| `src/store/marketStore.ts` | Yeni: platform payları, fırsat yönetimi |
| `src/types/index.ts` | `BaseProject`'e `featuredUntilTick`, `exclusivePlatformId` |
| `src/engine/scoreEngine.ts` | Trend + platformShare + featured + exclusive çarpanları |
| `src/engine/savegameEngine.ts` | `marketStore` snapshot |
| `src/App.tsx` | Haftalık tick'e market adımları; `OfferModal` render; `publishProject`'te `applyReactiveDelta` |
| `src/components/HUD.tsx` | Trending tür rozeti + 📊 butonu |
| `src/components/MarketPanel.tsx` | Yeni: 3 sekme |
| `src/components/OfferModal.tsx` | Yeni: fırsat kabul/red |

---

## Test Stratejisi

### `tests/engine/marketEngine.test.ts`

1. `computeBaseCurve(1)` → PC=60, Konsol=30, Mobil=10
2. `computeBaseCurve(5)` → PC=50, Konsol=30, Mobil=20
3. `computeBaseCurve(10)` → PC=40, Konsol=28, Mobil=32
4. `computeBaseCurve(15)` → yıl 10 sonrası sabit
5. `computeNormalizedShares`: toplam her zaman 100
6. `computeNormalizedShares`: delta clamp ±15 korunur
7. `computePlatformShareMultiplier(60)` → > 1.0
8. `computePlatformShareMultiplier(15)` → < 1.0
9. `computePlatformShareMultiplier(35)` → 1.0
10. `decayReactiveDelta(10)` → 8
11. `decayReactiveDelta(0.3)` → 0 (eşik altında)

### `tests/store/marketStore.test.ts`

1. `updatePlatformShares`: yıl değiştikçe pay değişir
2. `applyReactiveDelta`: delta set edilir, clamp ±15
3. `schedulerTick`: cooldown geçmeden teklif gelmez
4. `acceptOffer`: featured → gameStore.money azalır, `featuredUntilTick` set
5. `declineOffer`: pendingOffer null olur, cooldown set

---

## Kapsam Dışı

- Platform bazlı kullanıcı puanlama sistemi
- Platform-özgü rating/sertifika mekaniği
- Çoklu platform yayını (bir oyunu birden fazla platformda çıkarma)
- Pazarlama kampanyaları (Faz 6C)
- Sosyal medya tepkileri (Faz 6C)
