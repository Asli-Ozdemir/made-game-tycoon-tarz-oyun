# NPC Yaşam Olayları (Spec B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Küratörlü NPC yaşam olaylarını (reşit/kariyer, evlilik, doğum, ölüm & miras) Spec A'nın life-event motoruna **veri + içerik** olarak eklemek.

**Architecture:** Yeni motor yok. B = `src/data/lifeEvents.ts`'e yeni `LifeEvent` kayıtları + yeni cutscene'ler (frame tabanlı) + yeni Yarn diyalog düğümleri (`setDialogueNode` hedefleri) + doğum için yazılı çocuk `NpcDef`'leri. Evlilikler oyuncu romantizmine `condition` ile koşullu.

**Tech Stack:** TypeScript, Zustand, Vitest, electron-vite. Doğrulama: `npx vitest run`.

**Referans:** `docs/superpowers/specs/2026-05-31-npc-yasam-olaylari-design.md` (içerik kaynağı).

**Önkoşullar:**
- **Spec A** (`plans/2026-05-31-yaslanma-yasam-olayi.md`) uygulanmış: `lifeEvents.ts` (`LIFE_EVENTS`), `lifeStore`, `lifeEventEngine`, `aging.ts`, A effect/trigger türleri.
- **NPC sistemi** (`plans/2026-05-30-npc-etkilesim-felsefe.md`): `npcs.ts`, `.yarn` diyalogları, `npcStore` (`dialogueOverrides`/`spawnedNpcs`/`retiredNpcs` tüketimi), `getNpc`.
- **Cutscene sistemi:** `types/cutscene.ts` (`CutsceneId`, `CutsceneFrame`), `data/cutscenes.ts` (`CUTSCENES`).

**Entegrasyon notu (spawned NPC yaşlanması):** A'nın yaş ctx'i (`buildCtx`) `getNpc` ile statik NPC'leri okur. Doğan (spawn) çocukların yaşı için, age resolver `lifeStore.spawnedNpcs`'i de kapsamalı. Task 4 bunu küçük bir yardımcıyla bağlar.

---

## Dosya Yapısı

| Dosya | Sorumluluk | İşlem |
|-------|-----------|-------|
| `src/types/cutscene.ts` | `CutsceneId`'ye B sahneleri | Modify |
| `src/data/cutscenes.ts` | Yeni cutscene frame içeriği | Modify |
| `src/data/lifeEvents.ts` | B'nin `LifeEvent` kayıtları | Modify |
| `src/data/npcChildren.ts` | Doğan çocuk `NpcDef`'leri (spawn defs) | Create |
| `src/engine/aging.ts` | Spawned NPC'leri kapsayan age resolver yardımcısı | Modify |
| `src/dialogue/*.yarn` | Yeni düğümler (ArtistStart, GriefStart...) | Modify |

> Not: B'nin cutscene'leri **frame tabanlı** (`CUTSCENES`), NPC günlük diyalogları **Yarn**. İkisi ayrı kanal.

---

### Task 1: B cutscene'leri (frame içeriği)

**Files:** Modify `src/types/cutscene.ts`, `src/data/cutscenes.ts`, Test `tests/data/cutscenes.test.ts` (mevcut testi kapsar)

- [ ] **Step 1: CutsceneId'ye ekle** — `src/types/cutscene.ts` `CutsceneId` union'ına:
```ts
  | 'bea_mural' | 'uclu_studyo' | 'daniel_sigrid_dugun' | 'lena_sam_dugun' | 'wilhelm_olum'
```

- [ ] **Step 2: CUTSCENES'e frame içeriği ekle** — `src/data/cutscenes.ts` `CUTSCENES` nesnesine (anlatıcısız, mevcut `background` kümesinden):

