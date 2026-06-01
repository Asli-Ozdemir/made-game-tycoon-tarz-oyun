// src/data/npcDialogues.ts

export type IdeaSeedType = 'nostalji' | 'hikaye' | 'kaos' | 'zaman_yonetimi'

export const IDEA_SEED_META: Record<IdeaSeedType, { label: string; color: string; emoji: string }> = {
  nostalji:       { label: 'Nostalji',       color: '#a78bfa', emoji: '🌙' },
  hikaye:         { label: 'Hikaye',          color: '#60a5fa', emoji: '📖' },
  kaos:           { label: 'Kaos',            color: '#f87171', emoji: '🌪️' },
  zaman_yonetimi: { label: 'Zaman Yönetimi',  color: '#34d399', emoji: '⏳' },
}

export interface DialogueLine {
  speaker: 'npc' | 'player'
  text: string
}

export interface DialogueChoice {
  text: string
  lines: DialogueLine[]
  ideaSeed?: IdeaSeedType
  relationshipBonus: number
}

export interface Dialogue {
  id: string
  tier: 1 | 2 | 3
  title: string
  lines: DialogueLine[]
  choices?: DialogueChoice[]
  ideaSeed?: IdeaSeedType   // otomatik ödül (seçim yoksa)
  relationshipBonus: number
  repeatable?: boolean
}

export interface NPCDef {
  id: 'marcus' | 'remy' | 'theo' | 'bruno' | 'magnus' | 'yevgeni' | 'marta' | 'clara' | 'aldo' | 'rex' | 'vivian' | 'soren'
  name: string
  role: string
  philosophy: string
  emoji: string
  tier2Threshold: number
  tier3Threshold: number
  dialogues: Dialogue[]
}

// ─── MARCUS ─────────────────────────────────────────────────────────────────

