# Dedektif Asistanı — Tasarım Dokümanı
_2026-06-02_

## Özet

Emek yoluna bağlı yan iş. Yaşlanan dedektif patronun yanında asistan olarak 10 vaka çözersin. Her vaka point-and-click kanıt arama + sorgulama zinciri + haritada yüzleşmeden oluşur. 10 vakayı tamamlayınca dedektif/gerilim oyun türü açılır.

---

## 1. Anlatı Çerçevesi

### Patron
Şehrin eski dedektifi — keskin ama yorgun. Ofisi city room içinde (veya yeni alt oda). Vakaları posta yoluyla bildirir; oyuncu mektubu alınca gidip dedektifi bulur, dedektif kısa bir brifing verir ve vaka süresince companion olarak takip eder.

### Anlatı Yayı (10 Vaka)
| Vaka Aralığı | Dedektif Durumu |
|-------------|-----------------|
| 1–3 | Keskin, yönlendirici, özgüvenli |
| 4–6 | Yorgun ama deneyimli, ara sıra yanılıyor |
| 7–9 | Rakibin gölgesinde, savunmacı |
| 10 | Son büyük vaka — uzun, dedektif gerçekten zorlanıyor |

### Rakip Dedektif
Şehrin yeni yıldızı. Görünmez ama etkisi var: vakayı başarısız kapatınca "Dava kapatıldı — X Dedektif çözdü" tarzı kısa haber notu çıkar. Artan sıklıkta belirir.

---

## 2. Vaka Yapısı

### Pacing
```
Vaka 1 (3–5 gün) → ara (2–4 gün) → Vaka 2 → ... → Vaka 9 → ara → Vaka 10 (7–8 gün)
```
Aralar oyuncunun başka şeyler yapmasına izin verir. Dedektif arada "dosyaları inceliyorum" mesajı bırakır.

### Günlük Akış (Vaka Süresince)
1. **Sabah**: Dedektif not/ipucu bırakır — "Dün gece parkta biri görmüş, git konuş"
2. **Gündüz**: Oyuncu ipucunu takip eder (haritada ilgili lokasyon, NPC veya olay yeri)
3. **Gece**: Bir sonraki gün açılır; kalan gün sayısı azalır

### Gün Limiti
- Standart vakalar: 3–5 gün
- 10. vaka: 7–8 gün
- Süre dolunca rakip dedektif vakayı kapatır → minimum ödül

---

## 3. Mini Oyun Mekaniği

### 3.1 Olay Yeri Araması (Point & Click)
Haritada olay yerine veya cesede tıklanınca:
1. Ekran solar (fade out)
2. **ExamineScene** overlay açılır — nesne büyük, tam ekran
3. Parlayan noktalar = tıklanabilir kanıt alanları
4. Her noktaya tıklanınca yakın çekim görünümü (iç içe zoom) + kısa açıklama
5. Kanıt toplanınca işaretlenir, HUD güncellenir
6. ESC ile olay yerine dönülür

### 3.2 Sorgulama Zinciri
Her kanıt sorgulama zincirinde bir kişiye işaret eder:
```
Kanıt A → Kişi 1 (haritada bul, konuş)
  ├─ Doğru yol → Kişi 2 → ... → Suçlu
  └─ Yanlış yol → Çıkmaz, dedektif yorum yapar, backtrack gerekir
```
- Dedektif companion diyalog sırasında yorum yapar ("Bu yalan söylüyor" / "Devam et")
- Karar oyuncuya kalır

### 3.3 Yüzleşme
Zincirin sonunda suçluya haritada gidilir. Dedektif yanında durur. Kısa bir diyalog/animasyon ile vaka kapanır.

### 3.4 Başarısızlık Senaryoları
| Senaryo | Sonuç |
|---------|-------|
| Gün limiti doldu | Rakip dedektif haberle vakayi kapatır |
| Yanlış kişiyle yüzleşme | Dedektif sinirle "bu değil" der, vaka kapanır |
| Her ikisinde | Kısa haber notu, minimum ödül |