```ts
  bea_mural: { id: 'bea_mural', frames: [{ background: 'gallery', lines: [
    { speaker: 'Bea',          text: 'Bitti. Koca duvar, benim. Eller titriyor.' },
    { speaker: 'Nadia',        text: 'Bunu yıllar önce hayal etmiştin. Bak şimdi.' },
    { speaker: 'Bea',          text: 'Annem ne der acaba?' },
    { speaker: 'Nadia',        text: 'Bugün önemli olan ne dediğin. Gerisi geçer.' },
  ]}]},
  uclu_studyo: { id: 'uclu_studyo', frames: [{ background: 'studio', lines: [
    { speaker: 'Sam',          text: 'Resmi oldu. Küçük ama bizim. Stüdyo.' },
    { speaker: 'Lena',         text: 'Üç prototip, on çöküş, sonunda bir kapı.' },
    { speaker: 'Milo',         text: 'O okyanusu yapacağız. Belki bu sefer.' },
    { speaker: 'Sam',          text: '{{playerName}}\'in yaptığını gördük. Demek mümkünmüş — sıra bizde.' },
  ]}]},
  daniel_sigrid_dugun: { id: 'daniel_sigrid_dugun', frames: [{ background: 'coast', lines: [
    { speaker: 'Sigrid',       text: 'Söz vermek benim işim değildi. Bugün başka.' },
    { speaker: 'Daniel',       text: 'Seni önce bir tür gibi inceledim. Sonra anladım — seninle yaşamak istiyorum, çözmek değil.' },
    { speaker: 'Sigrid',       text: 'Lafı bırak da yüzüğü tak, biyolog.' },
  ]}]},
  lena_sam_dugun: { id: 'lena_sam_dugun', frames: [{ background: 'coast', lines: [
    { speaker: 'Lena',         text: 'Garajda başladık, burada bitirdik. İyi bir derleme.' },
    { speaker: 'Sam',          text: 'Hâlâ çöküyoruz ama birlikte çöküyoruz artık.' },
    { speaker: 'Lena',         text: 'En iyi build bu.' },
  ]}]},
  wilhelm_olum: { id: 'wilhelm_olum', frames: [{ background: 'bedroom', lines: [
    { speaker: 'Edith',        text: 'Buradayım Wilhelm. Hep buradaydım.' },
    { speaker: 'Wilhelm',      text: 'Adın aklımda değil. Ama elin tanıdık — elli yıllık tanıdık.' },
    { speaker: 'Edith',        text: 'Edith. Her sabah olduğu gibi.' },
    { speaker: 'Wilhelm',      text: 'Edith. ...Güzel isim. Bu sefer unutmam.' },
    { speaker: '{{playerName}}', text: '...' },
  ]}]},
```

- [ ] **Step 3: Veri testini çalıştır** — `npx vitest run tests/data/cutscenes.test.ts`
Expected: PASS (mevcut test: her frame geçerli background + dolu satır; yeni 5 sahne de geçer; placeholder/Anlatıcı yok).

- [ ] **Step 4: Commit**
```bash
git add src/types/cutscene.ts src/data/cutscenes.ts
git commit -m "feat(B): yaşam-olayı cutscene'leri (mural, stüdyo, 2 düğün, Wilhelm ölümü)"
```

---

### Task 2: Reşit & kariyer olayları

**Files:** Modify `src/data/lifeEvents.ts`, `src/dialogue/bea.yarn`, `src/dialogue/pippa.yarn`, Test `tests/data/lifeEventsB.test.ts`

