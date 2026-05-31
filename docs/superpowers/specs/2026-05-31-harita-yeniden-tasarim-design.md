# Harita Yeniden Tasarımı: Tasarım Dokümanı

**Tarih:** 2026-05-31
**Kapsam:** 50×50 tile'lık dikey harita — güneyde mavi-sakin sahil bölgesi, ortada köprü, kuzeyde mor/pembe neon şehir. 1-bit colored tileset entegrasyonu. Mevcut 40×30 harita ve placeholder tileset tamamen yerini alır.

---

## Vizyon

Oyuncu sahil evinde başlar. Yukarı (kuzey) gidince köprüye ulaşır, köprüden geçince neon ışıklı küçük şehre girer. Sahil sakin, mavi, kişisel. Şehir karanlık, mor neon, endüstriyel. Geçiş köprüde hissedilir.

---

## Harita Boyutu ve Bölgeler

**50×50 tile, 32px/tile → 1600×1600px toplam**

| Bölge | Satırlar | Açıklama |
|-------|----------|----------|
| Sahil — Su | 0–3 | Yürünemez, mavi su tile'ları |
| Sahil — Kumsal | 4–6 | Yürünebilir, kum dokusu |
| Sahil — Ana | 7–21 | Sahil evi, sahaf, balıkçı, pub |
| Köprü | 22–25 | Dar taş geçit, her iki yanda su |
| Şehir — Giriş | 26–29 | Küçük meydancık, neon levhalar |
| Şehir — Ana | 30–39 | Kafe, fuar, akademi, dükkanlar |
| Şehir — Kuzey | 40–49 | Nexus kulesi, yatırımcı ofisi |

---

## Lokasyonlar ve Trigger Koordinatları

### Sahil Bölgesi

| Bina | Tile konum (sütun, satır) | Tile boyut | Trigger adı | Trigger piksel (x,y) |
|------|--------------------------|------------|-------------|----------------------|
| Sahil Evi | col 20–29, row 9–17 | 10×9 | `studio_desk` | (768, 384) |
| Sahaf | col 5–12, row 9–16 | 8×8 | `sahaf_door` | (256, 512) |
| Balıkçı | col 36–44, row 8–15 | 9×8 | `balikci_door` | (1184, 480) |
| Sahil Pub'ı | col 14–22, row 14–20 | 9×7 | `pub_door` | (480, 640) |

Sahil Evi: stüdyo masası trigger → tycoon modu. Eş ileride buraya taşınır (Spec C1).

### Köprü

Yürünebilir koridour: col 20–29 (10 tile genişlik), row 22–25. Her iki yanda (col 0–19 ve 30–49) su tile'ları — collision.

### Neon Şehir

| Bina | Tile konum | Tile boyut | Trigger adı | Trigger piksel (x,y) | Panel |
|------|------------|------------|-------------|----------------------|-------|
| Greta Çiçekçi | col 8–13, row 26–30 | 6×5 | `cicekci_door` | (320, 928) | Placeholder |
| Otto Kuyumcu | col 15–19, row 26–30 | 5×5 | `kuyumcu_door` | (512, 928) | Placeholder |
| Hanna/Tomas Han | col 34–39, row 26–30 | 6×5 | `han_door` | (1120, 928) | Placeholder |
| Akademi | col 18–31, row 28–37 | 14×10 | `akademi_door` | (768, 1152) | AcademyPanel |
| Kafe | col 4–13, row 30–39 | 10×10 | `cafe_door` | (288, 1216) | CafePanel |
| Fuar | col 36–46, row 30–39 | 11×10 | `fair_entrance` | (1280, 1216) | FairPanel |
| Nexus Binası | col 40–49, row 38–49 | 10×12 | `nexus_building` | (1408, 1344) | Placeholder |
| Yatırımcı Ofisi | col 1–8, row 40–49 | 8×10 | `investor_office` | (128, 1376) | Placeholder |

---

## Tileset Entegrasyonu

### Kaynak
`C:/Users/umutm/Desktop/asetler/1-bit-pack/Tilesheet/colored.png`
→ Projeye kopyalanır: `src/pixi/assets/tileset_1bit.png`

Mevcut `src/pixi/assets/tileset.png` (placeholder) silinir.

### Özellikler
- Tile boyutu: 16×16px, tile'lar arası 1px boşluk
- Grid: 49 sütun × 22 satır = 1078 tile
- Erişim formülü: `tileX = (id % 49) * 17`, `tileY = Math.floor(id / 49) * 17`
  (0-indexed; 17 = 16px tile + 1px boşluk)

### Kullanım Stratejisi

Zemin tile'ları bölgeye göre:

| Bölge | Arka plan rengi | Ground tile tipi | Notlar |
|-------|----------------|-----------------|--------|
| Sahil su | `#050e18` | Su tile'ları (mavi, dalga) | Collision |
| Sahil kum | `#1a2e20` | Kum/toprak tile'ları | Yürünebilir |
| Sahil ana | `#0d1e2a` | Çim/toprak tile'ları | Yürünebilir |
| Köprü | `#1a1a12` | Taş tile'ları | Yürünebilir (dar koridor) |
| Şehir giriş | `#0d0018` | Kaldırım tile'ları | Yürünebilir |
| Şehir ana | `#0a0016` | Asfalt/yol tile'ları | Yürünebilir |

Tile ID seçimi implement ederken `colored.png` görsel olarak incelenerek yapılır. Her bölge için 1-2 tile ID yeterli; dekoratif çeşitlilik için scatter pattern uygulanabilir.

### Bina Render Stili

Binalar **PixiJS Graphics** ile çizilir (tile sprite değil):
- **Sahil binaları**: koyu mavi doldurma (`0x0d2035`), açık teal border (`0x2a5a7c`)
- **Köprü taşları**: koyu gri doldurma (`0x2a2a1a`), sarımsı border (`0x4a4a2a`)
- **Şehir binaları**: koyu mor doldurma (`0x0d001e`), mor neon border (`0x9b30ff`), `lineStyle(2, 0x9b30ff)` ile glow hissi
- **Özel binalar** (Nexus): daha koyu, kalın border, yüksek

---

## Mimarisi — Değişen Dosyalar

### Yeni / Tamamen Yeniden Yazılan

**`src/pixi/mapData.ts`** (YENİ)
Harita verilerini TypeScript sabitleri olarak tutar. TMX dosyasının yerini alır.

```ts
export const MAP_WIDTH  = 50
export const MAP_HEIGHT = 50
export const TILE_SIZE  = 32

export interface Building {
  id: string
  col: number; row: number; cols: number; rows: number
  label: string
  style: 'coastal' | 'bridge' | 'city' | 'city_major'
}

export interface TriggerDef {
  name: string; x: number; y: number; w: number; h: number
}

export interface ZoneDef {
  rowStart: number; rowEnd: number
  bgColor: number
  type: 'coastal_water' | 'coastal_sand' | 'coastal' | 'bridge' | 'city' | 'city_north'
}

export const ZONES: ZoneDef[] = [ ... ]   // 6 bölge tanımı
export const BUILDINGS: Building[] = [ ... ]  // tüm binalar
export const TRIGGERS: TriggerDef[] = [ ... ] // tüm trigger'lar
// Collision rect'leri runtime'da BUILDINGS'ten türetilir:
// BUILDINGS.map(b => ({ x: b.col*TILE_SIZE, y: b.row*TILE_SIZE, w: b.cols*TILE_SIZE, h: b.rows*TILE_SIZE }))
// Buna ek olarak köprü yanları (col 0–19 ve 30–49, row 22–25) manuel eklenir:
// { x: 0, y: 22*32, w: 20*32, h: 4*32 }  // sol su
// { x: 30*32, y: 22*32, w: 20*32, h: 4*32 } // sağ su
// Sahil suyu (row 0–3) tüm genişlikte:
// { x: 0, y: 0, w: 50*32, h: 4*32 }
```

**`src/pixi/WorldScene.ts`** (TAM YENİDEN YAZILIR)
- TMX parse kaldırılır → `mapData.ts` import edilir
- `renderZones()`: bölge arka planlarını çizer (colored rectangles)
- `renderGroundTiles()`: bölgeye göre tileset sprite'ları serer
- `renderBuildings()`: `BUILDINGS` array'ini PixiJS Graphics ile çizer
- `renderTriggerOverlays()`: trigger overlay'leri (semi-transparent, geliştirici modunda)
- `isBlocked(px, py)`: `COLLISION_RECTS`'i kontrol eder (tile grid yerine)
- Kamera sistemi değişmez

**`src/pixi/TileRenderer.ts`** (YENİ)
- `colored.png` texture'ını yükler
- `getTileTexture(tileId: number): Texture` — tile koordinatından texture döner
- `createGroundLayer(zone: ZoneDef, tileId: number): Container` — bölge için zemin tile sprite'ları

**`src/pixi/TriggerSystem.ts`** (GÜNCELLENİR)
Yeni trigger handler'ları eklenir:

```ts
case 'sahaf_door':
  useWorldStore.getState().setLocation('sahaf'); break

case 'balikci_door':
  useWorldStore.getState().setLocation('balikci'); break

case 'pub_door':
  useWorldStore.getState().setLocation('pub'); break

case 'cicekci_door':
case 'kuyumcu_door':
case 'han_door':
case 'nexus_building':
case 'investor_office':
  console.info('Yakında açılacak...'); break
```

