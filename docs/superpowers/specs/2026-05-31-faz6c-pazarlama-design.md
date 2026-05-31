# Faz 6C — Pazarlama Tasarım Dokümanı

**Tarih:** 2026-05-31
**Kapsam:** Pazarlama kampanyaları (yayın öncesi/sonrası), sosyal medya tepkileri (pasif olaylar + aktif aksiyonlar), kampanya paneli

---

## Genel Bakış

İki temel mekanizma eklenir: (1) Oyuncu yayın öncesi veya sonrası kampanya başlatır — peşin + haftalık bütçe öder, satış çarpanı ve itibar bonusu alır. (2) Sosyal medya tepkileri: pasif olaylar (viral, review bomb) haftalık tick'te otomatik tetiklenir; aktif aksiyonlar (dev günlüğü, topluluk etkinliği) oyuncu tarafından başlatılır.

---

## Mimari

```
src/engine/campaignEngine.ts    — saf hesap fonksiyonları
src/store/campaignStore.ts      — aktif kampanyalar, sosyal aksiyon cooldown'ları
src/components/CampaignPanel.tsx  — HUD'dan açılan 3 sekmeli panel
src/components/SocialEventToast.tsx — viral/review_bomb bildirim toast'u
```

Mevcut dokunuşlar:
- `src/engine/scoreEngine.ts` → pre-launch çarpanı
- `src/App.tsx` → haftalık tick'e kampanya adımları + SocialEventToast render
- `src/components/HUD.tsx` → 📣 butonu + aktif kampanya rozeti
- `src/components/ProjectCard.tsx` → kampanya başlatma/durdurma butonu
- `src/engine/savegameEngine.ts` → campaignStore snapshot

`marketStore`, `economyStore`, `newsStore` — sadece okunur, değişmez.

---

## Veri Modeli

### Kampanya Türleri (sabit tablo)

| Tür | Ad | Peşin | Haftalık | Süre | Satış Çarpanı | İtibar/hafta |
|---|---|---|---|---|---|---|
| `sosyal` | Sosyal Medya | 2.000$ | 500$/hafta | 4 hafta | ×1.15 | +1 |
| `influencer` | Influencer | 5.000$ | 1.500$/hafta | 3 hafta | ×1.30 | +3 |
| `billboard` | Billboard | 8.000$ | 2.000$/hafta | 6 hafta | ×1.20 | +5 |

**Yayın sonrası haftalık bonus gelir oranları** (publishRevenue × oran):
- `sosyal` → 0.05 (publishRevenue'nun %5'i haftalık)
- `influencer` → 0.08
- `billboard` → 0.06

### `CampaignType`

```typescript
export type CampaignType = 'sosyal' | 'influencer' | 'billboard'
```

### `CampaignConfig`

```typescript
export interface CampaignConfig {
  type:              CampaignType
  name:              string
  openingCost:       number
  weeklyBudget:      number
  durationWeeks:     number
  salesMultiplier:   number   // pre-launch scoreEngine çarpanı
  reputationPerWeek: number
  postLaunchBonusRate: number // publishRevenue'ya uygulanan haftalık oran
}
```

### `ActiveCampaign`

```typescript
export interface ActiveCampaign {
  id:          string
  projectId:   string
  type:        CampaignType
  startTick:   number
  endTick:     number
  isPreLaunch: boolean   // başlatıldığında proje 'gelistirme' statüsündeydi
  isActive:    boolean   // false = durduruldu veya süresi bitti
}
```

### `CampaignStore`

```typescript
interface CampaignStore {
  campaigns:           ActiveCampaign[]
  actionCooldowns:     Record<string, number>   // projectId → cooldownUntilTick (dev diary & community paylaşır)
  devDiaryBonusTick:   Record<string, number>   // projectId → tick (o tick'te bonus gelir ×1.5)
  communityBonusUntil: Record<string, number>   // projectId → endTick (bu tick'e kadar bonus gelir ×1.3)
  pendingToast:        SocialToast | null       // App.tsx SocialEventToast için

  startCampaign:    (projectId: string, type: CampaignType) => void
  stopCampaign:     (campaignId: string) => void
  weeklyTick:       () => void
  triggerDevDiary:  (projectId: string) => void
  triggerCommunity: (projectId: string) => void
  clearToast:       () => void
  reset:            () => void
}

interface SocialToast {
  type:    'viral' | 'review_bomb' | 'dev_diary' | 'community_event'
  projectName: string
  message: string
}
```

