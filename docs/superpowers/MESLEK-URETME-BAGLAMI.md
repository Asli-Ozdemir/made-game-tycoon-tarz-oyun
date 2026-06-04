# Meslek Üretme Bağlamı — Side Job Creation Reference

Bu doküman yeni bir yan iş (side job) üretmek için gereken mimari kararları, dosya yapısını ve teknik kalıpları açıklar. Mevcut 5 iş bu kurala göre yazılmıştır.

---

## Genel Mimari

Her yan iş **4 katmandan** oluşur:

```
src/data/<jobName>Shifts.ts     ← Statik içerik (session/case/shift verileri)
src/store/<jobName>Store.ts     ← Zustand state machine
src/pixi/<SceneName>Scene.ts    ← PixiJS mini-scene (gerçek zamanlı görsel + input)
src/components/<JobName>Panel.tsx ← React orchestrator (phase yönetimi)
```

---

## 1. Data Dosyası

**Ne içerir:** Interface tanımları + sabit session/case/shift dizisi. Hiç logic yok.

**Kural:** Session sayısı en az 10 olmalı. Zorluk kademeli artar (easy → normal → hard). İlk 3 session yeni oyuncuyu mekanikleri öğretir.

**Örüntü:**
```typescript
export interface MyShift {
  id:         string          // 'job_shift_01' … 'job_shift_10'
  briefingNotes: string[]     // Açılış metni (NPC sesi)
  // ... mekanik-özel alanlar
  difficulty: 'easy' | 'normal' | 'hard'
}

export const MY_SHIFTS: MyShift[] = [shift01, shift02, /* ... */ shift10]
```

**Mevcut örnekler ve seed çıktıları:**

| İş | Data Dosyası | Seed(ler) | Hayat Yolu |
|---|---|---|---|
| Pub garsonluk | `pubShifts.ts` | kaos, zaman_yonetimi | emek |
| Sahaf arşiv | `antiquarianShifts.ts` | nostalji | huzur |
| Bar bodyguard | `barShifts.ts` | kaos | emek |
| Dedektif asistanı | `detectiveCases.ts` | analiz | emek |
| Balıkçı | `fishingSessions.ts` | nostalji, hikaye | huzur |

---

## 2. Zustand Store

**Ne içerir:** Phase state machine + iş mantığı. React ve PixiJS'den bağımsız.

**Kural:** Store, `useXxxStore.getState()` ile PixiJS callbackleri içinden çağrılabilir olmak zorunda (reactive hook değil).

**Standart state şablonu:**
```typescript
interface MyStore {
  completedShifts: string[]
  activeShift:     MyShift | null
  phase:           MyPhase         // union type
  // ... mekanik-özel alanlar

  startShift(id: string): void
  // ... phase transition actions
  endShift(): ShiftResult | null   // seed + progress hesaplar, store'u sıfırlar
  reset(): void
}
```

**endShift içinde ödül dağıtımı:**
```typescript
endShift() {
  // ...
  useIdeaSeedStore.getState().addSeed('nostalji', seeds)
  useLifePathStore.getState().addProgress('huzur', progress)
  // store'u sıfırla
  set({ activeShift: null, phase: 'briefing', completedShifts: [...] })
  return { seeds, progress }
}
```

**Ödül skalası (iş başına):**
- Kötü performans: 1 seed, +1 progress
- Orta: 2 seed, +3 progress
- İyi: 3 seed, +5 progress

---

## 3. PixiJS Scene

**Ne içerir:** Görsel çizim + gerçek zamanlı input. Store'a dokunmaz — sadece callback'leri çağırır.

**Kural:** `static async create(opts)` factory pattern zorunlu. Sync constructor yasak (PixiJS `app.init()` async).

**Standart şablon:**
```typescript
export class MyScene {
  private app: Application
  private destroyed = false

  private constructor(app: Application, private opts: MySceneOptions) {}

  static async create(opts: MySceneOptions): Promise<MyScene> {
    const app = new Application()
    await app.init({ canvas: opts.canvas, width: opts.width, height: opts.height, ... })
    const scene = new MyScene(app, opts)
    scene._init()
    return scene
  }

  private _init() {
    // Input event listener'lar + ticker
    this.opts.canvas.addEventListener('pointerdown', this._onInput)
    this.app.ticker.add(this._tick)
    this._render()
  }

  // Arrow function = this binding korunur
  private _onInput = (e: PointerEvent) => { ... }
  private _tick = () => { if (this.destroyed) return; /* ... */; this._render() }

  private _render() {
    if (this.destroyed) return
    this.app.stage.removeChildren()
    // Her frame tam yeniden çizim (basit, güvenilir)
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.opts.canvas.removeEventListener('pointerdown', this._onInput)
    this.app.ticker.remove(this._tick)
    this.app.destroy()
  }
}
```

**Callbacks:** Scene, işin bittiğini panel'e bildirir:
```typescript
export interface MySceneOptions {
  canvas:    HTMLCanvasElement
  width:     number
  height:    number
  // ...mekanik parametreler
  onResult: (outcome: MyOutcome) => void  // panel'e bildir
}
```

