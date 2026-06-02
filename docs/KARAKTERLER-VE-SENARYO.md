# Karakterler ve Senaryo — Macenta Koyu

Son güncelleme: 2026-06-03

---

## Ana Senaryo

### Oyuncunun Hikâyesi

Oyuncu, büyük bir oyun şirketi olan **Nexus Games**'ten kovulur. Victor Crane'in kararıyla işten çıkarılır, nehri geçerek **Macenta Koyu**'na yerleşir. Hedef: sıfırdan bağımsız stüdyo kurmak. Süre: 30 yıl (2000–2030).

### 5 Oyuncu Arka Planı (`backgrounds.ts`)

| # | Arka Plan | Emoji | Başlangıç Parası | Başlangıç İtibar | Özellik |
|---|---|---|---|---|---|
| 1 | **KK Uzmanı** | 🔍 | $30,000 | 0 | Yayınlanan oyunlarda bug olmaz |
| 2 | **Yaratıcı Direktör** | 🎨 | $40,000 | 0 | Görsel kalite yüksek (Faz 5'te aktif) |
| 3 | **Baş Mühendis** | 💻 | $50,000 | 0 | Solo oyun yapabilir, programlama bonusu |
| 4 | **Yapımcı** | 📋 | $75,000 | 0 | En yüksek ekip verimliliği (Faz 5'te) |
| 5 | **Eski CEO** | 👔 | $120,000 | 20 | İtibar kaybı ×2 (herkes seni izliyor) |

**Meslek İstatistikleri (programlama / tasarım / ses / proje yönetimi):**
- KK Uzmanı: 4/4/5/5 — dengeli
- Yaratıcı Direktör: 2/9/4/3 — tasarım ağırlıklı
- Baş Mühendis: 8/3/2/4 — programlama ağırlıklı
- Yapımcı: 1/4/3/9 — yönetim ağırlıklı
- Eski CEO: 3/3/2/7 — yönetim ağırlıklı

Her arka plan farklı bir kovulma hikâyesi anlatır (bkz. Cutscene Sistemi).

---

## Ana Antagonist — Victor Crane

**Şirketi:** Nexus Games | **Yardımcısı:** Klein

Oyunun tek doğrudan antagonisti. Makyavel'i alıntılar: *"Sevgi ucuzlar, korku tutar."*

**Crane'in Arka Plan Varyantları** (her geçmişe göre farklı bakış açısı):

| Varyant | Crane'in tanımı |
|---|---|
| KK Uzmanı | "Dört yüz kişi gönderdim, hisse yüzde on iki fırladı. Kurul adımı o gün ezberledi." |
| Yaratıcı Direktör | "Fikir ucuzdur, Klein. Onu doğru odada söyleyen kişi pahalı. Ben o odadaydım, o değildi." |
| Baş Mühendis | "Kod kusursuzdu. Sorun yönetimdeydi, yani bendeydi. Ama itibar pahalı, doğruluk ucuz." |
| Yapımcı | "Çok şey biliyordu. Bilen adam, taht için fazla tehlikelidir." |
| Eski CEO | "Bu koltuğu o yaptı. Ben sadece daha çok isteyeni oynadım." |

**Klein:** Crane'in asistanı. Haberleri getirir, raporlar. Kendi görüşü yok.

**Crane Sahne Arci:**
1. `nexus_notice` — Klein haberi getirir, Crane uzaktan değerlendiriyor
2. `nexus_meeting` — İlk yüz yüze: *"Sıkılmıştım. İyi rakip iyi aynadır — bakalım ben mi haklıydım."*
3. `nexus_resolution` — 4 karar yolu (aşağıda)

**Oyun Sonu — 4 Karar Yolu:**

| Seçim | Crane'in Son Sözü |
|---|---|
| **Buyout** (satın al) | "Artık benden daha korkunçsun galiba. İkimiz de aynı yere vardık." |
| **Destroy** (yık, skandal) | "Gömülen benim. Ama düsturumu taçlandırdın." |
| **Forgive** (hiçbirini kullanma) | "Ham, katıksız iyi insanlar varmış. Ben hep masal sanırdım. Git — seni anlamadan önce git." |
| **Merge** (birleş) | "İkimiz de nehrin sonuna geldik — sen kürek çekerek, ben sürüklenerek. Ortak olalım. Ama gözünü dört aç." |

---

## Giriş Cutscene Karakterleri

Her kovulma sahnesi: ofis → yatak odası (eş) → mahkeme → kıyı (yeni başlangıç)

| Karakter | Varyant | Notta |
|---|---|---|
| **İK Müdürü** | kk_uzmani | "Karar yukarıdan geldi." |
| **Patron** | yaratici_direktor, bas_muhendis | "Eşyalarını topla. Güvenlik aşağıda bekliyor." |
| **Yeni CEO** | yapimci | "Çok şey biliyorsun. Sorun da tam olarak bu." |
| **Kurul Başkanı** | eski_ceo | "Oybirliği. Şirket artık senden büyük." |
| **Eş** | tüm varyantlar | Her birinde farklı son söz, mesaj aynı: "Başka biri var. Beni gören biri." |
| **Hâkim** | tüm varyantlar | "Taraflar anlaşmalı boşanmada mutabık." |
| **Sunucu** | awards_win / lose | Ödül töreni sunucusu |
| **Rakip Kurucu** | indie_resolution | "Sıra bize geldi. Sizin gibi büyükler hep küçükleri ezerek başlar." |

---

## Rakip Şirketler (`rivals.ts`)

### Sabit Rakipler

| Şirket | Tier | Kişilik | Kurulus | Favori Tür | Gelir | Fark Edilme |
|---|---|---|---|---|---|---|
| **Nexus Games** | major | aggressive | 1990 | RPG, Aksiyon | $50M | 80 itibar |
| **PixelForge** | mid | friendly | 1995 | Bulmaca, Simülasyon | $5M | 20 itibar |
| **Ironclad Studios** | mid | aggressive | 1993 | Strateji, Aksiyon | $7.5M | 25 itibar |
| **Starlight Interactive** | mid | secretive | 1997 | Macera, RPG | $4M | 30 itibar |
| **Tiny Worlds** | indie | friendly | 1998 | Simülasyon, Bulmaca | $200K | 5 itibar |
| **Glitch Lab** | indie | defensive | 1999 | Aksiyon, Bulmaca | $100K | 8 itibar |

### Prosedürel Rakipler
8 prefix × 8 suffix = 64 olası isim (Pixel, Nova, Storm, Iron, Sky, Dark, Ultra, Hyper + Works, Labs, Studio, Games, Craft, Forge, Arts, Byte). Indie tier, rastgele kişilik.

---

## Hayat Yolları

Üç resmi yol, eşik 100 puan. İlgili NPC'ler ve skill ağacı T5 kilidiyle bağlı.

| Yol | Bağlı NPC'ler | T5 Skill Düğümü |
|---|---|---|
| **Huzur** | Marcus, Remy, Rex | `t5_huzur` — "Nehir gibi akar, okyanus gibi derin." |
| **Emek** | Theo, Søren | `t5_emek` |
| **Hırs** | Vivian | `t5_hirs` |

---

## Fikir Tohumları (Idea Seeds) — 6 Tür

NPC diyalogları ve yan işlerden birikir, skill ağacı düğümlerini satın almak için kullanılır.

| Seed | Emoji | Renk |
|---|---|---|
| Nostalji | 🌙 | Mor |
| Hikaye | 📖 | Mavi |
| Kaos | 🌪️ | Kırmızı |
| Zaman Yönetimi | ⏳ | Yeşil |
| Analiz | 🔍 | Sarı |
| Sosyallik | 🫂 | Pembe |

---

## Felsefe NPC'leri (12 kişi)

---

### Marcus — Sahaf
**Felsefe:** Stoa | **Emoji:** 📚 | **Yan İş:** Sahaf Arşiv (nostalji + hikaye)

**Gizli arka plan (Remy ile bağlantı):** 15 yıl önce Remy'nin balıkçı ekibinin 4. üyesiydi. Fırtınadan sağ çıktılar ama tekne battı. Diğer ikisi şehri terk etti. Marcus kaldı — bir daha balık tutmadı. Kitap satmaya başladı. Remy ile aralarında tek kelime geçmedi bu konuda; sessizce kabullendiler.

Büyük şehirde kütüphane direktörüydü. Koleksiyonu dijitalleştirme kararına karşı çıktı, görevden alındı. Binlerce kitabı taşıyarak döndü.

**T3:** *"Crane'in varlığına enerji harcama. Onu kontrol etmeye çalışırsan, o seni yönetmiş olur."*

---

### Remy — Balıkçı
**Felsefe:** Tao | **Emoji:** 🎣 | **Yan İş:** Balıkçılık (nostalji → huzur path)

**Hikâye arki** — 3 arc, 10 session:

**Arc 1 — Fener (session 1–3, easy):**
Babası bir fener bekçisiydi. Remy'yi balık tutmayı öğretti, güneydeki eski iskelede — şimdi yıkılmış. Babasının son yıllarında belleği gitti; bir kez Remy'nin adını unuttu. Tek seferdi, ama Remy yüzündeki ifadeyi hiç unutmadı. 17 yaşında son kez birlikte balık tuttular.

**Arc 2 — Fırtına (session 4–6, normal/hard):**
15 yıl önce. 4 kişilik ekip — on yıl birlikte balık tutmuşlardı. Fırtına vurdu, Remy "devam et" dedi, sığınağa koştular. Hepsi kurtuldu ama tekne battı. Sonra: iki kişi bir ay içinde şehri terk etti, bir daha denize bakamazlardı. **Marcus kaldı — ve hiç konuşmadı bu konuda. Sadece kitap satmaya başladı.**

**Arc 3 — Aile (session 7–10, normal/hard/normal):**
Kızı var. Küçükken balığa gelirdi, büyüyünce "deniz sıkıcı" dedi. Annesini kaybettikten sonra (3 yıl önce) seyreltik aradı. Remy yıkılmayı bilmedi — kız belki de yıkılmasını, onu ihtiyacı olduğunu görmesini bekliyordu. Remy göremedi. Son session'da: mektubu gönderdi. Üç cümle. Bilmiyor yeterli mi.

*"I don't know what a good father looks like. Mine disappeared into that lighthouse."*

**Dedektif crossover:** Vaka 3'te tanık olarak yer alıyor — limanda gece sesler duymuş.

**T3:** *"Crane'e karşı güç kullanma. Nehir kayayı yıkmaz — onu aşar."*

> **Lore notu:** Balıkçılık mekanik olarak deniz balıklarıyla çalışıyor (mackerel, anchovy, bluefish, bonito, sea bass, red mullet, sea bream, flounder). Session metinleri de "sea" diyor. Macenta Koyu'nun kıyıya çıkan bir nehri veya haliç erişimi var; fishing pier kıyısal.

---

### Theo — Pub Barman
**Felsefe:** Varoluşçuluk (Camus) | **Emoji:** 🍺 | **Yan İş:** Pub Garsonluk (zaman_yonetimi + kaos)

Akademisyen. Anlam arayışının anlamsızlığını fark edip barda kaldı. *"Camus kahkaha attı ve içki döktü."* **T3:** *"Absürd dünyada ciddiyet de absürd; gül, devam et."*

---

### Bruno — Mühendis
**Felsefe:** Aristoteles | **Emoji:** 🔧

Köprü mühendisi. Bir köprüde şirket baskısıyla kritik malzeme değiştirildi; olay yaşanmadan yakalandı ama Bruno o köprüye bir daha bakmadı. *"Erdem, bir kez ödün verdiğinde kaybolmaz — ama kırılır."* **T3:** *"Crane'i zaferden önce dürüstlüğü feda etmeden yen."*

---

### Magnus — Sokak Filozofu
**Felsefe:** Nietzsche | **Emoji:** 🌒

Kendi şehrinde "dahi" denen bir oyun yaptı, sonra aynı kalabalık onu yaktı. Sürünerek döndü. Çürük teknede yaşıyor. Hanna onu çocukluğundan tanır. **T3:** *"Crane'i değil, kendini aş. Canavarla dövüşen, canavara dönüşmemeye dikkat etsin."*

---

### Marta — Hemşire
**Felsefe:** Bakım Etiği | **Emoji:** 🩺

Başkente gitme şansı vardı, annesine kalıcı. Kırk yıldır herkese bakıyor, ezbere biliyor. Nexus'tan kırılanların elini tuttu. *"Tablo titremez, insan titrer."* **T3:** *"İnsan kal. Crane'e karşı katılaşırsan sen de kaybedin."*

---

### Clara — Noter
**Felsefe:** Kant/Deontoloji | **Emoji:** ⚖️

Avukattı. Büyük şirket küçük stüdyonun fikrini çalmıştı, davayı "zayıflat" dediklerinde reddetti. Kimse işe almadı, döndü. Masasında yarım bir dosya: *"neyi reddettiğimi unutmamak için."* Vivian ve Marta'yı oyun içinde anar. **T3:** *"Bunu kural yapsam herkese uygulasa razı mıyım? Değilsen, ona benzemişsindir."*

---

### Aldo — Bahçıvan
**Felsefe:** Epikür | **Emoji:** 🌿

Karşı yakada serveti ve unvanı vardı; hepsini sattı, bahçeye döndü. Masa dağılınca gerçek dostları bahçeye geldi. *"İsim taşa değil, bahçeye kazınır."* **T3:** *"Crane'i yen, ama yıkma. Bahçeni kaybedersen o seni yenmiş olur."*

---

### Yevgeni — Teknisyen
**Felsefe:** Nihilizm/Materyalizm | **Emoji:** 🔬

Her şeyi mekanizmasına indirger. Otoriteyi reddeder. Ama babasından gelen mektupları çekmecede saklar — *"karbon ve mürekkep, ama faydasını bulamıyorum. Galiba yararsız bir şeyi ilk kez seviyorum."* **T3:** *"Crane'i bir makine gibi gör. Ama yıkmadan önce yerine ne koyacağını bil."*

---

### Søren — Liman Kaptanı
**Felsefe:** Varoluşçuluk (Sartre) | **Emoji:** ⚓ | **Yan İş:** Nehir Sal Kaptanlığı (kaos + zaman_yonetimi → emek path)

Babası donanmadaydı. Komisyon kâğıdını reddetti, tek başına açıldı. Lasse adlı genç tayfasını dar geçitte kaybetti — *"devam et"* demişti, Lasse geçemedi. Yıllarca mazeret aradı. Şimdi her akşam sal seferi yapıyor, 10 session, 3 arc.

**T1 sahne:** *"Bu limanın, evet. Søren. Sabah üç tekne geç yanaştı — üçü de rüzgârı suçladı. Rüzgâr suçlanmaz; rüzgâr sadece eser."* ve *"Seni kimse getirmedi. Geldin."*

**T3:** *"Crane 'akıntı böyle aktı' diyor. Yalan. Dümeni tutan da bendim. 'Mecbur kaldım' demek sorumluluktan kaçmaktır."*

---

### Rex — Arcade Sahibi
**Felsefe:** Kirenaik Hedonizm | **Emoji:** 🕹️

Sahnelerdeydi, adını bağırırlardı. Refleksler yavaşladı, sahne küçüldü. Kendi köşesini kurdu. Birikimi yok, pişmanlığı da. Geç kapanış saatinde ışıkları söndürmekten korkar. **T3:** *"Crane'i yendiğin gün mutlu olacağını sanıyorsun — yanılıyorsun. Mutluluk ertelenmez."*

---

### Vivian — Yatırımcı
**Felsefe:** Faydacılık | **Emoji:** 📈

Kariyer başında dostunun stüdyosuna tüm fonunu yatırdı — sevdiği için. Stüdyo battı, o parayla kurtulabilecek beş stüdyo da gitti. O günden beri "toplam" üzerine kurdu ahlakını. Ama o dostun adını hesap yaparken mırıldanıyor. Clara ile Marta'yı anar. **T3:** *"Crane'i yenmek toplama değer mi, yoksa sadece egonu mu doyuruyor? Öfkeni teraziye koyma."*

---

## Romantizm Adayları (4 kişi)

---

### Elise — Kafe Müzisyeni
**Emoji:** 🎶 — Dışarıda: süslü diva. İçeride: kimsenin dinlemediğini bilen yalnız sanatçı. Çalmadığı bir şarkı var: fazla gerçek. **T3:** Salon boşaldığında sana cilasız çalıyor. *"Birinin gerçekten dinlemesi, alkıştan daha çok korkutuyor."*

### Daniel — Nehir Biyoloğu
**Emoji:** 🔬 — İnsanlarla beceriksiz, su semenderleriyle rahat. Üniversiteden kaçtı. Konuşmayı sevince durduramıyor. **T3:** Yeni keşfettiği türe senin adını veriyor (Latince ekiyle, resmî kayıtta). *"Seni çözmek istemiyorum. Sadece yanında durmak istiyorum."*

### Nadia — Seramikçi
**Emoji:** 🏺 — Şehirde galerisi vardı, "pratik ol" dediklerinde trene bindi geldi. Eğri vazoları atar. Bağlanmaktan korkar ama sadıktır. **T3:** Birlikte çark başında, ne çıkacağını bilmeden. *"İlk kez bir şeyin bitmesini değil, sürmesini istiyorum."*

### Cassian — Fenerci
**Emoji:** 🗼 — Melankolik. Fener bir zamanlar iki kişiydi; birinin adını anmıyor ("anarsam gerçek olur"). Geceleri yazar, kimseye okumaz. Yalnızlığı seçtiğini söyler. **T3:** *"Sen geldiğinden beri gece daha kısa. İlk kez ışık içeride de yanıyor."*

---

## Dedektif Vakaları (`detectiveCases.ts`)

### Vaka 1 — Parkta Kayıp Evrak
**Süre:** 4 gün | **Konum:** park | **Suçlu:** Mete Doğan

Kanıt zinciri: Deri çanta (içinde "Yarın park — M." notu + Mete'nin kartviziti) → Sigara izmariti → Parmak izi

| Şüpheli | Durum | Not |
|---|---|---|
| **Mete Doğan** | Suçlu | Finansal danışman, "beni zorladılar" diyor |
| **Dilara** | Masum | Parkta yürüyüşçü |

---

### Vaka 2 — Kuyumcu Soygunu
**Süre:** 5 gün | **Konum:** city | **Suçlu:** Kadir Usta

Kanıt: Kırık vitrin (kesici alet, içeriden) → Solvent kokulu siyah eldiven → 44 numara ayak izi

| Şüpheli | Durum | Not |
|---|---|---|
| **Kadir Usta** | Suçlu | Tamirci, borca batmış, solvent kokuyor |
| **Zehra Hanım** | Masum | Dükkan sahibi, öfkesi gerçek |
| **Ali** | Masum | Kafe müşterisi |

---

### Vaka 3 — Limanın Kayıp Teknesi
**Süre:** 5 gün | **Konum:** coast | **Suçlu:** Nikos

Kanıt: Bilerek açılmış tekne deliği → Dalış maskesi (parmak izi) | Sigorta dolandırıcılığı

| Şüpheli | Durum | Not |
|---|---|---|
| **Nikos** | Suçlu | Balıkçı, aile borca batmış |
| **Remy** | Tanık | "Geceleri garip sesler duydum limandan." *(NPC çapraz geçiş)* |

---

## Side Job'lar — Tam İçerik

### 1. Pub Garsonluk (Theo, 15 vardiya)
Sipariş + sabır barı mini-oyunu. Gizli istekler masaya gidince açılır (Kemal'in fıstık alerjisi gibi). Seeds: zaman_yonetimi + kaos.

### 2. Sahaf Arşiv (Marcus, 3 session)
Kitap eşleştirme bulmacası. Tür + dönem + durum üçlüsü. Seeds: nostalji + hikaye.

**Lokasyonlar ve session yapısı:**

| Session | Lokasyon | Kitap Sayısı | İstek Sayısı | Zorluk |
|---|---|---|---|---|
| 1 | Old Tower | 10 (4 doğru + 6 yem) | 4 | Kolay |
| 2 | Forest Cabin | 12 (5 doğru + 7 yem) | 5 | Orta (su hasarı ekli) |
| 3 | Cave **veya** Old Tower (seçim) | 10 her biri | 5 | Orta+ |

**Kitap türleri:** leather journal, poetry collection, field guide, travel diary, memoir, atlas, novel, botanical guide, correspondence collection, exploration journal, scientific treatise, illustrated almanac, letter collection

### 3. Bar Bodyguard (10 vardiya)
Papers Please tarzı kapı görevlisi. Gece kuralı + kara liste + VIP listesi. Gerilim sistemi (tensionSteps), yönetilmezse kavga. Seeds: kaos + emek.

**Misafir kategorileri:** sarhoş (Gözleri kızarmış, Sesi yüksek), tehlikeli, kara listede, VIP, normal.

**İsimler (örnekler):** Ayşe, Mehmet, Volkan (kara listede), Selin, Deniz, Berk, Cem, Hande, Rıza...

### 4. Dedektif Asistanı (3 vaka, yukarıda detaylı)
Sahne tarama → kanıt inceleme → şüpheli sorgulama → suçlama. Seeds: analiz + emek.

### 5. Balıkçılık (Remy, 10 session)
Jigging ritim mini-oyunu. Sol tık → optimal aralık. Seeds: nostalji → huzur path.

**Lure'lar:** Live Bait (mackerel, anchovy, flounder), Metal Spoon (sea bass, bluefish, bonito), Soft Lure (red mullet, sea bream, flounder)

**Spot'lar:** Open Water (mackerel, anchovy), Rocky Edge (sea bass, red mullet), Pier Tip (sea bream, bonito, bluefish)

**Jigging profilleri:** easy = 1200ms/400ms tolerans, hard = 600ms/150ms tolerans

**Story fragment'lar:** 11 unlock (frag_lighthouse_01-07, frag_storm_01-08, frag_family_01-11) — Remy'nin babası, fırtına ve ekip, kızı ile arası.

**Session 10 kapanışı:** *"I sent the letter. Yesterday. Three sentences. I don't know if it's enough."* / *"I chose this place. I'd choose it again. I think she knows that now. And maybe that's okay."*

### 6. Nehir Sal Kaptanlığı (Søren, 10 session)
PixiJS yan-kaydırmalı. A/D = sol/sağ kürek. Akıntı + engeller (rock, narrows, debris). 3 hasar hakkı. Seeds: kaos + zaman_yonetimi → emek path (+5 bonus session 10).

---

## Oyun Sistemleri — Özet

### Tycoon Mekanikleri

**Proje Boyutları:**
| Boyut | Süre | Kalite/Hafta |
|---|---|---|
| Küçük | 8 hafta | 6 |
| Orta | 16 hafta | 5 |
| Büyük | 24 hafta | 4 |
| İddialı | 36 hafta | 3 |

**Platform Çarpanları:**
- PC: ×1.0 satış, $20/birim
- Konsol: ×1.2 satış, $30/birim ($40 önerilen)
- Mobil: ×0.8 satış, $5/birim

**Oyun Türleri:** Aksiyon (1000 baz satış, 6 hf döngü), RPG (800, 8 hf), Strateji (600, 5 hf), Simülasyon (500, 7 hf), Bulmaca (700, 6 hf). Popülarite sinüs dalgasıyla döner.

**Temalar (Topics):** Uzay (Aksiyon+Strateji), Fantezi (RPG+Aksiyon), Spor (Simülasyon+Aksiyon), Korku (Aksiyon+RPG), Şehir (Simülasyon+Strateji)

**Çalışan Kişilikleri:** Odaklı, Yaratıcı, Sosyal, Rekabetçi, Sakin — her birinin farklı stat tavanları.

**Çalışan İsimleri (havuz):** Ahmet, Mehmet, Zeynep, Ayşe, Can, Deniz, Ece, Fatma, Hasan, İpek, Kemal, Leyla, Murat, Nilüfer, Ozan, Pınar, Rıza, Selin, Tamer, Ülkü, Burak, Canan, Emre, Gizem + Yılmaz, Kaya, Demir, Şahin, Çelik, Yıldız, Arslan, Doğan, Aydın, Özkan, Kurt, Şimşek

### Sektör Etkinlikleri (6 yıllık)

| Etkinlik | Mevsim | Odak Türler |
|---|---|---|
| GDC | İlkbahar H2 | Strateji, Simülasyon, Bulmaca |
| Indie Fuarı İlkbahar | İlkbahar H4 | Indie |
| E3 / Summer Game Fest | Yaz H2 | Konsol, Aksiyon, RPG |
| Gamescom | Sonbahar H1 | PC, Mobil |
| Indie Fuarı Sonbahar | Sonbahar H3 | Indie, PC |
| Oyun Ödülleri | Kış H4 | Skor ≥75 gerekli |

**Sunum türleri:** Teaser ($5K, +5 itibar, ×1.10), Demo ($15K, +10, ×1.25), Duyuru ($35K, +20, ×1.40)

### Zaman Sistemi

Yıl 2000'den başlar. 4 mevsim (İlkbahar/Yaz/Sonbahar/Kış), mevsim başı 4 hafta = 13 tik/yıl. Hız: Duraklat / Normal / Hızlı (×2) / Çok Hızlı (×4).

---

## Dünya Lore Notları

- **Şimdiki şehir — Macenta Koyu:** Nehir kenti. Balıkçılık kıyısal/haliç erişimiyle.
- **Karşı yaka:** Eski liman kenti — Nexus orada.
- **Kural:** "Deniz" = geçmişe atıf. Remy liman kentini anıyorsa doğru; şimdiki günlük yaşamda nehir.
- **Remy–Marcus bağlantısı:** Aynı balıkçı ekibinin üyeleriydi. Fırtınadan sonra Marcus denizi bıraktı.
- **Fish:** Deniz balıkları (mackerel, bonito vb.) — Macenta Koyu'nun haliç/kıyı erişimi olduğu kabul edilir.

---

## Dosya Haritası

```
src/data/
  npcDialogues.ts        — 16 NPC (12 felsefe + 4 romantizm)
  cutscenes.ts           — kovulma, nexus_*, awards_*, indie_resolution
  rivals.ts              — 6 sabit rakip + prosedürel üretici
  detectiveCases.ts      — 3 vaka, 7 şüpheli/tanık
  fishingSessions.ts     — 10 session, 3 arc (Remy hikâyesi), 11 story fragment
  nehirShifts.ts         — 10 session, 3 arc (Søren hikâyesi)
  antiquarianShifts.ts   — 3 session, Old Tower/Forest Cabin/Cave
  pubShifts.ts           — 15 pub vardiyası
  barShifts.ts           — 10 bar bodyguard vardiyası
  backgrounds.ts         — 5 oyuncu arka planı
  skillTree.ts           — 35+ düğüm, 5 tier, LifePath: huzur/emek/hirs
  lifePathData.ts        — PATH_THRESHOLD=100, PATH_NPC_MAP
  topics.ts              — 5 tema (Uzay, Fantezi, Spor, Korku, Şehir)
  genres.ts              — 5 tür + pazar döngüsü
  platforms.ts           — PC/Konsol/Mobil
  courses.ts             — Çalışan eğitim programları
  events.ts              — 50+ rastgele olay (6 kategori)
  industryEvents.ts      — 6 sektör etkinliği
  employeeNames.ts       — 24 ad + 12 soyad havuzu

src/store/ (26+ store)
  nehirStore, fishingStore, antiquarianStore, detectiveStore
  worldStore, gameStore, timeStore, projectStore, employeeStore
  npcStore, skillTreeStore, lifePathStore, ideaSeedStore
  rivalStore, marketStore, industryEventStore, campaignStore
  barStore, pubStore, newsStore, awardsStore, economyStore...

src/pixi/
  RaftScene.ts, FishingScene.ts + diğer sahne dosyaları

src/components/ (40+ panel)
  NehirPanel, BalikciPanel, SahafPanel, DetectivePanel
  BarPanel, PubPanel, CafePanel, AcademyPanel
  SkillTreeCanvas, SkillTreePanel
  CharacterCreationWizard, CutscenePlayer, DialogueView
  NewProjectModal, EmployeePanel, CampaignPanel...

docs/
  KARAKTERLER-VE-SENARYO.md   — Bu dosya
  DURUM.md                    — Geliştirme durum özeti
  superpowers/specs/           — Design spec'leri
  superpowers/plans/           — Implementasyon planları
```
