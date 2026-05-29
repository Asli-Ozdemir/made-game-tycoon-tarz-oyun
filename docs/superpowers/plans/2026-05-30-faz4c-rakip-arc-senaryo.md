# Faz 4C Rakip Arc Senaryosu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut 4C cutscene iskeletinin `[PLACEHOLDER]` diyaloglarını gerçek senaryoyla doldur; `nexus_notice`'i arka plana, `nexus_resolution`'ı seçime göre dallandır; bir yeni orta sahne (`nexus_meeting`) ekle; tipleri ve kırık testi düzelt.

**Architecture:** `CutsceneDef`'e opsiyonel `variants` (arka plana göre) ve `choiceVariants` (resolution seçimine göre) eklenir. Saf `getCutsceneFrames(id, ctx)` resolver'ı aktif frame dizisini çözer. Store ve player resolver'ı kullanır; `cutsceneStore` resolution seçimini taşır; `ResolutionScreen` seçimi set eder; `rivalStore.setRelationship` Nexus 'rival' olunca `nexus_meeting`'i tetikler.

**Tech Stack:** TypeScript, React, Zustand, Vitest, electron-vite. Diyalog Türkçe.

**Referans:** `docs/superpowers/specs/2026-05-30-faz4c-rakip-arc-senaryo-design.md` (tüm diyalogların kaynağı).

**Mevcut durum (önemli):**
- `build` = `electron-vite build` → **proje çapında tip denetimi yapmaz.** Tip kapısı yok; doğrulama `npx vitest run` ile yapılır. (Yine de tipler doğru tutulur.)
- Main'de şu an **1 test kırık:** `tests/data/cutscenes.test.ts` geçerli-background testi `server_room/gallery/boardroom`'u tanımıyor. Bu plan onu düzeltir.
- 4C cutscene iskeleti + `startCutsceneForce` + `ResolutionScreen` + `awardsStore` **commit'li.** `CutscenePlayer.SceneBackground` `server_room/gallery/boardroom` CSS'lerini **zaten içeriyor** (yeni bg CSS gerekmez).
- `CutsceneId` ve `CutsceneFrame['background']` union'ları dar (yeni id/bg'ler tipte yok) — bu plan genişletir.

**Giriş (kovulma) planıyla ilişki:** `2026-05-30-senaryo-intro-sahneleri.md` planı da `variants` + `getCutsceneFrames` ekler. Bu plan **mevcut main'e** (kovulma/ilk_yayin hâlâ flat placeholder) göre yazılmıştır ve kovulma/ilk_yayin içeriğine **dokunmaz** (onları olduğu gibi korur). İki plan birlikte uygulanırken `getCutsceneFrames` imzası ve `variants` alanı tek sürümde birleştirilmeli; bu plandaki imza `(id, ctx)` nesnesidir ve giriş planının `(id, background)` imzasını kapsar.

---

## Dosya Yapısı

| Dosya | Sorumluluk | İşlem |
|-------|-----------|-------|
| `src/types/cutscene.ts` | Tipler | Modify — id/bg union genişlet, variants/choiceVariants |
| `src/data/cutscenes.ts` | Sahne verisi + resolver | Modify — 4C diyalogları + `getCutsceneFrames` |
| `src/store/cutsceneStore.ts` | Cutscene akışı | Modify — resolver + `resolutionChoice` |
| `src/components/CutscenePlayer.tsx` | Render + typewriter | Modify — resolver kullanımı |
| `src/components/ResolutionScreen.tsx` | Final seçim ekranı | Modify — `setResolutionChoice` |
| `src/store/rivalStore.ts` | Rakip mekaniği | Modify — `nexus_meeting` tetikleyici |
| `tests/data/cutscenes.test.ts` | Veri testleri | Modify — variant-aware + 4C içerik |
| `tests/store/cutsceneStore.test.ts` | Store testleri | Modify — resolutionChoice |

---

### Task 1: Tipleri genişlet

**Files:**
- Modify: `src/types/cutscene.ts`

- [ ] **Step 1: `src/types/cutscene.ts` dosyasının tamamını aşağıdakiyle değiştir**

```ts
import type { BackgroundId } from '@/data/backgrounds'
import type { ResolutionChoice } from '@/types/rival'

export interface DialogLine {
  speaker: string  // "Victor Crane", "Klein", "Sunucu", "Rakip Kurucu", "{{playerName}}", ...
  text:    string  // {{playerName}} ve {{studioName}} placeholder destekler
}

export interface CutsceneFrame {
  background:
    | 'office' | 'bedroom' | 'studio'
    | 'server_room' | 'gallery' | 'boardroom'
  lines: DialogLine[]
}

export type CutsceneId =
  | 'kovulma' | 'ilk_yayin'
  | 'nexus_notice' | 'nexus_meeting'
  | 'awards_win' | 'awards_win_gallery' | 'awards_win_boardroom' | 'awards_lose_to_nexus'
  | 'nexus_resolution' | 'indie_resolution'

export interface CutsceneDef {
  id:              CutsceneId
  frames?:         CutsceneFrame[]                                     // varyantsız sahneler
  variants?:       Record<BackgroundId, CutsceneFrame[]>               // arka plana göre (nexus_notice)
  choiceVariants?: Partial<Record<ResolutionChoice, CutsceneFrame[]>>  // seçime göre (nexus_resolution)
}
```

- [ ] **Step 2: Sözdizimini doğrula**

