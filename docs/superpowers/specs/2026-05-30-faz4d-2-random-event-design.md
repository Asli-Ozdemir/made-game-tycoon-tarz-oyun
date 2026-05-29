# Faz 4D-2 — Random Event Sistemi: Tasarım Dokümanı

**Tarih:** 2026-05-30
**Kapsam:** Tek alt faz — event kataloğu + engine + store + EventModal UI
**Önceki faz:** 4D-1 — Piyasa & Tür Trendi
**Sonraki faz:** 4D-3 (Çalışan Gelişimi)

---

## Genel Bakış

Oyun sırasında rastgele olaylar tetiklenir. Küçük olaylar NewsFeed'e pasif bildirim olarak düşer; büyük olaylar oyuncudan karar isteyen bir modal açar. Her event kategoriye ve bireysel ID'ye bağlı cooldown sistemiyle tekrar kontrolü yapılır. Seçimler para, itibar, proje kalitesi/süresi ve çalışan durumunu etkileyebilir.

---

## Veri Modeli

### `src/data/events.ts`

```typescript
export type EventCategory = 'finansal' | 'studyo' | 'sektor' | 'kisisel' | 'rakip'

export interface EventEffect {
  money?:        number   // + veya – (mutlak değer)
  reputation?:   number   // + veya –
  qualityBonus?: number   // aktif projelerin qualityPoints toplamına eklenir
  weekDelay?:    number   // aktif projelerin totalWeeks değerine eklenir
  employeeLeave?: boolean // rastgele bir çalışan işten ayrılır
}

export interface EventChoice {
  text:       string
  condition?: { minMoney?: number; minReputation?: number }
  effect:     EventEffect
}

export interface RandomEvent {
  id:           string
  category:     EventCategory
  title:        string
  description:  string
  type:         'passive' | 'choice'
  weight:       number         // 1–10, seçim ağırlığı
  cooldownYears: number        // son tetiklenmeden bu kadar yıl geçmeli
  trigger?: {
    minReputation?: number
    maxReputation?: number
    minMoney?:      number
    maxMoney?:      number
    minPublished?:  number     // yayınlanan oyun sayısı
  }
  effect?:    EventEffect      // type === 'passive' için
  choices?:   EventChoice[]    // type === 'choice' için, 2–4 eleman
}

export const EVENTS: RandomEvent[] = [ /* katalog aşağıda */ ]
```

### Event Kataloğu (52 event)

#### Finansal (12 event)

| id | title | type | weight | cooldown | trigger |
|---|---|---|---|---|---|
| `vergi_denetimi` | Vergi Denetimi | choice | 4 | 3 | minPublished:2 |
| `yatirimci_teklifi` | Yatırımcı Teklifi | choice | 6 | 4 | minReputation:40 |
| `banka_kredisi` | Banka Kredi Teklifi | choice | 5 | 3 | minPublished:1 |
| `beklenmedik_gider` | Beklenmedik Gider | passive | 7 | 2 | — |
| `sponsor_anlasma` | Sponsor Anlaşması | choice | 5 | 3 | minReputation:30 |
| `sigorta_odemesi` | Sigorta Ödemesi | passive | 4 | 4 | minPublished:2 |
| `hisse_kazanci` | Hisse Senedi Kazancı | passive | 3 | 3 | minMoney:50000 |
| `para_cezasi` | Para Cezası | passive | 5 | 2 | — |
| `muhasebe_hatasi` | Muhasebe Hatası | choice | 4 | 3 | minPublished:1 |
| `kredi_karti_dolandiriciligi` | Dolandırıcılık Girişimi | choice | 3 | 4 | — |
| `devlet_destegi` | Devlet Destek Hibe | choice | 3 | 5 | minReputation:50 |
| `beklenmedik_gelir` | Beklenmedik Royalty Geliri | passive | 5 | 3 | minPublished:3 |

#### Stüdyo (12 event)

