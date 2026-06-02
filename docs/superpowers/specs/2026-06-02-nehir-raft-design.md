# Nehir Sal Kaptanlığı — Raft Navigation Side Job Design

**Tarih:** 2026-06-02  
**NPC:** Søren (Liman Kaptanı, Varoluşçuluk)  
**Konum:** `nehir` (yeni LocationId)  
**Seed çıktısı:** kaos + zaman_yonetimi → Emek Yolu progress

---

## Bağlam

Macenta Koyu'nun nehir kenarında Søren her akşam sal seferleri yapar. Oyuncu bu seferlerde sal kaptanlığı yapıyor — Søren işi öğretiyor, ama asıl şey 10 sessionda ortaya çıkan geçmişi: bir ekip, bir fırtına gecesi, bir karar ve "mazeret yoktur" felsefesiyle yüzleşme.

**Emek Yolu uyumu:** Gameplay esnasında diyalog yok — iş odaklı. Hikaye briefing başında ve result sonunda Søren'in 2–3 cümlesiyle sızıyor.

---

## Phase Yapısı

```
briefing → rafting → result
```

**Briefing:** Søren o geceye dair 2–3 cümle söyler. Nehir koşullarını aktarır ("akıntı güçlü bu gece"), bazen geçmişinden bir kırıntı düşer.

**Rafting:** PixiJS sahne. Sal soldan sağa ilerler, oyuncu `←/→` (veya `A/D`) ile yönlendirir. Engeller aşılır, süre takip edilir.

**Result:** Søren performansa yorum yapar ve hikaye ipucu verir.

---

## Core Mechanic — Sal Kaptanlığı

### Görünüm
Yan kaydırmalı (side-scroll). Sal soldan sağa, ekran kayar.

```
[ Kararan gökyüzü — turuncu-lacivert gradient     ]
[ Uzak kıyı silueti — ağaç silüetleri             ]
────────────────────────────────────────────────── ← kıyı üst
[ Nehir — koyu mavi, yavaş akan akıntı çizgileri  ]
      🪵  ← sal (yüzer, input ile kayar)
────────────────────────────────────────────────── ← kıyı alt
[ Zemin şeridi                                     ]
```

### Input
- `←` / `A` → sol kürek — anlık sola itme
- `→` / `D` → sağ kürek — anlık sağa itme
- Input yok → akıntı salı kendi rotasına çeker

### Fizik
- Salın dikey pozisyonu nehrin genişliği içinde serbestçe kayar
- Kürek çekişi anlık momentum verir; yavaş söner
- `currentForce` (0.2–0.8): akıntı gücü her sessionda farklı
- Hard sessionlarda nehir kıvrımlarında akıntı yön değiştirir (`currentShifts` listesi)

### Engel Tipleri

| Engel | Tetikleyici | Sonuç |
|---|---|---|
| `rock` (kaya) | Salın merkezi kayaya değerse | +1 hasar |
| `narrows` (dar geçit) | Sal geçidin ortasından sapmazsa | +1 hasar |
| `debris` (yüzen moloz) | Hareket eden engel, çarpışma | +1 hasar |

**Hasar sistemi:** Her session 3 hakla başlar. 3 hasar → sal durur, sefer başarısız (düşük ödül).

### Süre Baskısı
Her seferin `timeLimitSecs` var. Süre dolmadan varmak yüksek ödül verir. Akıntıyı akıllıca kullanmak süreyi kısaltır.

---

## Ödül Hesabı

| Performans | kaos | zaman_yonetimi | emek progress |
|---|---|---|---|
| 0 hasar + zamanında | +1 | +3 | +5 |
| 1–2 hasar veya zamanında | +2 | +2 | +3 |
| 3 hasar veya geç | +3 | +1 | +1 |

*Kaos: kaotik seferlerden daha fazla; zaman_yonetimi: temiz seferlerden daha fazla.*

Session 10 tamamlandığında (Søren arc tam): `zaman_yonetimi +5` ek bonus.

---

## 10 Session — 3 Story Arc

Diyalog gameplay'i kesmez: `briefingLines` (pre) ve `resultLines` (post) üzerinden.

### Arc 1: Ekip (Sessions 1–3, easy)
Søren seni teste çekiyor. Sert ama adil. Geçmişte bir "ekip"ten bahseder — isim vermez, ton vermez.

| # | castCount eşdeğeri | Zorluk | Briefing tonu |
|---|---|---|---|
| 01 | 1 bölüm, az engel | easy | "Nehir sabırsızları sevmez. Bak önce, sonra kürek çek." |
| 02 | 1 bölüm, orta engel | easy | "Eskiden dörttük bu nehirde. Şimdi tekimi. Fark etmez." |
| 03 | 1 bölüm, kıvrım var | easy | "Ekibimin en iyisi dar geçitleri severdi. Neden mi? Sormadım." |

