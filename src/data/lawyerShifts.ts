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
    { id: 't01_2', opponentStatement: "The derivative product was commercially released and directly competed with PixelForge's own titles.", opponentPower: 2, isCritical: false, weaknessType: 'technical' },
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
    { id: 'c02_tanık',   label: 'Çapraz Sorgu',      type: 'procedural', power: 3, description: "Mercer'ın çelişkili önceki ifadesine atıf." },
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
    good: ["Mercer's testimony falls apart under Clara's cross. The jury visibly shifts."],
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
    "Closing arguments. Everything you've fed Clara over two days comes down to this.",
    "Mercer's team will paint this as a pattern. Shut it down.",
  ],
  availableCards: [
    { id: 'c03_kapanış', label: 'Kapanış Beyanı',   type: 'legal',      power: 4, description: 'İki günün delillerini tek argümanda toplayan güçlü kapanış.' },
    { id: 'c03_meta',    label: 'Meta Veri',          type: 'technical',  power: 5, description: "Dosya zaman damgaları PixelForge'un iddiasını çürütüyor." },
    { id: 'c03_prosedur',label: 'Son İtiraz',         type: 'procedural', power: 3, description: 'Rakibin son savunma hamlesine karşı usul hamlesi.' },
    { id: 'c03_adil',    label: 'Adalet Çağrısı',    type: 'emotional',  power: 3, description: 'Küçük stüdyoların haksız lisans baskısından korunması gerektiği.' },
    { id: 'c03_emsal2',  label: 'İkinci Emsal',      type: 'legal',      power: 3, description: 'Aynı mahkemede görülen benzer davada verilen karar.' },
  ],
  turns: [
    { id: 't03_1', opponentStatement: "The defendant's conduct is part of a broader pattern of disrespect for IP law in the indie space.", opponentPower: 3, isCritical: false, weaknessType: 'legal' },
    { id: 't03_2', opponentStatement: 'No written consent, no notification, no remorse. Three strikes.', opponentPower: 3, isCritical: false, weaknessType: 'procedural' },
    { id: 't03_3', opponentStatement: 'We are asking for full damages plus punitive compensation—', opponentPower: 4, isCritical: true, weaknessType: 'legal', hint: 'The damages cap argument from day 1 applies here.' },
    { id: 't03_4', opponentStatement: 'PixelForge deserves to see justice for every small studio that worked honestly.', opponentPower: 3, isCritical: false, weaknessType: 'emotional' },
    { id: 't03_5', opponentStatement: 'The technical evidence is clear. The intent was commercial exploitation.', opponentPower: 4, isCritical: false, weaknessType: 'technical' },
  ],
  resultLines: {
    good: ["Verdict: favourable settlement. Mercer shakes Clara's hand with a tight smile."],
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
    "Ironclad claims our client's character designs are derivative works.",
    "Holt's lawyers are sharp. Clara needs precise, fast rebuttals.",
  ],
  availableCards: [
    { id: 'c04_tasarım',  label: 'Tasarım Tarihi',    type: 'technical',  power: 4, description: 'Karakterin orijinal eskizleri ve zaman damgalı dosyaları.' },
    { id: 'c04_emsal',    label: 'IP Emsali',          type: 'legal',      power: 4, description: 'Karakter tarzının telif kapsamı dışında olduğuna dair emsal.' },
    { id: 'c04_uzman',    label: 'Sanat Uzmanı',       type: 'technical',  power: 3, description: 'Bağımsız sanat direktörünün karşılaştırma analizi.' },
    { id: 'c04_prosedur', label: 'Tescil Sorgusu',     type: 'procedural', power: 3, description: "Ironclad'ın telif tescilinin eksik olduğuna dair itiraz." },
    { id: 'c04_niyet',    label: 'Piyasa Niyeti',      type: 'emotional',  power: 2, description: 'Müşterinin bağımsız ve özgün çalışma niyetini açıklaması.' },
  ],
  turns: [
    { id: 't04_1', opponentStatement: 'The silhouette, colour palette, and posture are direct copies of our registered character.', opponentPower: 3, isCritical: false, weaknessType: 'technical' },
    { id: 't04_2', opponentStatement: 'Our design language is protected as trade dress.', opponentPower: 3, isCritical: false, weaknessType: 'legal' },
    { id: 't04_3', opponentStatement: 'The defendant had access to our promotional materials prior to their release date—', opponentPower: 4, isCritical: true, weaknessType: 'technical', hint: 'The sketch timestamps predate the promotional materials.' },
    { id: 't04_4', opponentStatement: 'Ironclad has invested significantly in its visual identity. This dilutes our brand.', opponentPower: 3, isCritical: false, weaknessType: 'emotional' },
    { id: 't04_5', opponentStatement: 'We have expert testimony confirming the similarity exceeds acceptable thresholds.', opponentPower: 4, isCritical: false, weaknessType: 'technical' },
    { id: 't04_6', opponentStatement: "The registration predates the defendant's work by 18 months.", opponentPower: 3, isCritical: false, weaknessType: 'procedural' },
  ],
  resultLines: {
    good: ['Clara obliterates the "substantial similarity" argument. Holt\'s team huddles quietly.'],
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
    "Ironclad pivoted — now they're targeting a former employee who joined our client.",
    'The non-compete was written to be overbroad. Clara can challenge its validity.',
  ],
  availableCards: [
    { id: 'c05_rekabet',  label: 'Rekabet Yasası',    type: 'legal',      power: 4, description: 'Overbroad non-compete clauses are unenforceable in this jurisdiction.' },
    { id: 'c05_süre',     label: 'Süre Aşımı',        type: 'procedural', power: 4, description: 'İki yıllık geçerlilik süresi dolmuş — söz doğrultusunda.' },
    { id: 'c05_beceri',   label: 'Genel Beceri',       type: 'legal',      power: 3, description: "Çalışanın taşıdığı bilgi sektörde standarttır, ticari sır değil." },
    { id: 'c05_iletişim', label: 'İç Yazışmalar',      type: 'technical',  power: 5, description: "Ironclad'ın kendi e-postaları maddenin ihlal edilmediğini gösteriyor." },
    { id: 'c05_adil',    label: 'Geçim Hakkı',        type: 'emotional',  power: 3, description: 'Overbroad non-compete geçimini engeller — haksız.' },
  ],
  turns: [
    { id: 't05_1', opponentStatement: 'The employee signed a clear two-year non-compete covering the game development sector.', opponentPower: 3, isCritical: false, weaknessType: 'legal' },
    { id: 't05_2', opponentStatement: 'The proprietary workflow they brought to the defendant constitutes a trade secret.', opponentPower: 4, isCritical: false, weaknessType: 'technical' },
    { id: 't05_3', opponentStatement: 'We documented the workflow transfers in detail—', opponentPower: 4, isCritical: true, weaknessType: 'technical', hint: "Ironclad's own emails confirm standard industry practice." },
    { id: 't05_4', opponentStatement: "This is a clear case of talent poaching designed to damage Ironclad's competitive position.", opponentPower: 3, isCritical: false, weaknessType: 'emotional' },
    { id: 't05_5', opponentStatement: 'Courts in this jurisdiction have upheld non-competes of this scope in two recent cases.', opponentPower: 4, isCritical: false, weaknessType: 'legal' },
    { id: 't05_6', opponentStatement: "The scope of the agreement is proportionate to Ironclad's legitimate business interests.", opponentPower: 3, isCritical: false, weaknessType: 'procedural' },
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
    "Clara says she's never seen him this prepared.",
  ],
  availableCards: [
    { id: 'c06_birleşik',  label: 'Birleşik Savunma',  type: 'legal',      power: 5, description: 'Her iki iddiayı tek kapsamlı argümanla çürüten savunma.' },
    { id: 'c06_meta',      label: 'Meta Veri Paketi',   type: 'technical',  power: 5, description: 'Tüm zaman damgaları ve iletişim kayıtları bir arada.' },
    { id: 'c06_emsal3',    label: 'Üçüncü Emsal',       type: 'legal',      power: 4, description: 'Aynı mahkemede görülen iki talepli dava — aleyhimize çıktı.' },
    { id: 'c06_prosedur2', label: 'Çapraz Başvuru',     type: 'procedural', power: 3, description: 'Birden fazla talebin birleştirilmesinin prosedürel itirazı.' },
    { id: 'c06_kamu2',     label: 'Pazar Etkisi',       type: 'emotional',  power: 3, description: "Ironclad'ın taleplerinin bağımsız piyasayı boğacağı argümanı." },
    { id: 'c06_ifa2',      label: 'Karşı İddia',        type: 'legal',      power: 4, description: "Ironclad'ın dava açma sürecindeki kötü niyetin kanıtı." },
  ],
  turns: [
    { id: 't06_1', opponentStatement: 'Both the design theft and the talent raid form a single coordinated attack on Ironclad.', opponentPower: 4, isCritical: false, weaknessType: 'legal' },
    { id: 't06_2', opponentStatement: 'We present a pattern of behaviour, not isolated incidents.', opponentPower: 4, isCritical: false, weaknessType: 'procedural' },
    { id: 't06_3', opponentStatement: "The combined damages represent a full year of Ironclad's design budget—", opponentPower: 5, isCritical: true, weaknessType: 'legal', hint: 'The bad-faith filing counters this entirely.' },
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
    "They're claiming your studio stole trade secrets from an ex-Nexus developer.",
    'Clara is quiet this morning. She knows what this means.',
  ],
  availableCards: [
    { id: 'c07_sır',      label: 'Ticari Sır Testi',  type: 'legal',      power: 4, description: "Nexus'un talep ettiği bilginin ticari sır statüsünü sorgular." },
    { id: 'c07_kaynak2',  label: 'Bağımsız Geliştirme',type: 'technical',  power: 5, description: "Stüdyonun söz konusu teknolojiyi bağımsız geliştirdiğini kanıtlar." },
    { id: 'c07_emsal4',   label: 'Nexus Emsali',       type: 'legal',      power: 4, description: "Nexus'un daha önce benzer davayı kaybettiğine dair kayıt." },
    { id: 'c07_prosedur3',label: 'Yetki İtirazı',      type: 'procedural', power: 4, description: 'Davayı açma yetkisini sorgulayan resmi itiraz.' },
    { id: 'c07_etki',     label: 'Piyasa Baskısı',     type: 'emotional',  power: 3, description: 'Büyük şirketlerin küçük stüdyolara dava yoluyla baskı uygulaması.' },
    { id: 'c07_orijin',   label: 'Menşe Belgesi',      type: 'technical',  power: 4, description: 'Teknolojinin ilk kullanım tarihi ve bağlamı.' },
  ],
  turns: [
    { id: 't07_1', opponentStatement: "Our client's proprietary rendering pipeline appears verbatim in the defendant's product.", opponentPower: 4, isCritical: false, weaknessType: 'technical' },
    { id: 't07_2', opponentStatement: 'The former Nexus developer had full access to the pipeline before joining the defendant.', opponentPower: 5, isCritical: false, weaknessType: 'legal' },
    { id: 't07_3', opponentStatement: 'We have the timestamps, the source, and the trajectory—', opponentPower: 5, isCritical: true, weaknessType: 'technical', hint: "The independent development chain predates the employee's departure." },
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
    { id: 'c08_kötüniyet', label: 'Kötü Niyet Kaydı',  type: 'legal',      power: 5, description: "Nexus'un daha önce geçersiz IP iddiaları açtığının belgesi." },
    { id: 'c08_öncelik',   label: 'Öncelikli Sanat',    type: 'technical',  power: 5, description: "Stüdyonun iddia edilen teknolojinin öncüsü olduğuna dair delil." },
    { id: 'c08_yıkıcı',    label: 'Çapraz Sorgu',       type: 'procedural', power: 4, description: 'Nexus tanığının çelişkili ifadesine doğrudan müdahale.' },
    { id: 'c08_crane',     label: 'Crane Bağlantısı',   type: 'legal',      power: 4, description: "Davanın Crane'in stratejik çıkarlarıyla örtüştüğüne dair delil." },
    { id: 'c08_tanık2',    label: 'Eski Nexus Çalışanı',type: 'emotional',  power: 3, description: "Nexus'tan ayrılan birinin şirket içi iklimi anlatan tanıklığı." },
    { id: 'c08_belge',     label: 'İç Belge Paketi',    type: 'technical',  power: 4, description: "Nexus'un iç yazışmaları davanın motivasyonunu açığa çıkarıyor." },
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
    "Stay sharp. It's going to get worse before it gets better.",
  ],
  availableCards: [
    { id: 'c09_delil',     label: 'Delil Zamanlaması',   type: 'procedural', power: 5, description: 'Yeni delil zamanında açıklanmadı — kabul edilemez.' },
    { id: 'c09_kapsamdışı',label: 'Kapsam Dışı',         type: 'legal',      power: 5, description: 'Yeni delil dava sınırlarını aşıyor, kabul edilemez.' },
    { id: 'c09_bağımsız2', label: 'Bağımsız Doğrulama',  type: 'technical',  power: 4, description: 'Üçüncü taraf teknik audit yeni delili çürütüyor.' },
    { id: 'c09_süreç',     label: 'Süreç Manipülasyonu', type: 'procedural', power: 4, description: 'Delil açıklamasının kasıtlı geç yapıldığına dair argüman.' },
    { id: 'c09_istihbarat',label: 'Endüstri Belgesi',    type: 'technical',  power: 5, description: 'Bağımsız yayında yer alan teknik açıklama — öncelik göstergesi.' },
    { id: 'c09_Holt',      label: 'Ironclad Bağlantısı', type: 'legal',      power: 3, description: 'Nexus ve Ironclad arasında koordinasyon olduğuna dair ipucu.' },
  ],
  turns: [
    { id: 't09_1', opponentStatement: 'We have obtained an internal communication that references the disputed pipeline by name.', opponentPower: 5, isCritical: false, weaknessType: 'procedural' },
    { id: 't09_2', opponentStatement: 'This document was discovered during discovery and submitted according to procedure.', opponentPower: 4, isCritical: false, weaknessType: 'legal' },
    { id: 't09_3', opponentStatement: "The email is dated three weeks before the defendant's first patent filing—", opponentPower: 5, isCritical: true, weaknessType: 'technical', hint: 'The industry publication predates the email.' },
    { id: 't09_4', opponentStatement: "This document is decisive. The defendant's narrative collapses.", opponentPower: 5, isCritical: false, weaknessType: 'legal' },
    { id: 't09_5', opponentStatement: 'We request the court admit exhibit 47-C as primary evidence.', opponentPower: 4, isCritical: false, weaknessType: 'procedural' },
    { id: 't09_6', opponentStatement: "My client's investment is now directly threatened by this studio's continued operation.", opponentPower: 4, isCritical: false, weaknessType: 'emotional' },
    { id: 't09_7', opponentStatement: 'Nexus will pursue this case to its conclusion. There will be no settlement.', opponentPower: 5, isCritical: false, weaknessType: 'legal' },
    { id: 't09_8', opponentStatement: 'The studio knew. The employee knew. Everyone in that room knew.', opponentPower: 4, isCritical: false, weaknessType: 'emotional' },
  ],
  resultLines: {
    good: ["The surprise evidence is excluded. Kade's gambit collapses."],
    okay: ['Exhibit admitted but weakened. The case remains alive.'],
    bad:  ["Exhibit 47-C is admitted. Tomorrow's final hearing starts from behind."],
  },
}

