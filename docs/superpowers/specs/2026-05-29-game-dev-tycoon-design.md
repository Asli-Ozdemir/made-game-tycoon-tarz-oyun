# Game Dev Life — Design Spec
**Tarih:** 2026-05-29  
**Durum:** Onay bekliyor

---

## Vizyon

**"Game Dev Life"** — Tycoon + RPG + Sandbox hibrit oyun.  
Büyük bir oyun şirketinden kovulan bir karakter olarak kendi stüdyonu kuruyor, sektörde yükseliyor ve seni kovayla şirketi geçmek için mücadele ediyor. Ama mecbur değilsin — sandbox istersen ana hikayeyi geride bırakabilirsin.

**Referans formül:** Persona 5 (çift mod / hikaye) + Stardew Valley (canlı dünya / NPC) + MGT2 (oyun geliştirme tycoon)

**Steam hedefi:** Electron ile masaüstü uygulama.

---

## Temel Tasarım Kararları

### Perspektif
Top-down piksel art. Karakter tile tabanlı dünyada yürüyor.  
Şehirde birden fazla lokasyon — stüdyo tek bir bina değil, dünyada bir nokta.

### Çift Mod Sistemi
- **Keşif Modu** — Karakter fiziksel olarak dünyada dolaşır, NPC'lerle konuşur, şehri gezer.
- **Tycoon Modu** — Stüdyoda kendi masana oturduğunda açılır. Klasik yönetim arayüzü. Masadan kalktığında kapanır.

Bu geçiş oyunun kalbidir: dünya seni çekiyor (Stardew hissi), ama stüdyo seni büyütüyor (MGT2 hissi).

> **Not:** Çift mod Faz 3'te eklenir. Faz 1–2'de oyun tamamen tycoon arayüzünde geçer — dünyada yürüme henüz yok.

---

## Dünya — Lokasyonlar

| Lokasyon | Amaç |
|----------|------|
| 🏢 Kendi Stüdyon | Ana üs. Masa = tycoon modu açılır |
| ☕ Kahve Dükkanı | Sosyal hub. Rakiplerle karşılaş, dedikodu/trend öğren |
| 🏭 Rakip Stüdyo | Casusluk, çalışan kaçırma, gerilimli karşılaşmalar |
| 💼 Yatırımcı Ofisi | Fon toplantıları — para ama kısıtlamalar gelir |
| 🎮 Oyun Fuarı | Sezonluk etkinlik. Demo sun, ödül kazan, trend belirle |
| 🕹️ Arcade / Mağaza | Kendi oyunlarını vitirinde gör, trend araştır, ilham topla |

Lokasyonlar arası geçiş: karakter yürüyerek veya haritadan hızlı seyahatle.

---

## Karakter Yaratma

Karakter oluşturma üç ayrı adımda yapılır: arkaplan, kişilik, görünüm.

### Adım 1 — Arkaplan Seçimi (Meslek Stat'ları)
Oyuncu 4 hazır arkaplan arasından seçer. Her arkaplan kovulma hikayesini ve meslek stat önizlemesini birlikte gösterir.

**Meslek Stat'ları** — işte ne kadar iyi olduğunu gösterir (1–10):
- **Programlama** — Kod kalitesi, teknik freelance işler, motor yazımı
- **Tasarım** — Görsel kalite, sanat freelance işleri
- **Ses** — Müzik / SFX kalitesi
- **Proje Yönetimi** — Ekip verimliliği, deadline tutturma

| Arkaplan | Kovulma Hikayesi | Yüksek | Düşük | Başlangıç Avantajı |
|----------|-----------------|--------|-------|-------------------|
| 💻 Baş Mühendis | Başarısız projenin faturası sana kesildi | Prog 8 | Karisma 2 | Solo oyun yapabilir, kendi motoru var |
| 🎨 Yaratıcı Direktör | Fikrin çalındı, sen çıkarıldın | Tasarım 9 | Programlama 2 | Görsel kalite yüksek, sanat freelance açık |
| 📋 Yapımcı | Yeni CEO "kültürel uyum yok" dedi | Prj.Yönetimi 9 | Programlama 1 | En yüksek başlangıç sermayesi |
| 🔍 KK Uzmanı | Otomasyon bahanesiyle çıkarıldın | Her stat 4–5 | Özel avantaj yok | Playtesting bonusu, oyunlarda bug olmaz |

### Adım 2 — Kişilik (Kişilik Stat'ları)
Meslek stat'larından bağımsız ikinci kategori. Oyuncu **5 puan** dağıtır.

