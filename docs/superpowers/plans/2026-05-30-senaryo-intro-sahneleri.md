# Senaryo Giriş Sahneleri (Kovulma Varyantları + İlk Yayın) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faz 4B cutscene altyapısının `[PLACEHOLDER]` diyaloglarını gerçek senaryoyla değiştir; kovulma sahnesini arkaplana özgü 5 varyanta (her biri 4 frame) çıkar, ilk yayın sahnesini yalnız/kişisel hâle getir.

**Architecture:** `CutsceneDef`'e opsiyonel `variants: Record<BackgroundId, CutsceneFrame[]>` eklenir. Yeni bir saf fonksiyon `getCutsceneFrames(id, background)` aktif frame dizisini çözer (varyant varsa arkaplana göre seçer, yoksa `frames`). Store ve player bu resolver'ı kullanır; böylece varyant mantığı tek yerde kalır. İki yeni CSS arka planı (`court`, `coast`) eklenir.

**Tech Stack:** TypeScript, React, Zustand, Vitest, Vite. Diyalog dili Türkçe.

**Referans tasarım:** `docs/superpowers/specs/2026-05-30-senaryo-intro-sahneleri-design.md` (tüm diyalogların kaynağı ve gerekçesi).

**Önemli not (tip kapısı):** Vitest esbuild ile çalışır ve proje çapında tip denetimi yapmaz; her test dosyası yalnız import ettiği modülleri derler. Tek tutarlı tip kapısı `npm run build` (tsc) olduğundan, ara görevlerde hedefli vitest dosyaları yeşil olsa da nihai tip doğrulaması **Task 5**'te yapılır.

---

## Dosya Yapısı

| Dosya | Sorumluluk | İşlem |
|-------|-----------|-------|
| `src/types/cutscene.ts` | Cutscene tip tanımları | Modify — `court`/`coast` background, opsiyonel `frames`/`variants` |
| `src/data/cutscenes.ts` | Sahne verisi + frame resolver | Modify — gerçek içerik + `getCutsceneFrames` |
| `src/store/cutsceneStore.ts` | Cutscene akış state'i | Modify — resolver + arkaplan okuma |
| `src/components/CutscenePlayer.tsx` | Sahne render + typewriter | Modify — resolver + `court`/`coast` arka planları |
| `tests/data/cutscenes.test.ts` | Veri testleri | Modify — varyant yapısı |
| `tests/store/cutsceneStore.test.ts` | Store testleri | Modify — varyant + arkaplan |

`src/App.tsx`, `src/components/CharacterCreationWizard.tsx`, `src/components/Dashboard.tsx` **değişmez** — `startCutscene('kovulma')` zaten wizard `finalize`'dan sonra çağrılıyor ve o noktada `characterStore.background` set edilmiş durumda.

---

### Task 1: Tipleri genişlet (court/coast + variants)

**Files:**
- Modify: `src/types/cutscene.ts`

- [ ] **Step 1: `src/types/cutscene.ts` dosyasının tamamını aşağıdakiyle değiştir**

```ts
import type { BackgroundId } from '@/data/backgrounds'

export interface DialogLine {
  speaker: string  // "İK Müdürü", "Patron", "Yeni CEO", "Kurul Başkanı", "Eş", "Hâkim", "{{playerName}}"
  text:    string  // {{playerName}} ve {{studioName}} placeholder destekler
}

export interface CutsceneFrame {
  background: 'office' | 'bedroom' | 'court' | 'coast' | 'studio'
  lines:      DialogLine[]
}

export type CutsceneId = 'kovulma' | 'ilk_yayin'

export interface CutsceneDef {
  id:        CutsceneId
  frames?:   CutsceneFrame[]                          // varyantsız sahneler (ilk_yayin)
  variants?: Record<BackgroundId, CutsceneFrame[]>    // arkaplana özgü sahneler (kovulma)
}
```

- [ ] **Step 2: Tip dosyasının izole derlendiğini doğrula**