**Grafik dili:** Sadece `Graphics` + `Text` (pixi.js), sprite asset yok. `TextStyle` sabit olarak dosya başında tanımlanır.

---

## 4. React Panel

**Ne içerir:** Phase yönetimi (React local state) + PixiJS scene lifecycle + ödül gösterimi.

**Kural:** Phase state `useState` ile panelde tutulur. Store'dan yalnızca persistence data okunur (`activeShift`, `catchLog` vb.).

**Standart yapı:**
```typescript
type PanelPhase = 'briefing' | /* ...job-specific phases */ | 'result'

export default function MyPanel() {
  const [phase, setPhase] = useState<PanelPhase>('briefing')
  const [shiftResult, setShiftResult] = useState<ShiftResult | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef  = useRef<{ destroy(): void } | null>(null)

  const close = useCallback(() => {
    sceneRef.current?.destroy()
    sceneRef.current = null
    setLocation(null)
    setIsPaused(false)
  }, [...])

  // PixiJS scene mount/unmount
  useEffect(() => {
    if (phase !== 'active_phase') return
    const canvas = canvasRef.current
    if (!canvas) return
    let scene: MyScene | null = null
    let cancelled = false

    MyScene.create({
      canvas, width: W, height: H,
      onResult: (outcome) => {
        useMyStore.getState().recordResult(outcome)   // stale closure yok: getState() kullan
        scene?.destroy()
        sceneRef.current = null
        setPhase('next_phase')
      },
    }).then(s => {
      if (cancelled) { s.destroy(); return }
      scene = s
      sceneRef.current = s
    })

    return () => { cancelled = true; scene?.destroy(); sceneRef.current = null }
  }, [phase, /* bağımlılıklar */])
```

**Stale closure kuralı:** PixiJS callback'leri içinde `useMyStore((s) => s.value)` kullanma. Bunun yerine `useMyStore.getState().value` çağır — bu her zaman güncel değeri verir.

**`cancelled` flag:** `useEffect` cleanup'ında async `create()` tamamlanmadan component unmount olursa scene hemen destroy edilir. Olmadan memory leak ve "update after unmount" hataları oluşur.

---

## 5. worldStore Entegrasyonu

Yeni iş için `worldStore.ts`'de `LocationId` union'ına id eklenir:

```typescript
// src/store/worldStore.ts
type LocationId = 'pub' | 'sahaf' | 'bar' | 'detective' | 'balikci' | 'yeni_is'
```

`App.tsx`'e yeni `currentLocation === 'yeni_is'` bloğu eklenir:
```tsx
{currentLocation === 'yeni_is' && <YeniIsPanel />}
```

---

## 6. Hayat Yolu — Seed Bağlantısı

| Hayat Yolu | NPC'ler | Uygun seed türleri |
|---|---|---|
| huzur | marcus, remy, rex | nostalji, hikaye |
| emek | theo, soren | kaos, analiz, zaman_yonetimi |
| hirs | vivian | (nadir/kirli seed'ler) |

Hangi job hangi path'a ait olduğu `PATH_NPC_MAP` (`lifePathData.ts`) ile belirlenir. Yeni iş bu map'te var olan bir NPC'ye bağlıysa otomatik o yola dahil olur.

---

## 7. Test Kalıbı

Her store için `src/store/__tests__/<jobName>Store.test.ts` oluşturulur. Örüntü:

```typescript
beforeEach(() => {
  useMyStore.setState({ /* initial state */ })
  useIdeaSeedStore.setState(s => ({ seeds: { ...s.seeds, nostalji: 0 } }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
})

// Test her action için: başarılı yol + guard (invalid input) + cross-store etkileri
```

PixiJS scene'leri test edilmez (DOM gerektiriyor). Panel'lar test edilmez (E2E scope).

---

## 8. Checklist — Yeni Meslek Üretirken

- [ ] Data: Interface + en az 10 session, zorluk kademeli artar
- [ ] Data: `briefingNotes` / `briefingText` NPC sesiyle yazılmış
- [ ] Store: `startShift`, `endShift`, `reset` zorunlu
- [ ] Store: `endShift` → `addSeed` + `addProgress` çağırıyor
- [ ] Store: Phase transitions guard'lı (yanlış phase'de action = no-op)
- [ ] Scene: `static async create()` factory + `destroy()` zorunlu
- [ ] Scene: Arrow function event handlers (`_onInput = (e) => { ... }`)
- [ ] Scene: `cancelled` flag useEffect cleanup'ında
- [ ] Panel: Store callback'lerinde `getState()` kullanılıyor (hook değil)
- [ ] Panel: `briefing` phase → `result` phase tam kapalı döngü
- [ ] worldStore: `LocationId`'ye eklendi
- [ ] App.tsx: render bloğu eklendi
- [ ] Tests: store unit testleri yazıldı
