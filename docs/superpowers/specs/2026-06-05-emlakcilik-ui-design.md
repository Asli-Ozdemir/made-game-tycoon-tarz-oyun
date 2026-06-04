# Emlakçılık UI — Aseprite Background Design

> Header banner arka planları için Aseprite pixel art tasarım dokümanı. Store/data katmanı (`emlakcilikStore`, `propertyDeals.ts`) zaten uygulanmış; bu spec yalnızca görsel/UI katmanını kapsar.

---

## Tek Cümle

Emlakçılık panelinin üstüne sabit yükseklikte bir header banner yerleştirilir; brief/idle fazında Vivian'ın sıcak amber ofisini, negotiation/result fazında soğuk mavi müzakere odasını gösteren iki pixel art sahne arasında geçiş yapılır.

---

## Dosya Yapısı

| Dosya | Açıklama |
|-------|----------|
| `src/assets/emlak_bg.aseprite` | Kaynak dosya — 2 frame, animasyon tag'leri |
| `src/assets/emlak_office_bg.png` | Frame 1 export — brief/idle fazı |
| `src/assets/emlak_negotiation_bg.png` | Frame 2 export — negotiation/result fazı |
| `src/components/EmlakcilikPanel.tsx` | Yeni React bileşeni |

---

## Canvas

- **Boyut:** 440×80 px
- **Mod:** RGB, 8-bit indeksli palette
- **Ölçek:** 1:1 (ölçekleme yok — display 440px genişliğe tam oturur)
- **imageRendering:** `pixelated`

---

## Aseprite Frame Yapısı

Tek `.aseprite` dosyası, 2 frame, animasyon tag'leriyle ayrılmış.

| Frame | Tag | Sahne |
|-------|-----|-------|
| 1 | `office` | Vivian'ın ofisi — brief/idle fazları |
| 2 | `negotiation` | Müzakere odası — negotiation/result fazları |

### Layer Stack (her iki frame paylaşır)

| # | Layer | Açıklama |
|---|-------|----------|
| 1 | `bg` | Solid fill — frame 1: `#1a0800`, frame 2: `#070c14` |
| 2 | `arch` | Mimari — frame 1: ahşap raf/duvar silueti, frame 2: cam bölme silueti |
| 3 | `light` | Işık kaynağı — frame 1: masa lambası halesi, frame 2: floresan şerit |
| 4 | `furniture` | Mobilya silueti — frame 1: masa kenarı, frame 2: uzun masa + sandalye tepeleri |
| 5 | `detail` | Küçük objeler — frame 1: kitap sırtları + kağıt yığını, frame 2: su bardağı + belge klasörü |
| 6 | `atmosphere` | Doku — frame 1: sağ köşede mor neon pencere, frame 2: sol kenar soğuk dış ışık sızması |

---

## Renk Paleti

### Frame 1 — Vivian'ın Ofisi (amber/sıcak)

| Öğe | Hex |
|-----|-----|
| Arka plan | `#1a0800` |
| Duvar/ahşap doku | `#2a1200` |
| Masa lambası halesi (sıcak) | `#f59e0b` |
| Masa lambası halesi (koyu) | `#78350f` |
| Mobilya silueti | `#3d1a00` |
| Masa yüzeyi kenar | `#5a2e00` |
| Kitap sırtı A | `#7c2d12` |
| Kitap sırtı B | `#92400e` |
| Kitap sırtı C | `#451a03` |
| Uzak neon pencere | `#4c1d95` (düşük opasite) |
| Kağıt yığını | `#e7d5b8` |

**Kompozisyon:** Sol ⅓ karanlık → orta masa lambası parlak nokta → sağda uzak şehir penceresi (mor sızdırma).

### Frame 2 — Müzakere Odası (soğuk mavi)

| Öğe | Hex |
|-----|-----|
| Arka plan | `#070c14` |
| Cam bölme silueti | `#0f1a2a` |
| Floresan şerit (parlak) | `#bfdbfe` |
| Floresan şerit (koyu) | `#1e3a5f` |
| Uzun masa silueti | `#1e293b` |
| Sandalye tepeleri | `#0f172a` |
| Su bardağı yansıması | `#93c5fd` (1-2 px) |
| Belge klasörü | `#374151` |
| Dış ışık sızması (sol kenar) | `#dbeafe` (düşük opasite) |

**Kompozisyon:** Üst ⅓'te yatay floresan bant → orta simetrik masa silueti → sağ alt cam bölme.

---

## Lua Script Planı

Her layer için ayrı Lua script, Aseprite MCP `aseprite_run_lua_script` ile çalıştırılır. Sıra:

1. `emlak_bg_01_create.lua` — dosya oluştur (440×80, 2 frame, 6 layer, tag'ler)
2. `emlak_bg_02_office_bg.lua` — frame 1 `bg` layer
3. `emlak_bg_03_office_arch.lua` — frame 1 `arch` layer
4. `emlak_bg_04_office_light.lua` — frame 1 `light` layer
5. `emlak_bg_05_office_furniture.lua` — frame 1 `furniture` layer
6. `emlak_bg_06_office_detail.lua` — frame 1 `detail` layer
7. `emlak_bg_07_office_atmosphere.lua` — frame 1 `atmosphere` layer
8. `emlak_bg_08_negotiation_bg.lua` — frame 2 `bg` layer
9. `emlak_bg_09_negotiation_arch.lua` — frame 2 `arch` layer
10. `emlak_bg_10_negotiation_light.lua` — frame 2 `light` layer
11. `emlak_bg_11_negotiation_furniture.lua` — frame 2 `furniture` layer
12. `emlak_bg_12_negotiation_detail.lua` — frame 2 `detail` layer
13. `emlak_bg_13_negotiation_atmosphere.lua` — frame 2 `atmosphere` layer
14. `emlak_bg_14_export.lua` — her tag'i ayrı PNG olarak export et

---

## React Bileşeni — EmlakcilikPanel.tsx

### Panel Layout

```
┌─────────────────────────────────────────────┐
│  EMLAKÇILIK                              [✕] │  header bar (Tailwind)
├─────────────────────────────────────────────┤
│                                             │
│   [Aseprite PNG — 440×80, pixelated]        │  <img>, phase'e göre src
│                                             │
├─────────────────────────────────────────────┤
│  brief    → mülk listesi                    │
│  negotiation → teklif UI                    │  faz içeriği (Tailwind)
│  result   → sonuç ekranı                    │
└─────────────────────────────────────────────┘
```

### Banner Geçiş Kuralı

```ts
const bannerSrc =
  phase === 'brief' || phase === 'idle'
    ? emlakOfficeBg
    : emlakNegotiationBg
```

Geçişte: `transition: opacity 300ms ease`.

### Boyut

- Genişlik: `440px` (sabit)
- Yükseklik: `auto` (içeriğe göre)

### App.tsx Kaydı

`location === 'emlakcilik'` koşulunda `<EmlakcilikPanel />` render edilir — diğer panel kayıtlarıyla aynı pattern.

---

## Test

- Her iki PNG export edildiğinde 440×80 px olduğu doğrulanır
- `phase: 'brief'` → office banner görünür
- `phase: 'negotiation'` → negotiation banner görünür
- `phase: 'idle'` → office banner görünür
- `phase: 'result'` → negotiation banner görünür
- `imageRendering: pixelated` uygulandığı kontrol edilir