Run: `node -e "require('typescript')" 2>/dev/null; npx vitest run tests/data/cutscenes.test.ts 2>&1 | tail -5`
Expected: Test hâlâ KIRIK olabilir (Task 2'de düzelir) ama import/parse hatası OLMAMALI. Bu adımda yalnız dosyanın geçerli TS olduğunu teyit et; içerik düzeltmesi Task 2'de.

> Commit Task 2 ile birlikte yapılır (tip + veri tutarlı olsun).

---

### Task 2: 4C diyalogları + resolver

**Files:**
- Modify: `src/data/cutscenes.ts`
- Test: `tests/data/cutscenes.test.ts`

- [ ] **Step 1: `tests/data/cutscenes.test.ts` dosyasının tamamını aşağıdakiyle değiştir (önce test)**

```ts
import { describe, it, expect } from 'vitest'
import { CUTSCENES, getCutsceneFrames } from '@/data/cutscenes'
import { BACKGROUNDS } from '@/data/backgrounds'
import type { CutsceneId, CutsceneFrame } from '@/types/cutscene'
import type { ResolutionChoice } from '@/types/rival'

const VALID_BG = new Set(['office', 'bedroom', 'studio', 'server_room', 'gallery', 'boardroom'])
const ALL_IDS = Object.keys(CUTSCENES) as CutsceneId[]
const RES_CHOICES: ResolutionChoice[] = ['buyout', 'destroy', 'forgive', 'merge']

// Bir sahneye ait tüm frame dizilerini topla (flat | variants | choiceVariants)
function allFrameArrays(id: CutsceneId): CutsceneFrame[][] {
  const def = CUTSCENES[id]
  const arrays: CutsceneFrame[][] = []
  if (def.frames) arrays.push(def.frames)
  if (def.variants) arrays.push(...Object.values(def.variants))
  if (def.choiceVariants) arrays.push(...Object.values(def.choiceVariants) as CutsceneFrame[][])
  return arrays
}

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
  it('her sahne ID kendi id alanıyla eşleşir', () => {
    for (const id of ALL_IDS) {
      expect(CUTSCENES[id]).toBeDefined()
      expect(CUTSCENES[id].id).toBe(id)
    }
  })

  it('her sahnenin geçerli ve dolu frame\'leri var (flat/variants/choiceVariants)', () => {
    for (const id of ALL_IDS) {
      const arrays = allFrameArrays(id)
      expect(arrays.length).toBeGreaterThan(0)
      for (const frames of arrays) assertFramesValid(frames)
    }
  })

  it('nexus_notice her BackgroundId için varyant içerir', () => {
    const variants = CUTSCENES.nexus_notice.variants
    expect(variants).toBeDefined()
    for (const bg of BACKGROUNDS) expect(variants![bg.id]).toBeDefined()
  })

  it('nexus_resolution dört seçim için varyant içerir', () => {
    const cv = CUTSCENES.nexus_resolution.choiceVariants
    expect(cv).toBeDefined()
    for (const c of RES_CHOICES) expect(cv![c]).toBeDefined()
  })

  it('4C sahnelerinde placeholder ve Anlatıcı yok', () => {
    const fourC: CutsceneId[] = [
      'nexus_notice', 'nexus_meeting', 'awards_win', 'awards_win_gallery',
      'awards_win_boardroom', 'awards_lose_to_nexus', 'nexus_resolution', 'indie_resolution',
    ]
    for (const id of fourC) {
      for (const frames of allFrameArrays(id)) {
        for (const frame of frames) {
          for (const line of frame.lines) {
            expect(line.text).not.toContain('[PLACEHOLDER]')
            expect(line.speaker).not.toBe('Anlatıcı')
          }
        }
      }
    }
  })

  it('getCutsceneFrames arka plana göre nexus_notice varyantı seçer', () => {
    const frames = getCutsceneFrames('nexus_notice', { background: 'eski_ceo' })
    expect(frames).toBe(CUTSCENES.nexus_notice.variants!.eski_ceo)
  })

  it('getCutsceneFrames seçime göre nexus_resolution varyantı seçer', () => {
    const frames = getCutsceneFrames('nexus_resolution', { background: null, choice: 'forgive' })
    expect(frames).toBe(CUTSCENES.nexus_resolution.choiceVariants!.forgive)
  })

  it('getCutsceneFrames flat sahnede frames döndürür', () => {
    expect(getCutsceneFrames('nexus_meeting', { background: null })).toBe(CUTSCENES.nexus_meeting.frames)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

Run: `npx vitest run tests/data/cutscenes.test.ts`
Expected: FAIL — `getCutsceneFrames` yok, `variants`/`choiceVariants` tanımsız, 4C'de placeholder var.

- [ ] **Step 3: `src/data/cutscenes.ts` dosyasının tamamını aşağıdakiyle değiştir**

> Not: `kovulma` ve `ilk_yayin` mevcut placeholder hâlleriyle **korunur** (giriş planının işi). Bu plan yalnız 4C sahnelerini doldurur ve resolver ekler.

```ts
import type { BackgroundId } from '@/data/backgrounds'
import type { ResolutionChoice } from '@/types/rival'
import type { CutsceneId, CutsceneDef, CutsceneFrame } from '@/types/cutscene'

export const CUTSCENES: Record<CutsceneId, CutsceneDef> = {
  kovulma: {
    id: 'kovulma',
    frames: [
      {
        background: 'office',
        lines: [
          { speaker: 'Patron',         text: '[PLACEHOLDER] Seni işten çıkarmak zorundayım.' },
          { speaker: '{{playerName}}', text: '[PLACEHOLDER] Anlamıyorum, neden?' },
          { speaker: 'Patron',         text: '[PLACEHOLDER] Bütçe kısıtlamaları. Üzgünüm.' },
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
          { speaker: 'Anlatıcı',       text: '[PLACEHOLDER] İlk oyunun yayında.' },
          { speaker: '{{playerName}}', text: '[PLACEHOLDER] Sonunda...' },
          { speaker: 'Anlatıcı',       text: '[PLACEHOLDER] {{studioName}} adını dünyaya duyuruyorsun.' },
        ],
      },
    ],
  },

  nexus_notice: {
    id: 'nexus_notice',
    variants: {
      yapimci: [
        {
          background: 'office',
          lines: [
            { speaker: 'Klein',          text: 'Şu yükselen stüdyo... kurucusunu hatırlarsınız.' },
            { speaker: 'Victor Crane',   text: '(gülümser) Elbette. Onu kovduğum gün koltuğum sağlamlaştı.' },
            { speaker: 'Victor Crane',   text: 'Çok şey biliyordu, Klein. Bilen adam, taht için fazla tehlikelidir.' },
            { speaker: 'Klein',          text: 'Tehdit olduğu için mi gönderdiniz?' },
            { speaker: 'Victor Crane',   text: 'Tehdit değildi, basamaktı. Yukarı çıkmak için birine basarsın — o da oradaydı, o kadar.' },
            { speaker: 'Klein',          text: 'Şimdi geri döndü.' },
            { speaker: 'Victor Crane',   text: 'Güzel. Açıkçası sıkılmıştım. İyi rakip iyi aynadır — bakalım ben mi haklıydım.' },
            { speaker: 'Victor Crane',   text: 'Beni sevmesini beklemiyorum. Makyavel ne demiş — hem sevilip hem korkulamıyorsan, korkulmayı seç. Sevgi ucuzlar, korku tutar.' },
          ],
        },
      ],
      kk_uzmani: [
        {
          background: 'office',
          lines: [
            { speaker: 'Klein',          text: 'Küçük bir stüdyo dikkat çekiyor. {{studioName}}. Kurucusu eski çalışanımızmış.' },
            { speaker: 'Victor Crane',   text: 'Hangi ekipten?' },
            { speaker: 'Klein',          text: 'Kalite kontrol. Otomasyonda çıkarmışız.' },
            { speaker: 'Victor Crane',   text: 'Ah, o büyük temizlik. Dört yüz kişi gönderdim, hisse yüzde on iki fırladı. Kurul adımı o gün ezberledi.' },
            { speaker: 'Victor Crane',   text: 'Demek içlerinden biri stüdyo kurmuş. (eğlenir) Hoşuma gitti doğrusu.' },
            { speaker: 'Klein',          text: 'Endişelenelim mi?' },
            { speaker: 'Victor Crane',   text: 'Daha değil. Ama yetenekliyi yakından severim — ya yanına alırsın, ya önünü kesersin.' },
            { speaker: 'Victor Crane',   text: 'Korkutmak da var tabii. Makyavel boşuna yazmamış: sevgi ucuzlar, korku tutar.' },
          ],
        },
      ],
      eski_ceo: [
        {
          background: 'office',
          lines: [
            { speaker: 'Klein',          text: 'Efendim, {{studioName}} büyüyor. Kurucusu... bu şirketin kurucusu.' },
            { speaker: 'Victor Crane',   text: '(koltuğa yaslanır) Bu koltuğu o yaptı. Ben sadece daha çok isteyeni oynadım.' },
            { speaker: 'Klein',          text: 'Kurulu siz mi çevirdiniz?' },
            { speaker: 'Victor Crane',   text: 'Çevirmedim, dinledim. Onlar korkuyordu, ben cesaret sattım. Oylar öyle döndü.' },
            { speaker: 'Klein',          text: 'Geri almaya gelir mi?' },
            { speaker: 'Victor Crane',   text: 'Umarım gelir. Bir adamı gerçekten tanımak için ondan bir şey çalman gerekir.' },
            { speaker: 'Victor Crane',   text: 'Ne yapacağını izlemek — bu işin tek gerçek keyfi.' },
            { speaker: 'Victor Crane',   text: 'Beni asla sevmeyecek. Olsun. Prens\'te der ki — sevgi ucuzlar, korku tutar.' },
          ],
        },
      ],
      yaratici_direktor: [
        {
          background: 'office',
          lines: [
            { speaker: 'Klein',          text: 'Yükselen bir stüdyo var. {{studioName}}. Tarzı tanıdık geliyor.' },
            { speaker: 'Victor Crane',   text: 'Gelmeli. O tarzı kurula ben sattım. (gülümser) Fikir benim değildi tabii.' },
            { speaker: 'Klein',          text: 'Onun fikriydi.' },
            { speaker: 'Victor Crane',   text: 'Fikir ucuzdur, Klein. Onu doğru odada söyleyen kişi pahalı. Ben o odadaydım, o değildi.' },
            { speaker: 'Klein',          text: 'Şimdi aynı fikirle dönüyor.' },
            { speaker: 'Victor Crane',   text: 'Ve bu sefer odanın sahibi o. Adil sayılır.' },
            { speaker: 'Victor Crane',   text: 'İtiraf edeyim — o oyunu çıkardığım gün en çok onun ne diyeceğini merak etmiştim.' },
            { speaker: 'Victor Crane',   text: 'Ondan af beklemiyorum. İstediğim, çekinmesi. Sevgi ucuzlar, Klein — korku tutar.' },
          ],
        },
      ],
      bas_muhendis: [
        {
          background: 'office',
          lines: [
            { speaker: 'Klein',          text: '{{studioName}} teknik olarak etkileyici. Kurucusu eski mühendislerimizden.' },
            { speaker: 'Victor Crane',   text: 'Batan proje, değil mi? O enkaza birinin adını yazmamız gerekiyordu.' },
            { speaker: 'Klein',          text: 'Onu siz mi seçtiniz?' },
            { speaker: 'Victor Crane',   text: 'Seçmedim, izin verdim. En sessiz, en az dostu olan seçilir — kural budur.' },
            { speaker: 'Victor Crane',   text: 'Oysa kod kusursuzdu. Sorun yönetimdeydi, yani bendeydi. Ama itibar pahalı, doğruluk ucuz.' },
            { speaker: 'Klein',          text: 'Şimdi karşımızda.' },
            { speaker: 'Victor Crane',   text: 'Kusursuz kod yazan, kusursuz kin de tutar. Demek bu işin tadı kaçmayacak.' },
            { speaker: 'Victor Crane',   text: 'Bana kin tutsun, sevgisi umurumda değil. Makyavel haklıydı: sevgi ucuzlar, korku tutar.' },
          ],
        },
      ],
    },
  },

  nexus_meeting: {
    id: 'nexus_meeting',
    frames: [
      {
        background: 'office',
        lines: [
          { speaker: 'Victor Crane',   text: 'Sonunda yüz yüzeyiz. Otur. Seni uzaktan izliyordum.' },
          { speaker: '{{playerName}}', text: 'Neden çağırdın?' },
          { speaker: 'Victor Crane',   text: 'Merak. Beni bu kadar zorlayan kim, görmek istedim.' },
          { speaker: 'Victor Crane',   text: 'Hayatta tek şey öğrendim: akıntıya karşı yüzülmez. Ben bıraktım kendimi — bak, neredeyim.' },
          { speaker: '{{playerName}}', text: 'Akıntı seni bataklığa götürse de mi?' },
          { speaker: 'Victor Crane',   text: 'Orada da kral olurum. Boğulmaktan iyidir.' },
          { speaker: '{{playerName}}', text: 'Ben kürek çekeceğim. Yorulsam da, bataklığa saplansam da.' },
          { speaker: 'Victor Crane',   text: '(gülümser) Herkes öyle der; su sabırlıdır. Yine de... göster bakalım. Kimse beni uzun zamandır şaşırtmadı.' },
        ],
      },
    ],
  },

  awards_win: {
    id: 'awards_win',
    frames: [
      {
        background: 'server_room',
        lines: [
          { speaker: 'Sunucu',         text: '(yayından) Ve yılın oyunu ödülü... {{studioName}}!' },
          { speaker: '{{playerName}}', text: 'Duydum. Makinelerin uğultusu arasında, tek başıma.' },
          { speaker: '{{playerName}}', text: 'Sahnede birileri benim için alkışlıyor. Hiçbirini tanımıyorum.' },
          { speaker: '{{playerName}}', text: 'Kazandım. Ama elimi sıkacak kimse yok. Sadece fanların sesi.' },
          { speaker: '{{playerName}}', text: 'Yine de... fena değil. Hiç fena değil.' },
        ],
      },
    ],
  },
  awards_win_gallery: {
    id: 'awards_win_gallery',
    frames: [
      {
        background: 'gallery',
        lines: [
          { speaker: 'Sunucu',         text: '(yayından) Ve yılın oyunu... {{studioName}}!' },
          { speaker: '{{playerName}}', text: 'Duvardaki çizimlere baktım. Hepsinin altında tek bir imza var. Benimki.' },
          { speaker: '{{playerName}}', text: 'Yıllar önce bu sahnede başkası benim eserimle alkışlanmıştı.' },
          { speaker: '{{playerName}}', text: 'Şimdi alkış bana ait. Ama salon orada, ben buradayım.' },
          { speaker: '{{playerName}}', text: 'Galiba kazanmak, yalnız kalmanın güzel bir yolu.' },
        ],
      },
    ],
  },
  awards_win_boardroom: {
    id: 'awards_win_boardroom',
    frames: [
      {
        background: 'boardroom',
        lines: [
          { speaker: 'Sunucu',         text: '(yayından) Ve yılın oyunu... {{studioName}}!' },
          { speaker: '{{playerName}}', text: 'Uzun bir toplantı masası. Bir tek ben varım.' },
          { speaker: '{{playerName}}', text: 'Bir zamanlar böyle bir masadan kovulmuştum. Şimdi masa benim.' },
          { speaker: '{{playerName}}', text: 'Tuhaf — zirveye çıktıkça Crane\'i daha iyi anlıyorum.' },
          { speaker: '{{playerName}}', text: 'Ve beni en çok korkutan şey de bu.' },
        ],
      },
    ],
  },
  awards_lose_to_nexus: {
    id: 'awards_lose_to_nexus',
    frames: [
      {
        background: 'studio',
        lines: [
          { speaker: 'Sunucu',         text: '(yayından) Ve yılın oyunu ödülü... Nexus Games!' },
          { speaker: '{{playerName}}', text: 'Tabii ki. Parlak, güvenli, herkesin sevdiği bir oyun.' },
          { speaker: '{{playerName}}', text: 'Crane sahnede gülümsüyor. Beni görmüyor bile.' },
          { speaker: '{{playerName}}', text: '"Sevgi ucuzlar" demişti. Bu akşam sevgiyi de satın aldı.' },
          { speaker: '{{playerName}}', text: 'Sorun değil. Korku kalıcıysa... ben de sabırlıyım.' },
        ],
      },
    ],
  },

  nexus_resolution: {
    id: 'nexus_resolution',
    choiceVariants: {
      buyout: [
        {
          background: 'office',
          lines: [
            { speaker: 'Victor Crane',   text: 'Demek satın aldın. Çoğunluk hisse artık sende.' },
            { speaker: '{{playerName}}', text: 'Senin bana yaptığını yaptım. Sadece daha pahalıya.' },
            { speaker: 'Victor Crane',   text: 'Belki seni işten çıkararak hayatını kararttım. Kabul ediyorum.' },
            { speaker: 'Victor Crane',   text: 'Peki söyle — bu paraya ulaşana dek sen kaç kişinin hayatını kararttın?' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: 'Victor Crane',   text: 'Güç ezmeden gelmez. Bu benim kuralım değil, doğanın kanunu.' },
            { speaker: 'Victor Crane',   text: '"Sevgi ucuzlar, korku tutar" demiştim. Sen ikisini de geçtin — parayı seçtin.' },
            { speaker: 'Victor Crane',   text: '(kıkırdar) Koltuğu boşaltıyorum. Ama artık benden daha korkunçsun galiba.' },
            { speaker: 'Victor Crane',   text: '(kendini gösterir) Hayata son sürat kürek çektin. Ama bak — şu kütükle, yani benimle aynı hizadasın. İkimiz de aynı yere vardık.' },
          ],
        },
      ],
      destroy: [
        {
          background: 'office',
          lines: [
            { speaker: 'Victor Crane',   text: 'Skandalı basına verdin. Yarın sabaha bitmiş olacağım.' },
            { speaker: '{{playerName}}', text: 'Sen de beni böyle bitirmiştin. Tek bir imzayla.' },
            { speaker: 'Victor Crane',   text: 'Belki seni kovarak hayatını kararttım. Doğru.' },
            { speaker: 'Victor Crane',   text: 'Ama bu enkaza ulaşana dek sen kaç hayatın üstüne bastın?' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: 'Victor Crane',   text: 'Güç ezmeden gelmez. Doğanın kanunu bu — ben koymadım, sadece okudum.' },
            { speaker: 'Victor Crane',   text: '"Sevgi ucuzlar, korku tutar." Beni yıktın ama düsturumu taçlandırdın.' },
            { speaker: 'Victor Crane',   text: '(kıkırdar) Gömülen benim, korkma. Ama artık benden daha korkunçsun.' },
            { speaker: 'Victor Crane',   text: '(kendini gösterir) Tersine kürek çeke çeke vardığın yer, sürüklenen bir kütüğün — yani benim — vardığım yer. Nehir hep kazanır.' },
          ],
        },
      ],
      forgive: [
        {
          background: 'office',
          lines: [
            { speaker: 'Victor Crane',   text: 'Elinde her şey vardı. Skandalım, hisselerim, intikamın. Hiçbirini kullanmadın.' },
            { speaker: '{{playerName}}', text: 'Kullansaydım, sen olurdum. İstemedim.' },
            { speaker: 'Victor Crane',   text: '(uzun sessizlik) Anlamıyorum. Bu bir zayıflık.' },
            { speaker: '{{playerName}}', text: 'Ya da senin hiç sahip olmadığın bir şey.' },
            { speaker: 'Victor Crane',   text: '"Sevgi ucuzlar" demiştim. Sen onu bedavaya verdin, üstelik bana.' },
            { speaker: '{{playerName}}', text: 'Belki sevgi ucuz değildir, Crane. Belki sen hep yanlış mağazadaydın.' },
            { speaker: 'Victor Crane',   text: 'Sen nehrin sonuna kadar kürek çektin. Akıntıya değil, kendine rağmen. Oraya varan ilk insan belki de sensin.' },
            { speaker: 'Victor Crane',   text: '...Demek gerçekten varmış. Ham, katıksız iyi insanlar. Ben hep masal sanırdım.' },
            { speaker: 'Victor Crane',   text: 'Git. Seni anlamadan önce git.' },
          ],
        },
      ],
      merge: [
        {
          background: 'office',
          lines: [
            { speaker: 'Victor Crane',   text: 'Birleşme. İki stüdyo, tek çatı. Beklemediğim hamle.' },
            { speaker: '{{playerName}}', text: 'İkimiz de kaybetmekten yorulduk. Bu sefer aynı masadayız.' },
            { speaker: 'Victor Crane',   text: 'Sana onca kötülüğü yaptım, sen hâlâ elini uzatıyorsun.' },
            { speaker: '{{playerName}}', text: 'Güvendiğimden değil. Seni kontrol edebilirim çünkü — bunu bana sen öğrettin.' },
            { speaker: 'Victor Crane',   text: '(güler) Demek "sevgi ucuzlar, korku tutar"ı ezberledin.' },
            { speaker: '{{playerName}}', text: 'Hayır. Üçüncü bir şey buldum: ihtiyaç. O ikisinden de uzun sürer.' },
            { speaker: 'Victor Crane',   text: 'İkimiz de nehrin sonuna geldik — sen kürek çekerek, ben sürüklenerek. Tuhaf, yine de aynı yerde buluştuk.' },
            { speaker: 'Victor Crane',   text: '...Hayatım boyunca herkesi kendim sandım. Meğer gerçekten ham iyi insanlar varmış.' },
            { speaker: 'Victor Crane',   text: 'Ortak olalım. Ama gözünü dört aç.' },
            { speaker: '{{playerName}}', text: 'Sen de.' },
          ],
        },
      ],
    },
  },

  indie_resolution: {
    id: 'indie_resolution',
    frames: [
      {
        background: 'studio',
        lines: [
          { speaker: 'Rakip Kurucu',   text: 'Demek sıra bize geldi. Sizin gibi büyükler hep küçükleri ezerek başlar.' },
          { speaker: '{{playerName}}', text: 'Ben de bir zamanlar küçüktüm. Kovulmuş, bitmiş biriydim.' },
          { speaker: 'Rakip Kurucu',   text: 'Ama artık değilsin. Şimdi sen onlardansın.' },
          { speaker: '{{playerName}}', text: '...' },
          { speaker: '{{playerName}}', text: 'Belki. Ya da henüz değil. Bunu her gün yeniden seçiyorum.' },
        ],
      },
    ],
  },
}

/**
 * Aktif sahnenin frame dizisini çözer.
 * - choiceVariants + ctx.choice → seçime özgü (nexus_resolution)
 * - variants → arka plana özgü (nexus_notice); ctx.background null ise kk_uzmani fallback
 * - aksi hâlde frames
 */
export function getCutsceneFrames(
  id: CutsceneId,
  ctx: { background: BackgroundId | null; choice?: ResolutionChoice },
): CutsceneFrame[] {
  const def = CUTSCENES[id]
  if (def.choiceVariants && ctx.choice) {
    return def.choiceVariants[ctx.choice] ?? def.frames ?? []
  }
  if (def.variants) {
    return def.variants[ctx.background ?? 'kk_uzmani']
  }
  return def.frames ?? []
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini doğrula**

Run: `npx vitest run tests/data/cutscenes.test.ts`
Expected: PASS (tüm testler).

- [ ] **Step 5: Commit**

```bash
git add src/types/cutscene.ts src/data/cutscenes.ts tests/data/cutscenes.test.ts
git commit -m "feat: 4C senaryo diyalogları — nexus_notice/resolution varyantları, nexus_meeting, getCutsceneFrames"
```

---

### Task 3: Store — resolver + resolutionChoice

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
  useCutsceneStore.getState().reset()
  useDayTimeStore.getState().reset()
  useCharacterStore.setState({ background: 'kk_uzmani' })
}

beforeEach(resetAll)

describe('cutsceneStore — 4C', () => {
  it('başlangıçta resolutionChoice null', () => {
    expect(useCutsceneStore.getState().resolutionChoice).toBeNull()
  })

  it('startCutsceneForce seen kontrolü yapmadan sahneyi açar', () => {
    useCutsceneStore.setState({ seenCutscenes: new Set(['nexus_meeting']) })
    useCutsceneStore.getState().startCutsceneForce('nexus_meeting')
    expect(useCutsceneStore.getState().activeCutscene).toBe('nexus_meeting')
  })

  it('nexus_notice aktif arkaplana göre doğru varyantı oynatır', () => {
    useCharacterStore.setState({ background: 'eski_ceo' })
    const expected = getCutsceneFrames('nexus_notice', { background: 'eski_ceo' })[0].lines[0].text
    useCutsceneStore.getState().startCutsceneForce('nexus_notice')
    useCutsceneStore.getState().finishTyping()
    expect(useCutsceneStore.getState().displayedText).toBe(expected)
  })

  it('nexus_resolution resolutionChoice\'a göre doğru finali oynatır', () => {
    useCutsceneStore.getState().setResolutionChoice('forgive')
    const expected = getCutsceneFrames('nexus_resolution', { background: 'kk_uzmani', choice: 'forgive' })[0].lines[0].text
    useCutsceneStore.getState().startCutsceneForce('nexus_resolution')
    useCutsceneStore.getState().finishTyping()
    expect(useCutsceneStore.getState().displayedText).toBe(expected)
  })

  it('advance son frame son satırda isEnding set eder (nexus_meeting tek frame)', () => {
    useCutsceneStore.getState().startCutsceneForce('nexus_meeting')
    const frames = getCutsceneFrames('nexus_meeting', { background: 'kk_uzmani' })
    useCutsceneStore.setState({ frameIndex: 0, lineIndex: frames[0].lines.length - 1, isTyping: false })
    useCutsceneStore.getState().advance()
    expect(useCutsceneStore.getState().isEnding).toBe(true)
  })

  it('endCutscene resolutionChoice\'u temizler', () => {
    useCutsceneStore.getState().setResolutionChoice('destroy')
    useCutsceneStore.getState().startCutsceneForce('nexus_resolution')
    useCutsceneStore.setState({ isEnding: true })
    useCutsceneStore.getState().endCutscene()
    expect(useCutsceneStore.getState().resolutionChoice).toBeNull()
  })

  it('reset resolutionChoice\'u temizler', () => {
    useCutsceneStore.getState().setResolutionChoice('merge')
    useCutsceneStore.getState().reset()
    expect(useCutsceneStore.getState().resolutionChoice).toBeNull()
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

Run: `npx vitest run tests/store/cutsceneStore.test.ts`
Expected: FAIL — `resolutionChoice`/`setResolutionChoice` yok, store hâlâ `CUTSCENES[id].frames` kullanıyor.

- [ ] **Step 3: `src/store/cutsceneStore.ts` dosyasının tamamını aşağıdakiyle değiştir**

```ts
import { create } from 'zustand'
import { getCutsceneFrames } from '@/data/cutscenes'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useCharacterStore } from '@/store/characterStore'
import type { CutsceneId } from '@/types/cutscene'
import type { ResolutionChoice } from '@/types/rival'

interface CutsceneStore {
  activeCutscene:  CutsceneId | null
  frameIndex:      number
  lineIndex:       number
  displayedText:   string
  isTyping:        boolean
  isTransitioning: boolean
  isEnding:        boolean
  seenCutscenes:   Set<CutsceneId>
  resolutionChoice: ResolutionChoice | null

  startCutscene:       (id: CutsceneId) => void
  startCutsceneForce:  (id: CutsceneId) => void
  setResolutionChoice: (c: ResolutionChoice | null) => void
  advance:       () => void
  tick:          (char: string) => void
  finishTyping:  () => void
  nextFrame:     () => void
  endCutscene:   () => void
  skip:          () => void
  reset:         () => void
}

function activeFrames(id: CutsceneId, choice: ResolutionChoice | null) {
  return getCutsceneFrames(id, {
    background: useCharacterStore.getState().background,
    choice: choice ?? undefined,
  })
}

export const useCutsceneStore = create<CutsceneStore>((set, get) => ({
  activeCutscene:   null,
  frameIndex:       0,
  lineIndex:        0,
  displayedText:    '',
  isTyping:         false,
  isTransitioning:  false,
  isEnding:         false,
  seenCutscenes:    new Set(),
  resolutionChoice: null,

  startCutscene: (id) => {
    if (get().seenCutscenes.has(id)) return
    set({ activeCutscene: id, frameIndex: 0, lineIndex: 0, displayedText: '', isTyping: true, isTransitioning: false, isEnding: false })
    useDayTimeStore.getState().setIsPaused(true)
  },

  startCutsceneForce: (id) => {
    set({ activeCutscene: id, frameIndex: 0, lineIndex: 0, displayedText: '', isTyping: true, isTransitioning: false, isEnding: false })
    useDayTimeStore.getState().setIsPaused(true)
  },

  setResolutionChoice: (c) => set({ resolutionChoice: c }),

  advance: () => {
    const { activeCutscene, isTyping, frameIndex, lineIndex, resolutionChoice } = get()
    if (!activeCutscene) return

    if (isTyping) {
      get().finishTyping()
      return
    }

    const frames = activeFrames(activeCutscene, resolutionChoice)
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
    const { activeCutscene, frameIndex, lineIndex, resolutionChoice } = get()
    if (!activeCutscene) return
    const fullText = activeFrames(activeCutscene, resolutionChoice)[frameIndex].lines[lineIndex].text
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
    set({ activeCutscene: null, seenCutscenes: newSeen, isEnding: false, resolutionChoice: null })
    useDayTimeStore.getState().setIsPaused(false)
  },

  skip: () => {
    const { activeCutscene } = get()
    if (!activeCutscene) return
    const newSeen = new Set(get().seenCutscenes)
    newSeen.add(activeCutscene)
    set({ activeCutscene: null, seenCutscenes: newSeen, isTransitioning: false, isEnding: false, resolutionChoice: null })
    useDayTimeStore.getState().setIsPaused(false)
  },

  reset: () => set({
    activeCutscene:   null,
    frameIndex:       0,
    lineIndex:        0,
    displayedText:    '',
    isTyping:         false,
    isTransitioning:  false,
    isEnding:         false,
    seenCutscenes:    new Set(),
    resolutionChoice: null,
  }),
}))
```

- [ ] **Step 4: Testi çalıştır, geçtiğini doğrula**

Run: `npx vitest run tests/store/cutsceneStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/cutsceneStore.ts tests/store/cutsceneStore.test.ts
git commit -m "feat: cutsceneStore resolver + resolutionChoice (4C varyant oynatımı)"
```

---

### Task 4: Player — resolver kullanımı

**Files:**
- Modify: `src/components/CutscenePlayer.tsx`

- [ ] **Step 1: Import'ları güncelle**

`src/components/CutscenePlayer.tsx` başındaki şu satırı:

```tsx
import { CUTSCENES } from '@/data/cutscenes'
```

şununla değiştir:

```tsx
import { getCutsceneFrames } from '@/data/cutscenes'
```

- [ ] **Step 2: Typewriter effect'inde resolver kullan**

`useEffect` içindeki typewriter bloğunda şu iki satırı:

```tsx
      const def = CUTSCENES[state.activeCutscene]
      const fullText = def.frames[state.frameIndex].lines[state.lineIndex].text
```

şununla değiştir:

```tsx
      const frames = getCutsceneFrames(state.activeCutscene, {
        background: useCharacterStore.getState().background,
        choice: state.resolutionChoice ?? undefined,
      })
      const fullText = frames[state.frameIndex].lines[state.lineIndex].text
```

- [ ] **Step 3: Render kısmında resolver kullan**

`if (!activeCutscene) return null` satırından sonraki şu iki satırı:

```tsx
  const def          = CUTSCENES[activeCutscene]
  const currentFrame = def.frames[frameIndex]
```

şununla değiştir:

```tsx
  const currentFrame = getCutsceneFrames(activeCutscene, {
    background: useCharacterStore.getState().background,
    choice: useCutsceneStore.getState().resolutionChoice ?? undefined,
  })[frameIndex]
```

> `useCharacterStore` zaten import'lu (`playerName`/`studioName` için). Değilse ekle: `import { useCharacterStore } from '@/store/characterStore'`.

- [ ] **Step 4: `CUTSCENES` referansı kalmadığını doğrula**

Run: `grep -n "CUTSCENES" src/components/CutscenePlayer.tsx`
Expected: Çıktı YOK.

- [ ] **Step 5: Commit**

```bash
git add src/components/CutscenePlayer.tsx
git commit -m "feat: CutscenePlayer resolver kullanır (4C varyant render)"
```

---

### Task 5: ResolutionScreen — seçimi cutscene'e taşı

**Files:**
- Modify: `src/components/ResolutionScreen.tsx`

- [ ] **Step 1: `handleChoice` içinde seçimi set et**

`src/components/ResolutionScreen.tsx` `handleChoice` fonksiyonundaki şu bloğu:

```tsx
    resolveRival(rival!.id, choice)

    const cutsceneId = isNexus ? 'nexus_resolution' : 'indie_resolution'
    useCutsceneStore.getState().startCutsceneForce(cutsceneId)

    clearPending()
```

şununla değiştir:

```tsx
    resolveRival(rival!.id, choice)

    if (isNexus) {
      useCutsceneStore.getState().setResolutionChoice(choice)
      useCutsceneStore.getState().startCutsceneForce('nexus_resolution')
    } else {
      useCutsceneStore.getState().startCutsceneForce('indie_resolution')
    }

    clearPending()
```

- [ ] **Step 2: Doğrula (derleme/çalışma)**

Run: `npx vitest run`
Expected: Tüm testler PASS (bu adım yeni test eklemez; regresyon kontrolü).

- [ ] **Step 3: Commit**

```bash
git add src/components/ResolutionScreen.tsx
git commit -m "feat: ResolutionScreen Nexus finalinde seçimi cutscene'e taşır"
```

---

### Task 6: rivalStore — nexus_meeting tetikleyici

**Files:**
- Modify: `src/store/rivalStore.ts`

- [ ] **Step 1: `setRelationship`'i güncelle**

`src/store/rivalStore.ts` içindeki mevcut `setRelationship`:

```ts
  setRelationship: (rivalId, status) => {
    const rivals = get().rivals.map(r =>
      r.id === rivalId ? { ...r, relationship: status } : r
    )
    set({ rivals })
  },
```

şununla değiştir:

```ts
  setRelationship: (rivalId, status) => {
    const prev = get().rivals.find(r => r.id === rivalId)?.relationship
    const rivals = get().rivals.map(r =>
      r.id === rivalId ? { ...r, relationship: status } : r
    )
    set({ rivals })

    // Nexus ilk kez aktif rakip olunca tanışma sahnesi
    if (rivalId === 'nexus' && status === 'rival' && prev !== 'rival') {
      useCutsceneStore.getState().startCutsceneForce('nexus_meeting')
    }
  },
```

> `useCutsceneStore` zaten import'lu (`rivalStore` `nexus_notice` için kullanıyor). Değilse ekle: `import { useCutsceneStore } from '@/store/cutsceneStore'`.

- [ ] **Step 2: Doğrula**

Run: `npx vitest run`
Expected: Tüm testler PASS (regresyon).

> Not: Mevcut kodda Nexus'u `rival`'a geçiren bir çağrı henüz olmayabilir (mekanik tamamlanmamış olabilir). Tetikleyici `setRelationship` üzerinden bağlandığından, o mekanik geldiğinde sahne otomatik oynar. Mekaniğin kendisi bu planın kapsamı dışında.

- [ ] **Step 3: Commit**

```bash
git add src/store/rivalStore.ts
git commit -m "feat: rivalStore Nexus rival olunca nexus_meeting tetikler"
```

---

### Task 7: Tam doğrulama + DURUM

**Files:**
- Modify: `docs/superpowers/DURUM.md`

- [ ] **Step 1: Tüm test paketi**

Run: `npx vitest run`
Expected: PASS — **kırık test kalmadı** (eski background testi düzeldi, yeni 4C testleri geçiyor).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Hatasız tamamlanır (`electron-vite build`).

- [ ] **Step 3 (manuel duman testi, opsiyonel):**

Run: `npm run dev`
İtibarı yükselt → `nexus_notice` oyna (arka plana göre doğru varyant + Crane düsturu). Ödül kazan/kaybet → ilgili awards sahnesi. ResolutionScreen'de dört seçimi ayrı oyunlarda dene → `nexus_resolution` doğru finali + nehir imgesini oynatmalı.

- [ ] **Step 4: DURUM.md güncelle**

`docs/superpowers/DURUM.md` tablosuna ekle:

```markdown
| **Faz 4C — Rakip Arc Senaryosu** | ✅ Bitti | `specs/2026-05-30-faz4c-rakip-arc-senaryo-design.md` | `plans/2026-05-30-faz4c-rakip-arc-senaryo.md` |
```

ve "Testler" satırını `npx vitest run` güncel toplamıyla değiştir.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/DURUM.md
git commit -m "docs: Faz 4C rakip arc senaryosu tamamlandı"
```

---

## Self-Review

**1. Spec coverage:**
- Buruk-gerçekçi, anlatıcısız, gri/Makyavelist Crane → Task 2 diyalog içeriği + "Anlatıcı yok" testi ✅
- `nexus_notice` 5 arka plan varyantı + "sevgi ucuzlar korku tutar" düsturu → Task 2 `variants` + test ✅
- `nexus_meeting` (YENİ orta sahne, nehir beat) + tetikleyici → Task 2 veri + Task 6 trigger ✅
- 3 ödül + lose → Task 2 frames ✅
- `nexus_resolution` 4 seçime özgü final + nehir imgeleri + self-gesture → Task 2 `choiceVariants` + Task 3 store + Task 5 ResolutionScreen ✅
- `indie_resolution` → Task 2 frames ✅
- Nehir analojisi sadece meeting + final → içerik öyle yazıldı ✅
- Tip genişletme (id/bg union, variants/choiceVariants) → Task 1 ✅
- Kırık background testinin düzeltilmesi → Task 2 (VALID_BG genişletildi) ✅

**2. Placeholder scan:** Plan içinde TBD/TODO yok; kod blokları tam. `kovulma`/`ilk_yayin`'in `[PLACEHOLDER]` metinleri **bilerek** korundu (giriş planının işi) ve 4C testleri onları kapsamıyor. ✅

**3. Type consistency:**
- `getCutsceneFrames(id, { background, choice? })` — Task 2 tanım, Task 3 (store) ve Task 4 (player) aynı ctx imzasıyla çağırıyor ✅
- `resolutionChoice` / `setResolutionChoice` — Task 3 store tanımı, Task 5 ResolutionScreen kullanımı tutarlı ✅
- `ResolutionChoice` (`buyout`/`destroy`/`forgive`/`merge`) — `@/types/rival` ile birebir ✅
- `CutsceneId` yeni id'ler (`nexus_meeting` vb.) — Task 1 union + Task 2 veri + Task 6 trigger tutarlı ✅
- `startCutsceneForce` mevcut imzayla korundu (Task 3) → çağrılar bozulmaz ✅

---

## Kapsam Dışı

- Felsefe NPC'leri (ayrı alt sistem — sıradaki brainstorming).
- `kovulma`/`ilk_yayin` içeriği (giriş sahneleri planı).
- Nexus'u `rival`'a geçiren mekanik (yalnız tetikleyici bağlanır).
- Gerçek pixel-art asset'leri; ses/müzik; *(eylem)* yönergelerinin animasyona ayrıştırılması.
- Save/load'da `seenCutscenes`/`resolutionChoice` persist'i.
```