- [ ] **Step 1: Yeni Yarn düğümleri** — ilgili `.yarn` dosyalarına ekle:
  - `src/dialogue/bea.yarn` sonuna `ArtistStart` düğümü (yetişkin/ressam sesi): örn.
    ```
    title: ArtistStart
    ---
    Artık duvarlar bana ait. Annem bile gurur duyuyor — söylemese de.
    ===
    ```
  - `src/dialogue/pippa.yarn` sonuna `AdultStart` düğümü (büyümüş, kâşif).
  - `src/dialogue/tomas.yarn` sonuna `AdultStart` (A'daki Tomas olayı bunu hedefler).

- [ ] **Step 2: Testi yaz** — `tests/data/lifeEventsB.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { LIFE_EVENTS } from '@/data/lifeEvents'
import { eventsForYear } from '@/engine/lifeEventEngine'
import type { LifeCtx } from '@/types/lifeEvent'

function ctx(p: Partial<LifeCtx> = {}): LifeCtx {
  return { year: 2018, yearsElapsed: 18, getAge: () => 18, getStage: () => 'genc_yetiskin',
           hasFlag: () => false, heartOf: () => 0, ...p }
}
const ids = (evts: ReturnType<typeof eventsForYear>) => evts.map(e => e.id)

describe('B reşit/kariyer', () => {
  it('Bea genç yetişkin olunca ArtistStart + mural tetiklenir', () => {
    const due = eventsForYear(LIFE_EVENTS, ctx({ getStage: (n) => n === 'bea' ? 'genc_yetiskin' : 'cocuk' }), new Set())
    expect(ids(due)).toEqual(expect.arrayContaining(['bea_artist_dialog', 'bea_mural_sahne']))
  })
  it('üçlü stüdyo 6. yılda', () => {
    const due = eventsForYear(LIFE_EVENTS, ctx({ yearsElapsed: 6 }), new Set())
    expect(ids(due)).toContain('uclu_studyo_sahne')
  })
})
```

- [ ] **Step 3: Çalıştır (fail)** — FAIL (olaylar yok).

- [ ] **Step 4: `LIFE_EVENTS`'e ekle** — `src/data/lifeEvents.ts`:
```ts
  // Reşit & kariyer
  { id: 'bea_artist_dialog', trigger: { kind: 'npcStage', npcId: 'bea', stage: 'genc_yetiskin' },
    effect: { kind: 'setDialogueNode', npcId: 'bea', node: 'ArtistStart' } },
  { id: 'bea_mural_sahne',  trigger: { kind: 'npcStage', npcId: 'bea', stage: 'genc_yetiskin' },
    effect: { kind: 'cutscene', id: 'bea_mural' } },
  { id: 'pippa_adult',      trigger: { kind: 'npcStage', npcId: 'pippa', stage: 'genc_yetiskin' },
    effect: { kind: 'setDialogueNode', npcId: 'pippa', node: 'AdultStart' } },
  { id: 'uclu_studyo_sahne', trigger: { kind: 'yearsElapsed', years: 6 },
    effect: { kind: 'cutscene', id: 'uclu_studyo' } },
```

- [ ] **Step 5: Çalıştır (pass)** — `npx vitest run tests/data/lifeEventsB.test.ts` → PASS.

- [ ] **Step 6: Commit**
```bash
git add src/data/lifeEvents.ts src/dialogue/bea.yarn src/dialogue/pippa.yarn src/dialogue/tomas.yarn tests/data/lifeEventsB.test.ts
git commit -m "feat(B): reşit & kariyer olayları (Bea ressam+mural, Pippa, üçlü stüdyo)"
```

---

### Task 3: Evlilik olayları (oyuncuya koşullu)

**Files:** Modify `src/data/lifeEvents.ts`, Test `tests/data/lifeEventsB.test.ts` (genişlet)

- [ ] **Step 1: Testi genişlet** — koşullu evlilik:

```ts
describe('B evlilik (koşullu)', () => {
  const base = (p: Partial<LifeCtx> = {}) => ctx({ yearsElapsed: 9, ...p })
  it('oyuncu ilgilenmiyorsa Daniel&Sigrid evlenir', () => {
    const due = eventsForYear(LIFE_EVENTS, base({ hasFlag: () => false }), new Set())
    expect(ids(due)).toContain('daniel_sigrid_evlilik')
  })
  it('oyuncu Daniel ile romantikse evlilik TETİKLENMEZ', () => {
    const due = eventsForYear(LIFE_EVENTS, base({ hasFlag: (f) => f === 'player_romance_daniel' }), new Set())
    expect(ids(due)).not.toContain('daniel_sigrid_evlilik')
  })
})
```

- [ ] **Step 2: Çalıştır (fail)** — FAIL.

- [ ] **Step 3: `LIFE_EVENTS`'e ekle** — koşullu evlilikler (her biri sahne + bayrak):
```ts
  // Evlilik (oyuncu romantizmine koşullu)
  { id: 'daniel_sigrid_evlilik',
    trigger: { kind: 'condition', test: (c) => c.yearsElapsed >= 9
      && !c.hasFlag('player_romance_daniel') && !c.hasFlag('player_romance_sigrid')
      && !c.hasFlag('married_daniel_sigrid') },
    once: true, effect: { kind: 'cutscene', id: 'daniel_sigrid_dugun' } },
  { id: 'daniel_sigrid_flag',
    trigger: { kind: 'condition', test: (c) => c.yearsElapsed >= 9
      && !c.hasFlag('player_romance_daniel') && !c.hasFlag('player_romance_sigrid')
      && !c.hasFlag('married_daniel_sigrid') },
    once: true, effect: { kind: 'setFlag', flag: 'married_daniel_sigrid' } },
  { id: 'lena_sam_evlilik',
    trigger: { kind: 'condition', test: (c) => c.yearsElapsed >= 8
      && !c.hasFlag('player_romance_lena') && !c.hasFlag('player_romance_sam')
      && !c.hasFlag('married_lena_sam') },
    once: true, effect: { kind: 'cutscene', id: 'lena_sam_dugun' } },
  { id: 'lena_sam_flag',
    trigger: { kind: 'condition', test: (c) => c.yearsElapsed >= 8
      && !c.hasFlag('player_romance_lena') && !c.hasFlag('player_romance_sam')
      && !c.hasFlag('married_lena_sam') },
    once: true, effect: { kind: 'setFlag', flag: 'married_lena_sam' } },
```
> Not: Aynı koşullu çift olayı `cutscene` + `setFlag` iki kayıt olarak yazıldı (A'da effect tekildir). `once` ile her biri bir kez tetiklenir; `married_*` bayrağı set olunca koşul bir sonraki yıl zaten kapanır.

- [ ] **Step 4: Çalıştır (pass)** — PASS.

- [ ] **Step 5: Commit**
```bash
git add src/data/lifeEvents.ts tests/data/lifeEventsB.test.ts
git commit -m "feat(B): koşullu evlilik olayları (Daniel&Sigrid, Lena&Sam)"
```

---

### Task 4: Doğum (yeni nesil) + spawned NPC yaşlanması

**Files:** Create `src/data/npcChildren.ts`, Modify `src/data/lifeEvents.ts`, `src/engine/aging.ts`, Test `tests/data/lifeEventsB.test.ts` (genişlet)

- [ ] **Step 1: Çocuk NpcDef'leri** — `src/data/npcChildren.ts`:
```ts
import type { NpcDef } from '@/data/npcs'

// Doğum yılı = başlangıç 2000 + ofset (evlilikten ~2 yıl sonra)
export const MIRA: NpcDef = {
  id: 'mira', name: 'Mira Pierce', role: 'Çocuk', spot: { x: 320, y: 400 },
  birthYear: 2011,  // Daniel&Sigrid evliliği ~2009 + 2
}
export const THEO_JR: NpcDef = {
  id: 'theo_jr', name: 'Theo Jr.', role: 'Çocuk', spot: { x: 340, y: 400 },
  birthYear: 2010,  // Lena&Sam evliliği ~2008 + 2
}
```
> `dialogue/mira.yarn`, `dialogue/theo_jr.yarn` (kısa çocuk replikleri) + `dialogue/index.ts`'e import — NPC sistemi deseni. (Konuşulabilir flavor; romantizm dışı.)

- [ ] **Step 2: age resolver'ı spawned NPC'leri kapsayacak şekilde genişlet** — `src/engine/aging.ts`'e yardımcı ekle:
```ts
import type { NpcDef } from '@/data/npcs'

// Statik + spawn edilmiş NPC'lerden birthYear bul.
export function birthYearOf(npcId: string, statics: NpcDef[], spawned: NpcDef[]): number | null {
  const def = statics.find(n => n.id === npcId) ?? spawned.find(n => n.id === npcId)
  return def ? def.birthYear : null
}
```
ve `lifeStore.buildCtx`'i, `getAge`'i `birthYearOf(npcId, NPCS, get().spawnedNpcs)` ile hesaplayacak şekilde güncelle (A'daki `buildCtx`'te `getNpc` yerine).

- [ ] **Step 3: Testi genişlet** — doğum:
```ts
import { useLifeStore } from '@/store/lifeStore'
describe('B doğum', () => {
  it('evlilik bayrağı varken 11. yılda Mira doğar (spawnedNpcs)', () => {
    useLifeStore.getState().reset()
    useLifeStore.setState({ flags: new Set(['married_daniel_sigrid']) })
    useLifeStore.getState().advanceYear(2011)   // LIFE_EVENTS varsayılan
    expect(useLifeStore.getState().spawnedNpcs.some(n => n.id === 'mira')).toBe(true)
  })
})
```

- [ ] **Step 4: `LIFE_EVENTS`'e doğum olayları** — `src/data/lifeEvents.ts`:
```ts
import { MIRA, THEO_JR } from '@/data/npcChildren'
// ...
  { id: 'daniel_sigrid_dogum',
    trigger: { kind: 'condition', test: (c) => c.hasFlag('married_daniel_sigrid') && c.year >= 2011 },
    once: true, effect: { kind: 'spawnNpc', def: MIRA } },
  { id: 'lena_sam_dogum',
    trigger: { kind: 'condition', test: (c) => c.hasFlag('married_lena_sam') && c.year >= 2010 },
    once: true, effect: { kind: 'spawnNpc', def: THEO_JR } },
```

- [ ] **Step 5: Çalıştır (pass)** — `npx vitest run tests/data/lifeEventsB.test.ts` → PASS.

- [ ] **Step 6: Commit**
```bash
git add src/data/npcChildren.ts src/data/lifeEvents.ts src/engine/aging.ts src/dialogue/mira.yarn src/dialogue/theo_jr.yarn src/dialogue/index.ts tests/data/lifeEventsB.test.ts
git commit -m "feat(B): doğum (Mira, Theo Jr.) + spawned NPC yaş çözümü"
```

---

### Task 5: Ölüm & miras

**Files:** Modify `src/data/lifeEvents.ts`, `src/dialogue/edith.yarn`, `src/dialogue/hanna.yarn`, `src/dialogue/tomas.yarn`, Test `tests/data/lifeEventsB.test.ts` (genişlet)

- [ ] **Step 1: Yarn düğümleri** — `edith.yarn`'a `GriefStart` (yas) ve `AcceptanceStart` (dingin kabul); `hanna.yarn`'a `RetiredStart` (huzurlu emeklilik), `tomas.yarn`'a `InnkeeperStart` (han sahibi). Kısa, tona uygun.

- [ ] **Step 2: Testi genişlet** — ölüm dizisi:
```ts
describe('B ölüm & miras', () => {
  it('13. yılda Wilhelm retire + Edith GriefStart + wilhelm_dead flag', () => {
    useLifeStore.getState().reset()
    useLifeStore.getState().advanceYear(2013)
    const s = useLifeStore.getState()
    expect(s.retiredNpcs.has('wilhelm')).toBe(true)
    expect(s.dialogueOverrides['edith']).toBe('GriefStart')
    expect(s.hasFlag('wilhelm_dead')).toBe(true)
  })
})
```

- [ ] **Step 3: `LIFE_EVENTS`'e ekle**:
```ts
  // Ölüm & miras
  { id: 'wilhelm_retire', trigger: { kind: 'yearsElapsed', years: 13 },
    effect: { kind: 'retireNpc', npcId: 'wilhelm', reason: 'vefat' } },
  { id: 'wilhelm_olum_sahne', trigger: { kind: 'yearsElapsed', years: 13 },
    effect: { kind: 'cutscene', id: 'wilhelm_olum' } },
  { id: 'wilhelm_dead_flag', trigger: { kind: 'yearsElapsed', years: 13 },
    effect: { kind: 'setFlag', flag: 'wilhelm_dead' } },
  { id: 'edith_grief', trigger: { kind: 'yearsElapsed', years: 13 },
    effect: { kind: 'setDialogueNode', npcId: 'edith', node: 'GriefStart' } },
  { id: 'edith_acceptance',
    trigger: { kind: 'condition', test: (c) => c.hasFlag('wilhelm_dead') && c.yearsElapsed >= 16 },
    once: true, effect: { kind: 'setDialogueNode', npcId: 'edith', node: 'AcceptanceStart' } },
  // Miras: han -> Tomas (Tomas yetişkinse)
  { id: 'han_devir_flag',
    trigger: { kind: 'condition', test: (c) => c.yearsElapsed >= 18 && c.getStage('tomas') !== 'cocuk' && c.getStage('tomas') !== 'ergen' && !c.hasFlag('devir_han_tomas') },
    once: true, effect: { kind: 'setFlag', flag: 'devir_han_tomas' } },
  { id: 'hanna_emekli',
    trigger: { kind: 'condition', test: (c) => c.hasFlag('devir_han_tomas') },
    once: true, effect: { kind: 'setDialogueNode', npcId: 'hanna', node: 'RetiredStart' } },
  { id: 'tomas_hanci',
    trigger: { kind: 'condition', test: (c) => c.hasFlag('devir_han_tomas') },
    once: true, effect: { kind: 'setDialogueNode', npcId: 'tomas', node: 'InnkeeperStart' } },
```

- [ ] **Step 4: Çalıştır (pass)** — PASS.

- [ ] **Step 5: Commit**
```bash
git add src/data/lifeEvents.ts src/dialogue/edith.yarn src/dialogue/hanna.yarn src/dialogue/tomas.yarn tests/data/lifeEventsB.test.ts
git commit -m "feat(B): ölüm & miras (Wilhelm ölümü, Edith yası, han->Tomas)"
```

---

### Task 6: Tam doğrulama + DURUM

- [ ] **Step 1:** `npx vitest run` → tüm testler PASS.
- [ ] **Step 2:** `npm run build` → hatasız.
- [ ] **Step 3 (manuel):** `npm run dev` — yılları ilerlet: Bea 18'de mural + ArtistStart; ~yıl 6 üçlü stüdyo; ~yıl 9 Daniel&Sigrid düğünü (oyuncu ilgilenmediyse); ~yıl 11 Mira doğar; ~yıl 13 Wilhelm ölümü + Edith yası; Tomas yetişkin + ~yıl 18 han devri.
- [ ] **Step 4:** `docs/superpowers/DURUM.md` tablosuna ekle:
```markdown
| **NPC Yaşam Olayları (B)** | ✅ Bitti | `specs/2026-05-31-npc-yasam-olaylari-design.md` | `plans/2026-05-31-npc-yasam-olaylari.md` |
```
ve test sayısını güncelle.
- [ ] **Step 5:** Commit: `git commit -am "docs: NPC yaşam olayları (Spec B) tamamlandı"`

---

## Self-Review

**1. Spec coverage:**
- Yeni motor yok, A'ya veri/içerik → tüm görevler `LIFE_EVENTS`/`CUTSCENES`/`.yarn`'a ekler ✅
- Reşit & kariyer (Bea ressam+mural, Pippa, üçlü stüdyo) → Task 1 (sahne) + Task 2 ✅
- Evlilik koşullu (Daniel&Sigrid, Lena&Sam; oyuncu romantizmine `condition`) → Task 1 + Task 3 ✅
- Doğum (spawnNpc Mira/Theo Jr. + spawned yaşlanma) → Task 1? hayır → Task 4 ✅
- Ölüm & miras (Wilhelm + Edith yas→kabul, han→Tomas) → Task 1 (sahne) + Task 5 ✅
- Oyuncu çakışmama kuralı (`player_romance_*` okuma) → Task 3 condition + test ✅
- İçerik envanteri (cutscene/yarn/çocuk def) → Task 1/2/4/5 ✅

**2. Placeholder scan:** Gerçek kod/komut/replik var. Çocuk isimleri/yıl ofsetleri (Mira 2011, Theo Jr. 2010, Wilhelm yıl 13) somut sabitler — içerik kararı ama net. Yarn düğüm içerikleri örnekli; tona uygun kısa metin = içerik, kod açığı değil. ✅

**3. Type consistency:**
- `CutsceneId` yeni id'ler (Task 1) ↔ `lifeEvents` `cutscene` effect'leri (Task 2/3/5) ✅
- `LifeEvent`/`condition test(ctx)` A'nın tipiyle uyumlu; `ctx.hasFlag/getStage/yearsElapsed/year` A'da tanımlı ✅
- `married_*` bayrağı: evlilik (Task 3) set eder, doğum (Task 4) okur ✅
- `wilhelm_dead` bayrağı: ölüm (Task 5) set eder, `edith_acceptance` okur ✅
- `spawnNpc` def `NpcDef` (Task 4 `npcChildren.ts`) ↔ A `LifeEffect.spawnNpc` ✅
- `birthYearOf(npcId, statics, spawned)` (Task 4) ↔ lifeStore buildCtx kullanımı ✅

---

## Kapsam Dışı
- Oyuncunun kendi evliliği/çocuğu/emekliliği (Spec C); `player_romance_<npc>` bayrağını **set eden** romantizm-arc (C; B yalnız okur).
- Prosedürel/rastgele yaşam.
- Save/load persist'i.
- Spawned çocukların kendi reşit-olma olayları (ileride; şimdilik flavor, A yaşlanmasıyla evre değiştirir).
