# Oyuncu Romantizm Arkı (Spec C1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut NPC kalp sistemine binen Stardew-tam romantizm: arkadaşlık → itiraf (çiçek demeti) → buluşma → teklif (yüzük) → evlilik (eş taşınır) → çocuk (max 2). `player_romance_*`/`player_married_*` bayrakları (B okur) + oyuncu çocukları (A ile büyür).

**Architecture:** Yeni `romanceStore` kademe/jest/aksiyonları yönetir; `characterStore` tercih + partner/eş/çocuk tutar; uygunluk (gating) tercih + aday cinsiyeti + yetişkinlik (A) + B-evliliği'ne bakar. Bayraklar `lifeStore`'a (A), çocuk `lifeStore.spawnedNpcs`'e yazılır; itiraf/düğün cutscene'leri `cutsceneStore` ile.

**Tech Stack:** TypeScript, Zustand, Vitest, electron-vite. Doğrulama: `npx vitest run`.

**Referans:** `docs/superpowers/specs/2026-05-31-oyuncu-romantizm-arki-design.md`.

**Önkoşullar:** NPC sistemi (`npcs.ts` `NpcDef`, kalp/`npcStore`), A çekirdek (`lifeStore` flags/spawnedNpcs, `aging.ts`), cutscene sistemi. B'nin `married_*` bayrakları (uygunluk taraması). `START_YEAR=2000`, oyuncu yaşı `characterStore` (A planında `birthYear` eklendi).

---

## Dosya Yapısı

