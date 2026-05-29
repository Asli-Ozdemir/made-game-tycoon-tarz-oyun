# Faz 4B — Ara Sahne (Cutscene) Sistemi: Tasarım Dokümanı

**Tarih:** 2026-05-29  
**Kapsam:** Altyapı + 2 sahne (kovulma + ilk yayın)  
**Sonraki faz:** 4C — Rakip Şirket Arc'ı

---

## Genel Bakış

Oyun içi kritik anlarda gösterilen Stardew Valley tarzı ara sahneler. Pixel art CSS arka plan, karakter avatar'ı, typewriter diyalog efekti ve siyahtan fade geçişten oluşur. Senaryo yazılmadığı için placeholder diyaloglar kullanılır; gerçek içerik sonradan `src/data/cutscenes.ts` dosyasından düzenlenir.

---

## Görsel Tasarım

### Layout

```
┌─────────────────────────────────────────────┐
│  [pixel art CSS sahne arka planı]            │
│                                              │
│   [karakter CSS silüetleri]      [Atla >>]  │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ [avatar] Konuşan İsim                  │ │
│  │          "Diyalog metni typewriter_"   │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
           ↑ tıklama / Space / Enter = ilerle
```

### Diyalog Kutusu
- Ekranın alt kısmına yapışık, tam genişlik
- Sol tarafta konuşan karakterin avatar kutusu (altın çerçeve)
- Avatar içeriği: CSS ile yapılmış pixel silüeti (yuvarlak baş + dikdörtgen gövde)
- Sağ tarafta konuşan adı (bold, kahverengi) ve diyalog metni
- Arka plan: krem (#faf0d8), üst kenarlık: altın (#c8a050)

### Avatar
- 36×36px kutu, kenarlık: 2px solid #c8a050, border-radius: 0 (köşeli, pixel art)
- İçerik: CSS ile yapılmış insan silüeti (baş + gövde), koyu renkli
- `image-rendering: pixelated`

### Arka Plan (Sahneye Özgü Pixel CSS)
- `image-rendering: pixelated` + sert köşeler + hafif grid doku overlay
- Kovulma sahnesi: koyu kırmızı/bordo tonları, ofis prop'ları (pencere, masa)
- İlk yayın sahnesi: koyu mavi/gece tonları, bilgisayar ekranı parıltısı
- Prop'lar (masa, pencere, vb.) tamamen CSS ile — gerçek asset'ler geldiğinde `<img>` ile değiştirilir

### Geçiş Efekti
- Sahne açılışı: siyahtan fade-in (400ms CSS opacity transition)
- Frame değişimi: fade-out (200ms) → frame güncelle → fade-in (200ms)
- Sahne kapanışı: fade-out (400ms) → oyuna dön

### Skip Butonu
- Sağ üstte sabit konumda
- "Atla >>" yazısı, yarı saydam, hover'da opak
- Tıklanınca fade-out → sahne kapanır

---

## Veri Yapısı

### `src/types/cutscene.ts`

```ts
export interface DialogLine {
  speaker: string  // "Patron", "{{playerName}}", "Anlatıcı"
  text:    string  // Diyalog metni; {{playerName}}, {{studioName}} placeholder destekler
}

export interface CutsceneFrame {
  background: 'office' | 'bedroom' | 'studio'
  lines:      DialogLine[]
}

export type CutsceneId = 'kovulma' | 'ilk_yayin'

export interface CutsceneDef {
  id:     CutsceneId
  frames: CutsceneFrame[]
}
```

### `src/data/cutscenes.ts`

Sahne verisinin tutulduğu dosya. Senaryo yazarken burası düzenlenir, kod değiştirilmez.

```ts
export const CUTSCENES: Record<CutsceneId, CutsceneDef> = {
  kovulma: {
    id: 'kovulma',
    frames: [
      {
        background: 'office',
        lines: [
          { speaker: 'Patron',          text: '[PLACEHOLDER] Seni işten çıkarmak zorundayım.' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] Anlamıyorum, neden?' },
          { speaker: 'Patron',          text: '[PLACEHOLDER] Bütçe kısıtlamaları. Üzgünüm.' },
        ],
      },
      {
        background: 'bedroom',
        lines: [
          { speaker: 'Anlatıcı', text: '[PLACEHOLDER] Kutuyu topladın ve kapıdan çıktın.' },
          { speaker: 'Anlatıcı', text: '[PLACEHOLDER] Belki de bu bir başlangıçtı.' },
        ],
      },
    ],
  },
  ilk_yayin: {
    id: 'ilk_yayin',
    frames: [
      {
        background: 'studio',
        lines: [
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] İlk oyunun yayında.' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] Sonunda...' },
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] {{studioName}} adını dünyaya duyuruyorsun.' },
        ],
      },
    ],
  },
}
```

---

## State Yönetimi

### `src/store/cutsceneStore.ts`

```ts
interface CutsceneStore {
  activeCutscene: CutsceneId | null
  frameIndex:     number
  lineIndex:      number
  displayedText:  string   // typewriter'ın şu anki metni
  isTyping:       boolean  // true = hâlâ yazıyor
  seenCutscenes:  Set<CutsceneId>

  startCutscene:   (id: CutsceneId) => void
  advance:         () => void
  tick:            (char: string) => void  // typewriter interval'ı çağırır
  finishTyping:    () => void              // tüm metni anında göster
  nextFrame:       () => void              // bileşen fade-out bittikten sonra çağırır
  skip:            () => void
  reset:           () => void
  isTransitioning: boolean                 // bileşen bu flag'i izler
}
```

#### `startCutscene(id)` davranışı
- `seenCutscenes.has(id)` ise hiçbir şey yapma
- Aksi hâlde: `activeCutscene = id`, `frameIndex = 0`, `lineIndex = 0`, `displayedText = ''`, `isTyping = true`
- `dayTimeStore.setIsPaused(true)` çağrılır

#### `advance()` davranışı (tek tıklamayla her şey)
1. `isTyping === true` → `finishTyping()` (tüm metni göster, yazmayı durdur)
2. `isTyping === false`, sonraki satır var → `lineIndex++`, typewriter başlat
3. Son satır, sonraki frame var → store `isTransitioning = true` set eder; bileşen bunu izler, fade-out (200ms) → `nextFrame()` çağırır (store `frameIndex++`, `lineIndex = 0`, `isTransitioning = false`) → fade-in (200ms) → typewriter başlar
4. Son frame'in son satırı → `activeCutscene = null`, `seenCutscenes.add(id)`, `dayTimeStore.setIsPaused(false)`

> **Not:** Frame geçiş animasyonunun zamanlaması bileşende yönetilir; store sadece `isTransitioning` flag'ini set eder ve `nextFrame()` ile state'i günceller. Store animasyon süresini bilmez.

#### `skip()` davranışı
- `activeCutscene`'yi null'a çeker, `seenCutscenes.add(id)`, `dayTimeStore.setIsPaused(false)`

#### `reset()` davranışı
- Tüm state sıfırlanır, `seenCutscenes` boşaltılır
- `Dashboard.handleNewGame` içinde çağrılır

---

## Bileşen

### `src/components/CutscenePlayer.tsx`

- Tam ekran `fixed inset-0 z-50`
- `cutsceneStore`'dan aktif sahneyi, frame/line index'i, displayedText'i okur
- `characterStore`'dan `name` ve `studioName`'i okur; placeholder'ları değiştirir
- Ekrana tıklama, `Space`, `Enter` → `advance()`
- Skip butonu → `skip()`
- Typewriter: `useEffect` içinde `setInterval(30ms)` → `tick(nextChar)`; `isTyping` false olduğunda veya bileşen unmount olduğunda interval temizlenir
- Fade state: `useState<'in' | 'out'>('in')`, frame değişiminde geçici 'out' yapılır

---

## Entegrasyon Noktaları

### `src/App.tsx`
```tsx
if (!isCreated)     return <CharacterCreationWizard />
if (activeCutscene) return <CutscenePlayer />          // ← eklenen tek satır
```

### `src/components/CharacterCreationWizard.tsx`
```ts
function handleFinalize(name: string, studioName: string) {
  // ... mevcut kod ...
  finalize()
  useCutsceneStore.getState().startCutscene('kovulma')  // ← eklenen
}
```

### `src/components/Dashboard.tsx`
```ts
function handlePublish(projectId: string) {
  // ... mevcut kod ...
  incrementPub()
  if (useGameStore.getState().totalPublished === 1) {
    useCutsceneStore.getState().startCutscene('ilk_yayin')  // ← eklenen
  }
  onPublishResult(projectId)
}

function handleNewGame() {
  // ... mevcut resetler ...
  useCutsceneStore.getState().reset()  // ← eklenen
}
```

### Akış: İlk Yayın Sahnesi
`Yayınla` → `startCutscene('ilk_yayin')` → `onPublishResult(id)` (resultProjectId set edilir)  
→ App render: `activeCutscene` var → CutscenePlayer tam ekran (PublishResult gizlenir)  
→ Sahne biter → App normal render'a döner → `resultProjectId` hâlâ set'li → PublishResult görünür  
**Kullanıcı akışı: Yayınla → Sahne → Sonuçlar**

---

## Test Stratejisi

### `tests/store/cutsceneStore.test.ts`
1. Başlangıç state'i doğru
2. `startCutscene` — aktif sahneyi set eder, index'ler sıfırlanır
3. `startCutscene` — `seenCutscenes`'te varsa hiçbir şey yapmaz
4. `advance` — `isTyping` true'yken `finishTyping` çağırır
5. `advance` — sonraki satıra geçer
6. `advance` — son satırda frame geçişi yapar
7. `advance` — son frame'in son satırında sahneyi kapatır, `seenCutscenes`'e ekler
8. `skip` — sahneyi kapatır, `seenCutscenes`'e ekler
9. `reset` — tüm state temizlenir

### `tests/data/cutscenes.test.ts`
1. Her sahnenin en az bir frame'i var
2. Her frame'in en az bir satırı var
3. Her satırın boş olmayan `speaker` ve `text`'i var

---

## Riskler

| Risk | Çözüm |
|------|-------|
| PixiJS WASD input cutscene sırasında çalışır | `startCutscene` içinde `dayTimeStore.setIsPaused(true)` |
| Yeni oyunda kovulma sahnesi tekrar gösterilmez | `handleNewGame`'de `cutsceneStore.reset()` |
| PublishResult ile çakışma | CutscenePlayer `return` ile tam ekran; resultProjectId React state'te kalır, sahne bitince görünür |

---

## Kapsam Dışı (Faz 4B)

- Gerçek pixel art asset'leri (ilerleyen fazlarda)
- 4C sahneleri (rakip arc)
- Save/load'da `seenCutscenes` persist edilmesi
- Ses efekti / müzik
