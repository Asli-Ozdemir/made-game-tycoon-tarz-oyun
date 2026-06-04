# Oyun Medya Tepkileri — Tasarım Dokümanı
_2026-06-04_

## Özet

Oyuncu bir oyun yayınladığında, yayın anını **medya tepkileriyle** zenginleştiririz: Metaskor (toplu not) + açılır basın incelemeleri, YouTuber/gamer video tepkileri, hafif sosyal medya yorumları, haber akışına bir manşet, ve **bazen** interaktif bir basın röportajı (genelde Iris).

**Felsefe:** Bu sistem ayrı bir ekonomi kurmaz — oyunun zaten ürettiği `score`'u (0–100) **görünür ve canlı** kılar (Yaklaşım A). Tek gerçek mekanik yeni dokunuş **röportaj**tır (itibar / satış-bonusu / NPC ilişkisi). İçerik **küratörlü** (elle yazılı, skor bandına göre seçilen havuzlar) — PROJE-BAGLAM ruhu. Gerçek dergi/YouTuber **karakterleri** ve oyundan oyuna süreklilik (Yaklaşım C) bilinçli olarak **gelecek faza** bırakıldı.

## Bağlam (mevcut kancalar)

- `src/engine/scoreEngine.ts` → `calculatePublishResult(...)` `{ score, sales, revenue, publishDate }` döndürür. `Dashboard.tsx:96`'da çağrılır, `projectStore.ts:61`'de `project.publishResult` olarak yazılır.
- `src/components/PublishResult.tsx` — yayın sonucu ekranı; şu an sadece skor + satış + gelir gösterir.
- `src/store/newsStore.ts` → `addItem(Omit<NewsItem,'id'|'seen'>)`; `NewsType` içinde **`player_mention`** zaten var (manşet için kullanılacak).
- `src/store/gameStore.ts` → `gainReputation(amount)` (itibar 0–100).
- `src/store/campaignStore.ts` → kısa süreli **bonus gelir** mekaniği (viral ×2 örneği) + `gainReputation` kullanımları; röportaj satış-bonusu bunun pattern'ini izler.
- `src/store/npcStore.ts` → NPC ilişkisi (Iris röportajı ilişkiyi etkiler).
- `src/engine/campaignEngine.ts` → `rollSocialEvent` `'viral' | 'review_bomb'` (tepki tonu bununla uyumlanır).

## 1. Veri modeli