const shift10: LawyerShift = {
  id: 'lawyer_10', arcId: 'arc_nexus', isArcEnd: true,
  caseTitle: 'Nexus v. [Player Studio] — Final Day',
  opponentName: 'Lawrence Kade', opponentCompany: 'Nexus Interactive',
  difficulty: 'hard', timeLimitSecs: 360,
  briefingLines: [
    'This is it. Whatever happens today is what you live with.',
    "Clara says she's ready. She also says she's glad you were in her ear.",
  ],
  availableCards: [
    { id: 'c10_kapanış2',  label: 'Nihai Savunma',      type: 'legal',      power: 5, description: 'Tüm arc boyunca biriktirilen argümanların final sentezi.' },
    { id: 'c10_crane2',    label: 'Crane Stratejisi',    type: 'legal',      power: 5, description: "Davanın Crane'in stüdyoyu devre dışı bırakma planının parçası olduğu." },
    { id: 'c10_meta2',     label: 'Bütünleşik Delil',   type: 'technical',  power: 5, description: 'Üç arc boyunca toplanan teknik kanıtların birleşik paketi.' },
    { id: 'c10_kötüniyet2',label: 'Kötü Niyet — Final', type: 'procedural', power: 5, description: 'Davanın başından sonuna uzanan kötü niyet örüntüsü.' },
    { id: 'c10_bağımsız3', label: 'Üçüncü Taraf Audit', type: 'technical',  power: 4, description: 'Mahkeme atanan bağımsız teknik uzmanın final raporu.' },
    { id: 'c10_adalet2',   label: 'Adalet Çağrısı',     type: 'emotional',  power: 4, description: 'Bağımsız yaratıcılara yönelik sistematik baskının son reddi.' },
  ],
  turns: [
    { id: 't10_1', opponentStatement: 'Nexus has proven access, similarity, and intent. The standard is met.', opponentPower: 5, isCritical: false, weaknessType: 'legal' },
    { id: 't10_2', opponentStatement: 'Every counter-argument the defence raised has been addressed and disposed of.', opponentPower: 5, isCritical: false, weaknessType: 'legal' },
    { id: 't10_3', opponentStatement: "The studio's continued operation represents ongoing harm to Nexus—", opponentPower: 5, isCritical: true, weaknessType: 'legal', hint: 'The bad-faith pattern argument is your strongest card here.' },
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