---

## `campaignEngine.ts`

```typescript
export const CAMPAIGN_CONFIGS: Record<CampaignType, CampaignConfig>

// Yayın öncesi çarpan
// Kampanya yoksa 1.0; birden fazla kampanya varsa max alınır (stack yok)
export function computePreLaunchMultiplier(campaigns: ActiveCampaign[]): number

// Yayın sonrası haftalık bonus gelir
// Kampanya aktif ve süresi geçmemişse: publishRevenue * bonusRate
// Aksi halde: 0
export function computePostLaunchBonusRevenue(
  campaign: ActiveCampaign,
  publishRevenue: number,
  currentTick: number
): number

// Pasif sosyal olay üret
// viral: score >= 80 && hasActiveCampaign && seededRandom(seed) < 0.15
// review_bomb: score < 40 && !hasActiveCampaign && seededRandom(seed) < 0.10
// diğer: null
export function rollSocialEvent(
  score: number,
  hasActiveCampaign: boolean,
  seed: number
): 'viral' | 'review_bomb' | null
```

---

## `campaignStore.ts` Davranışları

### `startCampaign(projectId, type)`

- Proje durumuna bakılmaksızın çağrılabilir (guard: `gelistirme` veya `yayinlandi` olmalı)
- Peşin maliyet: `gameStore.addMoney(-config.openingCost)`
- `isPreLaunch`: proje statusu şu an `gelistirme` ise true
- `endTick = currentTick + config.durationWeeks`
- Aynı proje için birden fazla aktif kampanya olabilir (farklı türler)

### `stopCampaign(campaignId)`

- `isActive: false` set edilir; haftalık gider ve bonus durur
- Peşin maliyet iade edilmez

### `weeklyTick()`

Her hafta şu sırayla:

1. **Haftalık gider**: Her aktif kampanya için `gameStore.addMoney(-config.weeklyBudget)`
2. **İtibar bonusu**: Her aktif kampanya için `gameStore.gainReputation(config.reputationPerWeek)`
3. **Post-launch bonus gelir**: Aktif kampanyası olan yayındaki projeler için `computePostLaunchBonusRevenue` → `gameStore.addMoney(bonus)`
4. **Süresi biten kampanyalar**: `currentTick >= endTick` ise `isActive: false`
5. **Pasif sosyal olaylar**: Her yayındaki proje için `rollSocialEvent(score, hasActiveCampaign, seed)` — seed: `project.id.charCodeAt(0) + currentTick`:
   - `viral` → `pendingToast` set, `newsStore.addItem(...)`, o projenin aktif kampanya bonus'unu o hafta ×2
   - `review_bomb` → `pendingToast` set, `newsStore.addItem(...)`, `gameStore.gainReputation(-8)`

### `triggerDevDiary(projectId)`

- Guard: `actionCooldowns[projectId]` cooldown geçmemişse reddeder
- `gameStore.addMoney(-2000)`, `gameStore.gainReputation(+5)`
- `actionCooldowns[projectId] = currentTick + 4` (4 hafta cooldown)
- `devDiaryBonusTick[projectId] = currentTick` — `weeklyTick`'te bu tick eşleşince bonus gelir ×1.5
- `pendingToast` set, `newsStore.addItem(...)`

### `triggerCommunity(projectId)`

- Guard: `actionCooldowns[projectId]` cooldown kontrolü
- `gameStore.addMoney(-5000)`, `gameStore.gainReputation(+10)`
- `actionCooldowns[projectId] = currentTick + 6` (6 hafta cooldown)
- `communityBonusUntil[projectId] = currentTick + 2` — 2 hafta boyunca bonus gelir ×1.3
- `pendingToast` set, `newsStore.addItem(...)`

---

## scoreEngine Entegrasyonu

`calculatePublishResult` içinde, mevcut çarpanların ardından:

```typescript
import { computePreLaunchMultiplier } from '@/engine/campaignEngine'
import { useCampaignStore } from '@/store/campaignStore'

const preLaunchCampaigns = useCampaignStore.getState().campaigns
  .filter(c => c.projectId === project.id && c.isPreLaunch && c.isActive)

const preLaunchMultiplier = computePreLaunchMultiplier(preLaunchCampaigns)

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
  * (score / 50)
  * (1 + opts.reputation / 100)
)
```

---

## Haftalık Tick Entegrasyonu

`App.tsx`'teki weekly tick'e `marketStore.schedulerTick()` çağrısından sonra:

```typescript
useCampaignStore.getState().weeklyTick()
```

---

## UI Detayları

### `ProjectCard.tsx` — Kampanya Butonu

Geliştirme veya yayında olan projelerde kart altına eklenir:

```
Aktif kampanya yoksa:
  [📣 Sosyal 2K$]  [📣 Influencer 5K$]  [📣 Billboard 8K$]

Aktif kampanya varsa (her biri için):
  📣 Influencer — 3 hafta kaldı  [Durdur]
```

### `CampaignPanel.tsx` — 3 Sekme

**Aktif Kampanyalar sekmesi:**
- Her aktif kampanya: proje adı, tür, kalan hafta, toplam harcama tahmini
- [Durdur] butonu

**Aksiyonlar sekmesi:**
- Yayındaki projeler listelenir
- Her proje için: [Dev Günlüğü 2K$ — 4 hafta cooldown] [Topluluk Etkinliği 5K$ — 6 hafta cooldown]
- Cooldown'daysa buton devre dışı + "X hafta sonra"

**Geçmiş sekmesi:**
- Tamamlanan/durdurulan kampanyalar: proje, tür, başlangıç-bitiş tick, toplam harcama

### `SocialEventToast.tsx`

`campaignStore.pendingToast !== null` iken render, 4 saniye sonra `clearToast()`.

```
🚀 "Uzay Macerası" viral oldu! Bu hafta bonus gelir ×2
💢 "Korku Kalesi" eleştiri bombardımanına uğradı. İtibar -8
📝 Dev günlüğü yayınlandı — topluluk memnun. İtibar +5
```

### `HUD.tsx`

📣 butonu, aktif kampanya sayısı > 0 ise üstünde sarı rozet:

```tsx
<button onClick={() => openCampaignPanel()}>
  📣{activeCampaignCount > 0 && <span className="...badge">{activeCampaignCount}</span>}
</button>
```

---

## savegameEngine Güncellemesi

```typescript
campaign: {
  campaigns:     cs.campaigns,
  socialActions: cs.socialActions,
}
```

`deserialize`'da `useCampaignStore.setState(...)` ile yüklenir.

---

## Test Stratejisi

### `tests/engine/campaignEngine.test.ts` (8 test)

1. `computePreLaunchMultiplier([])` → 1.0
2. Tek aktif pre-launch kampanya → config'deki `salesMultiplier`
3. İki aktif pre-launch kampanya → ikisinin max'ı döner (stack değil)
4. `computePostLaunchBonusRevenue` — aktif kampanya, `currentTick < endTick` → `publishRevenue * bonusRate`
5. `computePostLaunchBonusRevenue` — `currentTick >= endTick` → 0
6. `rollSocialEvent(85, true, seed)` → olası sonuç `'viral'` veya `null` (belirleyici)
7. `rollSocialEvent(35, false, seed)` → olası sonuç `'review_bomb'` veya `null`
8. `rollSocialEvent(60, false, seed)` → her zaman `null` (eşik dışı)

### `tests/store/campaignStore.test.ts` (5 test)

1. `startCampaign`: peşin maliyet düşer, kampanya campaigns listesine eklenir
2. `stopCampaign`: kampanya `isActive: false` olur
3. `weeklyTick`: aktif post-launch kampanya → bonus gelir eklenir + haftalık gider düşer
4. `triggerDevDiary`: para düşer, itibar artar, cooldown set edilir
5. Cooldown içindeyken tekrar `triggerDevDiary` → engellenir (para düşmez)

---

## Kapsam Dışı

- Kampanya ROI analizi / grafik
- A/B test mekanikleri
- Influencer ile NPC etkileşim sahneleri
- Negatif kampanya (rakiplere sabotaj)
- Platform bazlı kampanya hedefleme