`src/types` (PublishResult'ın bulunduğu yer) içine:

```ts
export interface OutletReview { outlet: string; score: number; quote: string }      // 0–10
export interface YoutuberReaction { channel: string; viewsLabel: string; quote: string }

export interface MediaReactions {
  metascore: number          // = PublishResult.score (yalnızca gösterim)
  verdict: string            // bant etiketi (aşağıda)
  reviews: OutletReview[]    // 3–4 (A+B)
  youtubers: YoutuberReaction[] // 2–3 (C)
  social: string[]           // 2–3 kısa fan yorumu (D, hafif)
}
```

`PublishResult`'a opsiyonel alan eklenir: `media?: MediaReactions`. Böylece tepkiler projeyle birlikte saklanır, ekran sonradan tekrar açılsa da görünür.

**Skor bantları & verdict:**
| Bant | Aralık | Verdict |
|------|--------|---------|
| acclaim | 85–100 | "Övgü yağmuru" |
| approval | 70–84 | "Genel onay" |
| mixed | 50–69 | "Karışık" |
| pan | 0–49 | "Soğuk karşılama" |

## 2. Üretim motoru — `src/engine/mediaReactionEngine.ts`

Saf fonksiyon, **deterministik** (seed'li):

```ts
export function generateMediaReactions(
  result: PublishResult,
  project: GameProject,
  ctx: { viral?: boolean; reviewBomb?: boolean }
): MediaReactions
```

- **Seed:** `project.id` + `result.publishDate` (yayın başına sabit → aynı oyun aynı tepki; test edilebilir).
- **metascore** = `result.score`. **verdict** = banda göre etiket.
- **Sabit kadro** (`src/data/mediaOutlets.ts`): ~5 dergi/site (örn. PixelPress, OyunDergisi, PixelKritik, HardcoreGG, NeonReview) + ~5 YouTuber (örn. BurakOynuyor, PixelPaşa, …). Süreklilik hissi verir, ucuz.
- **Outlet puanı:** metascore'a seed'li küçük varyasyon (±, clamp 0–10), bantla tutarlı.
- **Alıntılar:** `src/data/mediaQuotes.ts` — banda göre (+ ana türe göre opsiyonel) küratörlü havuzlardan seçilir; `{oyun}` / `{tür}` ile şablonlanır. Dergi alıntıları, YouTuber alıntıları, sosyal yorumlar ayrı havuzlar.
- **viral/review_bomb tonu:** `ctx.viral` → coşkulu sosyal/YouTuber tonu; `ctx.reviewBomb` → olumsuz/öfkeli sosyal tonu (skor düşükse zaten panik bandı).

## 3. Röportaj — `InterviewModal` + `src/data/interviews.ts`

- **Tetik:** yayından sonra `INTERVIEW_CHANCE ≈ 0.35`, seed'li; **cooldown** (üst üste iki yayında çıkmasın — `lastInterviewPublishCount` benzeri guard).
- **Röportajcı:** genelde **Iris** (gazeteci romantizm adayı), bazen jenerik basın (`reporter: 'iris' | 'press'`).
- **İçerik:** skor bandına göre 1 soru + 2–3 cevap. Her cevap `InterviewAnswer`:
  ```ts
  interface InterviewAnswer {
    text: string
    reputationDelta: number          // gainReputation
    salesBonusPct?: number           // kısa süreli bonus gelir (campaign pattern)
    irisRelationshipDelta?: number   // reporter==='iris' ise npcStore
    resultLine: string               // seçimden sonra çıkan kısa tepki/haber
  }
  ```
- **Uygulama:** seçim → `gainReputation`, varsa satış-bonusu (mevcut bonus-gelir mekaniği üzerinden), Iris ise `npcStore` ilişki Δ; `resultLine` `newsStore`'a manşet olarak düşebilir.
- **Ton:** PROJE-BAGLAM — gri, anlatıcısız; kibirli cevabın bedeli olur, alçakgönüllü cevap itibar getirir ama hype az.

## 4. Akış / entegrasyon

1. `projectStore` yayın aksiyonu `calculatePublishResult` sonrası `generateMediaReactions(...)` çağırır (aktif viral/review_bomb bilgisini geçirir) → `publishResult.media`'ya yazar.
2. Aynı anda `newsStore.addItem({ type: 'player_mention', ... })` ile **manşet (E)** eklenir (verdict + oyun adı).
3. `PublishResult.tsx` `media`'yı render eder (aşağıdaki UI).
4. Röportaj olasılığı tutarsa: yayın ekranında **"Iris kapıda"** ipucu + tıklayınca `InterviewModal`. (Modal opsiyonel; kapatılabilir — sandbox ruhu.)

## 5. UI — `PublishResult.tsx` genişlemesi

Onaylanan sıralama (mockup'tan):
1. **Metaskor rozeti** (renk: bant) + **verdict** + mevcut Gelir/Satış.
2. **Basın incelemeleri (A+B)** — başlık altında açılır liste; her satır: puan (renk) + dergi + alıntı.
3. **YouTuber tepkileri (C)** — 2–3 video-kartı (kanal · izlenme · alıntı).
4. **Sosyal medya (D)** — tek satır, hafif fan yorumları.
5. **Röportaj ipucu** (bazen) — tıklanınca modal.

Renk eşiği mevcut koddaki gibi: ≥75 yeşil, ≥50 sarı, <50 kırmızı (skor rozeti ve outlet puanları için tutarlı).

## 6. Test

- `mediaReactionEngine`: bant→verdict eşlemesi; `metascore === result.score`; aynı seed → aynı çıktı; farklı seed → farklı seçim; `{oyun}`/`{tür}` şablon doğru dolar; outlet puanları 0–10 clamp; viral/reviewBomb tonu doğru havuzu seçer.
- `interviews`: olasılık + cooldown guard; cevap efektleri doğru store'lara yansır (reputation/satış/Iris ilişkisi); reporter seçimi.
- Mevcut 481+ test bozulmamalı; `npm run build` temiz.

## 7. Kapsam dışı (gelecek — Yaklaşım C)

Gerçek dergi/YouTuber **karakterleri**, oyundan oyuna süreklilik, kanal büyümesi/abone sayısı, oyuncuyla ilişki geliştiren basın figürleri, video küçük resimleri. Ayrı faz; bu spec onun altyapısını (sabit kadro + küratörlü havuz) bozmadan büyütülebilir bırakır.

## Açık varsayımlar

- "Hype" ayrı bir istatistik değil; röportajın "hype" etkisi **kısa süreli satış/gelir bonusu** olarak modellenir (mevcut campaign bonus-gelir mekaniği).
- Manşet için yeni `NewsType` eklenmez; `player_mention` kullanılır.
- RPG/medya state'i savegame kapsamı bu spec'in dışında (genel bir açık — bkz. ileride savegame genişletmesi); `media` projeye iliştiği için proje serileştiriliyorsa onunla taşınır.
