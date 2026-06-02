# Karakterler ve Senaryo — Macenta Koyu

Son güncelleme: 2026-06-03

---

## Ana Senaryo

### Oyuncunun Hikâyesi

Oyuncu, büyük bir oyun şirketi olan **Nexus Games**'ten kovulur. Victor Crane'in kararıyla "kaynak optimizasyonu" adı altında işten çıkarılır. Nehri geçerek **Macenta Koyu**'na yerleşir. Hedef: sıfırdan bağımsız stüdyo kurarak Nexus'a rakip olmak. Süre: 30 yıl (oyun içi).

**5 farklı başlangıç arka planı:**

| Arka Plan | İşten Çıkarılma Sahnesi | Özellik |
|---|---|---|
| **KK Uzmanı** | İK Müdürü — "Otomasyon senden hızlı" | Eski çalışanların kovulmasında imzası var |
| **Yaratıcı Direktör** | Patron — "Fikir şirkete aittir" | İmzasız jenerik, çalınan konsept |
| **Baş Mühendis** | Patron — "Batan proje senin" | Hep yazılı uyardı, dinlenilmedi |
| **Yapımcı** | Yeni CEO — "Çok şey biliyorsun, tehlikelisin" | Tazminat + sessizlik anlaşması |
| **Eski CEO** | Kurul Başkanı — "Şirket artık senden büyük" | Kurduğu şirketten oybirliğiyle çıkarıldı |

Her varyantta sahne üçü içerir: ofis (kovulma) → yatak odası (eş: "Başka biri var") → mahkeme (anlaşmalı boşanma) → kıyı (yeniden başlangıç, stüdyo adı).

