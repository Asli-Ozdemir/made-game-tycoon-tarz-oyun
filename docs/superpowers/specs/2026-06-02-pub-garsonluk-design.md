# Pub Garsonluk — Tasarım Dokümanı
_2026-06-02_

## Özet

Emek yoluna bağlı yan iş. Şehrin köklü pub'ında garson olarak 15 vardiya çalışırsın. Her vardiya 3–4 masanın siparişini zamanında alıp servis edersin; özel istekleri (alerjiler, tercihler) kaçırmadan. 15 vardiyayı tamamlayınca Restoran Simülasyonu oyun türü açılır.

---

## 1. Anlatı Çerçevesi

### Pub Sahibi
50'li yaşlarında, yorgun ama sıcak bir karakter. Her vardiya başında kısa brifing verir: o geceye özel notlar, VIP masalar, alerjiler. Oyuncu ilerledikçe güveni artar ve daha karmaşık geceler gelir.

### Baskı Unsuru
Şehirde yeni bir restoran açılıyor, pub müşteri kaybediyor. Her başarılı gece patronu biraz rahatlatıyor.

---

## 2. Gece Akışı

```
Vardiya başı (brifing) → Servis fazı (3–4 masa) → Vardiya sonu (ödül)
```

### Vardiya Başı
Patron kısa brifing verir: alerjiler, VIP notlar, o geceye özel kurallar. Bazı özel istekler yalnızca masaya gidince ortaya çıkar.

### Servis Fazı

3–4 masa aynı anda aktif. Her masanın bir **sabır barı** var — yavaşça doluyor.

**Masa etkileşimi:**
1. Masaya tıkla → müşteri profili + görünür özel istekler açılır
2. Siparişi seç ve mutfağa ilet
3. "Mutfak hazır" bildirimi gelince masaya tıkla → servis et
4. Sabır barı dolmadan servis edilmezse masa başarısız (hata sayılır)

**Özel istekler:**
- `revealedOnInteraction: false` — brifingde söylenir (alerjiler)
- `revealedOnInteraction: true` — masaya gidince ortaya çıkar ("az buzlu", "vejetaryen")
- Yanlış servis → sipariş geri gelir + zaman cezası (sabrı hızlandırır)

### Zorluk Artışı (15 Vardiya)

| Vardiya | Zorluk |
|---------|--------|
| 1–5 | 3 masa, açık istekler, tek çeşit sipariş |
| 6–10 | 4 masa, bazı istekler masaya gidince ortaya çıkar |
| 11–15 | 4 masa + rush saat (eş zamanlı sabır dolumu), VIP masa |

---

## 3. Ödül Sistemi

| Performans | Hata Sayısı | Zaman Yönetimi Tohumu | Emek İlerlemesi |
|-----------|-------------|----------------------|-----------------|
| Mükemmel | 0–1 | 3 | +5 |
| İyi | 2–3 | 2 | +3 |
| Kötü | 4+ | 1 | +1 |

**Hata sayımı:** Yanlış servis + sabır barı dolması her biri 1 hata sayılır.

15 vardiya × ortalama +3 ≈ 45 emek. Bar bodyguard ile birlikte ikisi ~100'e ulaşır.

### Tamamlama Bonusu
15 vardiyayı tamamlayınca: **Restoran Simülasyonu** oyun türü skill tree'de açılır.

---

## 4. Tohum Tipi

| Alan | Değer |
|------|-------|
| `type` | `'zaman_yonetimi'` |
| Skill tree etkisi | Mevcut zaman_yonetimi node'ları |

---

## 5. Teknik Mimari

```
src/data/pubShifts.ts                    ← 15 vardiya tanımı
src/store/pubStore.ts                    ← aktif vardiya durumu, masa state'leri, ödül
src/store/__tests__/pubStore.test.ts
src/pixi/ServiceScene.ts                 ← masa turu arayüzü (PixiJS)
```

### pubShifts.ts Veri Modeli

```ts
interface SpecialRequest {
  type: 'alerji' | 'tercih' | 'not'
  description: string                  // "Fıstık alerjisi", "Az buzlu", "Vejetaryen"
  revealedOnInteraction: boolean       // false = brifingde, true = masada ortaya çıkar
}

interface Customer {
  id: string
  name: string
  visualCues: string[]                 // "Takım elbise", "Sinirli görünüyor"
  specialRequests: SpecialRequest[]
}

interface Table {
  id: string                           // 'table_1' ... 'table_4'
  customers: Customer[]
  orderOptions: string[][]             // her müşteri için olası siparişler
  correctOrder: string[]               // doğru servis
  patienceMs: number                   // sabır barı dolma süresi
}

interface PubShift {
  id: string                           // 'pub_shift_01' ... 'pub_shift_15'
  briefingNotes: string[]              // vardiya öncesi patron notu
  tables: Table[]
}
```

### pubStore.ts Arayüzü

```ts
type TableStatus = 'waiting' | 'ordered' | 'cooking' | 'ready' | 'served' | 'failed'

interface TableState {
  tableId: string
  status: TableStatus
  servedOrder: string[] | null
  revealedRequests: boolean           // masaya tıklanıp tıklanmadı
  startedAt: number                   // Date.now() — sabır hesabı için
}

interface PubStore {
  activeShift: PubShift | null
  tableStates: Record<string, TableState>
  mistakes: number
  completedShifts: string[]

  startShift(shiftId: string): void
  interactTable(tableId: string): void        // ilk tıkla: özel istekleri göster
  submitOrder(tableId: string, order: string[]): void
  markReady(tableId: string): void            // mutfak hazır bildirimi
  deliverOrder(tableId: string): void
  failTable(tableId: string): void            // sabır barı doldu
  endShift(): { seeds: number; progress: number } | null
  reset(): void
}
```

### ServiceScene.ts

Bar bodyguard'daki `DoorScene` ve `FightScene` ile aynı PixiJS v8 pattern:
- `static async create(options)` factory, private constructor
- `destroy()` — event listener temizleme + `app.destroy()`
- Masa kartları grid halinde, her birinde sabır barı
- "Mutfak hazır" popup bildirimi
- Tıklama ile masa etkileşimi, sipariş seçim paneli

---

## 6. Kapsam Dışı

- Pub sahibi backstory ve tam diyalog ağacı — ayrı içerik
- Gerçek zamanlı sabır barı animasyonu ve mutfak zamanlayıcısı (`markReady` tetiklemesi) ServiceScene içinde `setInterval` ile çözülür — FightScene düşman zamanlayıcısıyla aynı pattern
- pub_shift_04–15 tam içeriği — altyapı kurulduktan sonra
- Çoklu sipariş taşıma (tepsi mekaniği) — ileride
