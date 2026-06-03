# Avukat Asistanlığı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Lawyer Assistant side job (Clara, emek yolu) — a 10-session split-screen courtroom game where the player feeds argument cards to Clara via earpiece.

**Architecture:** 4-layer pattern matching existing side jobs: static data (`lawyerShifts.ts`) → Zustand state machine (`lawyerStore.ts`) → PixiJS split-screen scene (`LegalScene.ts`) → React orchestrator (`LawyerPanel.tsx`). New `hukuk` idea-seed integrated into existing seed infrastructure. World trigger `clara_door → 'lawyers_office'` wired through TriggerSystem and cityRoom.

**Tech Stack:** TypeScript, Zustand, PixiJS v8, React 18, Tailwind CSS, Vitest

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/data/lawyerShifts.ts` | Interfaces + 10 shift definitions |
| Create | `src/store/lawyerStore.ts` | Phase state machine + reward calculation |
| Create | `src/store/lawyerStore.test.ts` | Store unit tests |
| Create | `src/pixi/LegalScene.ts` | Split-screen PixiJS scene |
| Create | `src/components/LawyerPanel.tsx` | React orchestrator |
| Modify | `src/data/npcDialogues.ts` | Add `'hukuk'` to `IdeaSeedType` + `IDEA_SEED_META` |
| Modify | `src/store/ideaSeedStore.ts` | Add `hukuk: 0` to `EMPTY` |
| Modify | `src/data/lifePathData.ts` | Add `'clara'` to `emek` in `PATH_NPC_MAP` |
| Modify | `src/store/worldStore.ts` | Add `'lawyers_office'` to `LocationId` |
| Modify | `src/pixi/TriggerSystem.ts` | Add `clara_door: 'lawyers_office'` to `LOCATION_MAP` |
| Modify | `src/pixi/rooms/cityRoom.ts` | Add law office building + `clara_door` trigger |
| Modify | `src/App.tsx` | Import `LawyerPanel` + render block |
| Modify | `src/store/skillTreeStore.test.ts` | Add `hukuk` field to all seed objects |

---

## Task 1: Data Layer — `src/data/lawyerShifts.ts`

**Files:**
- Create: `src/data/lawyerShifts.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/data/lawyerShifts.ts

export type ArcId = 'arc_indie' | 'arc_rival' | 'arc_nexus'

export interface ArgumentCard {
  id: string
  label: string
  type: 'legal' | 'technical' | 'emotional' | 'procedural'
  power: number        // 1–5
  description: string
}

export interface LegalTurn {
  id: string
  opponentStatement: string
  opponentPower: number        // 1–5, used to scale AI resistance
  isCritical: boolean          // true → 8-second timer fires
  weaknessType?: ArgumentCard['type']
  hint?: string                // shown when relationship tier allows
}

export interface LawyerShift {
  id: string                   // 'lawyer_01' … 'lawyer_10'
  arcId: ArcId
  isArcEnd: boolean
  caseTitle: string
  opponentName: string         // shown in result; same person seen in tycoon later
  opponentCompany: string
  turns: LegalTurn[]
  availableCards: ArgumentCard[]
  timeLimitSecs: number
  difficulty: 'easy' | 'normal' | 'hard'
  briefingLines: string[]      // story content — will be replaced by narrative pass
  resultLines: {
    good: string[]
    okay: string[]
    bad: string[]
  }
}

// ─── arc_indie — PixelForge, easy ────────────────────────────────────────────

