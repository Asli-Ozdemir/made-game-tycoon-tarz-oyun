# Yaşlanma & Yaşam-Olayı Çerçevesi (Çekirdek / Spec A): Tasarım Dokümanı

**Tarih:** 2026-05-31
**Kapsam:** "Tam yaşam simülasyonu"nun **çekirdeği** — NPC/oyuncu yaşlanması + bildirimsel yaşam-olayı (life-event) motoru + yıllık tetik + ~30 yıl emeklilik kancası. Sonraki katmanlar bunun üstüne **veri** olarak biner.

## Dekompozisyon (üç alt-sistem)

- **A — Çekirdek (bu spec):** yaş modeli, yaşam evreleri, bildirimsel life-event motoru, yıllık kanca, örnek olaylar (Tomas reşit, emeklilik), oyuncu hafif yaşlanması, `arcEnd` bayrağı.
- **B — NPC yaşam olayları (sonraki spec):** reşit olma/kariyer, çift olma/evlilik, doğum (spawn), hastalık/ölüm (retire), miras/devir — hepsi A'nın framework'üne **veri** olarak eklenir.
- **C — Oyuncunun hayatı & final (sonraki spec):** emeklilik/final içeriği, oyuncu romantizm→evlilik→çocuk, miras/legacy.

Bağlam: NPC kadrosu ve diyalog sistemi [NPC Etkileşim & Felsefe spec'inde](2026-05-30-npc-etkilesim-felsefe-design.md). Yaşlanma o NPC'lere yaş + yaşam olayları ekler; reşit olma `employeeStore`'a bağlanır.

---

## Genel Bakış

Oyun ~30 yıllık bir yaşam/kariyer arc'ıdır (sonra sandbox). Yıllar geçtikçe NPC'ler ve oyuncu yaşlanır; belirli yaş/evre/yıl eşiklerinde **yaşam olayları** tetiklenir (çocuk büyür ve işe alınabilir olur, biri evlenir, biri ölür, oyuncu emekli olur). Çekirdek, bu olayları **bildirimsel** (veri olarak tanımlanan) bir motorla işler; B ve C yalnızca olay verisi ekler, motor değişmez.

---

## Zaman & Yaş Modeli

- **Makro saat:** `timeStore.date.year` (başlangıç 2000). Yıl, hafta→sezon→yıl ilerlemesiyle artar (`timeEngine.advanceWeek`).
- **NPC yaşı:** Her `NpcDef`'e `birthYear: number` eklenir. `getAge(npcId) = currentYear − birthYear`. (Mevcut NPC'lere başlangıç yaşlarına göre `birthYear` atanır; ör. başlangıç yılı 2000, Tomas 16 → `birthYear: 1984`.)
- **Oyuncu yaşı:** `characterStore`'a `birthYear` eklenir; oyun başında oyuncu ~35 kabul edilir → `birthYear = başlangıçYılı − 35`. `getPlayerAge()`.
- **`yearsElapsed` = currentYear − başlangıçYılı.** (Emeklilik/oyuncu yaşlanması bununla ölçülür; başlangıç yılına bağımlı değil.)

### Yaşam Evreleri (`LifeStage`)
| Evre | Yaş |
|------|-----|
| `cocuk` | 0–12 |
| `ergen` | 13–17 |
| `genc_yetiskin` | 18–29 |
| `yetiskin` | 30–59 |
| `yasli` | 60+ |

`getStage(npcId)` yaşı evreye eşler. Evre **geçişleri** (örn. ergen→genç yetişkin) olay tetikleyebilir.

---

## State: `lifeStore` (yeni)

```ts
interface LifeStore {
  lastProcessedYear: number          // olayları yılda bir kez işlemek için
  firedEvents:       Set<string>     // once olayların id'leri
  flags:             Set<string>     // dünya bayrakları (örn. 'arcEnd')
  roles:             Record<string, ('hireable' | 'romanceable')[]>  // NPC'ye açılan roller

  advanceYear: (year: number) => void   // yıl değişiminde çağrılır → motoru koşturur
  hasFlag:     (flag: string) => boolean
  hasRole:     (npcId: string, role: 'hireable' | 'romanceable') => boolean
  reset:       () => void
}
```