### Arc 2: Fırtına Gecesi (Sessions 4–6, hard)
Ekipten biri yoktu artık. Neden? Parça parça çıkıyor. Søren'in üslubu sertleşir.

| # | Zorluk | Briefing tonu |
|---|---|---|
| 04 | normal | "On beş yıl önce böyle bir gece vardı. Daha soğuktu." |
| 05 | hard | "O gece karar vermem gerekiyordu. Hızlı. Nehir beklemez." |
| 06 | hard | "Karar verdim. Yanlış mıydı? Yanlış kararlar da senindir." |

### Arc 3: Karar (Sessions 7–9, hard)
Ne olduğu ortaya çıkıyor. Ekipten Lasse — Søren'in genç tayfa. Dar geçitte, fırtınada, Søren "devam et" dedi. Lasse geçemedi.

| # | Zorluk | Briefing tonu |
|---|---|---|
| 07 | hard | "Lasse adında biri vardı. İyi kürekçiydi. Sen ona benziyorsun biraz." |
| 08 | hard | "O gece dar geçide girdik. Ben öndeydim. 'Devam et' dedim. Lasse arkadaydı." |
| 09 | hard | "Geçemedi. Ben geçtim. Mazeret aradım yıllarca — bulamadım. Çünkü yok." |

### Arc 4: Nehir Akar (Session 10, normal)
Kabul. Varoluşçu çözüm: karar sendi, acısı da senin, ama durmak Lasse'yi geri getirmez.

| # | Zorluk | Briefing tonu |
|---|---|---|
| 10 | normal | "Bu gece sadece akıyoruz. Nehir yanlış yöne akmaz — aşağıya akar. Biz de." |

---

## PixiJS Sahne — RaftScene

**Statik elemanlar (her frame):** Gökyüzü gradient, kıyı silueti, nehir.  
**Dinamik elemanlar:** Sal pozisyonu (kürek physics), akıntı çizgileri (offset scroll), engeller (sahneye göre x koordinatı).  
**UI overlay:** Sol üst hasar (3 ikon), sağ üst süre sayacı.  
**Grafik dili:** Sadece `Graphics` + `Text` — sprite asset yok.  
**Factory pattern:** `static async create(opts)` — `AntiquarianScene.ts` / `FishingScene.ts` kalıbı.

### RaftSceneOptions
```typescript
export interface RaftSceneOptions {
  canvas:        HTMLCanvasElement
  width:         number
  height:        number
  obstacles:     RaftObstacle[]
  currentForce:  number
  currentShifts: number[]
  timeLimitSecs: number
  onComplete:    (result: { damage: number; timeLeft: number }) => void
}
```

---

## Data Yapısı (`src/data/nehirShifts.ts`)

```typescript
export interface RaftObstacle {
  type:    'rock' | 'narrows' | 'debris'
  xNorm:   number   // 0–1, sahne boyunca konum
  yNorm:   number   // 0–1, nehir genişliğinde merkez
  width?:  number   // narrows için geçit genişliği (0–1)
}

export interface NehirShift {
  id:             string
  arcId:          'arc_ekip' | 'arc_firtina' | 'arc_karar'
  briefingLines:  string[]     // Søren pre-shift (2–3 cümle)
  resultLines: {
    good:    string[]          // 0 hasar, zamanında
    okay:    string[]          // 1–2 hasar veya zamanında
    bad:     string[]          // başarısız
  }
  currentForce:   number       // 0.2–0.8
  currentShifts:  number[]     // akıntı yön değiştiren x pozisyonları (xNorm)
  obstacles:      RaftObstacle[]
  timeLimitSecs:  number
  difficulty:     'easy' | 'normal' | 'hard'
}

export const NEHIR_SHIFTS: NehirShift[] = [/* 10 shift */]
```

---

## Dosya Listesi

```
src/data/nehirShifts.ts              — 10 shift data
src/store/nehirStore.ts              — Zustand state machine
src/pixi/RaftScene.ts                — PixiJS yan-kaydırmalı sahne
src/components/NehirPanel.tsx        — React panel (briefing/rafting/result)
```

**worldStore.ts:** `LocationId` union'ına `'nehir'` eklenir.  
**App.tsx:** `currentLocation === 'nehir'` bloğu eklenir.

---

## Kapsam Dışı

- Çok oyunculu / birden fazla sal
- Nehir haritası (tüm rota görünümü)
- Gündüz seferleri (tüm sessionlar akşam/gece)
- Hava durumu (fırtına görsel efekti — scope creep)