const shift01: LawyerShift = {
  id: 'lawyer_01', arcId: 'arc_indie', isArcEnd: false,
  caseTitle: 'PixelForge License Dispute — Day 1',
  opponentName: 'Daniel Mercer', opponentCompany: 'PixelForge',
  difficulty: 'easy', timeLimitSecs: 600,
  briefingLines: [
    'PixelForge claims the client sublicensed their engine without written consent.',
    'Clara says the agreement language is ambiguous — we can win this.',
  ],
  availableCards: [
    { id: 'c01_emsal',    label: 'Emsal Karar',     type: 'legal',      power: 3, description: 'Benzer lisans anlaşmazlıklarında emsal mahkeme kararı.' },
    { id: 'c01_lisans',   label: 'Lisans Belgesi',  type: 'legal',      power: 4, description: 'Orijinal lisans sözleşmesinin tam metni ve yorumu.' },
    { id: 'c01_teknik',   label: 'Teknik Tanık',    type: 'technical',  power: 3, description: 'Motor teknik özellikleri üzerine bağımsız uzman beyanı.' },
    { id: 'c01_prosedur', label: 'Usul İtirazı',    type: 'procedural', power: 2, description: 'Karşı tarafın yargılama sürecindeki usul hatasına itiraz.' },
  ],
  turns: [
    { id: 't01_1', opponentStatement: 'The sublicensing provision requires express written consent. No such consent was ever sought.', opponentPower: 2, isCritical: false, weaknessType: 'legal' },
    { id: 't01_2', opponentStatement: 'The derivative product was commercially released and directly competed with PixelForge's own titles.', opponentPower: 2, isCritical: false, weaknessType: 'technical' },
    { id: 't01_3', opponentStatement: 'Estimated damages exceed the contract value by a factor of three—', opponentPower: 3, isCritical: true, weaknessType: 'legal', hint: 'The damages cap clause is on page 7.' },
    { id: 't01_4', opponentStatement: 'The defendant has the industry experience to have understood these terms.', opponentPower: 2, isCritical: false, weaknessType: 'emotional' },
    { id: 't01_5', opponentStatement: 'We ask the court to note the pattern of willful disregard for contractual obligations.', opponentPower: 2, isCritical: false },
  ],
  resultLines: {
    good: ['Clara dismantles the damages claim. PixelForge agrees to renegotiate.'],
    okay: ['A narrow points win. PixelForge will appeal, but the pressure eases.'],
    bad:  ['The judge is unconvinced. The case continues to the next hearing.'],
  },
}

const shift02: LawyerShift = {
  id: 'lawyer_02', arcId: 'arc_indie', isArcEnd: false,
  caseTitle: 'PixelForge License Dispute — Testimony Phase',
  opponentName: 'Daniel Mercer', opponentCompany: 'PixelForge',
  difficulty: 'easy', timeLimitSecs: 600,
  briefingLines: [
    'Mercer takes the stand today. Clara needs crisp rebuttals.',
    'One bad answer and the jury sympathy shifts.',
  ],
  availableCards: [
    { id: 'c02_emsal',   label: 'Emsal Karar',      type: 'legal',      power: 3, description: 'İkinci emsal — farklı mahkeme, aynı lisans dili.' },
    { id: 'c02_kopyala', label: 'Kaynak Kodu',       type: 'technical',  power: 4, description: 'Orijinal ve türetilmiş kodun yan yana karşılaştırması.' },
    { id: 'c02_tanık',   label: 'Çapraz Sorgu',      type: 'procedural', power: 3, description: 'Mercer\'ın çelişkili önceki ifadesine atıf.' },
    { id: 'c02_kamu',    label: 'Bağımsız Geliştiriciler', type: 'emotional', power: 2, description: 'Küçük stüdyolara yönelik lisans baskısının etkisi.' },
  ],
  turns: [
    { id: 't02_1', opponentStatement: 'My client built PixelForge from the ground up over ten years. This theft cost us real money.', opponentPower: 2, isCritical: false, weaknessType: 'emotional' },
    { id: 't02_2', opponentStatement: 'The defendant never reached out, never asked, never paid.', opponentPower: 3, isCritical: false, weaknessType: 'legal' },
    { id: 't02_3', opponentStatement: 'The source files carry our copyright headers — this is not ambiguous.', opponentPower: 3, isCritical: true, weaknessType: 'technical', hint: 'The modification dates tell a different story.' },
    { id: 't02_4', opponentStatement: 'No reasonable developer would interpret the agreement as permitting this.', opponentPower: 2, isCritical: false, weaknessType: 'procedural' },
    { id: 't02_5', opponentStatement: 'We have three similar cases that settled in our favour.', opponentPower: 3, isCritical: false, weaknessType: 'legal' },
  ],
  resultLines: {
    good: ['Mercer's testimony falls apart under Clara's cross. The jury visibly shifts.'],
    okay: ['Mixed session. Mercer landed some hits, but Clara held the key points.'],
    bad:  ['Mercer performed well. Day 2 will need stronger material.'],
  },
}

const shift03: LawyerShift = {
  id: 'lawyer_03', arcId: 'arc_indie', isArcEnd: true,
  caseTitle: 'PixelForge License Dispute — Closing',
  opponentName: 'Daniel Mercer', opponentCompany: 'PixelForge',
  difficulty: 'easy', timeLimitSecs: 600,
  briefingLines: [
    'Closing arguments. Everything you've fed Clara over two days comes down to this.',
    'Mercer's team will paint this as a pattern. Shut it down.',
  ],
  availableCards: [
    { id: 'c03_kapanış', label: 'Kapanış Beyanı',   type: 'legal',      power: 4, description: 'İki günün delillerini tek argümanda toplayan güçlü kapanış.' },
    { id: 'c03_meta',    label: 'Meta Veri',          type: 'technical',  power: 5, description: 'Dosya zaman damgaları PixelForge\'un iddiasını çürütüyor.' },
    { id: 'c03_prosedur',label: 'Son İtiraz',         type: 'procedural', power: 3, description: 'Rakibin son savunma hamlesine karşı usul hamlesi.' },
    { id: 'c03_adil',    label: 'Adalet Çağrısı',    type: 'emotional',  power: 3, description: 'Küçük stüdyoların haksız lisans baskısından korunması gerektiği.' },
    { id: 'c03_emsal2',  label: 'İkinci Emsal',      type: 'legal',      power: 3, description: 'Aynı mahkemede görülen benzer davada verilen karar.' },
  ],
  turns: [
    { id: 't03_1', opponentStatement: 'The defendant's conduct is part of a broader pattern of disrespect for IP law in the indie space.', opponentPower: 3, isCritical: false, weaknessType: 'legal' },
    { id: 't03_2', opponentStatement: 'No written consent, no notification, no remorse. Three strikes.', opponentPower: 3, isCritical: false, weaknessType: 'procedural' },
    { id: 't03_3', opponentStatement: 'We are asking for full damages plus punitive compensation—', opponentPower: 4, isCritical: true, weaknessType: 'legal', hint: 'The damages cap argument from day 1 applies here.' },
    { id: 't03_4', opponentStatement: 'PixelForge deserves to see justice for every small studio that worked honestly.', opponentPower: 3, isCritical: false, weaknessType: 'emotional' },
    { id: 't03_5', opponentStatement: 'The technical evidence is clear. The intent was commercial exploitation.', opponentPower: 4, isCritical: false, weaknessType: 'technical' },
  ],
  resultLines: {
    good: ['Verdict: favourable settlement. Mercer shakes Clara's hand with a tight smile.'],
    okay: ['Settlement reached after two more weeks of back-and-forth.'],
    bad:  ['Partial loss. Clara is quiet on the drive back.'],
  },
}

// ─── arc_rival — Ironclad Games, normal ──────────────────────────────────────

const shift04: LawyerShift = {
  id: 'lawyer_04', arcId: 'arc_rival', isArcEnd: false,
  caseTitle: 'Ironclad IP Dispute — Character Design Rights',
  opponentName: 'Victor Holt', opponentCompany: 'Ironclad Games',
  difficulty: 'normal', timeLimitSecs: 480,
  briefingLines: [
    'Ironclad claims our client's character designs are derivative works.',
    'Holt's lawyers are sharp. Clara needs precise, fast rebuttals.',
  ],
  availableCards: [
    { id: 'c04_tasarım',  label: 'Tasarım Tarihi',    type: 'technical',  power: 4, description: 'Karakterin orijinal eskizleri ve zaman damgalı dosyaları.' },
    { id: 'c04_emsal',    label: 'IP Emsali',          type: 'legal',      power: 4, description: 'Karakter tarzının telif kapsamı dışında olduğuna dair emsal.' },
    { id: 'c04_uzman',    label: 'Sanat Uzmanı',       type: 'technical',  power: 3, description: 'Bağımsız sanat direktörünün karşılaştırma analizi.' },
    { id: 'c04_prosedur', label: 'Tescil Sorgusu',     type: 'procedural', power: 3, description: 'Ironclad'ın telif tescilinin eksik olduğuna dair itiraz.' },
    { id: 'c04_niyet',    label: 'Piyasa Niyeti',      type: 'emotional',  power: 2, description: 'Müşterinin bağımsız ve özgün çalışma niyetini açıklaması.' },
  ],
  turns: [
    { id: 't04_1', opponentStatement: 'The silhouette, colour palette, and posture are direct copies of our registered character.', opponentPower: 3, isCritical: false, weaknessType: 'technical' },
    { id: 't04_2', opponentStatement: 'Our design language is protected as trade dress.', opponentPower: 3, isCritical: false, weaknessType: 'legal' },
    { id: 't04_3', opponentStatement: 'The defendant had access to our promotional materials prior to their release date—', opponentPower: 4, isCritical: true, weaknessType: 'technical', hint: 'The sketch timestamps predate the promotional materials.' },
    { id: 't04_4', opponentStatement: 'Ironclad has invested significantly in its visual identity. This dilutes our brand.', opponentPower: 3, isCritical: false, weaknessType: 'emotional' },
    { id: 't04_5', opponentStatement: 'We have expert testimony confirming the similarity exceeds acceptable thresholds.', opponentPower: 4, isCritical: false, weaknessType: 'technical' },
    { id: 't04_6', opponentStatement: 'The registration predates the defendant's work by 18 months.', opponentPower: 3, isCritical: false, weaknessType: 'procedural' },
  ],
  resultLines: {
    good: ['Clara obliterates the "substantial similarity" argument. Holt's team huddles quietly.'],
    okay: ['Clara holds the line. Holt is shaken but not out.'],
    bad:  ['Ironclad lands the design comparison. The case tilts against us.'],
  },
}

const shift05: LawyerShift = {
  id: 'lawyer_05', arcId: 'arc_rival', isArcEnd: false,
  caseTitle: 'Ironclad — Employee Non-Compete Breach',
  opponentName: 'Victor Holt', opponentCompany: 'Ironclad Games',
  difficulty: 'normal', timeLimitSecs: 480,
  briefingLines: [
    'Ironclad pivoted — now they're targeting a former employee who joined our client.',
    'The non-compete was written to be overbroad. Clara can challenge its validity.',
  ],
  availableCards: [
    { id: 'c05_rekabet',  label: 'Rekabet Yasası',    type: 'legal',      power: 4, description: 'Overbroad non-compete clauses are unenforceable in this jurisdiction.' },
    { id: 'c05_süre',     label: 'Süre Aşımı',        type: 'procedural', power: 4, description: 'İki yıllık geçerlilik süresi dolmuş — söz doğrultusunda.' },
    { id: 'c05_beceri',   label: 'Genel Beceri',       type: 'legal',      power: 3, description: 'Çalışanın taşıdığı bilgi sektörde standarttır, ticari sır değil.' },
    { id: 'c05_iletişim', label: 'İç Yazışmalar',      type: 'technical',  power: 5, description: 'Ironclad'ın kendi e-postaları maddenin ihlal edilmediğini gösteriyor.' },
    { id: 'c05_adil',     label: 'Geçim Hakkı',        type: 'emotional',  power: 3, description: 'Overbroad non-compete geçimini engeller — haksız.' },
  ],
  turns: [
    { id: 't05_1', opponentStatement: 'The employee signed a clear two-year non-compete covering the game development sector.', opponentPower: 3, isCritical: false, weaknessType: 'legal' },
    { id: 't05_2', opponentStatement: 'The proprietary workflow they brought to the defendant constitutes a trade secret.', opponentPower: 4, isCritical: false, weaknessType: 'technical' },
    { id: 't05_3', opponentStatement: 'We documented the workflow transfers in detail—', opponentPower: 4, isCritical: true, weaknessType: 'technical', hint: 'Ironclad's own emails confirm standard industry practice.' },
    { id: 't05_4', opponentStatement: 'This is a clear case of talent poaching designed to damage Ironclad's competitive position.', opponentPower: 3, isCritical: false, weaknessType: 'emotional' },
    { id: 't05_5', opponentStatement: 'Courts in this jurisdiction have upheld non-competes of this scope in two recent cases.', opponentPower: 4, isCritical: false, weaknessType: 'legal' },
    { id: 't05_6', opponentStatement: 'The scope of the agreement is proportionate to Ironclad's legitimate business interests.', opponentPower: 3, isCritical: false, weaknessType: 'procedural' },
  ],
  resultLines: {
    good: ['The non-compete is voided as overbroad. The employee keeps their job.'],
    okay: ['Partial relief. The employee stays, but some restrictions remain.'],
    bad:  ['The court upholds the clause. The employee must leave the project.'],
  },
}

const shift06: LawyerShift = {
  id: 'lawyer_06', arcId: 'arc_rival', isArcEnd: true,
  caseTitle: 'Ironclad — Final Hearing',
  opponentName: 'Victor Holt', opponentCompany: 'Ironclad Games',
  difficulty: 'normal', timeLimitSecs: 480,
  briefingLines: [
    'Ironclad combined both claims. Holt himself is here today.',
    'Clara says she's never seen him this prepared.',
  ],
  availableCards: [
    { id: 'c06_birleşik',  label: 'Birleşik Savunma',  type: 'legal',      power: 5, description: 'Her iki iddiayı tek kapsamlı argümanla çürüten savunma.' },
    { id: 'c06_meta',      label: 'Meta Veri Paketi',   type: 'technical',  power: 5, description: 'Tüm zaman damgaları ve iletişim kayıtları bir arada.' },
    { id: 'c06_emsal3',    label: 'Üçüncü Emsal',       type: 'legal',      power: 4, description: 'Aynı mahkemede görülen iki talepli dava — aleyhimize çıktı.' },
    { id: 'c06_prosedur2', label: 'Çapraz Başvuru',     type: 'procedural', power: 3, description: 'Birden fazla talebin birleştirilmesinin prosedürel itirazı.' },
    { id: 'c06_kamu2',     label: 'Pazar Etkisi',       type: 'emotional',  power: 3, description: 'Ironclad\'ın taleplerinin bağımsız piyasayı boğacağı argümanı.' },
    { id: 'c06_ifa2',      label: 'Karşı İddia',        type: 'legal',      power: 4, description: 'Ironclad\'ın dava açma sürecindeki kötü niyetin kanıtı.' },
  ],
  turns: [
    { id: 't06_1', opponentStatement: 'Both the design theft and the talent raid form a single coordinated attack on Ironclad.', opponentPower: 4, isCritical: false, weaknessType: 'legal' },
    { id: 't06_2', opponentStatement: 'We present a pattern of behaviour, not isolated incidents.', opponentPower: 4, isCritical: false, weaknessType: 'procedural' },
    { id: 't06_3', opponentStatement: 'The combined damages represent a full year of Ironclad's design budget—', opponentPower: 5, isCritical: true, weaknessType: 'legal', hint: 'The bad-faith filing counters this entirely.' },
    { id: 't06_4', opponentStatement: 'Ironclad built community trust through consistent visual branding. That trust was exploited.', opponentPower: 4, isCritical: false, weaknessType: 'emotional' },
    { id: 't06_5', opponentStatement: 'Victor Holt worked 80-hour weeks to build this company. He deserves protection.', opponentPower: 3, isCritical: false, weaknessType: 'emotional' },
    { id: 't06_6', opponentStatement: 'The law is on our side. The facts are on our side. The remedy should be decisive.', opponentPower: 5, isCritical: false, weaknessType: 'legal' },
  ],
  resultLines: {
    good: ['Both claims dismissed. Holt nods at Clara — respect between professionals.'],
    okay: ['Partial win. One claim dismissed, one settled on reduced terms.'],
    bad:  ['Ironclad wins the combined hearing. A costly appeal looms.'],
  },
}

// ─── arc_nexus — Nexus Interactive, hard ─────────────────────────────────────

const shift07: LawyerShift = {
  id: 'lawyer_07', arcId: 'arc_nexus', isArcEnd: false,
  caseTitle: 'Nexus v. [Player Studio] — Trade Secret Claim',
  opponentName: 'Lawrence Kade', opponentCompany: 'Nexus Interactive',
  difficulty: 'hard', timeLimitSecs: 360,
  briefingLines: [
    'This is different. Nexus hired Lawrence Kade — the best litigator in the city.',
    'They\'re claiming your studio stole trade secrets from an ex-Nexus developer.',
    'Clara is quiet this morning. She knows what this means.',
  ],
  availableCards: [
    { id: 'c07_sır',      label: 'Ticari Sır Testi',  type: 'legal',      power: 4, description: 'Nexus\'un talep ettiği bilginin ticari sır statüsünü sorgular.' },
    { id: 'c07_kaynak2',  label: 'Bağımsız Geliştirme',type: 'technical',  power: 5, description: 'Stüdyonun söz konusu teknolojiyi bağımsız geliştirdiğini kanıtlar.' },
    { id: 'c07_emsal4',   label: 'Nexus Emsali',       type: 'legal',      power: 4, description: 'Nexus\'un daha önce benzer davayı kaybettiğine dair kayıt.' },
    { id: 'c07_prosedur3',label: 'Yetki İtirazı',      type: 'procedural', power: 4, description: 'Davayı açma yetkisini sorgulayan resmi itiraz.' },
    { id: 'c07_etki',     label: 'Piyasa Baskısı',     type: 'emotional',  power: 3, description: 'Büyük şirketlerin küçük stüdyolara dava yoluyla baskı uygulaması.' },
    { id: 'c07_orijin',   label: 'Menşe Belgesi',      type: 'technical',  power: 4, description: 'Teknolojinin ilk kullanım tarihi ve bağlamı.' },
  ],
  turns: [
    { id: 't07_1', opponentStatement: 'Our client's proprietary rendering pipeline appears verbatim in the defendant's product.', opponentPower: 4, isCritical: false, weaknessType: 'technical' },
    { id: 't07_2', opponentStatement: 'The former Nexus developer had full access to the pipeline before joining the defendant.', opponentPower: 5, isCritical: false, weaknessType: 'legal' },
    { id: 't07_3', opponentStatement: 'We have the timestamps, the source, and the trajectory—', opponentPower: 5, isCritical: true, weaknessType: 'technical', hint: 'The independent development chain predates the employee's departure.' },
    { id: 't07_4', opponentStatement: 'Nexus invested three years developing this pipeline. This theft eliminates a competitive advantage worth millions.', opponentPower: 4, isCritical: false, weaknessType: 'emotional' },
    { id: 't07_5', opponentStatement: 'Mr. Kade will now present the technical exhibit.', opponentPower: 4, isCritical: false, weaknessType: 'procedural' },
    { id: 't07_6', opponentStatement: 'The similarity in implementation is not coincidental. It is systematic.', opponentPower: 5, isCritical: false, weaknessType: 'technical' },
    { id: 't07_7', opponentStatement: 'Nexus stands ready to demonstrate the exact technical overlap to the court.', opponentPower: 4, isCritical: false, weaknessType: 'legal' },
  ],
  resultLines: {
    good: ['Clara holds. The technical independence argument lands. Kade recalibrates.'],
    okay: ['A draw. Kade pushed hard but Clara denied the key exhibit.'],
    bad:  ['Nexus lands the technical exhibit. The case is in serious trouble.'],
  },
}

const shift08: LawyerShift = {
  id: 'lawyer_08', arcId: 'arc_nexus', isArcEnd: false,
  caseTitle: 'Nexus v. [Player Studio] — Counter Attack',
  opponentName: 'Lawrence Kade', opponentCompany: 'Nexus Interactive',
  difficulty: 'hard', timeLimitSecs: 360,
  briefingLines: [
    'Clara wants to go on the offensive. The studio has its own prior art.',
    'If we can show Nexus filed in bad faith, the whole case flips.',
  ],
  availableCards: [
    { id: 'c08_kötüniyet', label: 'Kötü Niyet Kaydı',  type: 'legal',      power: 5, description: 'Nexus\'un daha önce geçersiz IP iddiaları açtığının belgesi.' },
    { id: 'c08_öncelik',   label: 'Öncelikli Sanat',    type: 'technical',  power: 5, description: 'Stüdyonun iddia edilen teknolojinin öncüsü olduğuna dair delil.' },
    { id: 'c08_yıkıcı',    label: 'Çapraz Sorgu',       type: 'procedural', power: 4, description: 'Nexus tanığının çelişkili ifadesine doğrudan müdahale.' },
    { id: 'c08_crane',     label: 'Crane Bağlantısı',   type: 'legal',      power: 4, description: 'Davanın Crane\'in stratejik çıkarlarıyla örtüştüğüne dair delil.' },
    { id: 'c08_tanık2',    label: 'Eski Nexus Çalışanı',type: 'emotional',  power: 3, description: 'Nexus\'tan ayrılan birinin şirket içi iklimi anlatan tanıklığı.' },
    { id: 'c08_belge',     label: 'İç Belge Paketi',    type: 'technical',  power: 4, description: 'Nexus\'un iç yazışmaları davanın motivasyonunu açığa çıkarıyor.' },
  ],
  turns: [
    { id: 't08_1', opponentStatement: 'Prior art claims are a standard diversionary tactic.', opponentPower: 4, isCritical: false, weaknessType: 'legal' },
    { id: 't08_2', opponentStatement: 'The independent development assertion cannot be substantiated.', opponentPower: 5, isCritical: false, weaknessType: 'technical' },
    { id: 't08_3', opponentStatement: 'Bad faith requires showing intent. You have none—', opponentPower: 5, isCritical: true, weaknessType: 'legal', hint: 'The Crane connection email is the intent evidence.' },
    { id: 't08_4', opponentStatement: 'Nexus has never lost a properly filed trade secret case.', opponentPower: 4, isCritical: false, weaknessType: 'legal' },
    { id: 't08_5', opponentStatement: 'Prior complaints about Nexus are irrelevant to the facts of this case.', opponentPower: 4, isCritical: false, weaknessType: 'procedural' },
    { id: 't08_6', opponentStatement: 'My client has devoted its career to legitimate IP development.', opponentPower: 3, isCritical: false, weaknessType: 'emotional' },
    { id: 't08_7', opponentStatement: 'The prior art is not sufficiently similar to constitute a defence.', opponentPower: 5, isCritical: false, weaknessType: 'technical' },
  ],
  resultLines: {
    good: ['The bad-faith argument sticks. The judge looks at Kade with new eyes.'],
    okay: ['Mixed counterattack. Some points landed, the core claim survived.'],
    bad:  ['Kade deflects every counter. The offensive strategy needs rethinking.'],
  },
}

const shift09: LawyerShift = {
  id: 'lawyer_09', arcId: 'arc_nexus', isArcEnd: false,
  caseTitle: 'Nexus v. [Player Studio] — Surprise Evidence',
  opponentName: 'Lawrence Kade', opponentCompany: 'Nexus Interactive',
  difficulty: 'hard', timeLimitSecs: 360,
  briefingLines: [
    'Nexus revealed new evidence this morning. Clara was not prepared for this.',
    'Stay sharp. It\'s going to get worse before it gets better.',
  ],
  availableCards: [
    { id: 'c09_delil',    label: 'Delil Zamanlaması',  type: 'procedural', power: 5, description: 'Yeni delil zamanında açıklanmadı — kabul edilemez.' },
    { id: 'c09_kapsamdışı',label: 'Kapsam Dışı',       type: 'legal',      power: 5, description: 'Yeni delil dava sınırlarını aşıyor, kabul edilemez.' },
    { id: 'c09_bağımsız2', label: 'Bağımsız Doğrulama', type: 'technical',  power: 4, description: 'Üçüncü taraf teknik audit yeni delili çürütüyor.' },
    { id: 'c09_süreç',     label: 'Süreç Manipülasyonu',type: 'procedural', power: 4, description: 'Delil açıklamasının kasıtlı geç yapıldığına dair argüman.' },
    { id: 'c09_istihbarat',label: 'Endüstri Belgesi',   type: 'technical',  power: 5, description: 'Bağımsız yayında yer alan teknik açıklama — öncelik göstergesi.' },
    { id: 'c09_Holt',      label: 'Ironclad Bağlantısı',type: 'legal',      power: 3, description: 'Nexus ve Ironclad arasında koordinasyon olduğuna dair ipucu.' },
  ],
  turns: [
    { id: 't09_1', opponentStatement: 'We have obtained an internal communication that references the disputed pipeline by name.', opponentPower: 5, isCritical: false, weaknessType: 'procedural' },
    { id: 't09_2', opponentStatement: 'This document was discovered during discovery and submitted according to procedure.', opponentPower: 4, isCritical: false, weaknessType: 'legal' },
    { id: 't09_3', opponentStatement: 'The email is dated three weeks before the defendant's first patent filing—', opponentPower: 5, isCritical: true, weaknessType: 'technical', hint: 'The industry publication predates the email.' },
    { id: 't09_4', opponentStatement: 'This document is decisive. The defendant's narrative collapses.', opponentPower: 5, isCritical: false, weaknessType: 'legal' },
    { id: 't09_5', opponentStatement: 'We request the court admit exhibit 47-C as primary evidence.', opponentPower: 4, isCritical: false, weaknessType: 'procedural' },
    { id: 't09_6', opponentStatement: 'My client's investment is now directly threatened by this studio's continued operation.', opponentPower: 4, isCritical: false, weaknessType: 'emotional' },
    { id: 't09_7', opponentStatement: 'Nexus will pursue this case to its conclusion. There will be no settlement.', opponentPower: 5, isCritical: false, weaknessType: 'legal' },
    { id: 't09_8', opponentStatement: 'The studio knew. The employee knew. Everyone in that room knew.', opponentPower: 4, isCritical: false, weaknessType: 'emotional' },
  ],
  resultLines: {
    good: ['The surprise evidence is excluded. Kade's gambit collapses.'],
    okay: ['Exhibit admitted but weakened. The case remains alive.'],
    bad:  ['Exhibit 47-C is admitted. Tomorrow's final hearing starts from behind.'],
  },
}

const shift10: LawyerShift = {
  id: 'lawyer_10', arcId: 'arc_nexus', isArcEnd: true,
  caseTitle: 'Nexus v. [Player Studio] — Final Day',
  opponentName: 'Lawrence Kade', opponentCompany: 'Nexus Interactive',
  difficulty: 'hard', timeLimitSecs: 360,
  briefingLines: [
    'This is it. Whatever happens today is what you live with.',
    'Clara says she\'s ready. She also says she\'s glad you were in her ear.',
  ],
  availableCards: [
    { id: 'c10_kapanış2',  label: 'Nihai Savunma',      type: 'legal',      power: 5, description: 'Tüm arc boyunca biriktirilen argümanların final sentezi.' },
    { id: 'c10_crane2',    label: 'Crane Stratejisi',    type: 'legal',      power: 5, description: 'Davanın Crane\'in stüdyoyu devre dışı bırakma planının parçası olduğu.' },
    { id: 'c10_meta2',     label: 'Bütünleşik Delil',   type: 'technical',  power: 5, description: 'Üç arc boyunca toplanan teknik kanıtların birleşik paketi.' },
    { id: 'c10_kötüniyet2',label: 'Kötü Niyet — Final', type: 'procedural', power: 5, description: 'Davanın başından sonuna uzanan kötü niyet örüntüsü.' },
    { id: 'c10_bağımsız3', label: 'Üçüncü Taraf Audit', type: 'technical',  power: 4, description: 'Mahkeme atanan bağımsız teknik uzmanın final raporu.' },
    { id: 'c10_adalet2',   label: 'Adalet Çağrısı',     type: 'emotional',  power: 4, description: 'Bağımsız yaratıcılara yönelik sistematik baskının son reddi.' },
  ],
  turns: [
    { id: 't10_1', opponentStatement: 'Nexus has proven access, similarity, and intent. The standard is met.', opponentPower: 5, isCritical: false, weaknessType: 'legal' },
    { id: 't10_2', opponentStatement: 'Every counter-argument the defence raised has been addressed and disposed of.', opponentPower: 5, isCritical: false, weaknessType: 'legal' },
    { id: 't10_3', opponentStatement: 'The studio's continued operation represents ongoing harm to Nexus—', opponentPower: 5, isCritical: true, weaknessType: 'legal', hint: 'The bad-faith pattern argument is your strongest card here.' },
    { id: 't10_4', opponentStatement: 'Mr. Kade would like to remind the court of the scale of investment at risk.', opponentPower: 4, isCritical: false, weaknessType: 'emotional' },
    { id: 't10_5', opponentStatement: 'We ask for injunctive relief in addition to damages.', opponentPower: 5, isCritical: false, weaknessType: 'procedural' },
    { id: 't10_6', opponentStatement: 'This is not about one studio. This is about the integrity of IP protection industry-wide.', opponentPower: 4, isCritical: false, weaknessType: 'emotional' },
    { id: 't10_7', opponentStatement: 'Nexus rests its case.', opponentPower: 5, isCritical: false, weaknessType: 'legal' },
  ],
  resultLines: {
    good: ['The case is dismissed. Clara exhales. Outside, Kade is already on his phone.'],
    okay: ['Narrow victory. The studio survives, but Nexus files notice of appeal.'],
    bad:  ['Partial loss. Damages awarded. The studio will feel this.'],
  },
}

export const LAWYER_SHIFTS: LawyerShift[] = [
  shift01, shift02, shift03,
  shift04, shift05, shift06,
  shift07, shift08, shift09, shift10,
]
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun"
npx tsc --noEmit --project tsconfig.app.json 2>&1 | grep "lawyerShifts"
```

Expected: no errors mentioning `lawyerShifts.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/data/lawyerShifts.ts
git commit -m "feat: lawyerShifts data — 10 sessions, 3 arcs, ArgumentCard/LegalTurn interfaces"
```

---

## Task 2: Seed Integration

**Files:**
- Modify: `src/data/npcDialogues.ts` (lines 1–13 approximately)
- Modify: `src/store/ideaSeedStore.ts` (EMPTY constant)
- Modify: `src/data/lifePathData.ts` (PATH_NPC_MAP)

- [ ] **Step 1: Add `'hukuk'` to `IdeaSeedType` in `npcDialogues.ts`**

Find the line:
```typescript
export type IdeaSeedType = 'nostalji' | 'hikaye' | 'kaos' | 'zaman_yonetimi' | 'analiz' | 'sosyallik' | 'game_history'
```
Replace with:
```typescript
export type IdeaSeedType = 'nostalji' | 'hikaye' | 'kaos' | 'zaman_yonetimi' | 'analiz' | 'sosyallik' | 'game_history' | 'hukuk'
```

- [ ] **Step 2: Add `hukuk` entry to `IDEA_SEED_META` in `npcDialogues.ts`**

Find the closing `}` of `IDEA_SEED_META` (after the `game_history` entry). Add before the closing brace:
```typescript
  game_history:   { label: 'Oyun Tarihi',     color: '#f97316', emoji: '🕹️' },
  hukuk:          { label: 'Hukuk',            color: '#6366f1', emoji: '⚖️' },
```

- [ ] **Step 3: Add `hukuk: 0` to `EMPTY` in `ideaSeedStore.ts`**

Find:
```typescript
const EMPTY: SeedCounts = {
  nostalji:       0,
  hikaye:         0,
  kaos:           0,
  zaman_yonetimi: 0,
  analiz:         0,
  sosyallik:      0,
  game_history:   0,
}
```
Replace with:
```typescript
const EMPTY: SeedCounts = {
  nostalji:       0,
  hikaye:         0,
  kaos:           0,
  zaman_yonetimi: 0,
  analiz:         0,
  sosyallik:      0,
  game_history:   0,
  hukuk:          0,
}
```

- [ ] **Step 4: Add `'clara'` to `emek` in `PATH_NPC_MAP` in `lifePathData.ts`**

Find:
```typescript
  emek:  ['theo', 'soren'],
```
Replace with:
```typescript
  emek:  ['theo', 'soren', 'clara'],
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -E "npcDialogues|ideaSeedStore|lifePathData"
```

Expected: no errors from these files.

- [ ] **Step 6: Commit**

```bash
git add src/data/npcDialogues.ts src/store/ideaSeedStore.ts src/data/lifePathData.ts
git commit -m "feat: hukuk seed — IdeaSeedType, IDEA_SEED_META, EMPTY, emek PATH_NPC_MAP"
```

---

## Task 3: Store — `src/store/lawyerStore.ts` + Tests

**Files:**
- Create: `src/store/lawyerStore.ts`
- Create: `src/store/lawyerStore.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `src/store/lawyerStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useLawyerStore } from './lawyerStore'
import { useIdeaSeedStore } from './ideaSeedStore'
import { useLifePathStore } from './lifePathStore'

beforeEach(() => {
  useLawyerStore.setState({
    completedShifts: [],
    activeShift: null,
    phase: 'idle',
    argumentScore: 0,
    usedCardIds: [],
  })
  useIdeaSeedStore.setState({
    seeds: {
      nostalji: 0, hikaye: 0, kaos: 0, zaman_yonetimi: 0,
      analiz: 0, sosyallik: 0, game_history: 0, hukuk: 0,
    },
  })
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
})

describe('lawyerStore', () => {
  it('başlangıçta idle phase', () => {
    expect(useLawyerStore.getState().phase).toBe('idle')
  })

  it('startShift: idle → briefing', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    expect(useLawyerStore.getState().phase).toBe('briefing')
    expect(useLawyerStore.getState().activeShift?.id).toBe('lawyer_01')
  })

  it('startShift: phase guard — aktif shift varken yeni başlamaz', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().startShift('lawyer_02')
    expect(useLawyerStore.getState().activeShift?.id).toBe('lawyer_01')
  })

  it('startShift: bilinmeyen id — hiçbir şey yapmaz', () => {
    useLawyerStore.getState().startShift('lawyer_99')
    expect(useLawyerStore.getState().phase).toBe('idle')
  })

  it('advanceFromBriefing: briefing → session', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().advanceFromBriefing()
    expect(useLawyerStore.getState().phase).toBe('session')
  })

  it('advanceFromBriefing: phase guard — session dışından çağrılamaz', () => {
    useLawyerStore.getState().advanceFromBriefing()
    expect(useLawyerStore.getState().phase).toBe('idle')
  })

  it('recordSessionResult: session → result (non-arc-end)', () => {
    useLawyerStore.getState().startShift('lawyer_01') // isArcEnd: false
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(70, [])
    expect(useLawyerStore.getState().phase).toBe('result')
    expect(useLawyerStore.getState().argumentScore).toBe(70)
  })

  it('recordSessionResult: session → cross_exam (arc-end)', () => {
    useLawyerStore.getState().startShift('lawyer_03') // isArcEnd: true
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(60, ['c03_kapanış'])
    expect(useLawyerStore.getState().phase).toBe('cross_exam')
    expect(useLawyerStore.getState().usedCardIds).toEqual(['c03_kapanış'])
  })

  it('recordCrossExamResult: cross_exam → result, score capped at 100', () => {
    useLawyerStore.getState().startShift('lawyer_03')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(80, [])
    useLawyerStore.getState().recordCrossExamResult(20) // bonus
    expect(useLawyerStore.getState().phase).toBe('result')
    expect(useLawyerStore.getState().argumentScore).toBe(100)
  })

  it('recordCrossExamResult: score cannot exceed 100', () => {
    useLawyerStore.getState().startShift('lawyer_03')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(95, [])
    useLawyerStore.getState().recordCrossExamResult(30)
    expect(useLawyerStore.getState().argumentScore).toBe(100)
  })

  it('endShift: tier good — distributes correct seeds', () => {
    useLawyerStore.getState().startShift('lawyer_01') // easy → opponentScore 45
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(75, []) // 75 >= 45 + 15 → good
    useLawyerStore.getState().endShift()
    expect(useIdeaSeedStore.getState().seeds.hukuk).toBe(3)
    expect(useLifePathStore.getState().progress.emek).toBe(5)
  })

  it('endShift: tier okay — distributes correct seeds', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(50, []) // 50 < 45 + 15, 50 >= 45 → okay
    useLawyerStore.getState().endShift()
    expect(useIdeaSeedStore.getState().seeds.hukuk).toBe(2)
    expect(useLifePathStore.getState().progress.emek).toBe(3)
  })

  it('endShift: tier bad — distributes correct seeds', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(30, []) // 30 < 45 → bad
    useLawyerStore.getState().endShift()
    expect(useIdeaSeedStore.getState().seeds.hukuk).toBe(1)
    expect(useLifePathStore.getState().progress.emek).toBe(1)
  })

  it('endShift: session_10 bonus — +5 hukuk', () => {
    useLawyerStore.getState().startShift('lawyer_10')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(90, [])
    useLawyerStore.getState().recordCrossExamResult(0)
    const result = useLawyerStore.getState().endShift()
    // tier good (90 >= 70+15=85 → good: 3) + session10 bonus 5 = 8
    expect(result?.hukukSeeds).toBe(8)
    expect(useIdeaSeedStore.getState().seeds.hukuk).toBe(8)
  })

  it('endShift: returns to idle, clears activeShift', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(70, [])
    useLawyerStore.getState().endShift()
    expect(useLawyerStore.getState().phase).toBe('idle')
    expect(useLawyerStore.getState().activeShift).toBeNull()
  })

  it('endShift: adds to completedShifts', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().advanceFromBriefing()
    useLawyerStore.getState().recordSessionResult(70, [])
    useLawyerStore.getState().endShift()
    expect(useLawyerStore.getState().completedShifts).toContain('lawyer_01')
  })

  it('endShift: phase guard — result 외 phase에서 null 반환', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().advanceFromBriefing()
    const result = useLawyerStore.getState().endShift() // still in session phase
    expect(result).toBeNull()
  })

  it('reset: tüm alanları temizler', () => {
    useLawyerStore.getState().startShift('lawyer_01')
    useLawyerStore.getState().reset()
    expect(useLawyerStore.getState().phase).toBe('idle')
    expect(useLawyerStore.getState().activeShift).toBeNull()
    expect(useLawyerStore.getState().completedShifts).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npx vitest run src/store/lawyerStore.test.ts 2>&1 | tail -20
```

Expected: multiple FAIL (module not found).

- [ ] **Step 3: Create `src/store/lawyerStore.ts`**

```typescript
// src/store/lawyerStore.ts
import { create } from 'zustand'
import { LAWYER_SHIFTS } from '@/data/lawyerShifts'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { LawyerShift } from '@/data/lawyerShifts'

export type LawyerPhase = 'idle' | 'briefing' | 'session' | 'cross_exam' | 'result'

export interface LawyerSessionResult {
  hukukSeeds: number
  emekProgress: number
  tier: 'good' | 'okay' | 'bad'
}

interface LawyerStoreState {
  completedShifts: string[]
  activeShift:     LawyerShift | null
  phase:           LawyerPhase
  argumentScore:   number        // 0–100, set by scene callback
  usedCardIds:     string[]      // populated by scene callback, used in cross_exam overlay

  startShift(id: string): void
  advanceFromBriefing(): void
  recordSessionResult(argumentScore: number, usedCardIds: string[]): void
  recordCrossExamResult(bonus: number): void
  endShift(): LawyerSessionResult | null
  reset(): void
}

function getOpponentScore(difficulty: 'easy' | 'normal' | 'hard'): number {
  if (difficulty === 'easy')   return 45
  if (difficulty === 'normal') return 58
  return 70
}

function calcTier(
  argumentScore: number,
  difficulty: 'easy' | 'normal' | 'hard',
): 'good' | 'okay' | 'bad' {
  const opp = getOpponentScore(difficulty)
  if (argumentScore >= opp + 15) return 'good'
  if (argumentScore < opp)       return 'bad'
  return 'okay'
}

function calcReward(
  tier: 'good' | 'okay' | 'bad',
  isSession10: boolean,
): { hukuk: number; emek: number } {
  let hukuk: number
  let emek: number
  if (tier === 'good')      { hukuk = 3; emek = 5 }
  else if (tier === 'okay') { hukuk = 2; emek = 3 }
  else                      { hukuk = 1; emek = 1 }
  if (isSession10) hukuk += 5
  return { hukuk, emek }
}

const INITIAL: Omit<LawyerStoreState,
  'startShift' | 'advanceFromBriefing' | 'recordSessionResult' |
  'recordCrossExamResult' | 'endShift' | 'reset'
> = {
  completedShifts: [],
  activeShift:     null,
  phase:           'idle',
  argumentScore:   0,
  usedCardIds:     [],
}

export const useLawyerStore = create<LawyerStoreState>((set, get) => ({
  ...INITIAL,

  startShift(id) {
    if (get().activeShift !== null) return
    const found = LAWYER_SHIFTS.find(s => s.id === id)
    if (!found) return
    set({ activeShift: found, phase: 'briefing', argumentScore: 0, usedCardIds: [] })
  },

  advanceFromBriefing() {
    if (get().phase !== 'briefing') return
    set({ phase: 'session' })
  },

  recordSessionResult(argumentScore, usedCardIds) {
    if (get().phase !== 'session') return
    const { activeShift } = get()
    if (!activeShift) return
    const nextPhase: LawyerPhase = activeShift.isArcEnd ? 'cross_exam' : 'result'
    set({ argumentScore, usedCardIds, phase: nextPhase })
  },

  recordCrossExamResult(bonus) {
    if (get().phase !== 'cross_exam') return
    const newScore = Math.min(100, get().argumentScore + bonus)
    set({ argumentScore: newScore, phase: 'result' })
  },

  endShift() {
    if (get().phase !== 'result') return null
    const { activeShift, argumentScore } = get()
    if (!activeShift) return null

    const tier = calcTier(argumentScore, activeShift.difficulty)
    const isSession10 = activeShift.id === 'lawyer_10'
    const { hukuk, emek } = calcReward(tier, isSession10)

    useIdeaSeedStore.getState().addSeed('hukuk', hukuk)
    useLifePathStore.getState().addProgress('emek', emek)

    const result: LawyerSessionResult = { hukukSeeds: hukuk, emekProgress: emek, tier }

    set(s => ({
      completedShifts: [...s.completedShifts, activeShift.id],
      activeShift:     null,
      phase:           'idle',
      argumentScore:   0,
      usedCardIds:     [],
    }))

    return result
  },

  reset() {
    set({ ...INITIAL })
  },
}))
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run src/store/lawyerStore.test.ts 2>&1 | tail -30
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/lawyerStore.ts src/store/lawyerStore.test.ts
git commit -m "feat: lawyerStore — phase machine, tier rewards, hukuk seed distribution"
```

---

## Task 4: PixiJS Scene — `src/pixi/LegalScene.ts`

**Files:**
- Create: `src/pixi/LegalScene.ts`

This scene renders the split-screen courtroom. Left 60%: meeting room with Clara and opponent figures + scrolling statement text. Right 40%: player's card grid. Timer bar appears at top for `isCritical` turns only.

The scene manages turns and card use internally. When all turns complete, it fires `onSessionEnd(argumentScore, usedCardIds)`.

- [ ] **Step 1: Create `src/pixi/LegalScene.ts`**

```typescript
// src/pixi/LegalScene.ts
import { Application, Graphics, Text, TextStyle } from 'pixi.js'
import type { LegalTurn, ArgumentCard } from '@/data/lawyerShifts'

export class LegalScene {
  private _app!: Application
  private _turns: LegalTurn[] = []
  private _cards: ArgumentCard[] = []
  private _usedCardIds: string[] = []
  private _totalPower = 0
  private _currentTurnIdx = 0
  private _timerHandle: ReturnType<typeof setInterval> | null = null
  private _timerRemaining = 0
  private _timerBar!: Graphics
  private _statementText!: Text
  private _hintText!: Text
  private _cardGraphics: Map<string, Graphics> = new Map()
  private _opponentLabel!: Text

  onSessionEnd!: (argumentScore: number, usedCardIds: string[]) => void

  private constructor() {}

  static async create(
    canvas: HTMLCanvasElement,
    turns: LegalTurn[],
    cards: ArgumentCard[],
    opponentName: string,
    onSessionEnd: (argumentScore: number, usedCardIds: string[]) => void,
  ): Promise<LegalScene> {
    const scene = new LegalScene()
    scene._app = new Application()
    await scene._app.init({
      canvas,
      width:      canvas.clientWidth  || 800,
      height:     canvas.clientHeight || 500,
      background: 0x0d0d1a,
      antialias:  false,
    })
    scene._turns        = turns
    scene._cards        = cards
    scene.onSessionEnd  = onSessionEnd
    scene._setup(opponentName)
    return scene
  }

  private _setup(opponentName: string): void {
    const { width, height } = this._app.screen
    const splitX = Math.floor(width * 0.6)

    // Backgrounds
    const leftBg  = new Graphics().rect(0,       0, splitX,          height).fill(0x1a1a2e)
    const rightBg = new Graphics().rect(splitX,  0, width - splitX,  height).fill(0x16213e)
    const divider = new Graphics().rect(splitX - 1, 0, 2,            height).fill(0x3a3a5a)
    this._app.stage.addChild(leftBg, rightBg, divider)

    // Panel labels
    const labelStyle = new TextStyle({ fill: 0x6666aa, fontSize: 10, fontFamily: 'monospace' })
    const leftLbl  = new Text({ text: 'TOPLANTI ODASI', style: labelStyle })
    leftLbl.x = 12; leftLbl.y = 8
    const rightLbl = new Text({ text: 'MASANIZ', style: labelStyle })
    rightLbl.x = splitX + 12; rightLbl.y = 8

    // Clara figure
    const claraFig = new Graphics().rect(32, 80, 44, 72).fill(0x2a4066)
    const claraLbl = new Text({ text: 'Clara', style: new TextStyle({ fill: 0x6699cc, fontSize: 10, fontFamily: 'monospace' }) })
    claraLbl.x = 40; claraLbl.y = 156

    // Opponent figure
    const oppFig = new Graphics().rect(splitX - 84, 80, 44, 72).fill(0x5a2222)
    this._opponentLabel = new Text({ text: opponentName, style: new TextStyle({ fill: 0xcc6666, fontSize: 10, fontFamily: 'monospace' }) })
    this._opponentLabel.x = splitX - 84; this._opponentLabel.y = 156

    // Statement text — centre of left panel
    this._statementText = new Text({
      text: '',
      style: new TextStyle({
        fill: 0xccccdd, fontSize: 12, fontFamily: 'monospace',
        wordWrap: true, wordWrapWidth: splitX - 160, lineHeight: 18,
      }),
    })
    this._statementText.x = 100; this._statementText.y = 100

    // Hint text (small, bottom of left panel)
    this._hintText = new Text({
      text: '',
      style: new TextStyle({ fill: 0x888844, fontSize: 10, fontFamily: 'monospace', wordWrap: true, wordWrapWidth: splitX - 40 }),
    })
    this._hintText.x = 16; this._hintText.y = height - 30

    this._app.stage.addChild(leftLbl, rightLbl, claraFig, claraLbl, oppFig, this._opponentLabel, this._statementText, this._hintText)

    // Timer bar — hidden by default
    this._timerBar = new Graphics()
    this._timerBar.visible = false
    this._app.stage.addChild(this._timerBar)

    // Card grid (right panel)
    this._buildCardGrid(splitX, width, height)

    // Start first turn
    this._showTurn(0)
  }

  private _buildCardGrid(splitX: number, width: number, height: number): void {
    const cardW = Math.floor((width - splitX - 40) / 2) - 8
    const cardH = 64
    const gap   = 8
    const cols  = 2
    const startX = splitX + 16
    const startY = 28

    this._cards.forEach((card, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const x   = startX + col * (cardW + gap)
      const y   = startY + row * (cardH + gap)

      const g = new Graphics()
      g.rect(0, 0, cardW, cardH).fill(0x262640).stroke({ color: 0x4a4a7a, width: 1 })
      g.x = x; g.y = y
      g.interactive = true
      g.cursor = 'pointer'

      const typeColors: Record<ArgumentCard['type'], number> = {
        legal:      0x6699ff,
        technical:  0x66dd99,
        emotional:  0xff9966,
        procedural: 0xdddd66,
      }

      const typeDot = new Graphics().circle(cardW - 10, 10, 5).fill(typeColors[card.type])
      const lbl = new Text({ text: card.label, style: new TextStyle({ fill: 0xddddff, fontSize: 9, fontFamily: 'monospace', wordWrap: true, wordWrapWidth: cardW - 20 }) })
      lbl.x = 4; lbl.y = 4
      const pwr = new Text({ text: `★${card.power}`, style: new TextStyle({ fill: 0xffcc44, fontSize: 10, fontFamily: 'monospace' }) })
      pwr.x = cardW - 26; pwr.y = cardH - 16

      g.addChild(typeDot, lbl, pwr)
      g.on('pointerdown', () => this._onCardClick(card.id))

      this._app.stage.addChild(g)
      this._cardGraphics.set(card.id, g)
    })
  }

  private _onCardClick(cardId: string): void {
    if (this._usedCardIds.includes(cardId)) return
    const card = this._cards.find(c => c.id === cardId)
    if (!card) return

    this._usedCardIds.push(cardId)
    this._totalPower += card.power

    const g = this._cardGraphics.get(cardId)
    if (g) { g.tint = 0x444455; g.interactive = false; g.cursor = 'default' }

    this._clearTimer()
    this._nextTurn()
  }

  private _showTurn(index: number): void {
    if (index >= this._turns.length) {
      this._endSession()
      return
    }
    const turn = this._turns[index]
    this._statementText.text = turn.opponentStatement
    this._hintText.text = turn.hint ?? ''

    if (turn.isCritical) {
      this._startTimer(8)
    }
  }

  private _nextTurn(): void {
    this._currentTurnIdx++
    this._showTurn(this._currentTurnIdx)
  }

  private _startTimer(seconds: number): void {
    this._timerRemaining = seconds
    this._timerBar.visible = true
    this._drawTimerBar(1.0)

    this._timerHandle = setInterval(() => {
      this._timerRemaining -= 0.1
      const ratio = Math.max(0, this._timerRemaining / seconds)
      this._drawTimerBar(ratio)
      if (this._timerRemaining <= 0) {
        this._clearTimer()
        this._nextTurn() // auto-skip: no power gained
      }
    }, 100)
  }

  private _drawTimerBar(ratio: number): void {
    const { width } = this._app.screen
    const color = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xcccc44 : 0xcc4444
    this._timerBar.clear().rect(0, 0, Math.floor(width * ratio), 5).fill(color)
  }

  private _clearTimer(): void {
    if (this._timerHandle !== null) {
      clearInterval(this._timerHandle)
      this._timerHandle = null
    }
    this._timerBar.visible = false
  }

  private _endSession(): void {
    const maxPower = this._turns.length * 5
    const argumentScore = maxPower === 0
      ? 0
      : Math.min(100, Math.round(this._totalPower / maxPower * 100))
    this.onSessionEnd(argumentScore, [...this._usedCardIds])
  }

  destroy(): void {
    this._clearTimer()
    this._cardGraphics.clear()
    this._app.destroy()
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --project tsconfig.app.json 2>&1 | grep "LegalScene"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pixi/LegalScene.ts
git commit -m "feat: LegalScene — split-screen courtroom, card grid, critical-turn timer"
```

---

## Task 5: React Panel — `src/components/LawyerPanel.tsx`

**Files:**
- Create: `src/components/LawyerPanel.tsx`

- [ ] **Step 1: Create `src/components/LawyerPanel.tsx`**

```typescript
// src/components/LawyerPanel.tsx
import { useEffect, useRef, useState } from 'react'
import { useWorldStore }   from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useLawyerStore }  from '@/store/lawyerStore'
import { LAWYER_SHIFTS }   from '@/data/lawyerShifts'
import { LegalScene }      from '@/pixi/LegalScene'
import type { LawyerSessionResult } from '@/store/lawyerStore'

type PanelPhase = 'briefing' | 'session' | 'cross_exam' | 'result'

const ARC_LABELS: Record<string, string> = {
  arc_indie: 'Arc I — New Beginnings',
  arc_rival: 'Arc II — Contested Ground',
  arc_nexus: 'Arc III — The Weight of It',
}

const DIFF_COLORS: Record<string, string> = {
  easy:   'text-green-400',
  normal: 'text-yellow-400',
  hard:   'text-red-400',
}

const TIER_COLORS: Record<string, string> = {
  good: 'text-green-400',
  okay: 'text-yellow-400',
  bad:  'text-red-400',
}

export default function LawyerPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  const activeShift     = useLawyerStore((s) => s.activeShift)
  const completedShifts = useLawyerStore((s) => s.completedShifts)
  const storePhase      = useLawyerStore((s) => s.phase)
  const usedCardIds     = useLawyerStore((s) => s.usedCardIds)

  const [panelPhase, setPanelPhase] = useState<PanelPhase>('briefing')
  const [sessionResult, setSessionResult] = useState<LawyerSessionResult | null>(null)

  // Cross-exam selection
  const [crossSelected, setCrossSelected] = useState<string[]>([])

  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const sceneRef   = useRef<LegalScene | null>(null)

  // Pause clock while panel is open
  useEffect(() => {
    setIsPaused(true)
    return () => setIsPaused(false)
  }, [setIsPaused])

  // Escape closes from briefing or result
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && (panelPhase === 'briefing' || panelPhase === 'result')) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelPhase])

  // Mount LegalScene when panelPhase === 'session'
  useEffect(() => {
    if (panelPhase !== 'session') return
    if (!canvasRef.current) return
    if (!activeShift) return

    let cancelled = false
    const canvas = canvasRef.current

    LegalScene.create(
      canvas,
      activeShift.turns,
      activeShift.availableCards,
      activeShift.opponentName,
      (argumentScore, usedIds) => {
        if (cancelled) return
        useLawyerStore.getState().recordSessionResult(argumentScore, usedIds)
        if (activeShift.isArcEnd) {
          setCrossSelected([])
          setPanelPhase('cross_exam')
        } else {
          setPanelPhase('result')
        }
        sceneRef.current?.destroy()
        sceneRef.current = null
      },
    ).then((scene) => {
      if (cancelled) { scene.destroy(); return }
      sceneRef.current = scene
    })

    return () => {
      cancelled = true
      sceneRef.current?.destroy()
      sceneRef.current = null
    }
  }, [panelPhase, activeShift])

  function close() {
    sceneRef.current?.destroy()
    sceneRef.current = null
    useLawyerStore.getState().reset()
    setLocation(null)
  }

  function handlePickShift(shiftId: string) {
    useLawyerStore.getState().startShift(shiftId)
    useLawyerStore.getState().advanceFromBriefing()
    setPanelPhase('session')
  }

  function handleCrossExamSubmit() {
    if (crossSelected.length !== 2) return
    const cards = activeShift!.availableCards.filter(c => crossSelected.includes(c.id))
    const bonus = cards.reduce((sum, c) => sum + c.power * 2, 0)
    useLawyerStore.getState().recordCrossExamResult(bonus)
    setPanelPhase('result')
  }

  function handleEndShift() {
    const result = useLawyerStore.getState().endShift()
    setSessionResult(result)
  }

  function toggleCrossCard(cardId: string) {
    setCrossSelected(prev => {
      if (prev.includes(cardId)) return prev.filter(id => id !== cardId)
      if (prev.length >= 2) return prev
      return [...prev, cardId]
    })
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  function renderBriefing() {
    const available = LAWYER_SHIFTS.filter(s => !completedShifts.includes(s.id))

    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Clara — Avukatlık</div>
        {available.length === 0 && (
          <div className="text-gray-400 text-sm">Tüm davalar tamamlandı.</div>
        )}
        {['arc_indie', 'arc_rival', 'arc_nexus'].map(arcId => {
          const arcShifts = available.filter(s => s.arcId === arcId)
          if (arcShifts.length === 0) return null
          return (
            <div key={arcId} className="mb-2">
              <div className="text-xs text-gray-500 mb-1">{ARC_LABELS[arcId]}</div>
              {arcShifts.map(shift => (
                <button
                  key={shift.id}
                  onClick={() => handlePickShift(shift.id)}
                  className="w-full text-left px-3 py-2 mb-1 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-indigo-600 rounded text-sm text-gray-200 transition-colors"
                >
                  <span className="font-medium">{shift.caseTitle}</span>
                  <span className={`ml-2 text-xs ${DIFF_COLORS[shift.difficulty]}`}>
                    {shift.difficulty}
                  </span>
                  {shift.isArcEnd && (
                    <span className="ml-2 text-xs text-yellow-500">arc sonu</span>
                  )}
                </button>
              ))}
            </div>
          )
        })}
        <button
          onClick={close}
          className="mt-2 px-3 py-1 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded self-start"
        >
          [ESC] Kapat
        </button>
      </div>
    )
  }

  function renderSession() {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-1 text-xs text-gray-600 border-b border-gray-800">
          {activeShift?.caseTitle}
          <span className="ml-2 text-gray-700">— {activeShift?.opponentCompany}</span>
        </div>
        <canvas ref={canvasRef} className="flex-1 w-full" />
      </div>
    )
  }

  function renderCrossExam() {
    const remaining = activeShift!.availableCards.filter(c => !usedCardIds.includes(c.id))

    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-sm text-yellow-400 font-medium">Çapraz Sorgu</div>
        <div className="text-xs text-gray-400 mb-2">
          Clara tanığa soru soruyor. 2 kart seç — en güçlü kombinasyonu bul.
        </div>
        <div className="grid grid-cols-2 gap-2">
          {remaining.map(card => {
            const selected = crossSelected.includes(card.id)
            const disabled = !selected && crossSelected.length >= 2
            return (
              <button
                key={card.id}
                onClick={() => toggleCrossCard(card.id)}
                disabled={disabled}
                className={`p-2 text-left border rounded text-xs transition-colors
                  ${selected ? 'border-indigo-500 bg-indigo-950 text-indigo-200' : 'border-gray-700 bg-gray-900 text-gray-300'}
                  ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-gray-500'}
                `}
              >
                <div className="font-medium">{card.label}</div>
                <div className="text-yellow-500 mt-1">★{card.power}</div>
              </button>
            )
          })}
          {remaining.length === 0 && (
            <div className="col-span-2 text-gray-500 text-xs">Kullanılabilir kart kalmadı.</div>
          )}
        </div>
        <button
          onClick={handleCrossExamSubmit}
          disabled={crossSelected.length !== 2 && remaining.length > 0}
          className="mt-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm text-white"
        >
          Clara'ya İlet ({crossSelected.length}/2)
        </button>
      </div>
    )
  }

  function renderResult() {
    const result = sessionResult

    if (!result) {
      return (
        <div className="p-4">
          <button
            onClick={handleEndShift}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded text-sm text-white"
          >
            Sonucu Gör
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest">Oturum Sonu</div>
        <div className={`text-lg font-bold ${TIER_COLORS[result.tier]}`}>
          {result.tier === 'good' ? 'Kazandı' : result.tier === 'okay' ? 'Berabere' : 'Kaybetti'}
        </div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Hukuk tohumu: <span className="text-indigo-400">+{result.hukukSeeds}</span></div>
          <div>Emek yolu: <span className="text-blue-400">+{result.emekProgress}</span></div>
          {activeShift && (
            <div className="mt-2 text-gray-600 border-t border-gray-800 pt-2">
              Karşı taraf: <span className="text-gray-500">{activeShift.opponentName}</span>
              {' · '}
              <span className="text-gray-600">{activeShift.opponentCompany}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={close}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300"
          >
            Kapat
          </button>
        </div>
      </div>
    )
  }

  // ── Phase router ───────────────────────────────────────────────────────────

  // Sync store phase → panel phase for cross_exam edge case when store resets externally
  useEffect(() => {
    if (storePhase === 'idle' && panelPhase !== 'briefing') {
      setPanelPhase('briefing')
      setSessionResult(null)
    }
  }, [storePhase])

  return (
    <div
      className="bg-gray-950/97 border border-indigo-900 rounded-xl shadow-2xl flex flex-col font-mono overflow-hidden"
      style={{ width: panelPhase === 'session' ? '800px' : '440px', height: panelPhase === 'session' ? '520px' : 'auto', minHeight: '200px' }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <span className="text-xs text-indigo-400 tracking-widest">AVUKAT ASİSTANLIĞI</span>
        {(panelPhase === 'briefing' || panelPhase === 'result') && (
          <button onClick={close} className="text-gray-600 hover:text-gray-400 text-xs">✕</button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {panelPhase === 'briefing'   && renderBriefing()}
        {panelPhase === 'session'    && renderSession()}
        {panelPhase === 'cross_exam' && renderCrossExam()}
        {panelPhase === 'result'     && renderResult()}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --project tsconfig.app.json 2>&1 | grep "LawyerPanel"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/LawyerPanel.tsx
git commit -m "feat: LawyerPanel — briefing/session/cross_exam/result, LegalScene mount"
```

---

## Task 6: World Integration

**Files:**
- Modify: `src/store/worldStore.ts`
- Modify: `src/pixi/TriggerSystem.ts`
- Modify: `src/pixi/rooms/cityRoom.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `'lawyers_office'` to `LocationId` in `worldStore.ts`**

Find the `LocationId` type (currently ends with `'arcade' | 'sleep' | null`). Add `'lawyers_office'`:

```typescript
export type LocationId = 'cafe' | 'fair' | 'akademi' | 'sahaf' | 'balikci' | 'pub' | 'bar' | 'detective' | 'nehir' | 'arcade' | 'lawyers_office' | 'sleep' | null
```

- [ ] **Step 2: Add `clara_door` to `LOCATION_MAP` in `TriggerSystem.ts`**

Find:
```typescript
  arcade_door:   'arcade',
```
Add after it:
```typescript
  arcade_door:      'arcade',
  clara_door:       'lawyers_office',
```

- [ ] **Step 3: Add law office building and trigger to `cityRoom.ts`**

Find the buildings array. Add after the `arcade` entry:
```typescript
    { id: 'arcade',      col: 34, row: 0,  cols: 6,  rows: 5,  label: 'Arcade',      style: 'city'       },
    { id: 'law_office',  col: 24, row: 0,  cols: 6,  rows: 5,  label: 'Hukuk Bürosu', style: 'city'      },
```

Find the triggers array. Add after the `arcade_door` entry:
```typescript
    { name: 'arcade_door',  x: 1120, y: 96, w: 32, h: 32 },
    { name: 'clara_door',   x: 800,  y: 96, w: 32, h: 32 },
```

- [ ] **Step 4: Add `LawyerPanel` to `App.tsx`**

Add the import (after the `ArcadePanel` import line):
```typescript
import LawyerPanel   from '@/components/LawyerPanel'
```

Find the arcade render block:
```typescript
      {currentLocation === 'arcade' && (
        <div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center">
          <ArcadePanel />
        </div>
      )}
```

Add after it:
```typescript
      {currentLocation === 'lawyers_office' && (
        <div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center">
          <LawyerPanel />
        </div>
      )}
```

- [ ] **Step 5: Verify TypeScript compiles (full project)**

```bash
npx tsc --noEmit --project tsconfig.app.json 2>&1 | head -30
```

Expected: no new errors from files touched in this task.

- [ ] **Step 6: Commit**

```bash
git add src/store/worldStore.ts src/pixi/TriggerSystem.ts src/pixi/rooms/cityRoom.ts src/App.tsx
git commit -m "feat: world integration — lawyers_office LocationId, clara_door trigger, city room, App render"
```

---

## Task 7: Fix Seed Test Snapshots — `skillTreeStore.test.ts`

Adding `hukuk` to `IdeaSeedType` means all hardcoded seed objects in the test file must include the new field.

**Files:**
- Modify: `src/store/skillTreeStore.test.ts`

- [ ] **Step 1: Run existing tests to see current failures**

```bash
npx vitest run src/store/skillTreeStore.test.ts 2>&1 | tail -20
```

Expected: failures about missing `hukuk` key in seed objects.

- [ ] **Step 2: Update `beforeEach` seed object**

Find:
```typescript
    seeds: { nostalji: 10, hikaye: 10, kaos: 10, zaman_yonetimi: 10, analiz: 10, sosyallik: 10, game_history: 10 },
```
Replace with:
```typescript
    seeds: { nostalji: 10, hikaye: 10, kaos: 10, zaman_yonetimi: 10, analiz: 10, sosyallik: 10, game_history: 10, hukuk: 10 },
```

- [ ] **Step 3: Update all other seed objects in the file**

Search for every `{ nostalji: 0` pattern (tests that set specific seeds to 0). For each one, add `hukuk: 0` or `hukuk: 10` to match the test's intent (use the same value as the neighbouring fields — if a test sets `nostalji: 0` to test insufficient seeds, set `hukuk: 10` to leave it available; if it's a full-reset object, use `hukuk: 0`).

Typical pattern to update (appears multiple times):
```typescript
// BEFORE
useIdeaSeedStore.setState({ seeds: { nostalji: 0, hikaye: 10, kaos: 10, zaman_yonetimi: 10, analiz: 10, sosyallik: 10, game_history: 10 } })
// AFTER
useIdeaSeedStore.setState({ seeds: { nostalji: 0, hikaye: 10, kaos: 10, zaman_yonetimi: 10, analiz: 10, sosyallik: 10, game_history: 10, hukuk: 10 } })
```

Run grep to find all instances:
```bash
grep -n "nostalji:" src/store/skillTreeStore.test.ts
```

Update every line found.

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx vitest run src/store/skillTreeStore.test.ts 2>&1 | tail -15
```

Expected: all PASS.

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: lawyerStore tests pass, skillTreeStore tests pass, no regressions.

- [ ] **Step 6: Commit**

```bash
git add src/store/skillTreeStore.test.ts
git commit -m "fix: skillTreeStore tests — add hukuk field to all seed fixtures"
```

---

## Self-Review

**Spec coverage check:**

| Spec Requirement | Task |
|---|---|
| 4-layer architecture | Tasks 1, 3, 4, 5 |
| 10 sessions, 3 arcs (indie/rival/nexus) | Task 1 |
| Sessions 3, 6, 10 isArcEnd + cross_exam | Tasks 1, 3, 5 |
| ArgumentCard (one-use, power 1–5, type) | Tasks 1, 4, 5 |
| Split-screen: left meeting room, right card grid | Task 4 |
| Critical turns with 8-second timer | Task 4 |
| Tier system (good/okay/bad) vs opponentScore per difficulty | Task 3 |
| `hukuk` seed: IdeaSeedType, IDEA_SEED_META, EMPTY | Task 2 |
| emek progress distribution | Task 3 |
| Session 10 bonus (+5 hukuk) | Task 3 |
| Cross-exam: 2 cards from remaining, bonus calculation | Tasks 3, 5 |
| emek PATH_NPC_MAP: clara added | Task 2 |
| worldStore LocationId + TriggerSystem + cityRoom + App.tsx | Task 6 |
| Rival opponent names (PixelForge/Ironclad/Nexus) in result | Task 1, 5 |

**No placeholder scan:** briefingLines/resultLines contain real English strings. No "TBD" or "TODO" in implementation code. ✓

**Type consistency:**
- `LawyerPhase` defined in lawyerStore, referenced in tests ✓
- `LawyerSessionResult.hukukSeeds` used in tests and returned by `endShift()` ✓
- `LegalScene.create()` signature matches usage in LawyerPanel ✓
- `recordSessionResult(argumentScore, usedCardIds)` signature consistent across store + panel ✓
- `recordCrossExamResult(bonus: number)` takes number (panel calculates from cards) ✓

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-03-avukat-asistanligi.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