- `getAge`/`getStage`/`getPlayerAge` saf yardımcılar (`timeStore` + `birthYear`'dan türer; `src/engine/aging.ts`).
- `advanceYear(year)`: `year > lastProcessedYear` ise, aradaki her yıl için motoru çalıştırır (atlanan yıl olmasın), sonra `lastProcessedYear = year`.

### Yıllık Kanca
`Dashboard.tsx`'teki yıl-değişim `useEffect`'i (şu an `rivalStore.simulateYear(year)` çağrılan yer) → ek olarak `useLifeStore.getState().advanceYear(year)` çağrılır.

---

## Yaşam-Olayı Framework (bildirimsel)

`src/types/lifeEvent.ts`:

```ts
import type { CutsceneId } from '@/types/cutscene'
import type { NpcDef } from '@/data/npcs'

export type LifeStage = 'cocuk' | 'ergen' | 'genc_yetiskin' | 'yetiskin' | 'yasli'

export interface LifeCtx {
  year:        number
  yearsElapsed: number
  getAge:      (npcId: string) => number
  getStage:    (npcId: string) => LifeStage
  hasFlag:     (flag: string) => boolean
  heartOf:     (npcId: string) => number   // npcStore'dan
}

export type LifeTrigger =
  | { kind: 'npcAge';      npcId: string; age: number }
  | { kind: 'npcStage';    npcId: string; stage: LifeStage }
  | { kind: 'year';        year: number }
  | { kind: 'yearsElapsed'; years: number }
  | { kind: 'condition';   test: (ctx: LifeCtx) => boolean }

export type LifeEffect =
  | { kind: 'unlockRole';      npcId: string; role: 'hireable' | 'romanceable' }
  | { kind: 'setDialogueNode'; npcId: string; node: string }
  | { kind: 'cutscene';        id: CutsceneId }
  | { kind: 'spawnNpc';        def: NpcDef }
  | { kind: 'retireNpc';       npcId: string; reason?: string }
  | { kind: 'setFlag';         flag: string }

export interface LifeEvent {
  id:      string
  once?:   boolean            // varsayılan true
  trigger: LifeTrigger
  effect:  LifeEffect
}
```

### Motor: `src/engine/lifeEventEngine.ts`
```ts
// Belirli bir yıl için: tetikleyicisi sağlanan ve (once ise) henüz tetiklenmemiş
// olayları döndürür. Saf fonksiyon (uygulamayı lifeStore yapar).
export function eventsForYear(events: LifeEvent[], ctx: LifeCtx, fired: Set<string>): LifeEvent[]
```
- `lifeStore.advanceYear` → her atlanan yıl için `ctx` kur → `eventsForYear` → her olayın `effect`'ini uygula → `firedEvents`'e ekle.
- Tetikleyici değerlendirme: `npcAge`→`getAge===age`; `npcStage`→`getStage===stage`; `year`→`ctx.year===year`; `yearsElapsed`→`ctx.yearsElapsed===years`; `condition`→`test(ctx)`.

---

## Etki Entegrasyonu

| Etki | Bağlandığı yer |
|------|----------------|
| `unlockRole hireable` | `lifeStore.roles`'e eklenir + NpcDef'ten bir `Employee` adayı üretilip `employeeStore.candidates`'e enjekte edilir (özel "yerel aday"). |
| `unlockRole romanceable` | `lifeStore.roles`'e flag; Spec B romantizm-arc'ı okur. |
| `setDialogueNode` | `npcStore` o NPC için farklı Yarn başlangıç düğümü kullanır (çocuk→yetişkin sesi). NpcDef/`npcStore`'da `dialogueNodeOverride` tutulur. |
| `cutscene` | `useCutsceneStore.getState().startCutsceneForce(id)` |
| `spawnNpc` | Runtime NPC listesine eklenir (npcStore + dünya çizimi); B (doğum) kullanır. |
| `retireNpc` | NPC dünyadan kaldırılır/"gitti" işaretlenir; B (ölüm/taşınma) kullanır. |
| `setFlag` | `lifeStore.flags`'e eklenir. |

> `spawnNpc`/`retireNpc` etki **türleri** çekirdekte tanımlı ve çalışır; bunları **kullanan içerik** (doğum/ölüm) Spec B'dedir.

---

## Çekirdekteki Örnek Olaylar (motoru kanıtlar)

`src/data/lifeEvents.ts`:
- **`tomas_resit`** — `{ trigger:{kind:'npcStage', npcId:'tomas', stage:'genc_yetiskin'}, effect:{kind:'unlockRole', npcId:'tomas', role:'hireable'} }`
- **`tomas_yetiskin_diyalog`** — `{ trigger:{kind:'npcStage', npcId:'tomas', stage:'genc_yetiskin'}, effect:{kind:'setDialogueNode', npcId:'tomas', node:'AdultStart'} }`
- **`emeklilik`** — `{ trigger:{kind:'yearsElapsed', years:30}, effect:{kind:'setFlag', flag:'arcEnd'} }`

`arcEnd` bayrağı emeklilik/final kancasıdır (içeriği Spec C). Sandbox `arcEnd` sonrası devam eder (zorunlu son yok).

---

## Oyuncu Yaşlanması (karma-hafif)

- Yaş izlenir (`getPlayerAge`), çoğunlukla anlatısal.
- **Yalnızca son evrede mekanik:** `yearsElapsed ≥ 25` olunca her yıl küçük bir günlük-aktivite/enerji düşüşü (örn. kademeli, yıl başına ~%10; tasarımda sabit bir tablo). Oyuncuyu doğal olarak emekliliğe yaklaştırır; ezici değil.
- Bu, `dayTimeStore`/aktivite kapasitesine küçük bir çarpan olarak uygulanır (kesin formül planda).

---

## Test Stratejisi

- `aging.ts`: `getAge`/`getStage` yıl + birthYear'dan doğru türetir; evre bantları sınırları (12/13, 17/18, 59/60) doğru.
- `lifeEventEngine.eventsForYear`: her tetikleyici türü doğru eşleşir; `once` olaylar `fired`'deyse dönmez; `condition` testi `ctx` okur.
- `lifeStore.advanceYear`: atlanan yılları işler (year sıçraması), olayları bir kez tetikler, `lastProcessedYear` günceller; `reset` temizler.
- Örnek olaylar: Tomas genç yetişkin olunca `hireable` rolü + `employeeStore.candidates`'te belirir; `yearsElapsed 30` → `arcEnd` flag bir kez.
- Oyuncu yaşlanma: `yearsElapsed<25` iken çarpan 1.0; ≥25'te kademeli düşüş.

## Kapsam Dışı (A)
- Evlilik/doğum/ölüm/miras **içerik** olayları (B — framework'e veri).
- Emeklilik/final **içeriği**, oyuncu ailesi/legacy (C).
- Save/load'da `lifeStore` (yaş türetildiği için çoğu state'siz; `firedEvents`/`flags`/`roles` persist'i save sistemi geldiğinde).
- Gezen/zamanlı NPC programları (Spec A — NPC sistemi kapsamıydı, sabit; gezme ileri faz).