Eski trigger konumları (cafe_door, fair_entrance, akademi_door) yeni pixel koordinatlarına güncellenir. Artık `city.tmx`'ten değil, `mapData.ts` TRIGGERS array'inden okunur.

**`src/pixi/assets/city.tmx`** (SİLİNİR)
mapData.ts ile yerini alır.

### Güncellenen

**`src/store/worldStore.ts`**
```ts
export type LocationId =
  | 'cafe' | 'fair' | 'akademi'
  | 'sahaf' | 'balikci' | 'pub'
  | null
```
(cicekci, kuyumcu, han, nexus, investor: henüz setLocation kullanmıyor — placeholder console.info yeterli)

**`src/components/App.tsx`**
Yeni panel conditional'ları eklenir:
```tsx
{currentLocation === 'sahaf'   && <div className="absolute ..."><SahafPanel /></div>}
{currentLocation === 'balikci' && <div className="absolute ..."><BalikciPanel /></div>}
{currentLocation === 'pub'     && <div className="absolute ..."><PubPanel /></div>}
```

**`src/pixi/Game.ts`**
- TMX yükleme kaldırılır
- `WorldScene` constructor artık `mapData`'dan başlatılır
- Player start: `x = 24 * TILE_SIZE + 16 = 784`, `y = 13 * TILE_SIZE + 16 = 432`

### Yeni Bileşenler

**`src/components/SahafPanel.tsx`**
Placeholder panel. Marcus, Remy, Theo'nun geleceğini sezdiren kısa metin.
```
📚 Sahaf
Eski kitaplar, solmuş mürekkep, deniz kokusu.
Birisi buraya çok uğruyor olmalı.
[Kapat]
```

**`src/components/BalikciPanel.tsx`**
Placeholder panel. Balıkçı iskelesi, denize bakan siluetler.
```
🎣 Balıkçı İskelesi
Sabah sis var. Birinin teknesi henüz gelmedi.
[Kapat]
```

**`src/components/PubPanel.tsx`**
Placeholder panel. Hafif müzik, döküntü bar dekorasyonu hissi.
```
🍺 Sahil Pub'ı
Üç sandalye, iki bira bardağı, boş bir tuval.
Burası dolu olmalı normalde.
[Kapat]
```

---

## Görsel Detaylar

### Sahil Bölgesi
- Su: koyu lacivert (`#050e18`), mavi glow (`#1a4a6c`)
- Kumsal: `#1a2416` tonu, açık kenar tile'ları
- Sahil evi: diğer binalardan biraz büyük, kapı tutamağı detayı (küçük square)
- Balıkçı: iskele hissi için uzun dar building, yanında `1px` çizgi (iskele)

### Köprü
- Dar koridor (col 20–29), her iki yan: su tile'ları
- Giriş/çıkış noktaları: küçük taş kemer detayı (Graphics ile çizilir)

### Neon Şehir
- Her binanın border'ı `0x9b30ff` (mor), lineStyle width: 2
- Nexus binası özel: border `0xcc44ff`, lineStyle width: 3, daha yüksek (col 40–49, row 38–49)
- Yol/sokak zemininde kaldırım tile'ları tileset'ten
- Bina label'ları: küçük `PIXI.Text`, `fontFamily: 'monospace'`, `fontSize: 8`, renk `#cc66ff`

---

## Test Stratejisi

- Oyuncu haritanın tüm bölgelerinde yürüyebilir (sahil, köprü, şehir)
- Köprü geçişi: sol/sağ sular collision — oyuncu geçemez; orta koridor geçilebilir
- Binalara çarpmak engellenir (COLLISION_RECTS)
- Sahaf, balıkçı, pub trigger'ları → panel açılır, ESC ile kapanır
- Kafe, fuar, akademi yeni konumda çalışır (mevcut panel'lar açılır)
- studio_desk yeni konumda çalışır → tycoon modu
- Tüm placeholder trigger'lar console.info verir (nexus, investor, cicekci, kuyumcu, han)
- Player start: sahil evinin önünde (tile 24,13)
- Kamera map sınırlarını aşmaz (50×50 * 32 = 1600px)

## Kapsam Dışı

- NPC sprite'larının harita üzerinde görünmesi
- Sahaf/balıkçı/pub panellerinin gerçek NPC içeriği (Spec B/C1)
- Çiçekçi/kuyumcu/han gerçek panel içeriği (Spec C1)
- Gece/gündüz aydınlatma döngüsü
- Animasyonlu neon levhalar
- Harita geçiş animasyonu
