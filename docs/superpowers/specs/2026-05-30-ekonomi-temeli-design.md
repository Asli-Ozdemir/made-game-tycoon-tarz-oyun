# Ekonomi Temeli — Tasarım Dokümanı

**Tarih:** 2026-05-30
**Kapsam:** Fiyatlandırma özgürlüğü, platform indirim etkinlikleri, sabit giderler, finansal kriz & iflas mekanikleri

---

## Genel Bakış

Oyuncuya her oyun için fiyat belirleme özgürlüğü verilir. Sabit giderler (kira, sunucu, araç lisansları) haftalık baskı oluşturur. Para sıfırın altına düşünce kurtarma seçenekleri sunulur; 4 hafta çözülmezse stüdyo kapanır. Her 13 haftada bir platform genelinde indirim etkinliği gelir; oyuncu oyunlarını katıma açabilir.

---

## Mimari

```
economyEngine.ts
  computeWeeklyCosts(employeeCount, publishedProjects) → CostBreakdown
  computeEffectivePrice(project) → number

economyStore.ts
  sabit giderler, kredi, kriz durumu, platform indirim etkinlikleri

GameProject (types/index.ts)
  price, discountPct, isOnSale — tüm varyantlarda ortak alan

eventStore.ts
  ekonomik_kriz kategorisi (acil gider eventleri)
```

`economyEngine` store'lardan bağımsız saf hesap fonksiyonları içerir. `economyStore` state + action'ları tutar. `App.tsx` haftalık tick'te `computeCosts` çağırır ve kriz kontrolü yapar.

---

## Veri Modeli

### `GameProject` genişlemesi

`src/types/index.ts`'teki tüm `GameProject` varyantlarına (Standalone, Sequel, DLC, Update) ortak alan olarak eklenir:

```typescript
price:            number        // lansmanda belirlenen birim fiyat ($)
discountPct:      number | null // aktif indirim oranı (0.25 | 0.50 | 0.75), null = indirim yok
isOnSale:         boolean       // platform sale eventine katılıyor mu
publishTickCount: number | null // yayınlandığı hafta (timeStore.tickCount); geliştirmede null
```

`publishTickCount`, `projectStore.publishProject()` sırasında `useTimeStore.getState().tickCount` ile set edilir. `computeWeeklyCosts` çağrısında `weeksPublished = currentTickCount - publishTickCount` hesaplanır.

### `SaleEvent`

```typescript
interface SaleEvent {
  id:            string
  week:          number        // başladığı hafta (timeStore.tickCount)
  durationWeeks: number        // varsayılan: 2
  active:        boolean
}
```

### `EconomyStore`

```typescript
interface EconomyStore {
  // Sabit gider bileşenleri (bilgi amaçlı, computed)
  lastWeeklyCost:   number   // son hesaplanan haftalık toplam gider (HUD için)

  // Kredi
  loan:             number   // alınan kredi miktarı (0 = kredi yok)
  loanWeeksLeft:    number   // kalan ödeme haftası

  // Finansal kriz
  isInCrisis:       boolean  // para < 0
  crisisWeeksLeft:  number   // kriz başladıktan sonra kalan süre (4'ten geriye sayar)
  isBankrupt:       boolean  // oyun bitti

  // Platform indirim etkinlikleri
  saleEvents:       SaleEvent[]
  nextSaleWeek:     number   // bir sonraki etkinliğin başladığı hafta

  // SaleEventModal tetikleyici
  pendingSaleEventModal: boolean   // true → App.tsx SaleEventModal açar, sonra false yapar
  closeSaleEventModal:  () => void

  // Actions
  computeAndApplyCosts: () => void       // haftalık tick'te çağrılır
  takeLoan:             (amount: number, weeks: number) => void
  tickLoan:             () => void       // haftalık: kredi taksiti düşer
  checkCrisis:          () => void       // haftalık: kriz durumunu günceller
  tickCrisis:           () => void       // haftalık: crisisWeeksLeft azaltır
  declareBankruptcy:    () => void       // isBankrupt = true
  scheduleSaleEvent:    () => void       // sonraki sale event'i planlar
  activateSaleEvent:    () => void       // haftalık: zamanı gelen event'i aktifleştirir; pendingSaleEventModal = true
  deactivateSaleEvent:  () => void       // haftalık: süresi dolan event'i kapatır; projectStore üzerinden isOnSale/discountPct sıfırlar
  reset:                () => void
}
```

