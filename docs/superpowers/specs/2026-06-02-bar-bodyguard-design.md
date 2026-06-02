# Bar Bodyguard — Tasarım Dokümanı
_2026-06-02_

## Özet

Emek yoluna bağlı yan iş. 45-50 yaşında bar sahibinin güvenlik görevlisi olarak 10 vardiya çalışırsın. Her vardiya Papers Please tarzı kapı kontrolü + içeride gerginlik çözme + gerekirse yumruk dövüşünden oluşur. 10 vardiyayı tamamlayınca Aksiyon/Sokak filmi oyun türü açılır.

---

## 1. Anlatı Çerçevesi

### Bar Sahibi
Şehrin köklü barının 45–50 yaşında patronu — hâlâ güçlü ama yorulmaya başlamış. Her vardiya başında kısa brifing verir: o geceye özel kurallar, yasak listesi, VIP isimler. Oyuncu ilerledikçe güveni artar.

### Baskı Unsuru
Şehirde rakip bir bar açılıyor, müşteriler kayıyor. Patron baskı altında — her sorunlu gece onu biraz daha yıpratıyor. 10. vardiyada büyük bir olay var ve her şey o gecede çözüme kavuşuyor.

---

## 2. Gece Akışı

```
Vardiya başı (brifing) → Kapı fazı (misaferler) ←→ Kesinti (içeride olay) → Vardiya sonu (ödül)
```

### Vardiya Başı
Patron kısa brifing verir: gece kuralları, yasak listesi, VIP isimler. Oyuncu bu bilgileri o gece boyunca kullanır.

### Kapı Fazı (Papers Please)
Misaferler sırayla önüne gelir. Her birinde 3 kontrol yapılır:

1. **Görünüm ipuçları** — sarhoş mu, tehlikeli mi, giyim tarzı
2. **Yasak / VIP listesi** — isim sorulur veya gösterilir
3. **Gece kuralı** — "sadece rezervasyon", "18 yaş sınırı", "kravatsız yok" gibi

Karar: **İçeri Al** veya **Reddet**. Yanlış kararlar içeride sorun çıkma ihtimalini artırır.

### Kesinti Mekaniği
Kapıda dururken ekranda "⚠️ İÇERİDE OLAY" bildirimi çıkabilir. Oyuncu kapıyı bırakıp içeriye geçer. Olay çözülünce kapıya döner — sıradaki misafir hâlâ bekler.

### İçeride Olay (2 Aşamalı)

**Aşama 1 — Gerginlik Çözme:**
Gerginlik barı açılır. Diyalog seçimleriyle (2–3 seçenek) gerginliği düşürürsün. Doğru seçimler gerginliği azaltır, yanlışlar artırır. Sıfıra inerse olay sorunsuz kapandı.

**Aşama 2 — Yumruk Dövüşü (gerginlik maksimuma çıkarsa):**
Kavga sahnesi (PixiJS overlay) açılır. Sol tık veya Z/X tuşuyla yumruk atılır. Oyuncunun 3 vuruş hakkı var. Rakip yenilirse olay kapandı (hasar gördüğü için ödül biraz düşük). Oyuncu yenilirse gece başarısız sayılır.

### Vardiya Sonu
Kapı hataları + olay sonucu birleşerek performans değerlendirilir, ödül hesaplanır.

---

## 3. Zorluk Artışı (10 Vardiya)

| Vardiya Aralığı | Zorluk |
|----------------|--------|
| 1–3 | Az misafir, açık ipuçları, tek olay |
| 4–6 | Orta kalabalık, bazı ipuçları belirsiz |
| 7–9 | Kalabalık gece, sahte kimlik ihtimali, eş zamanlı olay |
| 10 | Son büyük gece — birden fazla olay, tüm kurallar aktif |

---

## 4. Ödül Sistemi

| Performans | Kaos Tohumu | Para | Emek İlerlemesi |
|-----------|-------------|------|-----------------|
| Sorunsuz (az hata, olay diyalogla çözüldü) | 3 | %100 | +12 |
| Orta (birkaç hata, kavgaya girdi ama kazandı) | 2 | %70 | +8 |
| Kötü (çok hata veya kavga kaybedildi) | 1 | %30 | +3 |

10 vardiya × ortalama +10 ≈ 100 → `lifePathStore.addProgress('emek', X)` ile emek yolu tamamlanır.

### Tamamlama Bonusu
10 vardiyayı tamamlayınca (sonuç ne olursa): **Aksiyon / Sokak filmi oyun türü** skill tree'de açılır. Ayrı kutlama ekranıyla gösterilir.

---

## 5. Tohum Tipi

| Alan | Değer |
|------|-------|
| `type` | `'kaos'` |
| Kaynak | Mevcut tohum tipi — yeni ekleme gerekmez |
| Skill tree etkisi | Mevcut kaos node'ları |

---

## 6. Teknik Mimari

```
src/data/barShifts.ts          ← 10 vardiya tanımı (misaferler, olaylar, kurallar)
src/store/barStore.ts          ← aktif vardiya, kapı kararları, gerginlik, dövüş durumu
src/pixi/DoorScene.ts          ← Papers Please kapı arayüzü (PixiJS)
src/pixi/FightScene.ts         ← yumruk dövüşü overlay (PixiJS)
```

### barShifts.ts Veri Modeli

```ts
interface Guest {
  id: string
  name: string
  isBlacklisted: boolean
  isVip: boolean
  isDrunk: boolean
  isDangerous: boolean
  visualCues: string[]       // "sallanıyor", "gözleri kızarmış"
  meetsNightRule: boolean    // gece kuralına uyuyor mu
}

interface Incident {
  id: string
  description: string        // "İki müşteri bardaki tabureleri kaplıyor"
  tensionSteps: {
    text: string
    options: { label: string; tensionDelta: number }[]
  }[]
  fightIfUnresolved: boolean
}

interface BarShift {
  id: string                 // 'shift_01' ... 'shift_10'
  nightRule: string          // "Bu gece sadece rezervasyonlular"
  blacklist: string[]        // Guest id listesi
  vipList: string[]
  guests: Guest[]
  incidents: Incident[]
  incidentTriggers: number[]         // hangi misafirlerden sonra kesinti (örn. [2, 5])
}
```

### barStore.ts Arayüzü

```ts
interface BarStore {
  activeShift: BarShift | null
  currentGuestIndex: number
  doorDecisions: Record<string, 'admit' | 'reject'>
  activeIncident: Incident | null
  tensionLevel: number          // 0–100
  fightActive: boolean
  playerHealth: number          // 3'ten başlar; her yenilen yumruk -1; 0'a düşünce dövüş kaybedilir
  completedShifts: string[]

  startShift(shiftId: string): void
  makeGuestDecision(guestId: string, decision: 'admit' | 'reject'): void
  triggerIncident(incidentId: string): void
  chooseTensionOption(optionIndex: number): void
  punchEnemy(): void
  takePunch(): void
  endShift(): { seeds: number; progress: number }
  reset(): void
}
```

### PixiJS Pattern
`DoorScene` ve `FightScene`, `ExamineScene` ile aynı pattern:
- `static async create(options): Promise<Scene>`
- Private constructor
- `destroy()` — event listener temizleme + `app.destroy()`

---

## 7. Kapsam Dışı

- Bar sahibinin tam hikâyesi ve backstory'si — ayrı içerik
- Kapı animasyonları (oyuncu karakteri kapıda görünür) — ileride
- Çoklu rakip (birden fazla kişiyle dövüş) — ileride
- Posta kutusu sistemi (vardiya daveti) — ayrı altyapı spec
