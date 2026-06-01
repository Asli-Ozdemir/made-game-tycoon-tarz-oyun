# Zihin Geliştirme Ağacı — Tasarım Dokümanı
_2026-06-01_

## Özet

Oyuncunun NPC diyalogları ve yan işlerden topladığı Fikir Tohumlarını harcayarak becerilerini geliştirdiği sistem. Her yetenek bir nöron olarak görselleştirilir. Ağaca erişim: oyuncu sahil evindeki yatağa yaklaşıp uyuduğunda açılır.

---

## 1. Veri Modeli

### `src/data/skillTree.ts`

```ts
interface SkillNode {
  id: string
  tier: 1 | 2 | 3 | 4 | 5
  name: string
  description: string
  cost: { type: IdeaSeedType; amount: number }[]
  effect: SkillEffect
  dependsOn: string[]
  lifePathLock?: 'hirs' | 'huzur' | 'emek'   // sadece T5
}

type SkillEffect =
  | { type: 'tycoon_bonus';   stat: string; value: number }
  | { type: 'social_unlock';  target: string }           // NPC diyalog / yeni alan
  | { type: 'project_bonus';  genre: string; value: number }
  | { type: 'crisis_reduce';  value: number }
```

**Node dağılımı (30 node):**
| Tier | Node sayısı | Tohum maliyeti | Hayat Yolu kilidi |
|------|-------------|----------------|-------------------|
| T1   | 6           | 1× tek tip     | —                 |
| T2   | 7           | 2× tek / karışık | —               |
| T3   | 7           | 2-3× karışık   | —                 |
| T4   | 6           | 3-4× karışık   | —                 |
| T5   | 4           | 4-5× karışık   | Hırs/Huzur/Emek + 1 nötr |

**Örnek node'lar:**
- `nos_t1` — "İlk Kıvılcım" · 1× Nostalji · Hikaye türü +5% kalite
- `nos_t2` — "Geçmişin Sesi" · 2× Nostalji + 1× Hikaye · Marcus T3 diyalog açılır
- `kaos_t1` — "Düzensiz Deha" · 1× Kaos · Proje kriz olasılığı −10%
- `zmn_t2` — "Akış Hali" · 2× Zaman · Proje teslim süresi −1 sezon
- `nos_t5_huzur` — "Huzurun Kökü" · 3× Nostalji + 2× Hikaye · Huzur Yolu'na özel efsanevi bonus

### `src/store/skillTreeStore.ts`

```ts
interface SkillTreeStore {
  unlockedNodeIds: string[]
  unlockNode(id: string): void       // seed harca, node aç
  canUnlock(id: string): boolean     // bağımlılık + seed + lifePathLock kontrolü
  getNodeState(id): 'locked' | 'unlockable' | 'active'
}
```

Aktif bonuslar `skillTreeStore.unlockedNodeIds` üzerinden hesaplanır — tycoon sistemi her publish'de bu listeyi okur.

---

## 2. Görsel Tasarım

### Nöron Estetiği
Referans: pixel art biyolojik nöron görseli. Her node:
- **Soma**: 5 loblu küme yapısı (merkez + 5 yuvarlak lob), turuncu sınır, mavi dolgu, sarı çekirdek
- **Dendritler**: soma'dan her yöne organik dallanma, uçlarda turuncu bulb'lar
- **Akson**: bir sonraki bağlı node'a uzanan turuncu/mavi segmentli çizgi
- **Renk durumları**:
  - `active` → mavi/cyan dendritler, sarı çekirdek, turuncu akson
  - `unlockable` → soluk mavi, titreyen sınır
  - `locked` → gri/koyu, dendritler çok soluk

### Node Yerleşimi (Radyal)
```
Merkez boşluk → T1 (r≈120) → T2 (r≈220) → T3 (r≈330) → T4 (r≈430) → T5 (r≈520)
```
- Nostalji/Hikaye node'ları üst yarıda kümelenir
- Kaos/Zaman node'ları alt yarıda kümelenir
- T5 Hayat Yolu node'ları: Hırs (sol), Huzur (üst), Emek (sağ), nötr (alt)
- Arkaplan: radyal gradient siyah → koyu mor, nokta dokusu, mini yıldızlar

---

## 3. Mimari

### Bileşenler
```
App.tsx
  └─ SleepOverlay.tsx          ← uyku fade + geçiş
       └─ SkillTreePanel.tsx   ← React wrapper (ESC, tohum sayaçları, tooltip)
            └─ SkillTreeCanvas.tsx  ← useRef canvas, mini PixiJS app
```

### `SkillTreeCanvas.tsx`
- `useEffect` ile PixiJS `Application` başlatır (canvas ref üzerinde)
- `drawNeuron(cx, cy, node, state)` → PixiJS `Graphics` ile soma + dendrit + akson
- `eventMode='static'` ile hover/click
- Hover → React state'e `hoveredNode` set eder → `SkillTreePanel` tooltip gösterir
- Click → `skillTreeStore.canUnlock(id)` → true ise `unlockNode()` + flash animasyonu

### `SkillTreePanel.tsx`
- Üst bar: `🌙 {nostalji}  📖 {hikaye}  🌪️ {kaos}  ⏳ {zaman_yonetimi}`
- Alt bar (hover'da): node adı + maliyet + effect açıklaması
- ESC ile kapatır, `dayTimeStore.advanceRealSeconds(28800)` (8 saat = 1 oyun günü)

---

## 4. Uyku Tetikleyicisi

### Yatak Trigger'ı
`coastRoom.ts`'e yeni trigger eklenir:
```ts
{ name: 'yatak', x: ..., y: ..., w: 32, h: 32 }
```
`TriggerSystem.ts`'de `LOCATION_MAP`'e `yatak: 'sleep'` eklenir.

`worldStore`'a `currentLocation: LocationId` tipine `'sleep'` eklenir.

`App.tsx`'de `currentLocation === 'sleep'` iken `SleepOverlay` render edilir.

### Akış
```
Oyuncu yatağa yaklaşır
  → "Uyu [E]" prompt (HUD'da küçük metin)
  → E tuşuna basınca: SleepOverlay açılır (siyah fade 600ms)
  → SkillTreePanel görünür (rüya estetiği)
  → Oyuncu node açar / kapatır
  → ESC → fade out → dayTime +8 saat → oyun devam eder
```

---

## 5. Kapsam Dışı

Bu tasarımda **yer almayan** şeyler:
- Hayat Yolu seçim mekanizması (ayrı sistem — T5 node'ları kilitli görünür, ileride açılır)
- Fikir Tohumlarını kazanma yolları dışındaki yeni sistemler (mevcut NPC sistemi yeterli)
- Beceri ağacı animasyonları (unlock flash dışında — sonraya bırakılır)
- Tohum tipi başına 4'ten fazla node türü (ileride genişletilebilir)
