# Faz 4A — Karakter Yaratma Design Spec
**Tarih:** 2026-05-29  
**Durum:** Onaylandı

---

## Vizyon

Oyun başlamadan önce oynanan 3 adımlı bir wizard. Oyuncu arkaplanını seçer (meslek stat'ları + ev değeri + sosyal statü), kişilik stat'larını dağıtır, isim ve stüdyo adını girer. Seçimler hem narratif anlam taşır hem oyun sistemlerini doğrudan etkiler. Zorluk seçimi klasik "Easy/Hard" menüsü yerine arkaplan seçimine gömülüdür.

**Kapsam:** Faz 4'ün ilk alt sistemi. Ara sahneler ve rakip şirket arc'ı ayrı spec'lerde ele alınır.

---

## Mimari

### Yeni Dosyalar

```
src/
├── store/
│   └── characterStore.ts
├── components/
│   ├── CharacterCreationWizard.tsx
│   └── character/
│       ├── BackgroundStep.tsx
│       ├── PersonalityStep.tsx
│       └── IdentityStep.tsx
└── data/
    └── backgrounds.ts
```

### App.tsx Değişimi

```tsx
const isCreated = useCharacterStore((s) => s.isCreated)
if (!isCreated) return <CharacterCreationWizard />
// mevcut oyun arayüzü
```

Wizard, PixiJS + React katman sisteminin üzerinde tam ekran overlay olarak çalışır. `isCreated = false` iken GameCanvas render edilmez.

---

## Veri Modeli

### characterStore.ts

```ts
type BackgroundId =
  | 'kk_uzmani'
  | 'yaratici_direktor'
  | 'bas_muhendis'
  | 'yapimci'
  | 'eski_ceo'

interface ProfessionStats {
  programlama:    number  // 1–10
  tasarim:        number
  ses:            number
  projeyonetimi:  number
}

interface PersonalityStats {
  karisma:        number  // 0–5, toplam 5 puan
  odak:           number
  rekabetcilik:   number
  yaraticilik:    number
  isZekasi:       number
}

interface CharacterStore {
  isCreated:    boolean
  name:         string
  studioName:   string
  background:   BackgroundId | null
  profession:   ProfessionStats
  personality:  PersonalityStats
  setBackground:  (bg: BackgroundId) => void
  setPersonality: (stats: PersonalityStats) => void
  setIdentity:    (name: string, studioName: string) => void
  finalize:       () => void   // isCreated = true, oyun sistemlerini başlat
  reset:          () => void   // yeni oyun için tüm state temizle
}
```

---

## 5 Arkaplan

### backgrounds.ts

```ts
export interface BackgroundDef {
  id:            BackgroundId
  emoji:         string
  title:         string
  story:         string          // kovulma hikayesi, 1-2 cümle
  houseStory:    string          // ev satış flavour text
  houseSale:     number          // başlangıç parası ($)
  startRep:      number          // başlangıç itibarı (0–100)
  profession:    ProfessionStats
  advantage:     string          // özel avantaj açıklaması
  special?:      BackgroundSpecial
}

type BackgroundSpecial =
  | { type: 'rival_early' }                              // rakip Hafta 1'de fark eder
  | { type: 'rep_loss_multiplier'; multiplier: 2 }       // başarısız projede itibar ×2 (CEO)
  | { type: 'no_bugs' }                                  // yayınlanan oyunlarda bug olmaz (KK)
```

| ID | Emoji | Başlık | Ev Satışı | Başlangıç İtibar | Özel |
|----|-------|--------|-----------|-----------------|------|
| `kk_uzmani` | 🔍 | KK Uzmanı | $30,000 | 0 | `no_bugs` — yayınlanan oyunlarda bug olmaz |
| `yaratici_direktor` | 🎨 | Yaratıcı Direktör | $40,000 | 0 | Görsel kalite yüksek (Faz 5) |
| `bas_muhendis` | 💻 | Baş Mühendis | $50,000 | 0 | Solo oyun yapabilir (Faz 5) |
| `yapimci` | 📋 | Yapımcı | $75,000 | 0 | En yüksek ekip verimliliği (Faz 5) |
| `eski_ceo` | 👔 | Eski CEO | $120,000 | 20 | `rival_early` + `rep_loss_multiplier: 2` |

### Meslek Stat'ları

| Arkaplan | Programlama | Tasarım | Ses | Proje Yönetimi |
|----------|------------|---------|-----|---------------|
| KK Uzmanı | 4 | 4 | 5 | 5 |
| Yaratıcı Direktör | 2 | 9 | 4 | 3 |
| Baş Mühendis | 8 | 3 | 2 | 4 |
| Yapımcı | 1 | 4 | 3 | 9 |
| Eski CEO | 3 | 3 | 2 | 7 |

### Kovulma Hikayeleri

| Arkaplan | Hikaye |
|----------|--------|
| KK Uzmanı | Otomasyon bahanesiyle çıkarıldın. On yıllık emeğin bir e-postayla bitti. |
| Yaratıcı Direktör | En iyi fikrin çalındı, sen çıkarıldın. İmzasız kalan bir oyun senin eserindi. |
| Baş Mühendis | Başarısız projenin faturası sana kesildi. Takım başarısızken sen günah keçisi oldun. |
| Yapımcı | Yeni CEO "kültürel uyum yok" dedi. Aslında çok şey biliyordun. |
| Eski CEO | Yönetim kurulu seni devirdi. Hisseler düşünce ilk feda edilensin. |

### Ev Satış Metinleri

| Arkaplan | Flavour Text |
|----------|-------------|
| KK Uzmanı | Küçük daireni $30,000'a sattın. Az, ama başlangıç için yeterli. |
| Yaratıcı Direktör | Sanat atölyeni $40,000'a kaptırdın. Resimler gitti, hayaller kaldı. |
| Baş Mühendis | Eve dönüp çantanı topladın. $50,000'lık bir başlangıç, başka bir şansın yok. |
| Yapımcı | Geniş apartman dairesini $75,000'a sattın. Aileni ikna etmek daha zordu. |
| Eski CEO | Villanı $120,000'a sattın. Basın bunu da haber yaptı. |

---

## Wizard Akışı

### Adım 1 — Arkaplan Seçimi

5 kart, 2+3 veya 1×5 grid düzeni. Her kart:
- Emoji + başlık
- Kovulma hikayesi (italic, gri)
- 4 meslek stat çubuğu (1–10 görsel)
- Ev satışı miktarı
- Özel avantaj (bir satır)

Kart seçilince highlight. "İleri" butonu aktif olur.

### Adım 2 — Kişilik Dağılımı

Başlık: "Sen kimsin?"  
5 puan, 5 stat arasında dağıt.

| Stat | Açıklama |
|------|---------|
| Karisma | İlişki kurma, ikna, NPC bonusu |
| Odak | Solo verimlilik, crunch dayanıklılığı |
| Rekabetçilik | Rakip diyalogları, gerilim artışı |
| Yaratıcılık | Oyun konsept özgünlüğü, eleştirmen bonusu |
| İş Zekası | Para yönetimi, yatırımcı ikna |

Her stat: `−` `[sayı]` `+` butonu (min 0, max 5).  
Üstte: "X puan kaldı" sayacı.  
"İleri" sadece 0 puan kaldığında aktif.

### Adım 3 — Kimlik

- "Adın:" text input (max 30 karakter)
- "Stüdyo adın:" text input (max 40 karakter)
- Ev satış flavour text (arkaplan seçimine göre)
- "Oyuna Başla" butonu → `finalize()` çağrılır

---

## Oyun Sistemlerine Entegrasyon

### finalize() içinde gerçekleşenler

```ts
finalize: () => {
  const { background, profession } = get()
  const bg = BACKGROUNDS.find(b => b.id === background)!

  // 1. Para ayarla (başlangıç default'unu houseSale ile ezer)
  // gameStore'a setMoney(amount) metodu eklenir (mevcut addMoney farklı semantik)
  useGameStore.getState().setMoney(bg.houseSale)

  // 2. Başlangıç itibarı
  // gameStore'a setReputation(amount) metodu eklenir
  if (bg.startRep > 0) {
    useGameStore.getState().setReputation(bg.startRep)
  }

  // 3. CEO özel: rakip bilinirliği
  if (bg.special?.type === 'rival_early') {
    useRivalStore.getState().setAwarenessWeek(1)
  }

  set({ isCreated: true })
}
```

### scoreEngine.ts Güncelleme

`computeScore` fonksiyonuna `playerSkillBonus` parametresi eklenir:

```ts
export function computeScore(
  project: GameProject,
  employeeBonus: number,
  playerSkillBonus: number
): number {
  const base = BASE_SCORES[project.scope]
  return Math.min(100, Math.round(base + employeeBonus + playerSkillBonus))
}
```

`playerSkillBonus` hesabı `projectEngine.ts`'de:

```ts
const { profession } = useCharacterStore.getState()
const avgSkill = (
  profession.programlama +
  profession.tasarim +
  profession.ses +
  profession.projeyonetimi
) / 4
const playerSkillBonus = avgSkill * 0.3  // max ~3 puan
```

### Başarısız Proje İtibar Kaybı (CEO Özel)

`scoreEngine.ts`'de veya proje yayınlama akışında:

```ts
const bg = BACKGROUNDS.find(b => b.id === characterStore.background)
const repLossMultiplier = bg?.special?.type === 'rep_loss_multiplier'
  ? bg.special.multiplier
  : 1
// score < 50 → başarısız proje
if (score < 50) gainReputation(-10 * repLossMultiplier)
```

### KK Uzmanı Özel: Bug Yok

Proje yayınlandığında bug cezası (eğer ilerleyen fazlarda eklenmişse) atlanır:

```ts
const hasBugImmunity = bg?.special?.type === 'no_bugs'
```

### SQLite Kayıt

`characterStore` state'i mevcut save yapısına eklenir:

```ts
window.electronAPI?.saveGame({
  game:      useGameStore.getState(),
  time:      useTimeStore.getState(),
  projects:  useProjectStore.getState().projects,
  employees: useEmployeeStore.getState().employees,
  character: useCharacterStore.getState(),   // YENİ
})
```

### Yeni Oyun Akışı

Dashboard'da "Yeni Oyun" butonu tüm store'ları sıfırlar:

```ts
function handleNewGame() {
  useCharacterStore.getState().reset()
  useGameStore.getState().reset()
  useProjectStore.getState().reset()
  useEmployeeStore.getState().reset()
  useTimeStore.getState().reset()
  useDayTimeStore.getState().reset()
  // isCreated = false → wizard otomatik açılır
}
```

---

## Zorluk Spektrumu

| Arkaplan | Başlangıç Parası | Baskı |
|----------|-----------------|-------|
| 🔍 KK Uzmanı | $30,000 | Yok |
| 🎨 Yaratıcı Direktör | $40,000 | Yok |
| 💻 Baş Mühendis | $50,000 | Yok |
| 📋 Yapımcı | $75,000 | Yok |
| 👔 Eski CEO | $120,000 | Rakip erken fark eder + 2× itibar kaybı |

---

## Test Yaklaşımı

| Alan | Yöntem |
|------|--------|
| `characterStore` | Unit test — setBackground, setPersonality, finalize state akışı |
| `backgrounds.ts` | Unit test — toplam meslek stat'ları mantıklı aralıkta |
| `scoreEngine` playerSkillBonus | Unit test — bonus hesabı |
| Wizard adım geçişleri | React Testing Library — "İleri" butonu koşulları |
| finalize() entegrasyonu | Unit test — para ve itibar doğru set ediliyor |

---

## Kapsam Dışı (Bu Spec İçin)

- Görünüm editörü (pixel art sprite, ten rengi, saç stili) — Faz 5
- Stat geliştirme mekanikleri (Skyrim tarzı artış) — Faz 5
- Ara sahneler / diyalog sistemi — Faz 4B
- Rakip şirket arc'ı — Faz 4C
- `rivalStore` tam implementasyonu — Faz 4C (bu fazda sadece `awarenessWeek` eklenir)
