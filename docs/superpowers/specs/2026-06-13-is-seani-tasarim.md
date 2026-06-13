# İş Seansı Tasarımı

**Tarih:** 2026-06-13  
**Durum:** Onaylı  
**Kapsam:** Tycoon çalışma mekaniği — kart destesi, ilham sistemi, günlük sıfırlama

---

## Özet

Masaya oturulduğunda oyuncu "dümdüz çalış butonu"na basmak yerine 3 kartlık bir karar zinciri yaşar. Her karar gerçek bir ikilem sunar — doğru cevap yoktur, bağlama göre değişir. Exploration sırasında nadir ilham anları gelir; bu ilhamlar iş seansına kıvılcım kartı olarak girer. Sistem günde 1 seans ile sınırlandırılır, sıfırlama uykuyla olur.

---

## 1. Genel Döngü

```
Exploration → [İlham anı? → Not Al/Geç] → Masa → İş Seansı (3 kart)
     ↑                                                        ↓
     ←————————— Uyku (heves dolar, masa açılır) ←————————————
```

- **Pasif ilerleme kaldırılır.** Proje yalnızca iş seansıyla ilerler. (Kod değişikliği: `tickAllProjects` weekly callback'ten çıkarılır.)
- **Masa kilidi:** Seans tamamlanınca o gün tekrar çalışılamaz; dashboard görüntülenebilir.
- **Günlük sıfır:** Yatak → uyku → yeni gün. Gece yarısı ya da haftalık değil.

---

## 2. İş Seansı — Kart Destesi

### Yapı
- Sabit sıra: **Bug → Odak → Kıvılcım**
- Her kart tipinden içerik rastgele seçilir; sıra oyuncuya tanıdık gelir.
- Seans sonu: `+2 hafta ilerleme · −1 heves · kalite değişkenleri uygulanır · masa kitlenir`

### Kart 1 — 🐛 Bug (8 varyant)

İkilem: **Zaman vs Kalite**

| Seçenek | Kazanç | Bedel |
|---------|--------|-------|
| 🔧 Düzelt | kalite korunur, +2 heves (max'ı aşmaz) | +1 hafta süre → 1 ekstra seans gerekir |
| 🚀 Geç | süre korunur | −10 kalite, sonraki seansın Bug kartı %40 ihtimalle daha ağır varyant |

Örnek senaryolar: render hatası, ses efekti kesintisi, save dosyası bozukluğu, collision bug, diyalog atlama, fps düşüşü, UI kayması, lokalizasyon hatası.

### Kart 2 — 🎯 Odak (1 kart, 4 seçenek)

İkilem: **Güçlü ama kör nokta**

| Odak | Kazanç | Bedel |
|------|--------|-------|
| 🎮 Gameplay | eğlence +15 | hikaye −8 |
| 🎨 Grafik | sunum +15 | ses −8 |
| 🎵 Ses | atmosfer +15 | eğlence −8 |
| 📖 Hikaye | derinlik +15 | sunum −8 |

Net: her seçim +7 toplam kalite. Ancak dağılım yayın notunu ve tür uyumunu etkiler. Günün trendi + projenin türü doğru seçimi belirler.

### Kart 3 — 💡 Kıvılcım (6 varyant + not kuyruğu)

İkilem: **Şimdi vs Sonra**

| Seçenek | Kazanç | Bedel |
|---------|--------|-------|
| ✨ Uygula | bu projeye +15 kalite | +2 hafta süre (scope creep) |
| 📝 Sonraya Sakla | süre korunur, sonraki projeye +10 başlangıç kalitesi | bu projeye kalite yok |

**Not kuyruğu kuralı:** Exploration'da alınan not varsa Kıvılcım kartında önce o gösterilir. Uygula ya da Geç → not silinir. Not uyku sonrası silinmez, sonraki seansa taşınır. Max 1 not tutulur; doluyken yeni ilham gelirse "Değiştir mi?" sorulur.

---

## 3. İlham Sistemi

### Popup
- Ekranın altında küçük, zarif kart: `"💡 Aklına bir şey geldi: [fikir metni]"`  
- Butonlar: **Not Al** / **Geç**  
- 8 saniye sonra otomatik kapanır (geç sayılır).
- In-game günde max 1 ilham tetiklenir (uyku = gün sıfırı).

### Baz Oranlar

| Lokasyon | Tip | Baz Oran |
|----------|-----|----------|
| 🏚️ Sahil (ev) | gameplay / atmosfer | %3/gün |
| ⚓ İskele | macera / keşif | %4/gün |
| 📚 Sahaf | hikaye / karakter | %5/ziyaret |
| ☕ Kafe | sosyal / çok oyunculu | %4/ziyaret |
| 🎣 Balıkçılık | zen / beklenmedik | %6/seans |

### Aktivite Bonusları

| Aktivite | Bonus | Max |
|----------|-------|-----|
| 🎣 Her 3 balıkçılık seansı | tüm balıkçılık oranı +2% | %35 |
| 📚 Her 2 sahaf ziyareti | sahaf oranı +3% | %25 |
| ☕ Sosyal beceri T1/T2/T3 | kafe oranı +3%/+6%/+10% | — |
| 💻 Her yayınlanan oyun | tüm lokasyonlar +1% | — |

**Tasarım ilkesi:** Başlangıçta haftada ~1 ilham. Dünyaya yatırım yaptıkça (balık, sahaf, kafe, oyun yayını) frekans artar. Dünya gezmenin mekanik anlamı oluşur.

---

## 4. Heves & Günlük Sıfırlama

- **Başlangıç:** 8/8 heves
- **İş seansı maliyeti:** −1 heves
- **Heves = 0:** Seans başlamaz; "Heves bitti — git doldur 😴" mesajı
- **Uyku:** Heves tamamen dolar (8/8)
- **Gelecek:** Kafe (+1), sahaf (+1), balıkçılık (+1) küçük bonuslar eklenebilir (demo sonrası)

---

## 5. Kapsam Dışı (Demo Sonrası)

- Kart sayısını 3'ten 4-5'e çıkarmak
- Exploration heves bonuslarını aktif etmek  
- Bug kartındaki %40 tekrar mekanizmasının tam implementasyonu
- "Sonraya Sakla" notunun sonraki proje akışına entegrasyonu
- İlham metinlerinin lokasyon + proje türüne göre dinamik üretimi