| id | title | type | weight | cooldown | trigger |
|---|---|---|---|---|---|
| `ekipman_arizasi` | Ekipman Arızası | passive | 7 | 2 | — |
| `ofis_su_baskini` | Su Baskını | choice | 3 | 5 | — |
| `buyuk_bug` | Kritik Bug Bulundu | choice | 6 | 2 | minPublished:1 |
| `viral_sosyal_medya` | Viral Sosyal Medya | passive | 5 | 3 | minPublished:1 |
| `ekip_moral_krizi` | Ekip Moral Krizi | choice | 6 | 3 | — |
| `yeni_yazilim_lisansi` | Yeni Yazılım Lisansı | choice | 4 | 3 | minMoney:20000 |
| `yangin_alarmi` | Yangın Alarmı | passive | 4 | 3 | — |
| `internet_kesintisi` | İnternet Kesintisi | passive | 6 | 2 | — |
| `basarili_crunch` | Başarılı Crunch Dönemi | passive | 5 | 2 | minPublished:1 |
| `ofis_tasinma` | Ofis Taşıma Fırsatı | choice | 3 | 5 | minMoney:30000 |
| `veri_kaybi` | Veri Kaybı | choice | 4 | 3 | minPublished:1 |
| `sosyal_medya_krizi` | Sosyal Medya Krizi | choice | 4 | 3 | minReputation:40 |

#### Sektör (10 event)

| id | title | type | weight | cooldown | trigger |
|---|---|---|---|---|---|
| `piyasa_cokusu` | Oyun Piyasası Çöküşü | passive | 3 | 5 | — |
| `yeni_platform_duyurusu` | Yeni Platform Duyurusu | passive | 4 | 4 | — |
| `buyuk_firma_iflas` | Büyük Firma İflas | passive | 3 | 5 | — |
| `endustri_grevi` | Endüstri Grevi | choice | 3 | 5 | — |
| `yeni_motor_cikti` | Yeni Oyun Motoru Çıktı | choice | 5 | 4 | minMoney:15000 |
| `oyun_festivali` | Oyun Festivali Daveti | choice | 5 | 3 | minReputation:35 |
| `medya_ilgisi` | Oyun Medyasının İlgisi | passive | 6 | 2 | minPublished:2 |
| `telif_hukuku_degisikligi` | Telif Hukuku Değişikliği | passive | 3 | 5 | — |
| `konsol_savas` | Konsol Savaşı | passive | 4 | 4 | — |
| `indie_dalga` | Indie Dalga | passive | 5 | 3 | minPublished:1 |

#### Kişisel (8 event)

| id | title | type | weight | cooldown | trigger |
|---|---|---|---|---|---|
| `konferans_daveti` | Konferans Daveti | choice | 5 | 3 | minReputation:30 |
| `roportaj_talebi` | Röportaj Talebi | choice | 6 | 2 | minReputation:25 |
| `mentorlik_teklifi` | Mentörlük Teklifi | choice | 4 | 4 | minReputation:50 |
| `yorgunluk_krizi` | Tükenmişlik Krizi | choice | 5 | 3 | — |
| `aile_ziyareti` | Aile Ziyareti | passive | 5 | 2 | — |
| `saglik_sorunu` | Sağlık Sorunu | choice | 4 | 3 | — |
| `kitap_teklifi` | Kitap Yazma Teklifi | choice | 3 | 5 | minReputation:60 |
| `odul_toreni_daveti` | Ödül Töreni Daveti | choice | 4 | 3 | minReputation:45 |

#### Rakip (10 event)

| id | title | type | weight | cooldown | trigger |
|---|---|---|---|---|---|
| `rakip_casusluk` | Rakipten Casusluk İddiası | choice | 4 | 4 | minReputation:50 |
| `rakip_calisan_teklifi` | Rakip Çalışan Teklifi | choice | 5 | 3 | minReputation:40 |
| `fikir_hirsizligi_iddiasi` | Fikir Hırsızlığı İddiası | choice | 4 | 4 | minPublished:2 |
| `rakip_isbirligi` | Rakip İşbirliği Teklifi | choice | 4 | 4 | minReputation:35 |
| `rakip_kopyalama` | Rakip Oyununu Kopyaladı | passive | 5 | 3 | minPublished:1 |
| `rakip_iflas_firsati` | Rakip İflas Fırsatı | choice | 3 | 5 | minMoney:100000 |
| `sektorde_dedikodu` | Sektörde Dedikodu | passive | 6 | 2 | — |
| `rakip_medyada_atakta` | Rakip Medyada Atakta | passive | 5 | 2 | minReputation:30 |
| `talent_savaşi` | Yetenek Savaşı | choice | 4 | 3 | minReputation:45 |
| `rakip_patent_davasi` | Rakip Patent Davası | choice | 3 | 5 | minPublished:3 |

---

## Engine

### `src/engine/eventEngine.ts`

Saf fonksiyonlar — hiçbir store'a erişmez, dışarıdan state alır.