**Yapı:** Tycoon modu (stüdyo inşa etme) + keşif modu (şehri gez, NPC'lerle konuş, side job yap). İki yakadaki iki dünya: eski şehir (kurumsal, Nexus, geçmiş) vs. Macenta Koyu (organik, bağımsız, gelecek).

---

## Ana Antagonist — Victor Crane

**Şirketi:** Nexus Games (major rakip, 1990'dan beri, aggressive)  
**Yardımcısı:** Klein (her nexus sahnesinde yanında)

Crane, oyunun doğrudan sahne diyaloğu olan tek antagonistidir. Makyavel'i sık alıntılar: *"Sevgi ucuzlar, korku tutar."*

**Sahne arci:**
1. **`nexus_notice`** (erken oyun) — Klein haberi getirir. Crane oyuncuyu arka planda değerlendirir. Her arka plan varyantı için ayrı diyalog (yapımcı/kk_uzmani/eski_ceo/yaratici_direktor/bas_muhendis).
2. **`nexus_meeting`** (orta oyun) — İlk yüz yüze buluşma. "Sıkılmıştım, iyi rakip iyi aynadır."
3. **`nexus_resolution`** (oyun sonu) — 4 karar yolu:
   - **Buyout** — Stüdyoyu satın al: "Artık benden daha korkunçsun. İkimiz de aynı yere vardık."
   - **Destroy** — Skandalı basına ver: "Gömülen benim. Ama düsturumu taçlandırdın."
   - **Forgive** — Hiçbirini kullanma: "Ham, katıksız iyi insanlar varmış. Ben hep masal sanırdım."
   - **Merge** — Birleşme teklifi: "Ortak olalım. Ama gözünü dört aç." / "Sen de."

**Klein:** Crane'in yakın yardımcısı. Haberleri getirir, durumu raporlar. Kendi görüşü yok — salt lens karakteri.

---

## Giriş Cutscene Karakterleri

| Karakter | Rol | Nerede Görünür |
|---|---|---|
| **İK Müdürü** | Personel müdürü | kovulma — kk_uzmani |
| **Patron** | Şirket sahibi | kovulma — yaratici_direktor, bas_muhendis |
| **Yeni CEO** | Devralma sonrası CEO | kovulma — yapimci |
| **Kurul Başkanı** | Şirket kurulu başkanı | kovulma — eski_ceo |
| **Eş** | Oyuncunun eski eşi | kovulma — tüm varyantlar (yatak odası sahnesi) |
| **Hâkim** | Boşanma mahkemesi | kovulma — tüm varyantlar (mahkeme sahnesi) |
| **Sunucu** | Ödül töreni sunucusu | awards_win, awards_lose_to_nexus |
| **Rakip Kurucu** | Bağımsız stüdyo kurucusu | indie_resolution |

**Eş:** Her arka plan varyantında farklı ton alır ama mesaj aynıdır — "Hep işini seçtin, ben hep yalnızdım. Başka biri var." Anlaşmalı boşanmaya razı olur. Son sözü arka plana göre değişir.

---

## Rakip Şirketler

### Sabit Rakipler

| Şirket | Tier | Kişilik | Kurulus | Favori Tür | Not |
|---|---|---|---|---|---|
| **Nexus Games** | major | aggressive | 1990 | RPG, Aksiyon | Eski işveren, Crane'in şirketi |
| **PixelForge** | mid | friendly | 1995 | Bulmaca, Simülasyon | — |
| **Ironclad Studios** | mid | aggressive | 1993 | Strateji, Aksiyon | — |
| **Starlight Interactive** | mid | secretive | 1997 | Macera, RPG | — |
| **Tiny Worlds** | indie | friendly | 1998 | Simülasyon, Bulmaca | — |
| **Glitch Lab** | indie | defensive | 1999 | Aksiyon, Bulmaca | — |

### Prosedürel Rakipler

Oyun ilerledikçe rastgele üretilir (PixelWorks, NovaForge, vb.). Indie tier, aggressive/friendly/defensive/secretive kişilik, 1–40 şöhret eşiği.

---

## Hayat Yolları (Life Paths)

Üç resmi yol var. Eşik: **100 puan**. İlgili NPC'lerle ilişki kurarak ve side job'larla biriktirilir.

| Yol | Seed | Bağlı NPC'ler | Skill Ağacı Kilidi |
|---|---|---|---|
| **Huzur** | nostalji | Marcus, Remy, Rex | T5: `t5_huzur` — "Nehir gibi akar, okyanus gibi derin." |
| **Emek** | emek | Theo, Søren | T5: `t5_emek` |
| **Hırs** | analiz/kaos | Vivian | T5: `t5_hirs` |

---

## Felsefe NPC'leri (12 kişi)

Her NPC 3 tier'da açılır (10 / 30 / 70 ilişki puanı). T3 Crane meselesine doğrudan değinir.

---

### Marcus — Sahaf
**Rol:** Sahaf arşivisti | **Felsefe:** Stoa — Kontrol edebileceğine odaklan, kalanı bırak.  
**Emoji:** 📚 | **Yan İş:** Sahaf Arşiv (nostalji + hikaye)

Büyük şehirde kütüphane direktörüydü. Değerli bir koleksiyonu dijitalleştirme kararına karşı çıkınca görevden alındı. Binlerce kitabı taşıyarak döndü. *"Kitaplar hâlâ burada."* Masasında eski fişler, paslanmış raflar, düzensiz arşiv. T2'de dijitalleştirme dayatmasının hikâyesi çıkar. **T3:** "Crane'in varlığına enerji harcama. Onu kontrol etmeye çalışırsan, o seni yönetmiş olur."

---

### Remy — Balıkçı
**Rol:** Sabah balıkçısı | **Felsefe:** Tao — Zorlamadan akmak; nehrin nereye gittiğini bilmek.  
**Emoji:** 🎣 | **Yan İş:** Balıkçılık (nostalji → huzur path)

Büyük bir liman kentinden geldi, orada deniz vardı ama nehir yoktu. *"Nehrin bir yönü var. Nereye gittiğini biliyor. Deniz her yere gidebilir — yani hiçbir yere gitmiyor."* T2'de kasabadan ayrılış hikâyesi. Dedektif Vaka 3'te tanık olarak çapraz geçiş yapıyor. **T3:** "Crane'e karşı güç kullanma. Nehir kayayı yıkmaz — onu aşar."

---

### Theo — Pub Barman
**Rol:** Pub barmanı | **Felsefe:** Varoluşçuluk (Camus) — Absürdlüğe rağmen yaşa.  
**Emoji:** 🍺 | **Yan İş:** Pub Garsonluk (zaman_yonetimi + kaos)

Akademisyen. Anlam arayışının kendisinin anlamsız olduğunu fark etti, barda kaldı. *"Camus kahkaha attı ve içki döktü. Ben de öyle."* T2'de anlam krizinin doruk noktası. **T3:** "Crane meselesini çok ciddiye alma. Absürd dünyada ciddiyet de absürd; gül, devam et."

---

### Bruno — Mühendis
**Rol:** Köprü mühendisi | **Felsefe:** Aristoteles — Erdem pratikle kazanılır, bir sıfat değil.  
**Emoji:** 🔧

Köprüler inşa etti. Bir tanesinde şirket baskısıyla kritik malzeme değiştirildi; olay yaşanmadan yakalandı ama Bruno o köprüye bir daha bakmadı. *"Erdem, bir kez ödün verdiğinde kaybolmaz — ama kırılır."* **T3:** "Zafer, dürüstlüğü feda etmeden gelsin. Aksi hâlde inşa ettiğin çürür."

---

### Magnus — Sokak Filozofu
**Rol:** Çürük teknede yaşayan Nietzscheci | **Felsefe:** Nietzsche — Değerleri sen dövürsün; sürü değil, kendini aş.  
**Emoji:** 🌒

Kendi şehrinde "dahi" denen bir oyun yaptı, kuralları yıktı; sonra aynı kalabalık onu yaktı — fazla radikal, fazla Magnus. Sürünerek doğduğu yere döndü. Hanna onu çocukluğundan tanır. **T3:** *"Canavarlarla dövüşen, kendi canavara dönüşmemeye dikkat etsin. Uçuruma uzun bakarsan, uçurum da sana bakar. Crane'i değil, kendini aş."*

---

### Marta — Hemşire
**Rol:** Şehrin hemşiresi | **Felsefe:** Bakım Etiği — Ahlak, karşındakinin elini tutmakta başlar.  
**Emoji:** 🩺

Başkente gitme şansı vardı; annesi hastalanınca kaldı. Kırk yıldır herkese bakıyor, hiç defter tutmuyor. Apex'ten kırılanların elini tuttu. *"Tablo titremez, insan titrer."* **T3:** *"Crane'e karşı savaşırken insan kal. Onu canavara benzersen, savaşırken katılaşırsın."*

---

### Clara — Noter
**Rol:** Şehrin noteri | **Felsefe:** Kant / Deontoloji — Kural herkese eşit; insan amaçtır, araç değil.  
**Emoji:** ⚖️

Avukattı. Büyük şirket küçük stüdyonun fikrini çalmıştı; davayı "zayıflat" dediklerinde reddetti. Hiçbir büro işe almadı, buraya döndü. Masasında yarım bir dosya var — *"neyi reddettiğimi unutmamak için."* Vivian'la Marta'yı ve `karşı yakadaki şirketi` doğrudan anar. **T3:** *"Ne yaparsan yap, önce 'bunu kural yapsam herkese uygulasa razı mıyım?' diye sor."*

---

### Aldo — Bahçıvan
**Rol:** İncir bahçesi sahibi | **Felsefe:** Epikür — En büyük zenginlik: iyi sofra, birkaç dost, korkusuz akşam.  
**Emoji:** 🌿

Karşı yakada serveti ve unvanı vardı; hepsini sattı, bahçeye döndü. *"İsim taşa değil, bahçeye kazınır."* Masa dağılınca gerçek dostlarının bahçeye geldiğini fark etti. **T3:** *"Crane'i yen, ama yıkma — fark var. Onu yenip bahçeni kaybedersen, o seni yenmiş olur."*

---

### Yevgeni — Teknisyen
**Rol:** Elektronik tamircisi | **Felsefe:** Nihilizm/Materyalizm — Faydası yoksa yık; doğa atölyedir.  
**Emoji:** 🔬

Her şeyi mekanizmasına indirger. Otoriteyi reddeder. Ama babasından gelen mektupları bir çekmecede saklar — *"karbon ve mürekkep"* ama faydasını bir türlü bulamamış. *"Galiba yararsız bir şeyi ilk kez seviyorum. Bu beni rahatsız ediyor."* **T3:** *"Crane'i bir makine gibi gör — korkuyla çalışıyor, korkuyu kes. Ama yıkmadan önce yerine ne koyacağını bil."*

---

### Søren — Liman Kaptanı
**Rol:** Nehir kaptanı | **Felsefe:** Varoluşçuluk (Sartre) — Rotanı sen çizersin; "mecbur kaldım" yalandır.  
**Emoji:** ⚓ | **Yan İş:** Nehir Sal Kaptanlığı (kaos + zaman_yonetimi → emek path)

Babası donanmadaydı; komisyon kâğıdını reddetti, tek başına açıldı. Lasse adlı genç tayfasını dar geçitte fırtınada kaybetti — "devam et" demişti, Lasse geçemedi. Yıllarca mazeret aradı, bulamadı. Her akşam nehirde sal seferi yapıyor. 10 session, 3 arc:
- **Arc 1 (1-3, easy):** Ekip — "Eskiden dörttük bu nehirde. Şimdi tekimi."
- **Arc 2 (4-6, normal/hard):** Fırtına Gecesi — kararın yavaş yavaş ortaya çıkışı
- **Arc 3 (7-10, hard→normal):** Lasse — "Geçemedi. Ben geçtim. Mazeret aradım yıllarca — bulamadım."

T1 diyalogunda "Bu limanın, evet. Søren. Sabah üç tekne geç yanaştı — üçü de rüzgârı suçladı. Rüzgâr suçlanmaz; rüzgâr sadece eser." **T3:** *"Crane 'akıntı böyle aktı' diyor. Yalan. Dümeni tutan da bendim — kabul etmemek sorumluluktan kaçmak."*

---

### Rex — Arcade Sahibi
**Rol:** Oyun salonu sahibi | **Felsefe:** Kirenaik Hedonizm — Tek gerçek şu an; yoğunluk süreyi yener.  
**Emoji:** 🕹️

Bir zamanlar sahnelerdeydi, kalabalık adını bağırırdı. Refleksler yavaşladı, sahne küçüldü, kendi köşesini kurdu. Kazandığı her şeyi "bir sonraki geceye yatırdı" — birikimi yok, pişmanlığı da. Geç kapanış saatinde ışıkları söndürmekten korkar — *"bir şey yetişiyor sanki bana."* **T3:** *"Crane'i yendiğin gün mutlu olacağını sanıyorsun — yanılıyorsun. Mutluluk ertelenmez; bu gece de kendin için bir tur at."*

---

### Vivian — Yatırımcı
**Rol:** Fon yöneticisi | **Felsefe:** Faydacılık — En çok kişiye en çok iyilik; toplam artıdaysa araç haklı çıkar.  
**Emoji:** 📈

Kariyer başında bir dostunun stüdyosuna tüm fonunu yatırdı — sevdiği için. Stüdyo yine battı, o parayla kurtulabilecek beş stüdyo da gitti. O günden beri ahlakını "toplam" üzerine kurdu. Ama o dostun adını hesap yaparken hâlâ mırıldanıyor. Clara'yı ve Marta'yı oyun içinde anar. **T3:** *"Crane'i yenmek toplama gerçekten değer mi, yoksa egonu mu doyuruyor? Kendi öfkeni teraziye koyma — o gram seni ona benzetir."*

---

## Romantizm Adayları (4 kişi)

T3'te flört diyaloğu açılır. Arka plan türüyle bağlantısı yok — herkes ulaşabilir.

---

### Elise — Kafe Müzisyeni
**Rol:** Kafe müzisyeni | **Emoji:** 🎶

Dışarıda: süslü diva, "bu şehrin tek gerçek sesi." İçeride: cilanın altında kimsenin dinlemediğini bilen yalnız bir sanatçı. Büyük sahneleri denedi, *"sahne tuttu"* — geçici on yıl oldu. Çalmadığı bir şarkı var: "fazla gerçek." **T3:** Salon boşaldığında sana cilasız çalıyor. *"Birinin gerçekten dinlemesi, alkıştan daha çok korkutuyor beni. Hem korkutuyor hem... hoşuma gidiyor."*

---

### Daniel — Nehir Biyoloğu
**Rol:** Araştırma biyoloğu | **Emoji:** 🔬

İnsanlarla beceriksiz, nehir canlılarıyla rahat. Üniversiteden kaçtı — *"merak orada suçtu, atıf peşindeydiler."* Konuşmayı sevince durduramıyor: *"Genelde insanlar bu noktada uzaklaşıyor."* **T3:** Yeni keşfettiği türe senin adını veriyor (Latince ekiyle, resmî kayıtta). *"Seni çözemiyorum, ve ilk kez bir şeyi çözmek istemiyorum."*

---

### Nadia — Seramikçi
**Rol:** Atölye seramikçisi | **Emoji:** 🏺

Bohem özgür ruh. Şehirde galerisi vardı, "pratik ol, markanı kur" diyince trene bindi, buraya geldi. *"Rengimi geri istedim."* Eğri vazoları atar — *"kusur değil, parmak izi."* Bağlanmaktan korkar ama sadıktır. **T3:** Çark başında birlikte çalışıyor, sonucu bilmeden. *"İlk kez bir şeyin bitmesini değil, sürmesini istiyorum."*

---

### Cassian — Fenerci
**Rol:** Nehir feneri bekçisi | **Emoji:** 🗼

Melankolik. Bir zamanlar fener iki kişiydi — adını anmıyor birinin ("anarsam gerçek olur, gerçek olursa gitmiş olur"). Geceleri yazar, kimseye okumaz. *"Işık nehre gider. Bana karanlık kalır."* Yalnızlığı seçtiğini söyler ama *"belki yalnızlık beni seçti."* **T3:** *"Sen geldiğinden beri gece daha kısa. İlk kez ışık içeride de yanıyor — nasıl olduğunu bilmiyorum."*

---

## Side Job'lar — Tam Liste

### 1. Pub Garsonluk (Theo)
- **Mekanik:** 15 vardiya. 3-4 masa, her masada 1-2 müşteri, sipariş + sabır barı. Gizli istekler bazı müşterilerde masaya gidince ortaya çıkar.
- **Seeds:** zaman_yonetimi + kaos
- **Müşteriler:** Ayşe, Mert, Kemal (fıstık alerjisi), Deniz, Serkan, Leyla, Cenk, Seda, Burcu, Emre, Neslihan, Nuri, Fatma, Osman, Zeynep, Koray, Emir, İpek, Can vb. (15 vardiyada çok sayıda adlandırılmış karakter)

### 2. Sahaf Arşiv (Marcus)
- **Mekanik:** Kitapları doğru kategoriye/rafa yerleştir, kırık notları onar.
- **Seeds:** nostalji + hikaye

### 3. Bar Bodyguard (kapı görevlisi)
- **Mekanik:** 10 vardiya. Papers Please tarzı — gece kuralı, kara liste, VIP listesi, sarhoş/tehlikeli görsel ipuçları.
- **Seeds:** kaos + emek
- **Misafirler:** Ayşe, Mehmet, Volkan (kara listede), Selin, Deniz, Berk, Cem, Hande, Serhat, Rıza, Pınar, Tuncay, Yasemin, Aydın, Özge, vb.

### 4. Dedektif Asistanı
- **Mekanik:** 3 vaka. Sahneyi tara, kanıtları incele, şüphelilerle konuş, suçluyu bul. Gün limiti var.
- **Seeds:** analiz + emek

**Vaka 1 — Parkta Kayıp Evrak** (dayLimit: 4, konum: park)
- Suçlu: **Mete Doğan** (Finansal Danışman) — zorla evrak aldı
- Masum: **Dilara** (parkta yürüyüşçü)

**Vaka 2 — Kuyumcu Soygunu** (dayLimit: 5, konum: city)
- Suçlu: **Kadir Usta** (tamirci) — borca battı, solvent kokusu, 44 numara
- Masumlar: **Zehra Hanım** (dükkan sahibi), **Ali** (kafe müşterisi)

**Vaka 3 — Limanın Kayıp Teknesi** (dayLimit: 5, konum: coast)
- Suçlu: **Nikos** (balıkçı) — sigorta dolandırıcılığı, dalış maskesi
- Tanık: **Remy** (NPC çapraz geçişi: "Geceleri garip sesler duydum limandan")

### 5. Balıkçılık (Remy)
- **Mekanik:** PixiJS sahnesi (FishingScene), Remy öğretiyor
- **Seeds:** nostalji → huzur path progress
- **Durum:** fishingSessions.ts + FishingScene.ts mevcut

### 6. Nehir Sal Kaptanlığı (Søren)
- **Mekanik:** PixiJS yan-kaydırmalı (RaftScene). A/D = sol/sağ kürek. Akıntı + engeller (rock, narrows, debris). 3 hasar hakkı. Süre baskısı.
- **Seeds:** kaos + zaman_yonetimi → emek path progress (+5 bonus session 10'da)
- **10 session, 3 arc:** Arc ekip (1-3 easy) → Arc fırtına (4-6 normal/hard) → Arc karar (7-10 hard/normal)
- **Dosyalar:** `nehirShifts.ts`, `nehirStore.ts`, `RaftScene.ts`, `NehirPanel.tsx`

---

## Dünya Lore Notları

- **Şimdiki şehir — Macenta Koyu:** Nehir kenti. Su = nehir. Deniz yok.
- **Karşı yaka:** Eski liman kenti — deniz, gemi, büyük şirket, Nexus orada.
- **Kural:** Diyalogda "deniz" sadece geçmişe atıfla. Remy hariç (bilerek eski kentini anıyor).
- **Düzeltilen yerler:** Nadia T1 (Nehri resmederim), skillTree huzur açıklaması (okyanus gibi derin).

---

## Dosya Haritası (Oyun Kodu)

```
src/data/
  npcDialogues.ts        — 16 NPC diyaloğu (12 felsefe + 4 romantizm)
  cutscenes.ts           — Tüm cutscene'ler (kovulma, ilk_yayin, nexus_*, awards_*, indie_resolution)
  rivals.ts              — Sabit rakipler + prosedürel üretici
  detectiveCases.ts      — 3 dedektif vakası + şüpheli karakterler
  nehirShifts.ts         — 10 sal seferi (Søren arc)
  fishingSessions.ts     — Remy balıkçılık oturumları
  pubShifts.ts           — 15 pub garsonluk vardiyası
  barShifts.ts           — 10 bar bodyguard vardiyası
  antiquarianShifts.ts   — Sahaf arşiv vardiyaları
  skillTree.ts           — Beceri ağacı (LifePath: huzur/emek/hirs)
  lifePathData.ts        — PATH_THRESHOLD=100, PATH_NPC_MAP
  topics.ts, genres.ts   — Oyun içerik veri
  events.ts              — Rastgele olaylar
  industryEvents.ts      — Sektör olayları
  courses.ts             — Eğitim/kurs sistemi
  backgrounds.ts         — Oyuncu arka planları (5 varyant)

src/store/
  nehirStore.ts, fishingStore.ts
  worldStore.ts, ideaSeedStore.ts, lifePathStore.ts

src/pixi/
  RaftScene.ts, FishingScene.ts

src/components/
  NehirPanel.tsx, BalikciPanel.tsx

docs/
  KARAKTERLER-VE-SENARYO.md   — Bu dosya
  DURUM.md                    — Geliştirme durum özeti
```