### `data/platforms.ts` genişlemesi

Her platform tanımına `suggestedPrice: number` eklenir:

| Platform | Önerilen Fiyat |
|----------|---------------|
| PC       | 20$           |
| Konsol   | 40$           |
| Mobil    | 5$            |
| Web      | 10$           |

---

## `economyEngine.ts`

```typescript
interface CostBreakdown {
  rent:       number   // 500$ × employeeCount
  server:     number   // her yayında proje için max(50, 500 - weeksPublished × 10)
  tools:      number   // 200$ × employeeCount
  total:      number   // rent + server + tools (maaşlar ayrıca gameStore'dan düşer)
}

export function computeWeeklyCosts(
  employeeCount: number,
  publishedProjects: Array<{ weeksPublished: number }>
): CostBreakdown

export function computeEffectivePrice(
  price: number,
  discountPct: number | null
): number
// discountPct null → price döner
// discountPct 0.50 → price × 0.50 döner

export function computeSalesMultiplier(discountPct: number | null): number
// null  → 1.0
// 0.25  → 1.5
// 0.50  → 2.5
// 0.75  → 4.0
```

---

## Haftalık Tick Entegrasyonu

`App.tsx`'teki `setOnWeeklyTick` callback'ine şunlar eklenir (sırayla):

1. `economyStore.computeAndApplyCosts()` — kira + sunucu + araç hesaplayıp `gameStore.addMoney(-total)`
2. `economyStore.tickLoan()` — kredi taksiti varsa düşür
3. `economyStore.activateSaleEvent()` — zamanı gelen event'i aktifleştir
4. `economyStore.deactivateSaleEvent()` — süresi dolan event'i kapat, projelerin `isOnSale`/`discountPct` sıfırlanır
5. `economyStore.checkCrisis()` — `gameStore.money < 0` → `isInCrisis: true`
6. `economyStore.tickCrisis()` — kriz varsa `crisisWeeksLeft--`; 0'a düşünce `declareBankruptcy()`
7. `economyStore.scheduleSaleEvent()` — `nextSaleWeek` geldiyse yeni event planla (13 hafta sonrası)

Ayrıca `newsStore`'a: sale event `nextSaleWeek - 3` haftasında haber düşer.

`SaleEventModal` için: `economyStore.pendingSaleEventModal === true` iken `App.tsx` `SaleEventModal`'ı render eder. Kullanıcı "Onayla"ya bastıktan sonra `closeSaleEventModal()` çağrılır.

`deactivateSaleEvent` içinde: `useProjectStore.getState().clearSaleParticipation()` çağrılır — bu action tüm projelerin `isOnSale: false`, `discountPct: null` yapar.

---

## Fiyatlandırma Akışı

### Lansman

`NewProjectModal` yayınla adımında fiyat seçimi:

```
Fiyat seç:  [5$]  [10$]  [★20$]  [30$]  [40$]  [60$]
            (★ = platform önerisi)
```

Fiyat seçilmeden "Yayınla" butonu pasif. Seçilen fiyat `project.price` olarak kaydedilir.

Satış hesabı: `revenue = sales × computeEffectivePrice(price, discountPct)`

Mevcut `scoreEngine`'deki `baseSales × platform_multiplier` formülü korunur; üstüne `computeSalesMultiplier(discountPct)` çarpanı eklenir.