Run: `npx tsc --noEmit src/types/cutscene.ts 2>&1 | head -5`
Expected: Bu dosyaya ait sözdizimi/çözümleme hatası YOK. (Not: tek dosya derlemesi path-alias `@/` çözememe uyarısı verebilir; bu beklenir ve Task 5'teki tam `npm run build` gerçek kapıdır. Bu adımda yalnızca yazım hatası olmadığını teyit et.)

> Bu görev tek başına commit edilmez; veri katmanıyla (Task 2) birlikte anlam kazanır. Commit Task 2 sonunda yapılır.

---

### Task 2: Veri + resolver (gerçek senaryo içeriği)

**Files:**
- Modify: `src/data/cutscenes.ts`
- Test: `tests/data/cutscenes.test.ts`

- [ ] **Step 1: `tests/data/cutscenes.test.ts` dosyasının tamamını aşağıdakiyle değiştir (önce test)**

```ts
import { describe, it, expect } from 'vitest'
import { CUTSCENES, getCutsceneFrames } from '@/data/cutscenes'
import { BACKGROUNDS } from '@/data/backgrounds'
import type { CutsceneFrame } from '@/types/cutscene'

const VALID_BG = new Set(['office', 'bedroom', 'court', 'coast', 'studio'])

function assertFramesValid(frames: CutsceneFrame[]) {
  expect(frames.length).toBeGreaterThan(0)
  for (const frame of frames) {
    expect(VALID_BG.has(frame.background)).toBe(true)
    expect(frame.lines.length).toBeGreaterThan(0)
    for (const line of frame.lines) {
      expect(line.speaker.trim()).not.toBe('')
      expect(line.text.trim()).not.toBe('')
    }
  }
}

describe('cutscenes verisi', () => {
  it('kovulma sahnesi her BackgroundId için bir varyanta sahip', () => {
    const variants = CUTSCENES.kovulma.variants
    expect(variants).toBeDefined()
    for (const bg of BACKGROUNDS) {
      expect(variants![bg.id]).toBeDefined()
    }
  })

  it('her kovulma varyantı tam 4 frame içerir', () => {
    for (const bg of BACKGROUNDS) {
      const frames = getCutsceneFrames('kovulma', bg.id)
      expect(frames.length).toBe(4)
    }
  })

  it('her kovulma varyantı geçerli ve dolu', () => {
    for (const bg of BACKGROUNDS) {
      assertFramesValid(getCutsceneFrames('kovulma', bg.id))
    }
  })

  it('ilk_yayin sahnesi frames kullanır ve geçerli', () => {
    expect(CUTSCENES.ilk_yayin.frames).toBeDefined()
    assertFramesValid(getCutsceneFrames('ilk_yayin', null))
  })

  it('getCutsceneFrames null arkaplanla kovulma için fallback döndürür', () => {
    const frames = getCutsceneFrames('kovulma', null)
    expect(frames.length).toBe(4)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

Run: `npx vitest run tests/data/cutscenes.test.ts`
Expected: FAIL — `getCutsceneFrames` export edilmemiş / `variants` tanımsız.

- [ ] **Step 3: `src/data/cutscenes.ts` dosyasının tamamını aşağıdakiyle değiştir**

```ts
import type { BackgroundId } from '@/data/backgrounds'
import type { CutsceneId, CutsceneDef, CutsceneFrame } from '@/types/cutscene'

export const CUTSCENES: Record<CutsceneId, CutsceneDef> = {
  kovulma: {
    id: 'kovulma',
    variants: {
      kk_uzmani: [
        {
          background: 'office',
          lines: [
            { speaker: 'İK Müdürü',     text: 'Otur, {{playerName}}. Uzun tutmayacağım.' },
            { speaker: '{{playerName}}', text: 'Ayakta kalırım. Alışkınım.' },
            { speaker: 'İK Müdürü',     text: 'Kalite kontrol süreçlerini otomasyona geçiriyoruz. Yeni sistem hataları senden hızlı buluyor.' },
            { speaker: '{{playerName}}', text: 'O sistem on yıl önce benim yazdığım test kılavuzuyla eğitildi.' },
            { speaker: 'İK Müdürü',     text: 'Karar yukarıdan geldi.' },
            { speaker: '{{playerName}}', text: 'On yıl be, on yıl. Hepsini tek bir kutuya mı sığdırayım?' },
            { speaker: 'İK Müdürü',     text: 'Tazminatını muhasebeden alabilirsin.' },
          ],
        },
        {
          background: 'bedroom',
          lines: [
            { speaker: 'Eş',             text: 'Kolileri gördüm. Demek gerçek oldu.' },
            { speaker: '{{playerName}}', text: '"Otomasyon" dediler.' },
            { speaker: 'Eş',             text: 'Hep iş, hep ekran. Eve geldiğinde bile burada değildin.' },
            { speaker: '{{playerName}}', text: 'O işi bizim için yapıyordum.' },
            { speaker: 'Eş',             text: 'Hayır, kendin için. Ben yıllardır bu evde yalnızım.' },
            { speaker: 'Eş',             text: '...Başka biri var, {{playerName}}.' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: '{{playerName}}', text: 'Evi satıp ikiye bölelim. Anlaşmalı bitirelim, uzatmayalım.' },
            { speaker: 'Eş',             text: 'Seni bir daha görmek istemiyorum.' },
          ],
        },
        {
          background: 'court',
          lines: [
            { speaker: 'Hâkim',          text: 'Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.' },
            { speaker: '{{playerName}}', text: '...' },
          ],
        },
        {
          background: 'coast',
          lines: [
            { speaker: '{{playerName}}', text: 'Annemlerin evi. Anahtar hâlâ saksının altında.' },
            { speaker: '{{playerName}}', text: 'Tuz ve toz kokuyor. Kimse yok. Sadece ben.' },
            { speaker: '{{playerName}}', text: 'Annem derdi ki: "Bir gün oturur, kendi işini kurarsın."' },
            { speaker: '{{playerName}}', text: 'Belki de zamanı geldi.' },
            { speaker: '{{playerName}}', text: '{{studioName}}.' },
          ],
        },
      ],
      yaratici_direktor: [
        {
          background: 'office',
          lines: [
            { speaker: 'Patron',         text: 'Oyun rekor kırdı, {{playerName}}. Bütün ekip gurur duymalı.' },
            { speaker: '{{playerName}}', text: 'Jenerik akarken adımı aradım. Yoktu.' },
            { speaker: 'Patron',         text: 'Fikir bir ekip işidir. Telifi şirkette kalır.' },
            { speaker: '{{playerName}}', text: 'O konsepti gece üçte, kendi masamda çizdim. Tek başıma.' },
            { speaker: 'Patron',         text: 'Fikirler şirkete aittir. Sen de öyleydin.' },
            { speaker: '{{playerName}}', text: 'Demek imzamı silip beni de siliyorsunuz.' },
            { speaker: 'Patron',         text: 'Eşyalarını topla. Güvenlik aşağıda bekliyor.' },
          ],
        },
        {
          background: 'bedroom',
          lines: [
            { speaker: 'Eş',             text: 'Yine mi kovuldun? Yoksa yine mi "prensip" meselesi?' },
            { speaker: '{{playerName}}', text: 'Eserimi çaldılar. Adımı bile koymadılar.' },
            { speaker: 'Eş',             text: 'Sen de hep o eserler için yaşadın. Bizim tablomuz hep yarım kaldı.' },
            { speaker: '{{playerName}}', text: 'Sanat böyledir, bedeli olur.' },
            { speaker: 'Eş',             text: 'Bedelini hep ben ödedim. Yalnızlığı ben taşıdım.' },
            { speaker: 'Eş',             text: '...Başka biri var. Beni gören biri.' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: '{{playerName}}', text: 'Atölyeyi satıp ikiye bölelim. Anlaşmalı bitirelim.' },
            { speaker: 'Eş',             text: 'Bu sefer kendine bir imza bul. Çünkü beni bulamayacaksın.' },
          ],
        },
        {
          background: 'court',
          lines: [
            { speaker: 'Hâkim',          text: 'Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.' },
            { speaker: '{{playerName}}', text: '...' },
          ],
        },
        {
          background: 'coast',
          lines: [
            { speaker: '{{playerName}}', text: 'Babamın evi. Duvarda hâlâ çocukken yaptığım resimler.' },
            { speaker: '{{playerName}}', text: 'Boyalar kurumuş, ama duruyor. Kimse silmemiş.' },
            { speaker: '{{playerName}}', text: 'Burada hiçbir fikir çalınmadı.' },
            { speaker: '{{playerName}}', text: 'Bu sefer jenerikte tek bir isim olacak.' },
            { speaker: '{{playerName}}', text: '{{studioName}}.' },
          ],
        },
      ],
      bas_muhendis: [
        {
          background: 'office',
          lines: [
            { speaker: 'Patron',         text: 'Proje battı, {{playerName}}. Yatırımcılar bir isim istiyor.' },
            { speaker: '{{playerName}}', text: 'Tarihi üç ay öne siz çektiniz. Ekibi yarıya siz indirdiniz.' },
            { speaker: 'Patron',         text: 'Teknik taraf senin sorumluluğundaydı.' },
            { speaker: '{{playerName}}', text: 'Uyardım. Her toplantıda, yazılı olarak uyardım.' },
            { speaker: 'Patron',         text: 'O mailleri kimse hatırlamayacak. Sadece batan projeyi hatırlayacaklar.' },
            { speaker: '{{playerName}}', text: 'Yani günah keçisi ben oluyorum.' },
            { speaker: 'Patron',         text: 'Çıkışın hazır. Kimseye veda etme, sessizce git.' },
          ],
        },
        {
          background: 'bedroom',
          lines: [
            { speaker: 'Eş',             text: 'Çantanı toplamışsın. Demek bu sefer gerçekten bitti.' },
            { speaker: '{{playerName}}', text: 'Batan geminin faturasını bana kestiler.' },
            { speaker: 'Eş',             text: 'Eve hep işi getirdin. Şimdi de suçu getiriyorsun.' },
            { speaker: '{{playerName}}', text: 'Suç benim değildi.' },
            { speaker: 'Eş',             text: 'Biliyorum. Ama haklı olman beni daha az yalnız bırakmadı.' },
            { speaker: 'Eş',             text: '...Başka biri var. Geceleri yanımda olan biri.' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: '{{playerName}}', text: 'Evi satıp ikiye bölelim. Anlaşmalı bitirelim, uzatmayalım.' },
            { speaker: 'Eş',             text: 'Bu sefer batarsan, yanında ben olmayacağım.' },
          ],
        },
        {
          background: 'court',
          lines: [
            { speaker: 'Hâkim',          text: 'Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.' },
            { speaker: '{{playerName}}', text: '...' },
          ],
        },
        {
          background: 'coast',
          lines: [
            { speaker: '{{playerName}}', text: 'Babamın evi. Garajda eski bilgisayarım hâlâ duruyor.' },
            { speaker: '{{playerName}}', text: 'Fişi taktım. Çalışıyor. İnatçı, tıpkı sahibi gibi.' },
            { speaker: '{{playerName}}', text: 'Bu sefer her satır kodun altında benim adım olacak.' },
            { speaker: '{{playerName}}', text: 'Batarsa, gerçekten benim hatam olur. İyi.' },
            { speaker: '{{playerName}}', text: '{{studioName}}.' },
          ],
        },
      ],
      yapimci: [
        {
          background: 'office',
          lines: [
            { speaker: 'Yeni CEO',       text: 'Şirkete yeni bir yön çiziyorum, {{playerName}}. Yeni bir kültür.' },
            { speaker: '{{playerName}}', text: 'On iki yıldır bu kültürü kuran bendim.' },
            { speaker: 'Yeni CEO',       text: 'Açıkçası... bu yeni vizyonla pek uyumlu görünmüyorsun.' },
            { speaker: '{{playerName}}', text: '"Uyum" derken, hangi sözleşmenin nereye gittiğini bilmemi mi kastediyorsun?' },
            { speaker: 'Yeni CEO',       text: 'Çok şey biliyorsun. Sorun da tam olarak bu.' },
            { speaker: '{{playerName}}', text: 'Yani bildiklerim yüzünden gidiyorum.' },
            { speaker: 'Yeni CEO',       text: 'Tazminatın cömert olacak. Karşılığında sessizliğini bekliyoruz.' },
          ],
        },
        {
          background: 'bedroom',
          lines: [
            { speaker: 'Eş',             text: 'Komşulara ne diyeceğiz? Daireyi, arabayı, okulları...' },
            { speaker: '{{playerName}}', text: 'Hepsi o işe bağlıydı. O iş de bitti.' },
            { speaker: 'Eş',             text: 'Bu hayatı sen seçtin. Bu çevreyi, bu tempoyu. Ben sadece uydum.' },
            { speaker: '{{playerName}}', text: 'Sana iyi bir hayat kurdum.' },
            { speaker: 'Eş',             text: 'Bana hayat kurdun ama içinde sen hiç yoktun.' },
            { speaker: 'Eş',             text: '...Başka biri var. Akşamları eve gelen biri.' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: '{{playerName}}', text: 'Daireyi satıp ikiye bölelim. Anlaşmalı bitirelim, uzatmayalım.' },
            { speaker: 'Eş',             text: 'Aileme bunu açıklamak, sana açıklamaktan kolay olacak.' },
          ],
        },
        {
          background: 'court',
          lines: [
            { speaker: 'Hâkim',          text: 'Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.' },
            { speaker: '{{playerName}}', text: '...' },
          ],
        },
        {
          background: 'coast',
          lines: [
            { speaker: '{{playerName}}', text: 'Annemlerin evi. Küçükken buradan kaçmak için can atardım.' },
            { speaker: '{{playerName}}', text: 'Şimdi tek sığınağım burası. Tuhaf.' },
            { speaker: '{{playerName}}', text: 'Kimse beni izlemiyor. İlk kez kimseye hesap vermiyorum.' },
            { speaker: '{{playerName}}', text: 'Bildiğim her şey hâlâ kafamda. Ve artık benim.' },
            { speaker: '{{playerName}}', text: '{{studioName}}.' },
          ],
        },
      ],
      eski_ceo: [
        {
          background: 'office',
          lines: [
            { speaker: 'Kurul Başkanı',  text: 'Hisse iki çeyrektir düşüşte, {{playerName}}. Yatırımcılar bir kurban istiyor.' },
            { speaker: '{{playerName}}', text: 'Bu şirketi ben kurdum. Sıfırdan, kendi ellerimle.' },
            { speaker: 'Kurul Başkanı',  text: 'Ve bugün kurul, gitmen yönünde oy kullandı.' },
            { speaker: '{{playerName}}', text: 'Kaç kişi? Yıllarca yanımda oturanlardan kaçı?' },
            { speaker: 'Kurul Başkanı',  text: 'Oybirliği. Şirket artık senden büyük.' },
            { speaker: '{{playerName}}', text: 'Şirketi ben büyüttüm. Beni de o yüzden gömüyorsunuz.' },
            { speaker: 'Kurul Başkanı',  text: 'Basın açıklaması saat beşte çıkıyor. Kapıda araba bekliyor.' },
          ],
        },
        {
          background: 'bedroom',
          lines: [
            { speaker: 'Eş',             text: 'Telefonum susmuyor. Herkes "geçmiş olsun" diyor, ama gözleri gülüyor.' },
            { speaker: '{{playerName}}', text: 'Geçer. Manşetler hep geçer.' },
            { speaker: 'Eş',             text: 'Manşetlerde senin adın. Ama hep benimki de yanında.' },
            { speaker: '{{playerName}}', text: 'Buna katlanmayı biliyoruz. Birlikte atlattık daha kötülerini.' },
            { speaker: 'Eş',             text: 'Hayır, sen atlattın. Ben hep arka planda durdum.' },
            { speaker: 'Eş',             text: '...Başka biri var. Beni manşet değil, insan olarak gören biri.' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: '{{playerName}}', text: 'Villayı satıp ikiye bölelim. Anlaşmalı bitirelim, basına yem olmayalım.' },
            { speaker: 'Eş',             text: 'Seni bir daha görmek istemiyorum. Hele gazetede hiç.' },
          ],
        },
        {
          background: 'court',
          lines: [
            { speaker: 'Hâkim',          text: 'Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.' },
            { speaker: '{{playerName}}', text: '...' },
          ],
        },
        {
          background: 'coast',
          lines: [
            { speaker: '{{playerName}}', text: 'Babamın evi. Bir zamanlar bana küçük gelirdi.' },
            { speaker: '{{playerName}}', text: 'Şimdi tam. Tam da olması gerektiği kadar.' },
            { speaker: '{{playerName}}', text: 'Beni gömdüklerini sanıyorlar. Mezar taşımı bile yazdılar.' },
            { speaker: '{{playerName}}', text: 'Bir dahaki sefere manşetleri ben yazacağım.' },
            { speaker: '{{playerName}}', text: '{{studioName}}.' },
          ],
        },
      ],
    },
  },
  ilk_yayin: {
    id: 'ilk_yayin',
    frames: [
      {
        background: 'studio',
        lines: [
          { speaker: '{{playerName}}', text: 'Gece yarısını geçti. "Yayınla" tuşu hâlâ ekranda, parlıyor.' },
          { speaker: '{{playerName}}', text: 'Eskiden bu an için bir toplantı odası dolusu insan olurdu. Pasta, alkış, fotoğraf.' },
          { speaker: '{{playerName}}', text: 'Şimdi sadece ben varım. Bir de dışarıda dalga sesi.' },
          { speaker: '{{playerName}}', text: '...Basayım mı?' },
        ],
      },
      {
        background: 'studio',
        lines: [
          { speaker: '{{playerName}}', text: '{{studioName}}. İlk oyun. Yayında.' },
          { speaker: '{{playerName}}', text: 'Kimse alkışlamıyor. İlk kez canımı yakmıyor bu.' },
          { speaker: '{{playerName}}', text: 'Çünkü bu sefer jenerikte tek bir isim var. Benimki.' },
          { speaker: '{{playerName}}', text: 'Yorgunum. Ama bu yorgunluk, ilk kez tamamen bana ait.' },
        ],
      },
    ],
  },
}

/**
 * Aktif sahnenin frame dizisini çözer.
 * variants varsa arkaplana göre seçer; yoksa frames döndürür.
 * background null ise (beklenmeyen durum) ilk varyanta (kk_uzmani) düşer.
 */
export function getCutsceneFrames(id: CutsceneId, background: BackgroundId | null): CutsceneFrame[] {
  const def = CUTSCENES[id]
  if (def.variants) {
    return def.variants[background ?? 'kk_uzmani']
  }
  return def.frames ?? []
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini doğrula**

Run: `npx vitest run tests/data/cutscenes.test.ts`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add src/types/cutscene.ts src/data/cutscenes.ts tests/data/cutscenes.test.ts
git commit -m "feat: senaryo verisi — kovulma 5 varyant + ilk yayın, getCutsceneFrames resolver"
```

---

### Task 3: Store'u resolver'a bağla

**Files:**
- Modify: `src/store/cutsceneStore.ts`
- Test: `tests/store/cutsceneStore.test.ts`

- [ ] **Step 1: `tests/store/cutsceneStore.test.ts` dosyasının tamamını aşağıdakiyle değiştir (önce test)**

```ts
// tests/store/cutsceneStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useCharacterStore } from '@/store/characterStore'
import { getCutsceneFrames } from '@/data/cutscenes'

function resetAll() {
  useCutsceneStore.setState({
    activeCutscene:  null,
    frameIndex:      0,
    lineIndex:       0,
    displayedText:   '',
    isTyping:        false,
    isTransitioning: false,
    isEnding:        false,
    seenCutscenes:   new Set(),
  })
  useDayTimeStore.getState().reset()
  // Kovulma varyant seçimi için aktif arkaplan gerekir
  useCharacterStore.setState({ background: 'kk_uzmani' })
}

beforeEach(resetAll)

const KK_FRAMES = () => getCutsceneFrames('kovulma', 'kk_uzmani')

describe('cutsceneStore', () => {
  it('başlangıç state\'i doğru', () => {
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBeNull()
    expect(s.frameIndex).toBe(0)
    expect(s.lineIndex).toBe(0)
    expect(s.displayedText).toBe('')
    expect(s.isTyping).toBe(false)
    expect(s.isTransitioning).toBe(false)
    expect(s.isEnding).toBe(false)
    expect(s.seenCutscenes.size).toBe(0)
  })

  it('startCutscene sahneyi başlatır ve index\'leri sıfırlar', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBe('kovulma')
    expect(s.frameIndex).toBe(0)
    expect(s.lineIndex).toBe(0)
    expect(s.displayedText).toBe('')
    expect(s.isTyping).toBe(true)
  })

  it('startCutscene oyunu duraklatır', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    expect(useDayTimeStore.getState().isPaused).toBe(true)
  })

  it('startCutscene seenCutscenes\'te varsa hiçbir şey yapmaz', () => {
    useCutsceneStore.setState({ seenCutscenes: new Set(['kovulma']) })
    useCutsceneStore.getState().startCutscene('kovulma')
    expect(useCutsceneStore.getState().activeCutscene).toBeNull()
  })

  it('advance — isTyping true\'yken finishTyping çağırır', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ displayedText: 'kısa', isTyping: true })
    useCutsceneStore.getState().advance()
    const s = useCutsceneStore.getState()
    expect(s.isTyping).toBe(false)
    expect(s.displayedText).not.toBe('kısa')
  })

  it('advance — sonraki satıra geçer', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ isTyping: false })
    useCutsceneStore.getState().advance()
    const s = useCutsceneStore.getState()
    expect(s.lineIndex).toBe(1)
    expect(s.displayedText).toBe('')
    expect(s.isTyping).toBe(true)
  })

  it('advance — frame\'in son satırında frame geçişini başlatır', () => {
    const frames = KK_FRAMES()
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ frameIndex: 0, lineIndex: frames[0].lines.length - 1, isTyping: false })
    useCutsceneStore.getState().advance()
    expect(useCutsceneStore.getState().isTransitioning).toBe(true)
    expect(useCutsceneStore.getState().frameIndex).toBe(0)
  })

  it('nextFrame — frameIndex\'i artırır ve isTransitioning\'i temizler', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ isTransitioning: true })
    useCutsceneStore.getState().nextFrame()
    const s = useCutsceneStore.getState()
    expect(s.frameIndex).toBe(1)
    expect(s.lineIndex).toBe(0)
    expect(s.isTransitioning).toBe(false)
    expect(s.isTyping).toBe(true)
    expect(s.displayedText).toBe('')
  })

  it('advance — son frame\'in son satırında isEnding\'i set eder', () => {
    const frames = KK_FRAMES()
    const last = frames.length - 1
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ frameIndex: last, lineIndex: frames[last].lines.length - 1, isTyping: false })
    useCutsceneStore.getState().advance()
    expect(useCutsceneStore.getState().isEnding).toBe(true)
    expect(useCutsceneStore.getState().activeCutscene).toBe('kovulma')
  })

  it('endCutscene — sahneyi kapatır ve seenCutscenes\'e ekler', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ isEnding: true })
    useCutsceneStore.getState().endCutscene()
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBeNull()
    expect(s.seenCutscenes.has('kovulma')).toBe(true)
    expect(s.isEnding).toBe(false)
    expect(useDayTimeStore.getState().isPaused).toBe(false)
  })

  it('skip — sahneyi kapatır, seenCutscenes\'e ekler, oyunu devam ettirir', () => {
    useCutsceneStore.getState().startCutscene('ilk_yayin')
    useCutsceneStore.getState().skip()
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBeNull()
    expect(s.seenCutscenes.has('ilk_yayin')).toBe(true)
    expect(useDayTimeStore.getState().isPaused).toBe(false)
  })

  it('reset — tüm state\'i ve seenCutscenes\'i temizler', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.getState().skip()
    useCutsceneStore.getState().reset()
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBeNull()
    expect(s.seenCutscenes.size).toBe(0)
    expect(s.frameIndex).toBe(0)
    expect(s.lineIndex).toBe(0)
  })

  it('tick — displayedText\'e karakter ekler', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.getState().tick('M')
    useCutsceneStore.getState().tick('e')
    useCutsceneStore.getState().tick('r')
    expect(useCutsceneStore.getState().displayedText).toBe('Mer')
  })

  it('finishTyping — aktif varyantın ilk satırının tüm metnini gösterir', () => {
    const expected = KK_FRAMES()[0].lines[0].text
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.getState().finishTyping()
    const s = useCutsceneStore.getState()
    expect(s.displayedText).toBe(expected)
    expect(s.isTyping).toBe(false)
  })

  it('startCutscene aktif arkaplana göre doğru varyantı kullanır', () => {
    useCharacterStore.setState({ background: 'eski_ceo' })
    const expected = getCutsceneFrames('kovulma', 'eski_ceo')[0].lines[0].text
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.getState().finishTyping()
    expect(useCutsceneStore.getState().displayedText).toBe(expected)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

Run: `npx vitest run tests/store/cutsceneStore.test.ts`
Expected: FAIL — yeni varyant testi ve `finishTyping` beklenen metni eski placeholder ile uyuşmuyor / store hâlâ `CUTSCENES[...].frames`'e bakıyor.

- [ ] **Step 3: `src/store/cutsceneStore.ts` dosyasının tamamını aşağıdakiyle değiştir**

```ts
import { create } from 'zustand'
import { getCutsceneFrames } from '@/data/cutscenes'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useCharacterStore } from '@/store/characterStore'
import type { CutsceneId } from '@/types/cutscene'

interface CutsceneStore {
  activeCutscene:  CutsceneId | null
  frameIndex:      number
  lineIndex:       number
  displayedText:   string
  isTyping:        boolean
  isTransitioning: boolean
  isEnding:        boolean
  seenCutscenes:   Set<CutsceneId>

  startCutscene: (id: CutsceneId) => void
  advance:       () => void
  tick:          (char: string) => void
  finishTyping:  () => void
  nextFrame:     () => void
  endCutscene:   () => void
  skip:          () => void
  reset:         () => void
}

function activeFrames(id: CutsceneId) {
  return getCutsceneFrames(id, useCharacterStore.getState().background)
}

export const useCutsceneStore = create<CutsceneStore>((set, get) => ({
  activeCutscene:  null,
  frameIndex:      0,
  lineIndex:       0,
  displayedText:   '',
  isTyping:        false,
  isTransitioning: false,
  isEnding:        false,
  seenCutscenes:   new Set(),

  startCutscene: (id) => {
    if (get().seenCutscenes.has(id)) return
    set({ activeCutscene: id, frameIndex: 0, lineIndex: 0, displayedText: '', isTyping: true, isTransitioning: false, isEnding: false })
    useDayTimeStore.getState().setIsPaused(true)
  },

  advance: () => {
    const { activeCutscene, isTyping, frameIndex, lineIndex } = get()
    if (!activeCutscene) return

    if (isTyping) {
      get().finishTyping()
      return
    }

    const frames = activeFrames(activeCutscene)
    const currentFrame = frames[frameIndex]

    if (lineIndex < currentFrame.lines.length - 1) {
      set({ lineIndex: lineIndex + 1, displayedText: '', isTyping: true })
      return
    }

    if (frameIndex < frames.length - 1) {
      set({ isTransitioning: true })
      return
    }

    set({ isEnding: true })
  },

  tick: (char) => set((s) => ({ displayedText: s.displayedText + char })),

  finishTyping: () => {
    const { activeCutscene, frameIndex, lineIndex } = get()
    if (!activeCutscene) return
    const fullText = activeFrames(activeCutscene)[frameIndex].lines[lineIndex].text
    set({ displayedText: fullText, isTyping: false })
  },

  nextFrame: () => {
    const { frameIndex } = get()
    set({ frameIndex: frameIndex + 1, lineIndex: 0, displayedText: '', isTyping: true, isTransitioning: false })
  },

  endCutscene: () => {
    const { activeCutscene } = get()
    if (!activeCutscene) return
    const newSeen = new Set(get().seenCutscenes)
    newSeen.add(activeCutscene)
    set({ activeCutscene: null, seenCutscenes: newSeen, isEnding: false })
    useDayTimeStore.getState().setIsPaused(false)
  },

  skip: () => {
    const { activeCutscene } = get()
    if (!activeCutscene) return
    const newSeen = new Set(get().seenCutscenes)
    newSeen.add(activeCutscene)
    set({ activeCutscene: null, seenCutscenes: newSeen, isTransitioning: false, isEnding: false })
    useDayTimeStore.getState().setIsPaused(false)
  },

  reset: () => set({
    activeCutscene:  null,
    frameIndex:      0,
    lineIndex:       0,
    displayedText:   '',
    isTyping:        false,
    isTransitioning: false,
    isEnding:        false,
    seenCutscenes:   new Set(),
  }),
}))
```

- [ ] **Step 4: Testi çalıştır, geçtiğini doğrula**

Run: `npx vitest run tests/store/cutsceneStore.test.ts`
Expected: PASS (tüm testler).

- [ ] **Step 5: Commit**

```bash
git add src/store/cutsceneStore.ts tests/store/cutsceneStore.test.ts
git commit -m "feat: cutsceneStore varyant resolver'ı kullanır (arkaplana göre frame seçimi)"
```

---

### Task 4: Player — resolver + court/coast arka planları

**Files:**
- Modify: `src/components/CutscenePlayer.tsx`

- [ ] **Step 1: Import'ları güncelle**

`src/components/CutscenePlayer.tsx` başındaki import bloğunu (satır 1-6) şununla değiştir:

```tsx
// src/components/CutscenePlayer.tsx
import { useEffect, useState } from 'react'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useCharacterStore } from '@/store/characterStore'
import { getCutsceneFrames } from '@/data/cutscenes'
import type { CutsceneFrame } from '@/types/cutscene'
```

- [ ] **Step 2: `SceneBackground` içine `court` ve `coast` dallarını ekle**

`SceneBackground` fonksiyonunda, `if (type === 'bedroom') { ... }` bloğunun kapanışından **hemen sonra** (yani `// studio` yorumundan önce) aşağıdaki iki bloğu ekle:

```tsx
  if (type === 'court') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1a1408 0%,#2a2010 50%,#1a1408 100%)', imageRendering: 'pixelated' }}>
        <div style={{ position: 'absolute', inset: 0, ...gridTexture }} />
        {/* Hâkim kürsüsü */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 160, height: 70, background: '#3a2a14', border: '4px solid #5a4020' }} />
        {/* Türk bayrağı / amblem yerine sade pano */}
        <div style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', width: 40, height: 24, background: '#5a4020', border: '3px solid #7a5a30' }} />
        {/* Sıra */}
        <div style={{ position: 'absolute', bottom: 90, left: '15%', right: '15%', height: 14, background: '#2a2010', borderTop: '4px solid #4a3a1c' }} />
      </div>
    )
  }

  if (type === 'coast') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#2a1a30 0%,#5a3050 40%,#c87050 75%,#e0a060 100%)', imageRendering: 'pixelated' }}>
        <div style={{ position: 'absolute', inset: 0, ...gridTexture }} />
        {/* Deniz penceresi */}
        <div style={{ position: 'absolute', top: 36, left: '50%', transform: 'translateX(-50%)', width: 120, height: 80, background: '#3a6a8a', border: '5px solid #6a4a2a' }}>
          <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '40%', background: '#2a5a7a' }} />
          {/* Güneş */}
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 22, height: 22, background: '#ffd070', borderRadius: '50%' }} />
        </div>
        {/* Eski ahşap masa */}
        <div style={{ position: 'absolute', bottom: 90, left: '12%', right: '12%', height: 12, background: '#6a4a2a', borderTop: '4px solid #8a6a3a' }} />
      </div>
    )
  }
```

- [ ] **Step 3: Typewriter effect'inde resolver kullan**

`useEffect` içindeki typewriter bloğunda şu satırı:

```tsx
      const def = CUTSCENES[state.activeCutscene]
      const fullText = def.frames[state.frameIndex].lines[state.lineIndex].text
```

şununla değiştir:

```tsx
      const frames = getCutsceneFrames(state.activeCutscene, useCharacterStore.getState().background)
      const fullText = frames[state.frameIndex].lines[state.lineIndex].text
```

- [ ] **Step 4: Render kısmında resolver kullan**

`if (!activeCutscene) return null` satırından sonraki şu üç satırı:

```tsx
  const def          = CUTSCENES[activeCutscene]
  const currentFrame = def.frames[frameIndex]
  const currentLine  = currentFrame.lines[lineIndex]
```

şununla değiştir:

```tsx
  const background   = useCharacterStore.getState().background
  const currentFrame = getCutsceneFrames(activeCutscene, background)[frameIndex]
  const currentLine  = currentFrame.lines[lineIndex]
```

- [ ] **Step 5: `CUTSCENES` artık kullanılmıyor — doğrula**

Run: `grep -n "CUTSCENES" src/components/CutscenePlayer.tsx`
Expected: Çıktı YOK (boş). Eğer hâlâ varsa, kalan referansı `getCutsceneFrames(...)` ile değiştir.

- [ ] **Step 6: Commit**

```bash
git add src/components/CutscenePlayer.tsx
git commit -m "feat: CutscenePlayer varyant resolver + court/coast arka planları"
```

---

### Task 5: Tam doğrulama (test + build)

**Files:** (yok — yalnız doğrulama)

- [ ] **Step 1: Tüm test paketini çalıştır**

Run: `npx vitest run`
Expected: PASS — tüm dosyalar yeşil (data + store testleri dahil).

- [ ] **Step 2: Üretim build'i (tip kapısı)**

Run: `npm run build`
Expected: Hatasız tamamlanır. Özellikle `Object is possibly 'undefined'` veya eksik background tipi hatası OLMAMALI. Hata çıkarsa, ilgili dosyada `getCutsceneFrames` kullanımına geçilmediği yeri düzelt.

- [ ] **Step 3 (manuel duman testi, opsiyonel ama önerilir):**

Run: `npm run dev`
Yeni oyun başlat → wizard'da farklı arkaplanlar seçerek kovulma sahnesinin 4 frame'inin (office → bedroom → court → coast) doğru diyaloglarla aktığını ve `{{playerName}}`/`{{studioName}}` değişiminin çalıştığını gözle. İlk oyunu yayınla → ilk yayın sahnesinin yalnız tonda oynadığını doğrula.

- [ ] **Step 4: DURUM.md güncelle**

`docs/superpowers/DURUM.md` içindeki "Tamamlanan Fazlar" tablosuna senaryo satırını ekle (Faz 4B'nin altına):

```markdown
| **Senaryo — Giriş Sahneleri** | ✅ Bitti | `specs/2026-05-30-senaryo-intro-sahneleri-design.md` | `plans/2026-05-30-senaryo-intro-sahneleri.md` |
```

Ve "Testler" satırındaki test sayısını `npx vitest run` çıktısındaki güncel toplamla değiştir.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/DURUM.md
git commit -m "docs: senaryo giriş sahneleri tamamlandı — DURUM güncellendi"
```

---

## Self-Review

**1. Spec coverage:**
- Buruk-gerçekçi ton, anlatıcısız → Task 2 diyalog içeriği ✅
- 5 arkaplana özgü kovulma, 4 frame (kovulma→boşanma→mahkeme→sahil) → Task 2 `variants` + Task 2 testi (4 frame kontrolü) ✅
- "başka biri var" + anlaşmalı boşanma + oyuncu pratik repliği → Task 2 her varyant F2 ✅
- İlk yayın yalnız/kişisel, rakip yok → Task 2 `ilk_yayin.frames` ✅
- `variants` veri modeli + `startCutscene` arkaplan seçimi → Task 2 resolver + Task 3 store ✅
- `court`+`coast` background → Task 1 tip + Task 4 SceneBackground ✅
- `Eş`/`Hâkim` speaker → Task 2 veri (speaker serbest string, tip değişikliği gerekmez) ✅
- Test stratejisi (varyant kapsama, geçerli background, store varyant seçimi) → Task 2 & Task 3 testleri ✅
- `houseSale` uyumu → sadece anlatısal, kod değişikliği gerektirmez (spec notu) ✅
- Gameplay notları (sandbox, "ofis tut" ana görevi, NPC işleri) → **bu plan kapsamı dışı** (spec'te de "ileride uygulanır" olarak işaretli; cutscene içeriğini etkilemez) ✅
- Genel arc 3-6. sahneler → kapsam dışı (4C) ✅

**2. Placeholder scan:** Plan içinde TBD/TODO yok; tüm kod blokları tam. (`{{playerName}}`/`{{studioName}}` runtime placeholder'larıdır, plan placeholder'ı değil.) ✅

**3. Type consistency:**
- `getCutsceneFrames(id: CutsceneId, background: BackgroundId | null): CutsceneFrame[]` — Task 2'de tanımlı, Task 3 (store) ve Task 4 (player) aynı imzayla çağırıyor ✅
- `CutsceneDef.variants?: Record<BackgroundId, CutsceneFrame[]>` ve `frames?` — Task 1 tip, Task 2 veri tutarlı ✅
- Store metod imzaları değişmedi (sadece iç gövde) → `CutscenePlayer` destructure'ı bozulmaz ✅
- `useCharacterStore.getState().background` tipi `BackgroundId | null` → `getCutsceneFrames`'in ikinci parametresiyle birebir uyumlu ✅

---

## Kapsam Dışı

- Genel arc'ın 3-6. sahnelerinin diyalogları (Faz 4C).
- Rakip şirket kimliği.
- "Ofis tut" ana görevi ve NPC freelance işleri (gameplay sistemi, ayrı faz).
- Gerçek pixel-art asset'leri; `court`/`coast` CSS placeholder yeterli.
- Save/load'da `seenCutscenes` persist'i (4B'de de kapsam dışıydı).