| Dosya | Sorumluluk | İşlem |
|-------|-----------|-------|
| `src/data/npcs.ts` | `NpcDef.gender` (romantizm adayları) | Modify |
| `src/store/characterStore.ts` | `romanticPreference`, `partnerId`, `spouseId`, `childIds` | Modify |
| `src/store/lifeStore.ts` | Public `setFlag` + `spawnNpc` (A'ya küçük ek) | Modify |
| `src/store/romanceStore.ts` | Kademe/jest/aksiyon + uygunluk | Create |
| `src/types/cutscene.ts`, `src/data/cutscenes.ts` | `itiraf`, `dugun_oyuncu` cutscene | Modify |
| `src/dialogue/*.yarn` | `DatingStart`, `SpouseStart` düğümleri | Modify |
| `src/components/CharacterCreationWizard.tsx` | "İlgi" seçimi | Modify |

---

### Task 1: NpcDef.gender + characterStore romantizm alanları

**Files:** Modify `src/data/npcs.ts`, `src/store/characterStore.ts`, Test `tests/store/characterStore.test.ts` (genişlet)

- [ ] **Step 1: `NpcDef`'e `gender` ekle** — `src/data/npcs.ts` `NpcDef`:
```ts
  gender?: 'kadin' | 'erkek'   // romantizm adaylarında dolu
```
Romantizm adaylarına (NPC spec'indeki 6K/6E) ata: `kadin` → Elise, Nadia, Rosa, Iris, Sigrid, Liv; `erkek` → Daniel, Cassian, Bjorn, Elias, Matteo, Kai.

- [ ] **Step 2: characterStore'a ekle** — state + reset:
```ts
  romanticPreference: 'kadin' | 'erkek' | 'herkes' | null
  partnerId: string | null
  spouseId:  string | null
  childIds:  string[]
  setRomanticPreference: (p: 'kadin' | 'erkek' | 'herkes') => void
```
initial: `romanticPreference: null, partnerId: null, spouseId: null, childIds: []`; `setRomanticPreference: (p) => set({ romanticPreference: p })`; `reset`'e bu alanların sıfırlanmasını ekle.

- [ ] **Step 3: Test** — `tests/store/characterStore.test.ts`'e:
```ts
it('romanticPreference set + reset', () => {
  useCharacterStore.getState().setRomanticPreference('herkes')
  expect(useCharacterStore.getState().romanticPreference).toBe('herkes')
  useCharacterStore.getState().reset()
  expect(useCharacterStore.getState().romanticPreference).toBeNull()
  expect(useCharacterStore.getState().childIds).toEqual([])
})
```

- [ ] **Step 4: Çalıştır (pass)** — `npx vitest run tests/store/characterStore.test.ts` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/data/npcs.ts src/store/characterStore.ts tests/store/characterStore.test.ts
git commit -m "feat(C1): NpcDef.gender + characterStore romantizm alanları"
```

---

### Task 2: lifeStore public setFlag + spawnNpc (A'ya küçük ek)

**Files:** Modify `src/store/lifeStore.ts`, Test `tests/store/lifeStore.test.ts` (genişlet)

- [ ] **Step 1: Test** — `tests/store/lifeStore.test.ts`'e:
```ts
it('public setFlag + spawnNpc', () => {
  useLifeStore.getState().reset()
  useLifeStore.getState().setFlag('player_romance_daniel')
  expect(useLifeStore.getState().hasFlag('player_romance_daniel')).toBe(true)
  useLifeStore.getState().spawnNpc({ id: 'k1', name: 'Çocuk', role: 'Çocuk', spot: { x: 0, y: 0 }, birthYear: 2010 } as any)
  expect(useLifeStore.getState().spawnedNpcs.some(n => n.id === 'k1')).toBe(true)
})
```

- [ ] **Step 2: lifeStore'a public metodlar ekle** — arayüze + implementasyona:
```ts
  setFlag:  (flag: string) => void
  spawnNpc: (def: NpcDef) => void
// impl:
  setFlag: (flag) => set(s => ({ flags: new Set(s.flags).add(flag) })),
  spawnNpc: (def) => set(s => ({ spawnedNpcs: [...s.spawnedNpcs, def] })),
```

- [ ] **Step 3: Çalıştır (pass)** — `npx vitest run tests/store/lifeStore.test.ts` → PASS.

- [ ] **Step 4: Commit**
```bash
git add src/store/lifeStore.ts tests/store/lifeStore.test.ts
git commit -m "feat(C1): lifeStore public setFlag + spawnNpc (romantizm için)"
```

---

### Task 3: romanceStore — uygunluk + itiraf

**Files:** Create `src/store/romanceStore.ts`, Test `tests/store/romanceStore.test.ts`

- [ ] **Step 1: Test** — `tests/store/romanceStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useRomanceStore } from '@/store/romanceStore'
import { useCharacterStore } from '@/store/characterStore'
import { useLifeStore } from '@/store/lifeStore'
import { useTimeStore } from '@/store/timeStore'

function reset() {
  useRomanceStore.getState().reset()
  useCharacterStore.getState().reset()
  useLifeStore.getState().reset()
  useTimeStore.getState().reset()        // year 2000
  useCharacterStore.getState().setRomanticPreference('herkes')
}
beforeEach(reset)

describe('romanceStore uygunluk + itiraf', () => {
  it('tercih erkekse kadın aday uygun değil', () => {
    useCharacterStore.getState().setRomanticPreference('erkek')
    expect(useRomanceStore.getState().isEligible('elise')).toBe(false) // Elise kadın
    expect(useRomanceStore.getState().isEligible('daniel')).toBe(true)  // Daniel erkek, yetişkin
  })
  it('confess: bouquet + max kalp → sevgili + player_romance flag', () => {
    useRomanceStore.setState({ hasBouquet: true })
    // kalbi max varsay (npcStore mock yerine doğrudan): confess kalbi parametre/garanti kabul eder
    useRomanceStore.getState().confess('daniel')
    expect(useRomanceStore.getState().stage['daniel']).toBe('sevgili')
    expect(useCharacterStore.getState().partnerId).toBe('daniel')
    expect(useLifeStore.getState().hasFlag('player_romance_daniel')).toBe(true)
  })
  it('bouquet yoksa confess olmaz', () => {
    useRomanceStore.getState().confess('daniel')
    expect(useRomanceStore.getState().stage['daniel']).toBeUndefined()
  })
})
```
> Not: Kalp eşiği `npcStore`'dan okunur; testte `npcStore` kalbi yüksek varsayılır. `confess`, çağrı anında kalp<max ise sessiz döner — test için `npcStore` kalbini ya set et ya da `confess`'in kalp kontrolünü `npcStore.hearts[id] >= HEART_MAX` ile yap; testte `useNpcStore.setState({ hearts: { daniel: 5 } })` ekle.

- [ ] **Step 2: Çalıştır (fail)** — FAIL.

- [ ] **Step 3: romanceStore'u yaz** — `src/store/romanceStore.ts`

```ts
import { create } from 'zustand'
import { getNpc } from '@/data/npcs'
import { useCharacterStore } from '@/store/characterStore'
import { useLifeStore } from '@/store/lifeStore'
import { useNpcStore, HEART_MAX } from '@/store/npcStore'
import { useTimeStore } from '@/store/timeStore'
import { ageFromBirthYear, stageForAge } from '@/engine/aging'

export type RomanceStage = 'arkadas' | 'sevgili' | 'nisanli' | 'evli'

interface RomanceStore {
  stage:      Record<string, RomanceStage>
  dateCount:  Record<string, number>
  hasBouquet: boolean
  hasRing:    boolean

  isEligible: (npcId: string) => boolean
  confess:    (npcId: string) => void
  reset:      () => void
}

function isAdult(npcId: string): boolean {
  const def = getNpc(npcId)
  if (!def) return false
  const year = useTimeStore.getState().date.year
  const st = stageForAge(ageFromBirthYear(def.birthYear, year))
  return st === 'genc_yetiskin' || st === 'yetiskin' || st === 'yasli'
}

function isTakenByNpc(npcId: string): boolean {
  // B evlilik bayrakları: 'married_a_b' — npcId substring taraması
  for (const f of useLifeStore.getState().flags) {
    if (f.startsWith('married_') && f.includes(npcId)) return true
  }
  return false
}

export const useRomanceStore = create<RomanceStore>((set, get) => ({
  stage:      {},
  dateCount:  {},
  hasBouquet: false,
  hasRing:    false,

  isEligible: (npcId) => {
    const def = getNpc(npcId)
    if (!def || !def.isRomance) return false
    const pref = useCharacterStore.getState().romanticPreference
    if (pref !== 'herkes' && pref != null && def.gender !== pref) return false
    if (pref == null) return false
    if (!isAdult(npcId)) return false
    if (isTakenByNpc(npcId)) return false
    return true
  },

  confess: (npcId) => {
    if (!get().isEligible(npcId)) return
    if (!get().hasBouquet) return
    if ((useNpcStore.getState().hearts[npcId] ?? 0) < HEART_MAX) return
    set(s => ({ stage: { ...s.stage, [npcId]: 'sevgili' }, hasBouquet: false }))
    useCharacterStore.setState({ partnerId: npcId })
    useLifeStore.getState().setFlag(`player_romance_${npcId}`)
    // itiraf cutscene (Task 6'da tanımlı)
    useCutsceneStore.getState().startCutsceneForce('itiraf')
  },

  reset: () => set({ stage: {}, dateCount: {}, hasBouquet: false, hasRing: false }),
}))
```
> `useCutsceneStore` import'u Task 6'da eklenir (cutscene `itiraf` tanımlanınca). Bu görevde import'u ekle; cutscene Task 6'da gelir (test, cutscene çağrısını tolere eder — `startCutsceneForce` mevcut ve geçersiz id'de güvenli davranmalı; değilse Task 6'yı önce yap).

- [ ] **Step 4: Çalıştır (pass)** — testte `useNpcStore.setState({ hearts: { daniel: 5 } })` ekleyip `npx vitest run tests/store/romanceStore.test.ts` → PASS.

- [ ] **Step 5: Commit (Task 4/5 ile)**

---

### Task 4: romanceStore — buluşma, teklif, evlilik

**Files:** Modify `src/store/romanceStore.ts`, Test genişlet

- [ ] **Step 1: Test** — ekle:
```ts
describe('buluşma/teklif/evlilik', () => {
  beforeEach(() => {
    useRomanceStore.setState({ stage: { daniel: 'sevgili' }, dateCount: {}, hasBouquet: false, hasRing: true })
    useCharacterStore.setState({ partnerId: 'daniel' })
  })
  it('propose: ring + 3 buluşma → nisanli', () => {
    useRomanceStore.setState({ dateCount: { daniel: 3 } })
    useRomanceStore.getState().propose('daniel')
    expect(useRomanceStore.getState().stage['daniel']).toBe('nisanli')
  })
  it('az buluşmada teklif olmaz', () => {
    useRomanceStore.setState({ dateCount: { daniel: 1 } })
    useRomanceStore.getState().propose('daniel')
    expect(useRomanceStore.getState().stage['daniel']).toBe('sevgili')
  })
  it('marry: nisanli → evli + player_married flag + spouseId', () => {
    useRomanceStore.setState({ stage: { daniel: 'nisanli' } })
    useRomanceStore.getState().marry('daniel')
    expect(useRomanceStore.getState().stage['daniel']).toBe('evli')
    expect(useCharacterStore.getState().spouseId).toBe('daniel')
    expect(useLifeStore.getState().hasFlag('player_married_daniel')).toBe(true)
  })
})
```

- [ ] **Step 2: Çalıştır (fail)** — FAIL.

- [ ] **Step 3: Metodları ekle** — romanceStore arayüzü + impl:
```ts
  goOnDate: (npcId: string) => void
  propose:  (npcId: string) => void
  marry:    (npcId: string) => void
// impl:
  goOnDate: (npcId) => {
    if (get().stage[npcId] !== 'sevgili') return
    set(s => ({ dateCount: { ...s.dateCount, [npcId]: (s.dateCount[npcId] ?? 0) + 1 } }))
  },
  propose: (npcId) => {
    if (get().stage[npcId] !== 'sevgili') return
    if (!get().hasRing) return
    if ((get().dateCount[npcId] ?? 0) < 3) return
    set(s => ({ stage: { ...s.stage, [npcId]: 'nisanli' }, hasRing: false }))
  },
  marry: (npcId) => {
    if (get().stage[npcId] !== 'nisanli') return
    set(s => ({ stage: { ...s.stage, [npcId]: 'evli' } }))
    useCharacterStore.setState({ spouseId: npcId })
    useLifeStore.getState().setFlag(`player_married_${npcId}`)
    useCutsceneStore.getState().startCutsceneForce('dugun_oyuncu')
  },
```

- [ ] **Step 4: Çalıştır (pass)** — PASS.

- [ ] **Step 5: Commit (Task 5 ile)**

---

### Task 5: romanceStore — çocuk (max 2)

**Files:** Modify `src/store/romanceStore.ts`, Test genişlet

- [ ] **Step 1: Test** — ekle:
```ts
describe('çocuk', () => {
  beforeEach(() => {
    useCharacterStore.getState().reset()
    useLifeStore.getState().reset()
    useCharacterStore.setState({ spouseId: 'daniel', childIds: [] })
    useRomanceStore.setState({ stage: { daniel: 'evli' } })
  })
  it('evliyken çocuk doğar (spawnedNpcs + childIds), max 2', () => {
    useRomanceStore.getState().haveChild()
    useRomanceStore.getState().haveChild()
    useRomanceStore.getState().haveChild()  // 3. olmaz
    expect(useCharacterStore.getState().childIds).toHaveLength(2)
    expect(useLifeStore.getState().spawnedNpcs).toHaveLength(2)
  })
  it('evli değilse çocuk olmaz', () => {
    useCharacterStore.setState({ spouseId: null })
    useRomanceStore.getState().haveChild()
    expect(useCharacterStore.getState().childIds).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Çalıştır (fail)** — FAIL.

- [ ] **Step 3: `haveChild` ekle** — romanceStore:
```ts
  haveChild: () => void
// impl:
  haveChild: () => {
    const { spouseId, childIds } = useCharacterStore.getState()
    if (!spouseId) return
    if (childIds.length >= 2) return
    const year = useTimeStore.getState().date.year
    const id = `cocuk_${childIds.length + 1}`
    const def = { id, name: `Çocuk ${childIds.length + 1}`, role: 'Çocuk', spot: { x: 480, y: 360 }, birthYear: year } as ReturnType<typeof getNpc>
    useLifeStore.getState().spawnNpc(def!)
    useCharacterStore.setState({ childIds: [...childIds, id] })
  },
```
> Çocuk isimleri/diyaloğu içerik olarak sonradan zenginleşir; spawn edilen çocuk A yaşlanmasıyla büyür. `dialogue/cocuk_*.yarn` opsiyonel basit düğüm.

- [ ] **Step 4: Çalıştır (pass)** — `npx vitest run tests/store/romanceStore.test.ts` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/store/romanceStore.ts tests/store/romanceStore.test.ts
git commit -m "feat(C1): romanceStore — itiraf/buluşma/teklif/evlilik/çocuk"
```

---

### Task 6: Cutscene'ler + Yarn düğümleri + jest edinme

**Files:** Modify `src/types/cutscene.ts`, `src/data/cutscenes.ts`, `src/dialogue/*.yarn`, `src/store/romanceStore.ts`

- [ ] **Step 1: CutsceneId + içerik** — `types/cutscene.ts`'e `| 'itiraf' | 'dugun_oyuncu'`; `cutscenes.ts`'e:
```ts
  itiraf: { id: 'itiraf', frames: [{ background: 'coast', lines: [
    { speaker: '{{playerName}}', text: 'Bunu söylemek için çok bekledim. Seninle... daha fazlasını istiyorum.' },
  ]}]},
  dugun_oyuncu: { id: 'dugun_oyuncu', frames: [{ background: 'coast', lines: [
    { speaker: '{{playerName}}', text: 'Kovulmuş, terk edilmiş, sıfırdan başlamıştım. Bugün yeniden başlıyorum — bu sefer yalnız değil.' },
  ]}]},
```
> Ton, eşin T3 repliklerinden gelir; cutscene ortak şablon + `{{playerName}}`.

- [ ] **Step 2: Yarn düğümleri** — adayların `.yarn`'larına `DatingStart` (sevgili dönemi) ve `SpouseStart` (eş, sahil evinde) düğümleri ekle (kısa, tona uygun). `npcStore` kademeye göre düğüm seçer: romanceStore `stage` `evli`→`SpouseStart`, `sevgili`→`DatingStart` (npcStore entegrasyonu — `dialogueOverrides` benzeri ya da `romanceStore.stage` okuma).

- [ ] **Step 3: Jest edinme** — romanceStore'a `buyBouquet`/`buyRing` (Greta/kuyumcu UI'ından çağrılır):
```ts
  buyBouquet: () => set({ hasBouquet: true }),
  buyRing:    () => set({ hasRing: true }),
```
(Para entegrasyonu: `gameStore.addMoney(-fiyat)` ilgili panelde; MVP'de flag yeterli.)

- [ ] **Step 4: Doğrula** — `npx vitest run` → PASS; `npm run build` → hatasız.

- [ ] **Step 5: Commit**
```bash
git add src/types/cutscene.ts src/data/cutscenes.ts src/dialogue src/store/romanceStore.ts
git commit -m "feat(C1): itiraf/düğün cutscene + Dating/Spouse düğümleri + jestler"
```

---

### Task 7: Karakter yaratma "İlgi" adımı + eş etkisi + doğrulama

**Files:** Modify `src/components/CharacterCreationWizard.tsx`, `src/store/dayTimeStore.ts` (veya enerji kaynağı), `docs/superpowers/DURUM.md`

- [ ] **Step 1: "İlgi" seçimi** — `CharacterCreationWizard`'a küçük bir adım/satır: kadın / erkek / herkes → `useCharacterStore.getState().setRomanticPreference(...)`. (Mevcut adım desenini izle; finalize öncesi set edilmeli.)

- [ ] **Step 2: Eş etkisi (hafif)** — Eş varsa (`characterStore.spouseId`) gün başında küçük moral/enerji desteği: günlük tick'in başladığı yerde (`dayTimeStore` günlük tick ya da Dashboard sabah) `spouseId` doluysa enerji/moral'e küçük sabit ekle (örn. +5, bir kez/gün). Kesin bağlanış mevcut enerji/moral kaynağına göre.

- [ ] **Step 3: Tam doğrulama** — `npx vitest run` PASS; `npm run build` hatasız; `npm run dev` ile: uygun adayla kalp max → çiçek demeti → itiraf → buluşmalar → yüzük → teklif → düğün → çocuk; B'nin o adayı evlendirmediğini gözle.

- [ ] **Step 4: DURUM güncelle** — tabloya:
```markdown
| **Oyuncu Romantizm Arkı (C1)** | ✅ Bitti | `specs/2026-05-31-oyuncu-romantizm-arki-design.md` | `plans/2026-05-31-oyuncu-romantizm-arki.md` |
```

- [ ] **Step 5: Commit**
```bash
git add src/components/CharacterCreationWizard.tsx src/store/dayTimeStore.ts docs/superpowers/DURUM.md
git commit -m "feat(C1): İlgi seçimi + eş etkisi; romantizm arkı tamamlandı"
```

---

## Self-Review

**1. Spec coverage:**
- Kademe akışı (arkadaş→sevgili→nişanlı→evli→çocuk) → Task 3/4/5 ✅
- İtiraf (çiçek demeti + max kalp + player_romance flag) → Task 3 ✅
- Buluşma/teklif (yüzük + ≥3 buluşma) → Task 4 ✅
- Evlilik (player_married flag + spouseId + düğün cutscene) → Task 4/6 ✅
- Çocuk (spawnNpc, max 2, A ile büyür) → Task 5 ✅
- Aday havuzu gating (tercih + cinsiyet + yetişkin + B-evliliği) → Task 3 `isEligible` ✅
- Tercih seçimi (karakter yaratma) → Task 7 ✅
- Eş etkisi hafif → Task 7 ✅
- Cutscene/Yarn içeriği → Task 6 ✅
- B entegrasyonu (player_romance_* okuma) → Task 3 flag + (B testi) ✅

**2. Placeholder scan:** Gerçek kod/komut var. Çocuk isim/diyalog "içerik sonra zenginleşir" ama spawn + max 2 mekaniği tam. Eş etkisi "mevcut enerji kaynağına göre" — kesin alan koda göre, mekanik (+gün başı sabit) net. ✅

**3. Type consistency:**
- `RomanceStage` (arkadas/sevgili/nisanli/evli) — Task 3 tanım, Task 4/5 kullanım ✅
- `isEligible/confess/goOnDate/propose/marry/haveChild` — Task 3-5 tutarlı ✅
- `lifeStore.setFlag/spawnNpc` — Task 2 tanım, Task 3-5 kullanım ✅
- `characterStore.romanticPreference/partnerId/spouseId/childIds` — Task 1 tanım, romanceStore kullanım ✅
- `NpcDef.gender` — Task 1 tanım, `isEligible` kullanım ✅
- `HEART_MAX`/`npcStore.hearts` — NPC sistemi (önkoşul), Task 3 kullanım ✅
- Cutscene `itiraf`/`dugun_oyuncu` — Task 6 tanım, Task 3/4 çağrı ✅

---

## Kapsam Dışı
- ~30-yıl emeklilik/final (C2) — `spouseId`/`childIds`/`partnerId` tüketir.
- Boşanma/aldatma/çoklu eş.
- Para/jest ekonomisi derinliği (MVP'de flag); eş için derin günlük yardım.
- Dünya yapısı (sahil mahallesi ↔ köprü ↔ şehir, otobüs/araba) — **ayrı spec** (kullanıcı fikri; C2 sonrası brainstorm).
- Save/load persist'i.