### Post-launch fiyat düşürme

`ProjectCard`'da "Fiyatı Düşür" butonu. Tıklanınca mevcut fiyattan **düşük** preset noktalar aktif gösterilir, diğerleri disabled. Seçilince `projectStore.updateProjectPrice(id, newPrice)` çağrılır — geri alınamaz.

### Platform indirim etkinlikleri

Etkinlik aktifleştiğinde `SaleEventModal` açılır. Yayında olan projeler listelenir:

```
🏷️  PC Yaz İndirimi — 2 hafta

  Oyun Adı          Fiyat    Katıl?   İndirim
  ─────────────────────────────────────────────
  Nexus Wars        20$      [ ]      %25 / %50 / %75
  Space Rogue       15$      [✓]      %25 / ★%50 / %75

                              [Onayla]
```

Oyuncu her proje için katıl/katılma ve indirim oranı seçer. "Onayla" → seçilen projeler `isOnSale: true`, `discountPct` set edilir.

Etkinlik bitince `deactivateSaleEvent()` tüm projelerin `isOnSale: false`, `discountPct: null` yapar.

---

## Sabit Giderler

### Haftalık hesap

```
Kira        = 500$ × çalışan_sayısı
Sunucu      = Σ max(50$, 500$ - hafta_sayısı × 10$)   [yayında her proje için]
Araç lis.   = 200$ × çalışan_sayısı
─────────────────────────────────────
Alt toplam  = kira + sunucu + araç
```

Maaşlar ayrıca `employeeStore.weeklyTick()` üzerinden düşmeye devam eder.

### Acil gider eventleri

`eventStore`'a yeni `ekonomik_kriz` kategorisi. Yılda en fazla 2 kez (mevcut cooldown altyapısı). Örnekler:

| Event | Maliyet |
|-------|---------|
| Sunucu çöktü — acil bakım | 3.000$ |
| Yazılım lisansı yenileme | 5.000$ |
| Ekipman arızası | 2.000$ |
| Hukuki uyarı — danışmanlık | 4.000$ |

---

## Finansal Kriz & İflas

### Eşikler

| Durum | Koşul | Tepki |
|-------|-------|-------|
| Uyarı | `money < lastWeeklyCost × 2` | HUD para göstergesi kırmızı + toast |
| Kriz | `money < 0` | `isInCrisis: true`, `crisisWeeksLeft: 4`, `CrisisModal` açılır |
| İflas | `crisisWeeksLeft === 0` | `declareBankruptcy()` → `BankruptcyScreen` |

### `CrisisModal`

Kapatılamaz overlay. Para < 0 olduğu sürece açık kalır:

```
⚠️  Stüdyo mali krizde!
Nakit: -12.400$  |  4 haftanız var

[Çalışan Çıkar]   [Proje İptal Et]   [Kredi Al]
```

- **Çalışan Çıkar** → mevcut `EmployeePanel`'i açar (CrisisModal arka planda kalır)
- **Proje İptal Et** → aktif projeleri listeler, iptal edilince `projectStore.cancelProject(id)`
- **Kredi Al** → 25.000$, 12 haftada geri ödeme (~2.100$/hafta). Zaten aktif kredi varsa disabled.

Para tekrar ≥ 0 olunca `isInCrisis: false`, `CrisisModal` kapanır.

### `BankruptcyScreen`

Tüm UI'ın üstünde tam ekran overlay:

```
Stüdyo kapandı.

[Stüdyo Adı] tarihinde iflas etti.
Son nakit: -XX.XXX$

[Ana Menüye Dön]
```

`doMainMenu()` tüm store'ları sıfırlar, `StartScreen`'e döner.

---

## `savegameEngine` Güncellemesi

`economyStore` snapshot'a eklenir:

```typescript
economy: {
  lastWeeklyCost:  es.lastWeeklyCost,
  loan:            es.loan,
  loanWeeksLeft:   es.loanWeeksLeft,
  isInCrisis:      es.isInCrisis,
  crisisWeeksLeft: es.crisisWeeksLeft,
  isBankrupt:      es.isBankrupt,
  saleEvents:      es.saleEvents,
  nextSaleWeek:    es.nextSaleWeek,
}
```

`deserialize`'da `useEconomyStore.setState(...)` çağrılır.

---

## Entegrasyon Noktaları

| Dosya | Değişiklik |
|-------|------------|
| `src/types/index.ts` | `GameProject` union'a `price`, `discountPct`, `isOnSale` |
| `src/engine/economyEngine.ts` | Yeni: `computeWeeklyCosts`, `computeEffectivePrice`, `computeSalesMultiplier` |
| `src/store/economyStore.ts` | Yeni: sabit giderler, kredi, kriz, sale events |
| `src/data/platforms.ts` | `suggestedPrice` alanı |
| `src/store/eventStore.ts` | `ekonomik_kriz` event kategorisi + örnekler |
| `src/store/projectStore.ts` | `updateProjectPrice`, `joinSaleEvent`, `leaveSaleEvent`, `clearSaleParticipation`, `publishProject`'e `publishTickCount` set |
| `src/engine/scoreEngine.ts` | `computeEffectivePrice` + `computeSalesMultiplier` entegrasyonu |
| `src/App.tsx` | Haftalık tick'e ekonomi adımları |
| `src/components/NewProjectModal.tsx` | Fiyat seçimi adımı |
| `src/components/ProjectCard.tsx` | Fiyat göstergesi, "Fiyatı Düşür", indirim rozeti |
| `src/components/HUD.tsx` | Haftalık gider göstergesi, kriz rengi |
| `src/components/SaleEventModal.tsx` | Yeni |
| `src/components/CrisisModal.tsx` | Yeni |
| `src/components/BankruptcyScreen.tsx` | Yeni |
| `src/engine/savegameEngine.ts` | `economyStore` snapshot'a ekle |

---

## Test Stratejisi

### `tests/engine/economyEngine.test.ts`

1. `computeWeeklyCosts`: 0 çalışan → 0 kira ve araç
2. `computeWeeklyCosts`: sunucu maliyeti doğru azalır (hafta 40 → 100$, hafta 60 → 50$)
3. `computeEffectivePrice`: `discountPct: null` → fiyat değişmez
4. `computeEffectivePrice`: `discountPct: 0.50` → yarı fiyat
5. `computeSalesMultiplier`: her indirim oranı için doğru çarpan

### `tests/store/economyStore.test.ts`

1. `computeAndApplyCosts` → `gameStore.money` azalır
2. `takeLoan` → `gameStore.money` artar, `loan` ve `loanWeeksLeft` set edilir
3. `tickLoan` → her hafta taksit düşer; `loanWeeksLeft: 0` → `loan: 0`
4. `checkCrisis` → `money < 0` → `isInCrisis: true`
5. `tickCrisis` → `crisisWeeksLeft` azalır; 0 → `isBankrupt: true`
6. `scheduleSaleEvent` → `nextSaleWeek` 13 hafta ilerler
7. `activateSaleEvent` → doğru haftada event aktifleşir

### `tests/store/projectStore.test.ts` (ek)

1. `updateProjectPrice`: sadece düşük fiyata izin verir
2. `joinSaleEvent`: `isOnSale: true`, `discountPct` set edilir
3. `leaveSaleEvent`: `isOnSale: false`, `discountPct: null`

---

## Kapsam Dışı

- Platform pazar payı dinamikleri (C fazı — ayrı spec)
- Pazarlama bütçesi (D fazı — ayrı spec)
- Fiyat geçmişi grafiği
- Çok oyunlu fiyatlandırma stratejileri (bundle vb.)
- Kredi faizi (sabit taksit, faiz yok)
