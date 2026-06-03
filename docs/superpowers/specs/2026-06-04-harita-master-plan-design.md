# Harita Master Planı — Design Spec

> Oyunun fiziksel dünyasını tanımlayan referans dokümanı. Kod yazmaz; tüm oda ve NPC spec/plan döngüleri buraya dayanır.

---

## Tek Cümle

Şehri sol/sağ kenar navigasyonuyla birbirine bağlı 9 odaya böler; 24 NPC'nin her birini kalıcı olarak bir odaya yerleştirir ve yeni oda/NPC eklemeyi tek dosya üzerinden yönetir.

---

## Mimari

Dört bileşen:

1. **`RoomId` union** (`worldStore.ts`) — tüm oda kimliklerinin tek kaynağı
2. **`npcLocations.ts`** — `Record<NPCId, RoomId>` — hangi NPC hangi odada yaşıyor
3. **Oda dosyaları** (`src/pixi/rooms/*.ts`) — her oda kendi PixiJS scene dosyasında
4. **`mapData.ts` navigasyon grafı** — hangi odanın solunda/sağında ne var

Yeni oda eklemek için protokol:
1. `RoomId`'ye yeni id ekle
2. `src/pixi/rooms/` altına yeni oda dosyası oluştur
3. `mapData.ts`'de sol/sağ bağlantıları tanımla
4. `npcLocations.ts`'de ilgili NPC'leri yeni odaya ata

---

## Room Kataloğu

| RoomId | İsim | Atmosfer | Sol | Sağ |
|--------|------|----------|-----|-----|
| `coast_home` | Sahil Evi | Konut, bahçe, deniz feneri | — | `coast_docks` |
| `coast_docks` | Nehir İskelesi | Balıkçı rıhtımı, su kıyısı | `coast_home` | `coast_center` |
| `coast_center` | Mahalle Merkezi | Pub, sahaf, fırın, klinik | `coast_docks` | `coast_west` |
| `coast_west` | Batı Semt | Sakin, kafe, atölye, park | `coast_center` | `bridge` |
| `bridge` | Köprü | Geçiş, iki dünya arası | `coast_west` | `city_core` |
| `city_core` | Kurumsal Merkez | Stüdyo, hukuk, akademi, basın | `bridge` | `city_culture` |
| `city_culture` | Eğlence / Kültür | Arcade, atölye, bistro | `city_core` | `city_edge` |
| `city_edge` | Kenar Mahalle | Evsiz semt, klinik, havuz | `city_culture` | `city_park` |
| `city_park` | Park | Yeşil alan, açık, neon arka plan | `city_edge` | — |

**Mevcut oda eşlemesi:**
- `coastRoom` → `coast_center` (yeniden adlandırma, içerik değişmez)
- `cityRoom` → `city_core` (yeniden adlandırma, içerik değişmez)
- `bridge` → zaten var, sadece `RoomId` güncellenir

---

## NPC Yerleşimi

`src/data/npcLocations.ts` dosyası:

```ts
import type { NPCId } from './npcDialogues'
import type { RoomId } from '@/store/worldStore'

export const NPC_HOME_ROOMS: Record<NPCId, RoomId> = {
  // coast_home — Konut, bahçe, deniz feneri
  aldo:    'coast_home',
  liv:     'coast_home',
  cassian: 'coast_home',

  // coast_docks — Balıkçı rıhtımı, su kıyısı
  remy:    'coast_docks',
  soren:   'coast_docks',
  sigrid:  'coast_docks',
  daniel:  'coast_docks',

  // coast_center — Pub, sahaf, fırın, klinik
  marcus:  'coast_center',
  theo:    'coast_center',
  marta:   'coast_center',
  rosa:    'coast_center',
  bjorn:   'coast_center',
  nadia:   'coast_center',

  // coast_west — Kafe, atölye, park
  bruno:   'coast_west',
  magnus:  'coast_west',
  elise:   'coast_west',

  // city_core — Stüdyo, hukuk, akademi, basın
  clara:   'city_core',
  vivian:  'city_core',
  iris:    'city_core',

  // city_culture — Arcade, atölye, bistro
  rex:     'city_culture',
  yevgeni: 'city_culture',
  matteo:  'city_culture',

  // city_edge — Klinik, havuz
  elias:   'city_edge',
  kai:     'city_edge',
}
```

`coast_center` 6 NPC ile en kalabalık odadır. İçerik genişledikçe `coast_center_a` / `coast_center_b`'ye bölünebilir — bu kararı o odanın kendi spec döngüsüne bırakıyoruz.

---

## Navigasyon

Sol/sağ kenar geçişi — oyuncu ekranın kenarına ulaşınca oda değişir (mevcut `transitionToRoom` mekanizması):

```
[coast_home] ←→ [coast_docks] ←→ [coast_center] ←→ [coast_west] ←→ [bridge] ←→ [city_core] ←→ [city_culture] ←→ [city_edge] ←→ [city_park]
```

Uç odalar (`coast_home`, `city_park`) tek yönlü — dışarı çıkış yok.

---

## Faz Planı

### Grup 1 — Hemen (mevcut içeriği yeni sisteme taşı)
- `coast_center` ← mevcut `coastRoom` yeniden adlandırılır
- `city_core` ← mevcut `cityRoom` yeniden adlandırılır
- `bridge` ← `RoomId` güncellenir
- `npcLocations.ts` ← yeni dosya oluşturulur

### Grup 2 — Emlakçılıkla birlikte
- `coast_home` — oyuncunun evi, Aldo/Liv/Cassian
- `coast_docks` — iskele, Remy/Søren/Sigrid/Daniel

### Grup 3 — İleriki fazlarda
- `coast_west` — Bruno/Magnus/Elise
- `city_culture` — Rex buraya taşınır (şu an `city_core`'da)
- `city_edge` — Elias/Kai
- `city_park` — boş, içerik hazır olunca

Her grup kendi spec → plan → implementation döngüsünde ele alınır.

---

## Genişleme Kuralları

- `coast_center` 6 NPC ile kalabalık — bölme kararı o odanın spec'ine bırakılır
- `city_park` şimdilik boş; ileriki fazda NPC veya event alanı olabilir
- Romantizm adayları kasıtlı olarak hem sahil hem şehir yakasına dağıtılmıştır — oyuncunun her iki yakayı da keşfetmesi için
- `bridge` NPC barındırmaz; sadece geçiş mekanizması