```typescript
interface GameStateSnapshot {
  reputation:     number
  money:          number
  totalPublished: number
}

// Aday eventleri filtrele
export function candidateEvents(
  catalog:          RandomEvent[],
  cooldowns:        Record<string, number>,   // eventId → son tetiklendiği yıl
  lastCategoryYear: Record<string, number>,   // category → son tetiklendiği yıl
  currentYear:      number,
  gameState:        GameStateSnapshot
): RandomEvent[]

// Ağırlıklı rastgele seçim
export function pickEvent(candidates: RandomEvent[]): RandomEvent | null

// Bir seçeneğin koşulunu değerlendir
export function isChoiceAvailable(
  condition: EventChoice['condition'],
  gameState: GameStateSnapshot
): boolean
```

**`candidateEvents` filtreleme sırası:**
1. `trigger` koşulları sağlanmıyor → elenir
2. `cooldowns[event.id]` varsa ve `currentYear - cooldowns[event.id] < event.cooldownYears` → elenir
3. `lastCategoryYear[event.category] === currentYear` → elenir (kategori cooldown)
4. Kalan eventler `weight` değerleriyle ağırlıklı listeye girer

**`pickEvent` algoritması:**
Toplam ağırlık hesaplanır, `Math.random() * totalWeight` rastgele sayı üretilir, kümülatif ağırlık gezerek seçim yapılır.

---

## Store

### `src/store/eventStore.ts`

```typescript
interface EventStore {
  pendingEvent:      RandomEvent | null
  cooldowns:         Record<string, number>   // eventId → son tetiklendiği yıl
  lastCategoryYear:  Record<string, number>   // category → son tetiklendiği yıl

  tryWeeklyEvent:   (year: number) => void
  tryAnnualEvent:   (year: number) => void
  checkMilestones:  (year: number) => void
  resolveEvent:     (choiceIndex: number | null) => void
  reset:            () => void
}
```

**`tryWeeklyEvent(year)`:**
- `pendingEvent` doluysa erken çık (bir seferde en fazla 1 bekleyen event)
- `Math.random() < 0.15` (haftada %15 şans)
- `candidateEvents` ile aday listesi oluştur; `pickEvent` ile seç
- Seçilen event pasifse: `newsStore.addItem` + cooldown güncelle (pendingEvent set edilmez)
- Seçilen event choice'sa: `pendingEvent` set et

**`tryAnnualEvent(year)`:**
- `pendingEvent` doluysa erken çık
- Her yıl guaranteed 1 event seçilir
- Tüm katalogdan `candidateEvents` filtreler, `pickEvent` seçer
- Pasif → news; choice → pending