const marcus: NPCDef = {
  id: 'marcus',
  name: 'Marcus',
  role: 'Sahaf',
  philosophy: 'Stoacılık — Kontrol edemediklerimizi bırakmak, edebildiklerimize sahip çıkmak.',
  emoji: '📚',
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'marcus_t1_1',
      tier: 1,
      title: 'Yeni Bir Yüz',
      lines: [
        { speaker: 'npc',    text: 'Merhaba. Kapıyı ittiğinde biraz güçlük çektin, değil mi? Menteşe... nazikçe davranmak lazım.' },
        { speaker: 'player', text: 'Sahaf mı burası?' },
        { speaker: 'npc',    text: 'Hem sahaf hem kitap hem de ben. Marcus. Bir şey arıyorsan söyle, sadece bakmak istiyorsan — en iyi müşterilerden birisin.' },
        { speaker: 'player', text: 'Yeni taşındım bu taraflara.' },
        { speaker: 'npc',    text: 'Biliyorum. Şehir tarafından mı geldin? Nehrin karşısından?' },
        { speaker: 'player', text: '...' },
        { speaker: 'npc',    text: 'Çoğu iyi şey oradan gelir. Kötü şeyler de. Ama şu an buradasın. Bu önemli.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 8,
    },
    {
      id: 'marcus_t1_2',
      tier: 1,
      title: 'Mürekkep Kokusu',
      lines: [
        { speaker: 'player', text: 'Kitapların kokusu farklı burada.' },
        { speaker: 'npc',    text: 'Mürekkep, kağıt, vakit. Bu üçünün dışında başka bir açıklama bulamıyorum. Ama bu koku beni her gün buraya getiriyor, yirmi üç yıldır.' },
        { speaker: 'player', text: 'Yirmi üç yıl mı?' },
        { speaker: 'npc',    text: 'Daha önce farklı bir işim vardı. Çok daha "verimli." Ama o işin kokusu yoktu. Sadece para kokusu. Ve para... kötü bir anı gibi, hava aldıkça güçsüzleşiyor.' },
      ],
      choices: [
        {
          text: 'Pişman mısın?',
          lines: [
            { speaker: 'npc', text: 'Epiktetos şöyle der — pişmanlık, geçmişin hâlâ üzerinde iktidar kurmasına izin vermektir. Hayır. Sadece şükran hissediyorum. Kitaplar için, nehir için, bu koku için.' },
          ],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
        {
          text: 'Verimli iş neydi?',
          lines: [
            { speaker: 'npc', text: 'Yazılım. Bir şirket kurdum, sattım, sonra başka birinin şirketinde çalıştım. Sonra o şirket beni sattı.' },
            { speaker: 'npc', text: '(gülümser) Burada ise ben ve kitaplar sadece sessizce devam ediyoruz.' },
          ],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'marcus_t2_1',
      tier: 2,
      title: 'Nehrin Öte Yakası',
      lines: [
        { speaker: 'npc',    text: 'Seni düşünüyordum bu sabah. Nehrin karşısında ne bıraktın?' },
        { speaker: 'player', text: 'Bir iş. Ve sanırım... küçük bir gurur parçası.' },
        { speaker: 'npc',    text: 'Gurur... tuhaf bir şey. Kontrolümüzdeki şeylerin içinde mi, değil mi — hiç emin olamadım. Belki yarısı içinde, yarısı dışında.' },
        { speaker: 'player', text: 'Sen neden geldin buraya?' },
        { speaker: 'npc',    text: 'Şirketim büyüdü. Sonra daha fazla büyüdü. Sonra içinde ne olduğunu bilemez hale geldim. Sabah kalktığımda ne için kalktığımı hatırlayamıyordum.' },
        { speaker: 'npc',    text: '(bir kitabı düzeltiyor) Bir gün nehri geçtim. Bir daha geçmedim.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 10,
    },
    {
      id: 'marcus_t2_2',
      tier: 2,
      title: 'Elden Gelenler',
      lines: [
        { speaker: 'player', text: 'Kaybedilen zamanı geri almak istesen, alabilir misin?' },
        { speaker: 'npc',    text: 'Bazı şeyler bizim elimizde, bazıları değil. Geçmiş — elimizde değil. Ama şu an ne yapacağın, kime bakacağın, neyle vakit geçireceğin... bunlar tamamen sende.' },
        { speaker: 'npc',    text: 'Ve bu yeterince büyük bir alan.' },
        { speaker: 'player', text: 'Her zaman bu kadar net miydin?' },
        { speaker: 'npc',    text: '(güler) Hayır. Onlarca yıl aldı.' },
      ],
      choices: [
        {
          text: 'Bunun için bir kitap önerebilir misin?',
          lines: [
            { speaker: 'npc', text: 'Enchiridion. Küçük bir kitap ama içi dolu. Sana verebilirim.' },
          ],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
        {
          text: 'Şu an ne yapman gerektiğini nasıl biliyorsun?',
          lines: [
            { speaker: 'npc', text: 'Bilmiyorum. Ama sabah kalkıp buraya geliyorum. Bu bir şey söylüyor bana.' },
          ],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 5,
    },
    // ─── T3 ───
    {
      id: 'marcus_t3_1',
      tier: 3,
      title: 'Senin Kaybın',
      lines: [
        { speaker: 'npc',    text: 'Apex Games mi, adı?' },
        { speaker: 'player', text: 'Evet.' },
        { speaker: 'npc',    text: "Victor Crane'in mi? Duymuştum. Nehrin o tarafında herkes duymuştu." },
        { speaker: 'player', text: 'Kovuldum. Beş yıl çalıştım.' },
        { speaker: 'npc',    text: 'Biliyor musun, ben de kovuldum bir zamanlar. Farklı bir şirketten. O gün hayatımın en kötü günü olduğunu düşündüm.' },
        { speaker: 'npc',    text: '(pencereden nehre bakıyor) Şimdi hayatımın en iyi gününün başlangıcı olduğunu görüyorum.' },
        { speaker: 'player', text: 'Çok kolay görünüyor bu bakış açısı.' },
        { speaker: 'npc',    text: 'Değil. Hiç değil. Ama şunu söyleyebilirim — kontrolünde olmayan bir şey seni yıktıysa, bu senin hatan değil. Seni yıkamadıysa ise, bu senin eserin.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 15,
    },
  ],
}

// ─── REMY ────────────────────────────────────────────────────────────────────

const remy: NPCDef = {
  id: 'remy',
  name: 'Remy',
  role: 'Balıkçı',
  philosophy: 'Sabır değil, var olmak. Nehrin yanında olmak seni besler.',
  emoji: '🎣',
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'remy_t1_1',
      tier: 1,
      title: 'Nehir Erken Kalkar',
      lines: [
        { speaker: 'npc',    text: "(ağ düzeltiyor, başını kaldırmıyor) Sabah mı, akşam mı?" },
        { speaker: 'player', text: 'Ne?' },
        { speaker: 'npc',    text: 'Nehire bakınca sabah mı hissediyorsun, akşam mı? İkisi farklı ışık verir.' },
        { speaker: 'player', text: 'Şu an sabah.' },
        { speaker: 'npc',    text: 'Ben de öyle görüyorum. Remy. Balıkçıyım, göründüğüm gibi.' },
        { speaker: 'player', text: 'Çok şey tutabiliyor musun?' },
        { speaker: 'npc',    text: 'Yeterince. Fazlasına ihtiyacım yok.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 8,
    },
    {
      id: 'remy_t1_2',
      tier: 1,
      title: 'Beklemek Üzerine',
      lines: [
        { speaker: 'player', text: 'Sabırla mı bekliyorsun?' },
        { speaker: 'npc',    text: 'Sabır değil aslında. Sabır beklemek demek, beklemek rahatsızlık demek. Ben sadece... buradayım. Nehrin yanında, soluk ışıkla.' },
        { speaker: 'npc',    text: 'Balık gelirse iyi, gelmezse de balıkçı çantam boş ama günüm boş değil.' },
        { speaker: 'player', text: 'Bu bir fark mı?' },
        { speaker: 'npc',    text: 'Büyük bir fark. İstediğin şeyi beklemek seni tüketir. İstediğin şeyin yanında olmak seni besler.' },
      ],
      choices: [
        {
          text: 'Oyun yaparken de böyle düşünebilir miyim?',
          lines: [
            { speaker: 'npc', text: 'Bilmiyorum. Ama elini suya sokup nerede aktığını hissedersen... belki.' },
          ],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
        {
          text: "Nehrin yanında olmak yeterli mi senin için?",
          lines: [
            { speaker: 'npc', text: 'Benim için evet. Senin için ne yeterli, bunu bilmiyorum. Ama soruyu sorabiliyorsan, zaten sorgunun içindesin. Bu bir başlangıç.' },
          ],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'remy_t2_1',
      tier: 2,
      title: 'Neden Burası',
      lines: [
        { speaker: 'player', text: 'Hep burada mı yaşadın?' },
        { speaker: 'npc',    text: 'Hayır. Liman kentinden geldim. Daha büyük, daha kalabalık. Orada da balık tutuyordum ama nehir yoktu. Sadece deniz.' },
        { speaker: 'player', text: 'Nehir farklı mı?' },
        { speaker: 'npc',    text: "Nehrin bir yönü var. Nereye gittiğini biliyor. Deniz her yere gidebilir — yani hiçbir yere gitmiyor aslında." },
        { speaker: 'npc',    text: 'Benim için yön önemliydi.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 10,
    },
    {
      id: 'remy_t2_2',
      tier: 2,
      title: 'Akış',
      lines: [
        { speaker: 'npc',    text: 'Sen ne yapıyorsun burada, yeni komşu?' },
        { speaker: 'player', text: 'Oyun yapıyorum. Kendi başıma.' },
        { speaker: 'npc',    text: 'Her sabah burada biri oturur, elinde bir şey yapmak ister. Bazıları yazar, bazıları çizer. Hepsinin aynı yüzü var — hem istekli hem korkmuş. Sen de öylesin.' },
        { speaker: 'player', text: 'Korkmak kötü mu?' },
        { speaker: 'npc',    text: 'Hayır. Korkusuz akan nehir yoktur. Önünde taş vardır, çamur vardır, dar geçit vardır. Ama hepsi akar.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 10,
    },
    // ─── T3 ───
    {
      id: 'remy_t3_1',
      tier: 3,
      title: 'Büyük Su',
      lines: [
        { speaker: 'npc',    text: 'Yakında bir şey olacak, değil mi? Bunu görüyorum insanlarda.' },
        { speaker: 'player', text: 'Nasıl?' },
        { speaker: 'npc',    text: 'Nehre çok baktım. Yağmurdan önce yüzey değişir. Rengi dönüşür. Seninki de dönüştü son zamanlarda.' },
        { speaker: 'player', text: 'Büyük bir karar vermem gerekiyor.' },
        { speaker: 'npc',    text: 'Hangi kararın doğru olduğunu biliyorsun aslında. Sadece onaylamaktan korkuyorsun.' },
        { speaker: 'player', text: 'Ya yanlışsa?' },
        { speaker: 'npc',    text: 'Nehir yanlış yöne akar mı? Aşağıya akar. Çünkü aşağısı nereye gittiğini biliyor. Sen de biliyorsun.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 15,
    },
  ],
}

// ─── THEO ────────────────────────────────────────────────────────────────────

const theo: NPCDef = {
  id: 'theo',
  name: 'Theo',
  role: 'Pub Barmen',
  philosophy: 'Anlam bulunmadığı için kendin yapabilirsin. Burası kararların verildiği yer.',
  emoji: '🍺',
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'theo_t1_1',
      tier: 1,
      title: 'Yeni Müşteri',
      lines: [
        { speaker: 'npc',    text: '(bardak siliyor) Otur. Karışık bir günün var. Yüzünden belli.' },
        { speaker: 'player', text: 'Nasıl anladın?' },
        { speaker: 'npc',    text: 'Yirmi yıldır bardak siliyorum. Bunun üçte biri psikolog işi. Ben Theo. Burası benim dünyam. Ne içersin?' },
        { speaker: 'player', text: 'Ne önerirsin?' },
        { speaker: 'npc',    text: 'Ağır bir gün için hafif bir şey. Paradoks bu işte — en ağır anlar hafif bir şeyle geçer.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 8,
    },
    {
      id: 'theo_t1_2',
      tier: 1,
      title: 'Boş Tabure',
      lines: [
        { speaker: 'player', text: 'Burası genelde bu kadar boş mu?' },
        { speaker: 'npc',    text: 'Bu saat öyle. Ama saat sekizde tam dolar. Her gece aynı yüzler, aynı yerler. Şuradaki tabure... kimse oturmaz. Merak ettim mi? Hep.' },
        { speaker: 'player', text: 'Sorsan olmaz mı?' },
        { speaker: 'npc',    text: 'Sormak bazen cevabı mahveder. Bazı şeyler soruyla değil gözlemle anlaşılır.' },
        { speaker: 'player', text: 'Ne gözemledin?' },
        { speaker: 'npc',    text: 'Boş tabure... kimse oturmak istemez ama kimse kaldırmak da istemez. Belki bir beklenti. Belki bir anı. İkisi de aynı şey aslında.' },
      ],
      choices: [
        {
          text: 'İnsanlar neden buraya gelir?',
          lines: [
            { speaker: 'npc', text: 'Kaçmak için. Ama kaçtıkları şey de gelir, masanın altında. Fark şu — burada ona bakabilirler.' },
          ],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: 'Boş taburenin kimin için olduğunu düşünüyorsun?',
          lines: [
            { speaker: 'npc', text: 'Hâlâ gelmemiş biri için. Ya da artık gelmeyen biri için. İkisi de aynı boşluğu bırakır.' },
          ],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'theo_t2_1',
      tier: 2,
      title: "Theo'nun Teorisi",
      lines: [
        { speaker: 'npc',    text: 'Şunu fark ettim yıllar içinde — insanlar iki sebepten içer. Birincisi: unutmak için. İkincisi: hatırlamak için. İkisi de aynı masada oturur.' },
        { speaker: 'player', text: 'Sen hangisi için içiyorsun?' },
        { speaker: 'npc',    text: 'Ben içmiyorum. (güler) Garip değil mi? Yirmi yıldır pubda çalışıyorum ama içmiyorum. Çünkü ben izlemek için buradayım.' },
        { speaker: 'player', text: 'Ne izliyorsun?' },
        { speaker: 'npc',    text: 'Kararlar. Burası kararların verildiği yer. Evde, ofiste alınan kararlar ön taslak. Gerçek kararlar... burada, saat gece yarısına doğru, üçüncü bardakla alınır.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 10,
    },
    {
      id: 'theo_t2_2',
      tier: 2,
      title: 'Anlam Hakkında',
      lines: [
        { speaker: 'player', text: 'Hayatın anlamını düşündün mü hiç?' },
        { speaker: 'npc',    text: 'Her gece. (duraklar) Sonra sabah olur ve anlam aramanın kendisinin anlamsız olduğunu görürsün. Ama aramayı da bırakamazsın. Bu insanın yazgısı.' },
        { speaker: 'player', text: 'Bu ümitsizlik değil mi?' },
        { speaker: 'npc',    text: 'Hayır. Bu özgürlük. Anlam bulunmadığı için kendin yapabilirsin. En kötü ev, boş bir yerde yapılmış ev değildir. En kötü ev, başkasının yaptığı evi devralan evdir.' },
        { speaker: 'player', text: 'Ve sen ne yaptın?' },
        { speaker: 'npc',    text: 'Bu pub. Başkasının malıydı. Ben onu aldım, dönüştürdüm. Şimdi benim anlamım.' },
      ],
      choices: [
        {
          text: 'Oyunum da öyle olabilir mi?',
          lines: [
            { speaker: 'npc', text: 'Zaten öyle. Farkındasın ya da değilsin, bu ayrı. Ama ellerinle bir şey yapıyorsun — bu anlam.' },
          ],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: "Başkasının anlamını devralmak bu kadar kötü mü?",
          lines: [
            { speaker: 'npc', text: 'Kötü değil. Ama sınırı var. Birileri sana "böyle yap" dedi ve sen yaptın — kaç kez? Ve kaç kez sormak istedin "neden böyle?"' },
          ],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 5,
    },
    // ─── T3 ───
    {
      id: 'theo_t3_1',
      tier: 3,
      title: 'Ne Uğruna',
      lines: [
        { speaker: 'npc',    text: '(bardağı kapatıyor, sana dönüyor) Seninle konuşmak istedim bir zamandır. Ciddi bir şey.' },
        { speaker: 'player', text: 'Nedir?' },
        { speaker: 'npc',    text: 'Bu stüdyonu kuruyorsun. Oyun yapıyorsun. Bunu neden yapıyorsun gerçekten?' },
        { speaker: 'player', text: 'Kovuldum ve—' },
        { speaker: 'npc',    text: 'Hayır. Bu neden değil. Bu sebep. Neden farklı bir şey.' },
        { speaker: 'player', text: '...bilmiyorum.' },
        { speaker: 'npc',    text: 'İyi. Bilmiyorsun ama devam ediyorsun. Bu dürüstlük. Çoğu insan "biliyorum" der ve yanılır. Sen bilmiyorsun ama doğru yoldasın. Çünkü soru hâlâ açık.' },
        { speaker: 'player', text: 'Bu yeter mi?' },
        { speaker: 'npc',    text: 'Yetmek zorunda değil. Ama seni buraya getirdi. Devam edecek.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 15,
    },
  ],
}

// ─── BRUNO ───────────────────────────────────────────────────────────────────

const bruno: NPCDef = {
  id: 'bruno',
  name: 'Bruno',
  role: 'Mühendis',
  philosophy: 'Erdem Etiği (Aristoteles) — Karakter, bir köprü gibi, alışkanlıkla ve ölçüyle örülür.',
  emoji: '🔧',
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'bruno_t1_1',
      tier: 1,
      title: 'Köprüyü Kuran',
      lines: [
        { speaker: 'npc',    text: '(bir şeyi ölçüyor) Dur, oraya basma — harç henüz tutmadı. ...Tamam, şimdi geç.' },
        { speaker: 'player', text: 'Bunları sen mi yaptın?' },
        { speaker: 'npc',    text: 'Bu köprüyü babamla ördük. Her gün üstünden geçiyorsun, fark etmeden. Bruno. Mühendis.' },
        { speaker: 'player', text: 'İki yakayı bağlayan köprü mü?' },
        { speaker: 'npc',    text: 'Bağlamak iyi iştir. Yıkmak kolay, bağlamak zor. Ben bağlayanlardanım.' },
      ],
      ideaSeed: 'zaman_yonetimi',
      relationshipBonus: 8,
    },
    {
      id: 'bruno_t1_2',
      tier: 1,
      title: 'Mükemmellik Alışkanlıktır',
      lines: [
        { speaker: 'player', text: 'Aynı işi her gün yapmak sıkıcı değil mi?' },
        { speaker: 'npc',    text: 'Sıkıcı? Bir köprü bir günde çökmez, bir günde de yükselmez. Her gün bir perçin. Mükemmellik bir eylem değil — alışkanlıktır.' },
      ],
      choices: [
        {
          text: 'Ya yeteneğin yoksa?',
          lines: [{ speaker: 'npc', text: 'Yetenek başlangıçtır, alışkanlık ustalıktır. Her gün doğru olanı yap; yıllar seni usta yapar.' }],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
        {
          text: 'Hiç acele etmez misin?',
          lines: [{ speaker: 'npc', text: 'Acele eden köprü ilk fırtınada gider. İyi yapılan iş kendi hızını bilir.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'bruno_t2_1',
      tier: 2,
      title: 'Kirişi İncelt',
      lines: [
        { speaker: 'npc',    text: 'Yıllar önce bir müteahhit geldi. "Kirişi incelt, kimse anlamaz" dedi — maliyet düşsün diye.' },
        { speaker: 'player', text: 'İncelttin mi?' },
        { speaker: 'npc',    text: 'Hayır. Sözleşmeyi kaybettim, parayı kaybettim. Ama o bina hâlâ ayakta — ben de.' },
        { speaker: 'npc',    text: 'Babam derdi: bir taşı gizlice yanlış koyarsan, önce kendin çürürsün. Haklıydı.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 10,
    },
    {
      id: 'bruno_t2_2',
      tier: 2,
      title: 'Ölçü',
      lines: [
        { speaker: 'player', text: 'Crane diye birini duydun mu? Karşı yakada.' },
        { speaker: 'npc',    text: "Apex'in adamı. Duydum. Her şeyi büyütmek ister — daha çok, daha hızlı." },
        { speaker: 'player', text: 'Sen ne dersin?' },
        { speaker: 'npc',    text: 'Ölçü her şeydir. Ne fazla, ne eksik. Fazla su koyarsan harç tutmaz; fazla hırs koyarsan adam tutmaz.' },
      ],
      choices: [
        {
          text: 'Ya kazanmak için fazlası gerekiyorsa?',
          lines: [{ speaker: 'npc', text: 'O zaman kazanırsın ama tutmaz. Tuttuğunu sandığın şey bir gün çöker — kiriş gibi.' }],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
        {
          text: 'Sen hiç büyümek istemedin mi?',
          lines: [{ speaker: 'npc', text: 'İstedim. Sonra köprüme, üstünden geçen çocuklara baktım. Yeterince büyük zaten.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 5,
    },
    // ─── T3 ───
    {
      id: 'bruno_t3_1',
      tier: 3,
      title: 'Kim Olarak',
      lines: [
        { speaker: 'npc',    text: 'O karşı yakayla bir hesabın var, görüyorum. Büyüyorsun.' },
        { speaker: 'player', text: 'Büyümek zorundayım.' },
        { speaker: 'npc',    text: 'Büyü. Ama perçin perçin öğrendiğim bir şey var: önemli olan onu yenmek değil — yenerken kim olduğunu korumak.' },
        { speaker: 'player', text: 'Ya ikisi aynı anda olmuyorsa?' },
        { speaker: 'npc',    text: 'O zaman ölçüyü kaçırmışsındır. İki yanlış var: korkup sinmek, ya da öfkeyle onun gibi acımasızlaşmak. Erdem ortada — cesaret.' },
        { speaker: 'npc',    text: '(köprüye vurur) Kazandığın gün hâlâ kendin olabilecek misin? Asıl mühendislik bu.' },
      ],
      ideaSeed: 'zaman_yonetimi',
      relationshipBonus: 15,
    },
  ],
}

// ─── MAGNUS ──────────────────────────────────────────────────────────────────

const magnus: NPCDef = {
  id: 'magnus',
  name: 'Magnus',
  role: 'Sokak Filozofu',
  philosophy: 'Nietzsche — Değerleri sürü değil sen dövürsün; kendini aş, uçuruma dikkat et.',
  emoji: '🌒',
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'magnus_t1_1',
      tier: 1,
      title: 'Uçurum Kenarı',
      lines: [
        { speaker: 'npc',    text: '(iskele ucunda, suya bakıyor, dönmeden) Sen de mi suya bakmaya geldin? Herkes gelir. Az kişi gerçekten bakar.' },
        { speaker: 'player', text: 'Sen kimsin?' },
        { speaker: 'npc',    text: 'Magnus. Bir zamanlar bir isimdim, şimdi bir soru işareti. İkisi de fena değil.' },
        { speaker: 'player', text: 'Burada mı yaşıyorsun?' },
        { speaker: 'npc',    text: 'Şu çürük teknede. Batmıyor — inadına. Tıpkı benim gibi.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 8,
    },
    {
      id: 'magnus_t1_2',
      tier: 1,
      title: 'İyi ve Kötü',
      lines: [
        { speaker: 'player', text: 'İnsanlar sana deli diyor.' },
        { speaker: 'npc',    text: 'Deli, herkesin görmezden geldiğini yüksek sesle söyleyendir. Bak şu nehre — "iyi" mi akıyor, "kötü" mü? Hiçbiri. İyiyi, kötüyü biz uydurduk.' },
      ],
      choices: [
        {
          text: 'O zaman hiçbir şey önemli değil mi?',
          lines: [{ speaker: 'npc', text: 'Hayır — her şey önemli, ama anlamı sen koyacaksın, sürü değil. Tanrı öldü, eleştirmen de. Değeri sen döveceksin.' }],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: 'Sen ne değer dövdün?',
          lines: [{ speaker: 'npc', text: 'Bir oyun. Kuralların hepsini yaktı. Sonra... başka bir hikâye. (acı gülümser) Sonra anlatırım.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'magnus_t2_1',
      tier: 2,
      title: 'Efsane',
      lines: [
        { speaker: 'player', text: 'O oyun neydi?' },
        { speaker: 'npc',    text: 'Bu şehirde doğdum; herkes "fazla" derdi bana. Şehre gittim, kuralları yakan bir oyun yaptım — tür tanımlandı, "dahi" dediler.' },
        { speaker: 'player', text: 'Sonra?' },
        { speaker: 'npc',    text: 'Sonra aynı kalabalık döndü. Fazla radikal, fazla dik, fazla Magnus. Beni de yaktılar. Zirveden düştüm, doğduğum yere sürünerek döndüm.' },
        { speaker: 'npc',    text: 'Hanna hâlâ "yine mi sen" der, gülerek. O, çocukluğumu bilir.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 10,
    },
    {
      id: 'magnus_t2_2',
      tier: 2,
      title: 'Düşmek',
      lines: [
        { speaker: 'player', text: 'Düşmek nasıldı?' },
        { speaker: 'npc',    text: 'Yükseklik, düşmekten korkanlar içindir. Ben düştüm — ve düşerken bir şey gördüm.' },
        { speaker: 'player', text: 'Ne?' },
        { speaker: 'npc',    text: 'Dibe vurmak sağlam bir zemindir. Üstüne yeniden inşa edebilirsin. Korktuğun şey aslında özgürlüğün.' },
      ],
      choices: [
        {
          text: "'Beni öldürmeyen güçlendirir' mi?",
          lines: [{ speaker: 'npc', text: 'Yarısı doğru. Bazısı sadece sakat bırakır. Marifet, sakatken bile yürümeye devam edebilmek.' }],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: 'Yeniden çıkmak istemedin mi?',
          lines: [{ speaker: 'npc', text: 'İstedim. Ama kendim için, kalabalık için değil. O zaman çıkış başka bir şey oluyor.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 5,
    },
    // ─── T3 ───
    {
      id: 'magnus_t3_1',
      tier: 3,
      title: 'Uçurum',
      lines: [
        { speaker: 'npc',    text: 'O karşı yakadaki güçle dövüşüyorsun. Gözlerinde tanıdık bir şey var — benim bir zamanlar aynada gördüğüm.' },
        { speaker: 'player', text: 'Onu yenmem gerek.' },
        { speaker: 'npc',    text: 'Belki. Ama şunu söyleyeyim, sonra unut: canavarlarla dövüşen, kendi canavara dönüşmemeye dikkat etsin.' },
        { speaker: 'player', text: '...' },
        { speaker: 'npc',    text: 'Ve sakın unutma — uçuruma uzun bakarsan, uçurum da sana bakar. Onu değil, kendini aş. Düşmanı geçmek kolay; kendini geçmek marifet.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 15,
    },
  ],
}

export const NPC_DEFS: Record<string, NPCDef> = {
  marcus,
  remy,
  theo,
  bruno,
  magnus,
}