**Kişilik Stat'ları** — kim olduğunu gösterir (1–10):
- **Karisma** — İlişki kurma hızı, ikna gücü, romantik ilişki kolaylığı
- **Odak** — Solo verimlilik, mini-game bonusu, crunch dayanıklılığı
- **Rekabetçilik** — Rakip diyalogları açılır; yüksekse gerilim artar, bazı NPC'ler uzaklaşır
- **Yaratıcılık** — Oyun konsept özgünlüğü, eleştirmen puanı bonusu
- **İş Zekası** — Yatırımcı müzakere, fiyatlandırma, pazar okuma

Bu iki kategori birbirinden ayrı tutulur — arkaplan seçerken meslek stat'larına, kişilik kısmında kişilik stat'larına bakılır. Tek ekranda 15 rakam yok.

**Her iki kategori oyun içinde geliştirilebilir:**

Meslek stat'ları — o işi yaparak artar (Skyrim mantığı):
- Programlama: freelance kod işleri, kendi motorunu yazma, günlük kod pratiği
- Tasarım: tasarım freelance, oyunun görsel parçalarını bizzat yapma
- Ses: ses stüdyosu kurma, ses projeleri üstlenme
- Proje Yönetimi: büyük ekip yönetme, zamanında proje teslimi

Kişilik stat'ları — ilgili aktivitelerle artar:
- Karisma: sosyal etkileşimler, etkinliklere katılma, ilişki milestone'ları
- Odak: kütüphanede çalışma, crunch yapmama, düzenli uyku (eve zamanında dönme)
- Rekabetçilik: rakiplerle yüzleşme, game jam'lere girme
- Yaratıcılık: arcade/müze/ilham mekanları, sanat oyunları çıkarma
- İş Zekası: yatırımcı toplantıları, pazar araştırması, finans haberleri okuma

Artış miktarı küçük tutulur — başlangıç arkaplanı her zaman belirleyici olmaya devam eder, ama uzun oyunlarda zayıf stat'lar telafi edilebilir.

### Adım 3 — Görünüm Editörü
Pixel art sprite için: ten rengi, saç stili/rengi, gözlük, aksesuar, başlangıç kıyafeti. İsim ve stüdyo adı. Görünüm mekanik etkisi yok — sadece kimlik.

---

## Günlük Döngü

Oyun günleri zaman dilimlerine bölünmüş. Zaman sınırlı — her şeyi yapamazsın.

| Dilim | Saat | İçerik |
|-------|------|--------|
| ☀️ Sabah | 09–12 | Stüdyo modu. Çalışan görevlendir, projeyi kontrol et, mesajları oku. Kararlar verildi mi? Geri kalanı otomatik çalışır. |
| 🌤 Öğle | 12–17 | Şehir zamanı. Freelance iş, sosyal etkileşim, araştırma, alışveriş, keşif. |
| 🌆 Akşam | 17–21 | Sosyal / kişisel. Yatırımcı yemeği, çalışanla buluşma, kişisel skill geliştirme, ilham toplama. |
| 🌙 Gece | 21–00 | İsteğe bağlı crunch. Proje hızlanır ama ertesi sabah yorgunluk cezası. |

### Aktivite Çeşitliliği — Stardew Analogu

Her aktivite farklı bir şey tüketir, farklı bir şey verir:

| Aktivite | Veriyor | Götürüyor |
|----------|---------|-----------|
| Freelance iş | Hızlı para | Kendi projen yavaşlar |
| Araştırma/kütüphane | Yeni teknoloji/tür | O gün para yok |
| Sosyal etkileşim | İlişki, ağ, bilgi | Üretkenlik sıfır |
| Crunch | Proje ilerleme | Ertesi yorgunluk |
| Arcade/trend araştırma | Yaratıcılık bonusu | Zaman |
| Yatırımcı toplantısı | Büyük para | Kısıtlamalar ve baskı |

---

## Tycoon Sistemi (Masa Modunda)

### Oyun Geliştirme Döngüsü
1. Konsept seç (tür + platform + hedef kitle)
2. Ekip ata (her alan: grafik, kod, müzik, test)
3. Geliştirme aşamaları ilerler (haftalık tick)
4. Playtesting mini-game'i (isteğe bağlı — kalite bonusu)
5. Yayıncı / bağımsız seçimi
6. Lansman → satış + eleştirmen puanı

### Çalışan Sistemi

**Çalışma saatleri:** Çalışanlar 09:00'da gelir, 15:00'da çıkar. Sen ofiste o saatlerde değilsen işlerini yapıp giderler. Oradaysan etkileşime geçebilirsin.

**Eleman bulma — iki yönlü:**