**`checkMilestones(year)`:**
- `pendingEvent` doluysa erken çık
- Yalnızca `trigger` alanı olan eventler (zaten `candidateEvents` bunu filtreler)
- Aynı `tryAnnualEvent` akışıyla çalışır, ek filtre yok (trigger zaten `candidateEvents`'te)

**`resolveEvent(choiceIndex)`:**
- `choiceIndex === null` → passive dismiss (yalnızca cooldown güncelle)
- Aksi halde `choices[choiceIndex].effect` uygulanır:
  - `money` → `gameStore.addMoney(effect.money)`
  - `reputation` → `gameStore.gainReputation(effect.reputation)`
  - `qualityBonus` → aktif projelerin `qualityPoints` toplamına eklenir (`projectStore`)
  - `weekDelay` → aktif projelerin `totalWeeks` değerine eklenir (`projectStore`)
  - `employeeLeave` → `employeeStore`'daki ilk atanmamış çalışan ayrılır; yoksa atanmış rastgele biri
- `cooldowns[event.id] = year`
- `lastCategoryYear[event.category] = year`
- `newsStore.addItem({ type: 'random_event', rivalId: null, text: ..., year, season: 0 })`
- `pendingEvent = null`

---

## News Entegrasyonu

`src/types/rival.ts` içindeki `NewsType` genişler:

```typescript
export type NewsType =
  | 'rival_release'
  | 'rival_award'
  | 'rival_scandal'
  | 'rival_notice'
  | 'player_mention'
  | 'market_trend'
  | 'random_event'    // ← yeni
```

Her event çözümlendiğinde (pasif veya choice) `newsStore.addItem` çağrılır. Haber metni: `event.title` kullanılır.

---

## UI Bileşenleri

### `src/components/EventModal.tsx`

App.tsx'te `pendingEvent` doluyken render edilir — `ResolutionScreen` ile aynı pattern.

```
┌──────────────────────────────────────┐
│  🎲 Beklenmedik Olay                 │
│                                      │
│  Vergi Denetimi                      │
│                                      │
│  Maliye denetçileri stüdyona geldi.  │
│  Kayıtlarınızı düzeltmek ister misiniz? │
│                                      │
│  [Kayıtları Düzenle  -$15.000]       │
│  [Denetçiyle İşbirliği Yap]          │
│  [İtiraz Et  (min. 40 itibar) ░░░]  │  ← yetersiz koşul → disabled
└──────────────────────────────────────┘
```

- Başlık: sabit "🎲 Beklenmedik Olay" + `event.title`
- Açıklama: `event.description`
- Her `EventChoice` için bir buton; `condition` sağlanmıyorsa `disabled` + `opacity-50`
- Pasif eventler için tek "Tamam" butonu (`resolveEvent(null)`)
- Seçim yapılınca `resolveEvent(index)` çağrılır

---

## Dashboard Entegrasyonu

`src/components/Dashboard.tsx` içinde iki yeni useEffect:

```typescript
// Haftalık event kontrolü
const week = useTimeStore((s) => s.date.week)
useEffect(() => {
  if (year <= 2000) return
  useEventStore.getState().tryWeeklyEvent(year)
}, [week])

// Yıllık event ve milestone kontrolü — mevcut year useEffect'e eklenir
useEventStore.getState().tryAnnualEvent(year)
useEventStore.getState().checkMilestones(year)
```

`handleNewGame` içine `useEventStore.getState().reset()` eklenir.

---

## App.tsx Entegrasyonu

```typescript
const pendingEvent = useEventStore((s) => s.pendingEvent)

// Gating sırası:
if (pendingResolution) return <ResolutionScreen />
if (pendingEvent)      return <EventModal />
```

---

## Entegrasyon Noktaları

| Dosya | Değişiklik |
|---|---|
| `src/data/events.ts` | Yeni dosya — 52 event kataloğu |
| `src/engine/eventEngine.ts` | Yeni dosya — candidateEvents, pickEvent, isChoiceAvailable |
| `src/store/eventStore.ts` | Yeni dosya — pendingEvent, cooldowns, try*/resolve/reset |
| `src/types/rival.ts` | NewsType'a `'random_event'` eklenir |
| `src/components/EventModal.tsx` | Yeni dosya — choice/passive UI |
| `src/components/Dashboard.tsx` | week useEffect + year useEffect eklentisi + reset |
| `src/App.tsx` | EventModal gating |

---

## Test Stratejisi

### `tests/engine/eventEngine.test.ts`

1. `candidateEvents` — trigger koşulu sağlanmayan event elenir
2. `candidateEvents` — bireysel cooldown aktifken event elenir
3. `candidateEvents` — kategori cooldown aktifken o kategoriden event çıkmaz
4. `candidateEvents` — tüm filtrelerden geçen event listede kalır
5. `pickEvent` — boş listede null döner
6. `pickEvent` — ağırlıklı seçim: weight:10 olan event, weight:1 olandan ~10× daha sık seçilir (1000 deneme)
7. `isChoiceAvailable` — minMoney koşulu para yeterliyse true, yetersizse false
8. `isChoiceAvailable` — condition yoksa true döner

### `tests/store/eventStore.test.ts`

1. `tryWeeklyEvent` — pendingEvent doluysa yeni event seçilmez
2. `tryAnnualEvent` — yıl 2000'de çağrılmaz (Dashboard koruması)
3. `resolveEvent(null)` — passive: cooldown güncellenir, pendingEvent temizlenir
4. `resolveEvent(0)` — choice: para etkisi uygulanır
5. `resolveEvent(0)` — choice: itibar etkisi uygulanır
6. `resolveEvent(0)` — cooldowns ve lastCategoryYear güncellenir
7. `resolveEvent(0)` — newsStore'a random_event haberi eklenir
8. `reset` — tüm state temizlenir

---

## Kapsam Dışı (Faz 4D-2)

- Event geçmişinin save/load'da persist edilmesi
- Birden fazla eş zamanlı pending event
- Event zinciri (bir event başka bir event tetikler)
- Event'lerin rakip ilişkisini doğrudan değiştirmesi (rivalStore)
- Çalışan ayrılmasında animasyon/cutscene
