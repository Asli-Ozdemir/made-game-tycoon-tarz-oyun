# Emlakçılık Side Job — Tasarım Dokümanı

> Oyunun fiziksel haritasını ve NPC ilişkilerini kalıcı olarak değiştiren, hırs yolunun gri bedel yan işi.

---

## Tek Cümle

Vivian aracılığıyla beş named mülkü alıp yeniden satarsın; her satış bir NPC'yi kalıcı olarak incitir, nehir mahallesini kızdırır ve kirli bir analiz tohumu bırakır.

---

## Mimari

İki dosya:

1. **`src/data/propertyDeals.ts`** — 5 mülk tanımı (id, isim, konum, baz maliyet, alıcı tipi, tavan aralığı, hint, etkilenen NPC, mahalle alanı)
2. **`src/store/emlakcilikStore.ts`** — aktif deal state, Kira Endeksi, tamamlanan satışlar, müzakere fazı

Shift bazlı değil — **deal bazlı**. Beş mülk bağımsız, istediğin sırayla açıklar.

---

## Erişim Kapısı

Vivian'ın T1 diyaloğunu tamamladıktan sonra `city_core`'daki `investor_office` trigger aktif olur. Vivian seni işe davet eder. Sonraki tüm mülkler aynı lokasyondan açılır.

---

## İki Aşamalı Mekanik

### Aşama 1 — Vivian Brief

Vivian bir mülk kartı gösterir:
- Konum (oda adı)
- Tahmini değer aralığı
- Alıcı tipi: `kurumsal_yatirimci` | `genc_girisimci` | `spekulatif_yatirimci`
- Muğlak semt ipucu — tam bilgi yok, sadece ton: "eski, işlek bir bölge", "nehir kenarı sakin mahalle", "park yakını yeşil alan"

Oyuncu hangi binadan söz edildiğini, kimin etkileneceğini brief aşamasında kesin olarak bilmez.

### Aşama 2 — Alıcı Müzakeresi

Alıcının görünmez tavan fiyatı var. 3 teklif hakkın var:

**Tepki sinyalleri:**
| Sinyal | Anlam |
|--------|-------|
| "Tereddüt etti" | Yakındasın ama biraz yüksek |
| "Düşündü, gülümsedi" | Altındasın, müzakerede |
| "Masayı terk etti" | Tavanı aştın — satış düştü |
| "Kabul etti" | Kapandı |

3 teklifin hepsinde masa terk edilirse deal kaybolur. Vivian'a geri dönüp aynı mülkü tekrar deneyebilirsin — ama alıcı profili değişir.

**Alıcı tipleri:**
- `kurumsal_yatirimci` — yüksek bütçe, soğuk, düşük sinyal
- `genc_girisimci` — düşük bütçe, risk alır, abartılı sinyal
- `spekulatif_yatirimci` — orta bütçe, sabırsız, 2. teklif sonrası acelecilik sinyali

---

## Mülk Kataloğu

| ID | Mülk | Konum | Baz Maliyet | Tavan Aralığı | Maks Kâr | Etkilenen NPC | Mahalle Hasarı |
|----|------|-------|-------------|---------------|----------|---------------|----------------|
| `sahaf_binasi` | Sahaf'ın Binası | coast_center | 40,000 | 55,000–75,000 | 35,000 | Marcus | coast_center |
| `iskele_deposu` | İskele Deposu | coast_docks | 25,000 | 38,000–55,000 | 30,000 | Remy | coast_docks |
| `firin_arsasi` | Fırın Arsası | coast_center | 30,000 | 45,000–62,000 | 32,000 | Marta | coast_center |
| `park_kenari` | Park Kenarı | city_park | 50,000 | 70,000–95,000 | 45,000 | — | — |
| `klinik_yani` | Klinik Yanı | city_edge | 35,000 | 50,000–70,000 | 35,000 | Elias | city_edge |

---

## NPC Sonuçları

### Direkt hasar
Mülkün etkilenen NPC'si ilişki **kalıcı olarak tavanlanır** (max 20). T2/T3 diyalogları kapanır, NPC soğur ama tam bloke olmaz.

### Mahalle kızgınlığı
Satış yapılan odadaki (coast_center, coast_docks, city_edge) tüm NPC'ler **-15 ilişki** kaybeder.

---

## Kira Endeksi

Her satışta `rentIndex += 20`. Eşik etkileri:

| Endeks | Etki |
|--------|------|
| 40 | NPCs "mahalle değişiyor" diye konuşur (diyalog değişikliği) |
| 60 | Vivian brief'teki semt ipuçlarının tonu sertleşir |
| 80 | Global `reputation -= 10` |
| 100 | Tövbe mekaniği için pişmanlık beat'i tetiklenebilir |

---

## Ödüller

| Kalem | Değer |
|-------|-------|
| Para | Müzakere becerisine göre, maks kâr yukarıdaki tabloda |
| Seed | 1× `analiz`, `kirli: true` — kullanılan oyun skandal riski taşır |
| Hırs yolu | 3 satış tamamlayınca `hirs` path progress +1 |

---

## Veri Yapısı

```ts
// src/data/propertyDeals.ts
export type BuyerType = 'kurumsal_yatirimci' | 'genc_girisimci' | 'spekulatif_yatirimci'

export interface PropertyDeal {
  id: string
  label: string
  roomId: RoomId
  baseCost: number
  buyerCeilingMin: number
  buyerCeilingMax: number
  hint: string           // Vivian'ın muğlak ipucu
  affectedNPC: NPCId | null
  communityRoom: RoomId | null
}

// src/store/emlakcilikStore.ts
interface EmlakcilikState {
  rentIndex: number                    // 0–100
  completedDealIds: string[]           // tamamlanan satışlar
  activeDeal: string | null            // aktif mülk id
  phase: 'idle' | 'brief' | 'negotiation' | 'result'
  offerCount: number                   // 0–3
  currentBuyerCeiling: number          // o deal için random çekilen tavan
}
```

---

## Test Stratejisi

- Her satış sonrası `rentIndex` +20 artar
- Direkt NPC ilişkisi tavan = 20 (artık çıkamaz)
- Mahalle odası NPC'leri -15 alır
- Eşik etkileri (40/60/80/100) doğru sırayla tetiklenir
- 3 teklif aşılınca deal kaybolur
- Kirli seed doğru tipte ve `kirli: true` ile düşer
- 3. satışta `hirs` path progress +1