---

## 4. Ödül Sistemi

| Performans | Analiz Tohumu | Para | Emek İlerlemesi |
|-----------|--------------|------|-----------------|
| Doğru suçlu, limit içinde | 3 | %100 | +12 |
| Doğru suçlu, son gün | 2 | %70 | +8 |
| Yanlış / süre doldu | 1 | %30 | +3 |

### Tamamlama Bonusu
10 vakayı tamamlayınca (sonuç ne olursa): **Dedektif/Gerilim oyun türü** skill tree'de açılır. Ayrı bir kutlama ekranıyla gösterilir.

### Emek Yolu İlerlemesi
10 vaka × ortalama +10 ≈ 100 → `lifePathStore.addProgress('emek', X)` ile eşik tamamlanır.

---

## 5. Yeni Tohum Tipi: Analiz

| Alan | Değer |
|------|-------|
| `type` | `'analiz'` |
| Kaynak | Dedektif asistanı vakalarından |
| Skill tree etkisi | Simülasyon kalitesi + bug azaltma bonusu (Emek yolu node'ları) |

`src/data/npcDialogues.ts` içindeki `IdeaSeedType`'a `'analiz'` eklenir.

---

## 6. Yeni Harita Odaları

| Oda | Konum | Kullanım |
|-----|-------|----------|
| Park (evsiz bölgesi) | Nehrin karşısında, şehir yanı | Vaka lokasyonu |
| Nehir karşısı / mahalle uzantısı | Bridge'in ötesi | Vaka lokasyonu |
| Dedektif ofisi | City room içi veya alt oda | Patron brifing |

---

## 7. Teknik Mimari

```
src/data/detectiveCases.ts          ← 10 vaka tanımı (yeni)
src/store/detectiveStore.ts         ← aktif vaka, gün sayacı, kanıtlar, zincir (yeni)
src/pixi/ExamineScene.ts            ← zoom-in overlay, iç içe point&click (yeni)
src/pixi/rooms/parkRoom.ts          ← park odası (yeni)
src/data/npcDialogues.ts            ← 'analiz' tohum tipi eklenir (değişiklik)
src/data/skillTree.ts               ← analiz node'ları, dedektif türü T node (değişiklik)
src/store/lifePathStore.ts          ← addProgress('emek') entegrasyonu (mevcut)
```

### detectiveCases.ts Veri Modeli
```ts
interface EvidenceNode {
  id: string
  label: string                    // "Deri çanta — sol cep açık"
  pointsTo: string                 // şüpheli id veya sonraki kanıt id
  examineItems?: ExamineItem[]     // iç içe zoom nesneleri
}

interface Case {
  id: string
  dayLimit: number                 // standart 3–5, son vaka 7–8
  location: RoomId                 // hangi odada geçiyor
  evidence: EvidenceNode[]
  suspects: string[]               // NPC id listesi
  culpritId: string
  detectiveDialogue: Record<string, string>  // vaka günlerine göre ipuçları
}
```

### detectiveStore.ts Arayüzü
```ts
interface DetectiveStore {
  activeCase: Case | null
  dayCount: number
  collectedEvidence: string[]      // EvidenceNode id'leri
  chainPosition: string | null     // zincirde nerede
  completedCases: string[]

  startCase(caseId: string): void
  collectEvidence(evidenceId: string): void
  advanceDay(): void
  makeAccusation(suspectId: string): 'correct' | 'wrong' | 'timeout'
  reset(): void
}
```

---

## 8. Kapsam Dışı

- Dedektifin kimliği ve tam backstory'si — ayrı içerik
- Rakip dedektifin görünür NPC olması — ileride
- Posta kutusu sistemi (diğer işlerde de kullanılacak) — ayrı altyapı spec
- Dedektif/gerilim türünün oyun içeriği — tycoon sistemine bağlı
