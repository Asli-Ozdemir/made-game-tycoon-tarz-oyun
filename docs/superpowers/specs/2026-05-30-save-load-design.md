# Save/Load Sistemi — Tasarım Dokümanı

**Tarih:** 2026-05-30
**Kapsam:** 3 save slot, otomatik kayıt (sezon + uyku), localStorage + Electron userData çift depolama, açılış ve oyun içi UI

---

## Genel Bakış

Tüm store snapshot'larını JSON olarak seri hale getiren merkezi bir `savegameEngine`; 3 slot metadata'sını yöneten `saveStore`; Electron IPC köprüsüyle disk kalıcılığı; localStorage mirror; sezon geçişi ve uyku tetikleyicileriyle otomatik kayıt.

---

## Mimari

```
savegameEngine.ts
  serialize()   → tüm store'lardan getState() → JSON
  deserialize() → JSON → her store setState()

saveStore.ts
  slots: SaveSlot[3]     // metadata + snapshot
  activeSlotId: 1|2|3
  save(slotId)           // serialize → localStorage + IPC
  load(slotId)           // localStorage veya IPC → deserialize
  reset()

electron/main.ts
  'save-game' handler    // JSON → userData/saves/slot-N.json
  'load-game' handler    // slot-N.json → JSON string

preload.ts
  window.electronAPI.saveGame(slotId, json)
  window.electronAPI.loadGame(slotId)
```

Store'lara dokunulmaz — `savegameEngine` dışarıdan `getState()` / `setState()` kullanır.

---

## Veri Modeli

```typescript
interface SaveSlot {
  slotId:  1 | 2 | 3
  label:   string        // "Slot 1 — 2003 Yaz" — otomatik üretilir
  savedAt: number        // Date.now()
  isEmpty: boolean
}

interface SaveSnapshot {
  version:   number      // şimdilik 1; ileride format değişirse migration kolaylığı
  savedAt:   number
  game:      ReturnType<typeof useGameStore.getState>
  projects:  ReturnType<typeof useProjectStore.getState>
  employees: ReturnType<typeof useEmployeeStore.getState>
  time:      ReturnType<typeof useTimeStore.getState>
  character: ReturnType<typeof useCharacterStore.getState>
  rivals:    ReturnType<typeof useRivalStore.getState>
  news:      ReturnType<typeof useNewsStore.getState>
  awards:    ReturnType<typeof useAwardsStore.getState>
  trends:    ReturnType<typeof useTrendStore.getState>
  events:    ReturnType<typeof useEventStore.getState>
  training:  ReturnType<typeof useTrainingStore.getState>
  seenCutscenes: string[]   // cutsceneStore.seenCutscenes (Set → Array)
}
```

`dayTimeStore` ve `cutsceneStore`'un aktif animasyon alanları (`activeCutscene`, `frameIndex`, vb.) kaydedilmez — her yüklemede sıfırlanır.

---

## `savegameEngine.ts`

```typescript
// src/engine/savegameEngine.ts

export function serialize(slotId: 1|2|3): string
// Tüm store'lardan getState() çeker, SaveSnapshot nesnesi oluşturur,
// JSON.stringify ile döndürür. Set türleri Array'e dönüştürülür.

export function deserialize(json: string): void
// JSON.parse → SaveSnapshot. Her store setState() ile yüklenir.
// seenCutscenes Array → Set dönüşümü yapılır.
// dayTimeStore.reset() çağrılır.
```

---

## `saveStore.ts`

```typescript
// src/store/saveStore.ts

interface SaveStore {
  slots:        [SaveSlot, SaveSlot, SaveSlot]
  activeSlotId: 1 | 2 | 3

  setActiveSlot: (id: 1|2|3) => void
  save:          (slotId: 1|2|3) => Promise<void>
  load:          (slotId: 1|2|3) => Promise<void>
  deleteSlot:    (slotId: 1|2|3) => void
  initSlots:     () => Promise<void>   // uygulama açılışında mevcut slot'ları yükler
  reset:         () => void
}
```

**`save` akışı:**
1. `serialize(slotId)` → JSON string
2. `localStorage.setItem(`save-slot-${slotId}`, json)`
3. `window.electronAPI.saveGame(slotId, json)` (IPC)
4. `slots[slotId-1]` metadata güncellenir (label, savedAt, isEmpty: false)

**`load` akışı:**
1. `localStorage.getItem(`save-slot-${slotId}`)` dene
2. Yoksa `window.electronAPI.loadGame(slotId)` (IPC)
3. `deserialize(json)`
4. `activeSlotId = slotId`

**`initSlots` akışı:** Uygulama açılışında her 3 slot için localStorage veya disk'ten metadata okunur; `isEmpty` belirlenir. Snapshot deserialize edilmez — yalnız label/tarih gösterilir.

---

## Electron IPC

### `electron/main.ts`

```typescript
ipcMain.handle('save-game', async (_, slotId: number, json: string) => {
  const dir  = path.join(app.getPath('userData'), 'saves')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, `slot-${slotId}.json`), json, 'utf-8')
})

ipcMain.handle('load-game', async (_, slotId: number) => {
  const file = path.join(app.getPath('userData'), 'saves', `slot-${slotId}.json`)
  try { return await fs.readFile(file, 'utf-8') }
  catch { return null }
})
```