Sana gelenler (pasif):
- Oyunun çıkınca etkilenen biri sana mail atar
- Mevcut çalışan birisini referans verir
- Rakip stüdyodan kovulan biri duyumla gelir

Sen gidersen (aktif, günlük aktivite olarak zaman tüketir):
- Kafede tanıştığın biriyle konuşursun
- Game jam / oyun fuarında tanışırsın
- Üniversite mezuniyet etkinliğine gidersin
- Rakip stüdyonun önünde bekleyip çıkanlarla tanışırsın

Teklif vermek ilk tanışmada olmaz — birkaç etkileşim sonra güven oluşur, sonra iş teklifi edilebilir.

**Her çalışanın:** beceri seviyesi, maaş beklentisi, kişilik, sadakat, enerji
**NPC çalışanların özel hayatı var** — doğum günü, aile problemi, iş teklifi, kişisel kriz.
Bu olaylar projeyi doğrudan etkiler (yarın işe gelmeyebilir, yavaşlayabilir, ayrılabilir).
Stüdyo dışında buluşarak moral ve sadakat yönetilebilir.

### Ofis Genişletme
- Daha büyük ofis = daha fazla çalışan kapasitesi
- Ekipman: daha iyi bilgisayar → geliştirme hızı bonusu
- Özel odalar: ses stüdyosu, oyun test odası, toplantı odası

### Pazar ve Trend Sistemi
- Her sezon belirli türler popüler
- Trend tahmin etmek beceri ister (İş Zekası stat'ı etkiler)
- Rakip şirket de oyun çıkarır — satış yarışması gerçek zamanlı

---

## Hikaye ve Ara Sahneler

### Çerçeve
Hikaye **destekleyici unsur** — ana gameplay loop olmadan da oyun eğlenceli.  
Ama hikayeyi takip eden oyuncu daha zengin bir deneyim yaşar.

### Ara Sahne Formatı
Pixel art still frame + diyalog kutusu. Uzun animasyon yok. Kısa, duygusal, anlamlı.

### Tetikleyici Olaylar

| Tetikleyici | Sahne İçeriği |
|------------|---------------|
| Oyun başlangıcı | Kovulma sahnesi — duygusal kanca, motivasyon kurulur |
| İlk oyun yayını | Küçük kutlama. Rakip şirket seni ilk kez fark eder. |
| Rakibin satışını geçersin | CEO seni arar. Tehdit mi, teklif mi? |
| Çalışanla ilişki milestone'u | Stardew heart event — kısa, kişisel sahne |
| Eski şirketten biri seni arar | Ahlaki seçim anı. Gri bölge. |
| Rakibi büyük etkinlikte yenersin | Gerilim doruk noktası |
| Son arc | Rakibi satın al / yık / affet / onlarla birleş — seçim sana bırakılır |

### Rakip Şirket Tasarımı
Kartoonize kötü değil — **ahlaki açıdan gri, gerçekçi, acımasız.**  
EA/Activision modeli: her karar iş açısından mantıklı, ama insanları eziyor.  
Oyuncu bunu doğrudan anlatım yerine **mekaniklerle öğrenir:**
- İşe aldığın eski çalışanları neden ayrıldıklarını anlatır
- Endüstri haberleri onları olumlu gösterir
- Sen büyüdükçe aynı zor kararlarla karşılaşırsın — ve anlarsın

---

## Teknik Stack

| Katman | Teknoloji |
|--------|-----------|
| Masaüstü wrapper | Electron (Steam Direct yayını için) |
| UI / Tycoon arayüzü | React + Zustand |
| 2D render / dünya | PixiJS |
| Harita formatı | Tiled (.tmx) |
| Veri persistans | SQLite (electron-store) |
| Dil | TypeScript |

---

## Geliştirme Fazları

Bu spec Faz 1'i kapsar. Sonraki fazlar kendi spec'lerini alır.

| Faz | Kapsam |
|-----|--------|
| **Faz 1 — Core Loop** | Zaman döngüsü, para, proje başlat/geliştir/yayınla, basit puan |
| **Faz 2 — Çalışan Sistemi** | İşe al/çıkar, maaş, NPC hayatları |
| **Faz 3 — Dünya / Keşif** | Şehir haritası, lokasyonlar, karakter hareketi, çift mod |
| **Faz 4 — Karakter + Hikaye** | Arkaplan seçimi, ara sahneler, rakip şirket arc'ı |
| **Faz 5 — Pazar + Trend + Mini-game'ler** | Trend sistemi, freelance mini-game'ler, playtesting |

---

## Kapsam Dışı (Bu Spec İçin)

- Multiplayer
- Mod desteği
- Konsol portu
- Ses/müzik tasarımı detayları
- Tam diyalog yazımı
