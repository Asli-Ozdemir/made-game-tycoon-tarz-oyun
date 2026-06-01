# Sandbox Yan İşler & Yaşam Yolları (Derinleştirme): Tasarım Dokümanı

**Tarih:** 2026-06-01
**Kapsam:** (1) Yan işleri "tohum/para butonu"ndan **mikro-deneyimlere** dönüştürmek + temalı/nadir/**kirli** idea-seed'ler; (2) üç yaşam yolunu (hırs/huzur/emek) estetik + derin mekanik (sinaps) + bedel ile derinleştirmek; (3) **tek-seferlik tövbe** ile yol değiştirme.

## Bağlam
Mevcut **skill tree** (`data/skillTree.ts`, lifePathLock: `hirs`/`huzur`/`emek` + Denge), **idea-seed** (`ideaSeedStore.ts`, 4 temel: nostalji/hikaye/kaos/zaman_yonetimi), **NPC diyalog** (`npcDialogues.ts`) ve **dünya odaları** (coast/bridge/city, nehir) zaten uygulandı. Bu doküman onların üstüne biner. Lore: **Apex Games / Victor Crane**, nehir şehri. Tema/ruh: `PROJE-BAGLAM.md`.

> **Kod uzlaşı notu:** `IdeaSeedType` şu an 4'lü kapalı union. Bu spec **nadir seed** katmanı ekler (genişletme: ya union genişler, ya da `RareSeedType` ayrı tutulur + skill tree maliyet/efektlerine bağlanır). Uygulamada karar verilir.

---

## 1) Yan İşler — Mikro-Deneyimler

Her yan iş, kendi içinde ustalaşılabilen bir mini-sistem; **temalı idea-seed** düşürür. Bazı seed'ler **nadir**, bazıları **kirli** (skandal riski).

### 🛡️ Barda Bodyguardlık — *Distopya & Otorite*
- **Mekanik:** Yaşa bakmak yetmez; neon ışık altında müşterilerin **siber implant lisanslarını** tara, gerginlikte **rüşvet** tekliflerini reddet/kabul et.
- **Tohumlar (nadir):** **Kara Borsa · Siber Güvenlik · Ahlaki Çöküş.** Rüşvet alırsan tohumlar **"Kirli"** işaretlenir → bu tohumlarla yapılan oyunlar **skandala** yol açabilir (itibar riski, basın).

### 🍺 Pub İşçiliği — *Odak & Kaos Yönetimi*
- **Mekanik:** Mesai sonrası tükenmiş yazılımcı + kasabalı kalabalığında masaları yönet; müşterinin **enerji seviyesine** göre doğru sipariş. Ör. crunch'tan çıkmış yazılımcıya basit atıştırmalık değil, **kaliteli karbonhidrat+protein** (tavuklu bulgur pilavı) → o NPC'nin **sadakati + bahşişi** artar.
- **Tohumlar:** **Zaman Bükülmesi · Kaos Teorisi · Kaynak Yönetimi** → restoran/şehir-kurma simülasyonlarında **%20 kalite bonusu.**

### ⚖️ Avukat Asistanlığı — *Legal Engineering*
- **Mekanik:** Evrak okumak değil; karmaşık yasal metinleri **kod + akış şemasına** çeviren mini-oyun. Bağımsızları büyük şirketlere karşı korumak için **kendini çalıştıran akıllı sözleşmeler (Ricardian)** kodla; hukuki boşlukları algoritmayla kapat.
- **Tohumlar:** **Computable Law · Siber Casusluk · Bürokrasi Simülasyonu.** Ustalaşmak stüdyona pasif **"Telif Kalkanı"** kazandırır (fikir hırsızlığına karşı koruma — 4C/Kant temasıyla bağ).

### 📚 Sahafta Arşiv Taraması — *Gizem Çözme*
- **Mekanik:** Raf silmek değil; Marcus sana hasarlı disket/yıpranmış roman sayfası verir, **metinlerdeki şifreleri çözerek** unutulmuş oyun mekaniklerini (lore) çıkarırsın.
- **Tohumlar:** **Unutulmuş Tanrılar · Retro-Futurizm · Kadim Anlatı** → bu tohumlu RPG oyunları anında **"Kült Klasik"** statüsü. *(Bağ: skill tree `sahaf_arsiv` social_unlock.)*

### 🏘️ Emlakçılık — *Gentrification / Soylulaştırma*
- **Mekanik:** Tohum vermez; **haritayı fiziksel değiştirir.** Ucuz arsaları topla, değerlenince sat. Ama çok alıp satarsan şehrin **"Kira Endeksi"** yükselir → sevdiğin **sahaf/fırıncı kepenk kapatma** tehlikesine girer. *(Hırs yolunun gri bedeli; NPC kaybı kalıcı.)*

---

## 2) Yaşam Yolları (Derinleştirme)

Yollar sadece üretilen oyunu değil, **ofisin estetiğini, kasabadaki fiziksel varlığını ve ekibin psikolojisini** değiştirir.

### 📈 Hırs Yolu — *The Way of Capital*
- **Estetik:** Sıcak ahşap garaj → soğuk, minimalist, cam ağırlıklı plaza (Baltık tech ekosistemi).
- **Sinapslar:** **Yapay Zeka Yatırımı** (çalışan ihtiyacı azalır, kodu AI'a devret → hız ↑ ama "Ruh/Özgünlük" ↓) · **Düşmanca Satın Alma** (küçük bağımsız stüdyoları haritadan sil, pazar payını yut).
- **Bedel:** Kasaba halkı ofisine gelmeyi bırakır; idealist gençler (tatlı piksel sanatçısı) **"Sen de Victor Crane gibi oldun"** deyip istifa eder.

### 🌊 Huzur Yolu — *The Way of Soul*
- **Estetik:** Ticarethane değil; sarkık bitkiler, lo-fi müzik, gezen kediler — sanat atölyesi.
- **Sinapslar:** **Yaratıcı Dokunulmazlık** (pazar trendlerinden etkilenmezsin — FPS modaysa bile point-and-click yap, trend cezası yok) · **Komünite Bağı** (pazarlama bütçesi gereksiz; fırıncı/balıkçı/sahaf oyununu fısıltıyla yayar → bedava organik **Sadık Hayran Kitlesi**).
- **Bedel:** Şirket asla milyar dolarlık deve dönüşemez; büyük yatırımcılar kredi vermez, darboğazları yalnız kendi tasarrufunla atlatırsın.

### ⚖️ Emek Yolu — *The Way of Iron*
- **Estetik:** Sunucu kabloları, akış şemaları, enerji içecekleri — hackerspace/mühendislik laboratuvarı.
- **Sinapslar:** **Otonom Sistemler** (çıkıştan aylar sonra kendini yamayan/optimize eden motorlar; modüler kod → eski oyun kodunu yenilere %100 verimle kopyala) · **Zaman Bükücü** (enerji barı asla tam sıfırlanmaz; 03:00'te bile hatasız kod).
- **Bedel:** Oyunların hikâye/sanat yönü hep kuru, "fazla teknik" kalır; basın ilgisini zor çekersin ama oynayanlar sistemin kusursuzluğuna hayran.

### ⚪ Denge Noktası
İki yolu da tatmış, ikisini de aşmış nadir orta (skill tree T5'te mevcut). Tövbe yolunun varış noktası olabilir.

---

## 3) Tek-Seferlik Tövbe (Yol Değiştirme)

**Karar mühürlü DEĞİL — ama bedava respec de değil.** Oyunun "kendini aşma" temasının mekanik karşılığı: dönebilirsin, ama ağır.

- **Anlatı-tetikli (menüden değil):** Bir **pişmanlık beat'i** kapıyı açar — ör. Hırs yolundayken Ned'i sokakta görmek / idealist gencin istifası / çocuğun "neden senden korkuyorlar?" sorusu / eski eşin düğünü. O an oyun sorar: *"Bu sen misin?"*
- **Geçmiş değil, gelecek değişir** *(Marcus/Stoa: "geçmiş elimizde değil")*: yaktığın köprüler **kalıcı** — istifa eden geri gelmez, evsiz Ned evsiz kalır, soylulaştırdığın sahaf açılmaz.
- **Ağır bedel:** mevcut yolun **T5 capstone'u + sinapslarının çoğu sökülür** ("unutursun"), büyük para/itibar kaybı, birkaç hafta felç.
- **Tek kez:** ikinci dönüş yok (ya da iki kat ağır). Aksi halde min-max oyuncağı olur.
- **Yön:** çoğu dönüş **Denge Noktası**'na açılabilir (iki yolu da aşmış kişi).
- **Bayrak:** `path_switched` + eski/yeni yol → C2 epilogu "döndü mü, ne pahasına" diye yansıtır; 4C finaliyle birlikte "nasıl bir insan oldun"u tamamlar.

---

## Test Stratejisi
- Yan iş tohum düşürme: doğru iş → doğru (nadir) seed; rüşvet → seed `kirli` flag; kirli seed'li oyun → skandal olasılığı.
- Pub: doğru sipariş (enerjiye göre) → sadakat/bahşiş ↑.
- Emlak: çok alım-satım → Kira Endeksi ↑ → eşikte NPC kapanma tetiklenir (kalıcı).
- Yaşam yolu sinapsları: efektler doğru uygulanır (AI → hız↑ özgünlük↓; Huzur → trend cezası 0; Emek → enerji tam sıfırlanmaz).
- Tövbe: tek kez; T5 capstone sökülür, bedel uygulanır; `path_switched` set; ikinci dönüş engellenir; yaktığın köprüler geri gelmez.

## Kapsam Dışı
- `IdeaSeedType` genişletme/`RareSeedType` kod kararı (uygulamada).
- Her yan işin tam mini-oyun UI'ı (mekanik tasarım burada; ayrı UI turları).
- Romantizm/yaşlanma/final (kendi spec'leri); tövbe yalnız bayrak bırakır, C2 okur.
- Save/load persist'i.