### `electron/preload.ts`

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  saveGame: (slotId: number, json: string) => ipcRenderer.invoke('save-game', slotId, json),
  loadGame: (slotId: number)               => ipcRenderer.invoke('load-game', slotId),
})
```

`window.electronAPI` için `src/types/electron.d.ts` type declaration dosyası oluşturulur.

---

## Otomatik Kayıt Tetikleyicileri

### Sezon Geçişi

`timeStore`'daki `advanceWeek` fonksiyonunda `week === 1` (yani yeni sezon başı) koşulunda:

```typescript
useSaveStore.getState().save(useSaveStore.getState().activeSlotId)
```

### Uyku

`dayTimeStore`'da gece callback'i zaten var (`onSleep` veya benzeri). Yoksa `worldStore`'a `triggerSleep` action'ı eklenir. Bu tetikleme noktasında:

```typescript
useSaveStore.getState().save(useSaveStore.getState().activeSlotId)
```

Her iki durumda da `gameStore` üzerinden küçük bir toast bildirimi gösterilir: `"💾 Kaydedildi"` (2 saniye görünür, oyun durmaz).

---

## Toast Bildirimi

```typescript
// gameStore'a eklenir:
saveToast: string | null          // "💾 Kaydedildi" veya null
showSaveToast: () => void         // set + 2 saniye sonra null
```

`App.tsx`'te render edilir:

```tsx
{saveToast && (
  <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded text-sm">
    {saveToast}
  </div>
)}
```

---

## UI

### Açılış Ekranı (`StartScreen.tsx`)

Uygulama açılışında `characterStore.name` boşsa character wizard gösterilir. Doluysa (veya slot seçiminde):

```
┌─────────────────────────────┐
│  [OYUN ADI]                 │
│                             │
│  ┌────────┐ ┌────────┐ ┌───┐│
│  │ Slot 1 │ │ Slot 2 │ │...││
│  │2003 Yaz│ │ — Boş —│ │   ││
│  │Devam Et│ │Yeni Oyun│ │   ││
│  └────────┘ └────────┘ └───┘│
│                             │
│       [Yeni Oyun Başlat]    │
└─────────────────────────────┘
```

- Dolu slot: label ("Slot 1 — 2003 Yaz") + kaydedilme tarihi + "Devam Et" butonu
- Boş slot: "— Boş —" + "Yeni Oyun" butonu (wizard'a yönlendirir, bu slotu aktif yapar)
- "Yeni Oyun Başlat": slot seçtirir, sonra wizard açılır

### Oyun İçi Overlay (`SaveLoadPanel.tsx`)

Dashboard'da küçük 💾 butonu veya ESC ile açılır:

- **Şimdi Kaydet** — aktif slota manuel kayıt
- **Farklı Slota Kaydet** — 3 slot listesi, seç ve kaydet
- **Slot Yükle** — başka bir slotu yükle (onay ister: "Mevcut ilerleme kaydedilmeyecek")
- **Ana Menüye Dön** — `StartScreen`'e geri döner (onay ister)
- **Slotu Sil** — seçili slotu temizler (onay ister)

---

## Entegrasyon Noktaları

| Dosya | Değişiklik |
|---|---|
| `src/engine/savegameEngine.ts` | Yeni dosya: serialize/deserialize |
| `src/store/saveStore.ts` | Yeni dosya: slot yönetimi |
| `src/store/gameStore.ts` | `saveToast` + `showSaveToast` |
| `src/store/timeStore.ts` | Sezon geçişinde `save()` tetikleyici |
| `src/store/dayTimeStore.ts` | Uyku callback'inde `save()` tetikleyici |
| `electron/main.ts` | IPC handler'ları (`save-game`, `load-game`) |
| `electron/preload.ts` | `electronAPI` bridge genişletmesi |
| `src/types/electron.d.ts` | Yeni dosya: `window.electronAPI` tip tanımı |
| `src/components/StartScreen.tsx` | Yeni dosya: açılış slot seçimi |
| `src/components/SaveLoadPanel.tsx` | Yeni dosya: oyun içi overlay |
| `src/App.tsx` | `StartScreen` gate + `SaveLoadPanel` render |

---

## Test Stratejisi

### `tests/engine/savegameEngine.test.ts`

1. `serialize` → JSON geçerli, `version: 1` içeriyor
2. `serialize` → `seenCutscenes` Set → Array dönüşümü doğru
3. `deserialize` → `seenCutscenes` Array → Set dönüşümü doğru
4. `serialize` → `deserialize` round-trip: `gameStore.money` korunur
5. `serialize` → `deserialize` round-trip: `projectStore.projects` sayısı korunur
6. `deserialize` → `dayTimeStore` sıfırlanır (ephemeral alan temizlenir)

### `tests/store/saveStore.test.ts`

1. `save` → localStorage'a JSON yazar
2. `load` → localStorage'dan deserialize eder
3. `deleteSlot` → slot `isEmpty: true` olur, localStorage temizlenir
4. `initSlots` → localStorage'da var olan slotların `isEmpty: false` döner
5. `setActiveSlot` → activeSlotId güncellenir

---

## Kapsam Dışı

- Cloud save / çevrimiçi senkronizasyon
- Oyun içi ekran görüntüsü thumbnail (slot kartında önizleme)
- Save dosyası şifreleme
- `version` üzerinden migration (şimdilik `version: 1`, format değişirse bu altyapı kullanılır)
- Slot'a özel isim verme (oyuncu yazamaz, otomatik label)
