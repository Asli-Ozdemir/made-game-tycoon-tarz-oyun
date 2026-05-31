# Proje Durumu — Nerede Kaldık

**Son güncelleme:** 2026-05-31

Bu dosya, başka bir makinede çalışmaya devam ederken nerede kaldığımızı özetler.
Yeni bir Claude Code oturumunda bu dosyayı ve `docs/superpowers/` altındaki spec/planları okut.

---

## Tamamlanan Fazlar

| Faz | Durum | Spec | Plan |
|-----|-------|------|------|
| **Faz 1 — Core Loop** | ✅ Bitti | `specs/2026-05-29-game-dev-tycoon-design.md` | `plans/2026-05-29-faz1-core-loop.md` |
| **Faz 2 — Çalışan Sistemi** | ✅ Bitti | (ana spec) | `plans/2026-05-29-faz2-calisan-sistemi.md` |
| **Faz 3 — Dünya / Keşif** | ✅ Bitti | `specs/2026-05-29-faz3-dunya-kesif-design.md` | `plans/2026-05-29-faz3-dunya-kesif.md` |
| **Faz 4A — Karakter Yaratma** | ✅ Bitti | `specs/2026-05-29-faz4a-karakter-yaratma-design.md` | `plans/2026-05-29-faz4a-karakter-yaratma.md` |
| **Faz 4B — Ara Sahne Sistemi** | ✅ Bitti | `specs/2026-05-29-faz4b-ara-sahne-design.md` | `plans/2026-05-29-faz4b-ara-sahne.md` |
| **Senaryo — Giriş Sahneleri** | ✅ Bitti | `specs/2026-05-30-senaryo-intro-sahneleri-design.md` | `plans/2026-05-30-senaryo-intro-sahneleri.md` |
| **Faz 4C — Rakip Arc Senaryosu** | ✅ Bitti | `specs/2026-05-30-faz4c-rakip-arc-senaryo-design.md` | `plans/2026-05-30-faz4c-rakip-arc-senaryo.md` |
| **Faz 4D-4 — Sequel & DLC** | ✅ Bitti | `specs/2026-05-30-faz4d-4-sequel-dlc-design.md` | `plans/2026-05-30-faz4d-4-sequel-dlc.md` |
| **Faz 5 — Save/Load Sistemi** | ✅ Bitti | `specs/2026-05-30-save-load-design.md` | `plans/2026-05-30-save-load.md` |
| **Faz 6A — Ekonomi Temeli** | ✅ Bitti | `specs/2026-05-30-ekonomi-temeli-design.md` | `plans/2026-05-30-ekonomi-temeli.md` |
| **Faz 6B — Platform & Pazar Dinamikleri** | ✅ Bitti | `specs/2026-05-30-faz6b-pazar-dinamikleri-design.md` | `plans/2026-05-30-faz6b-pazar-dinamikleri.md` |
| **Faz 6C — Pazarlama** | ✅ Bitti | `specs/2026-05-31-faz6c-pazarlama-design.md` | `plans/2026-05-31-faz6c-pazarlama.md` |

**Testler:** 254/254 geçiyor (`npx vitest run`). Build çalışıyor (`npm run build`).

### Faz 3 özeti
PixiJS tile-based şehir haritası, WASD karakter hareketi, Stardew tarzı günlük saat sistemi (`dayTimeStore`), tycoon/keşif çift modu (`worldStore`), trigger sistemi, Kafe ve Fuar panelleri. PixiJS kendi canvas'ını oluşturuyor; CSP'ye `unsafe-eval` eklendi (shader compilation için).

### Faz 4A özeti
3 adımlı karakter yaratma wizard'ı: arkaplan seçimi (5 seçenek — KK Uzmanı, Yaratıcı Direktör, Baş Mühendis, Yapımcı, Eski CEO), kişilik stat dağılımı (5 puan), kimlik (isim + stüdyo adı). `characterStore` + `data/backgrounds.ts`. Zorluk seçimi arkaplana gömülü (ev satış değeri + sosyal statü). CEO özel: başlangıç itibarı 20, başarısız projede 2× itibar kaybı. `scoreEngine`'e `playerSkillBonus` eklendi. App.tsx'te wizard gate, Dashboard'da "Yeni Oyun" butonu.

---

### Senaryo — Giriş Sahneleri özeti
Faz 4B cutscene altyapısının `[PLACEHOLDER]` diyaloglarının yerine gerçek senaryo. Ton: buruk-gerçekçi, anlatıcısız. Kovulma artık arkaplana özgü **5 varyant**, her biri **4 frame**: kovulma → boşanma (aldatma + anlaşmalı) → mahkeme → ölen anne-babadan kalan sahil evine yalnız dönüş. İlk yayın: yalnız, kişisel an. Veri modeli `variants: Record<BackgroundId, CutsceneFrame[]>` + `getCutsceneFrames` resolver; yeni `court`/`coast` arka planları, `Eş`/`Hâkim` speaker. Gameplay notu (ileride): sahil evinde yalnız başla, opsiyonel "ofis tut" ana görevi, NPC freelance işleri (garsonluk, web sitesi vb.). **Spec + plan hazır; kod bu PC'de değil — diğer PC'de plan uygulanacak.**

---

## Faz 4C — Rakip Arc Senaryosu Özeti

`nexus_notice` (5 BackgroundId varyantı, Victor Crane/Klein sahneleri, "sevgi ucuzlar korku tutar" düsturu), `nexus_meeting` (nehir beat, ilk yüz yüze karşılaşma), `awards_win/win_gallery/win_boardroom/lose_to_nexus` (ödül sahneleri), `nexus_resolution` (4 seçime özgü final — buyout/destroy/forgive/merge, nehir imgesi + Crane self-gesture), `indie_resolution`. `CutsceneDef`'e `variants` + `choiceVariants` eklendi; `getCutsceneFrames(id, ctx)` resolver. `cutsceneStore`'a `resolutionChoice` + `setResolutionChoice`. `ResolutionScreen` seçimi store'a yazar. `rivalStore.setRelationship` Nexus ilk kez rival olunca `nexus_meeting` tetikler.

---

### Faz 4D-4 — Sequel & DLC Özeti

`GameProject` discriminated union: `StandaloneProject | SequelProject | DlcProject | UpdateProject`. Sequel: `fanBaseMultiplier` (max 2×) + skor bonusu (kaynak ≥85 → +20, ≥70 → +10). DLC: `priceOverride` ile gelir hesabı, yayında parent satışını ×1.2 artırır. Ücretsiz Güncelleme: sıfır gelir, parent score +5/+10 (kapsama göre), `gainReputation(+3)`. `NewProjectModal`'a kaynak oyun dropdown + içerik tipi seçimi + DLC fiyat input + kapsam filtreleme eklendi. `ProjectCard` child proje rozeti (DLC/Sequel/Güncelleme sayısı) gösterir.

---

## Faz 5 — Save/Load Sistemi Özeti

`savegameEngine.ts` tüm store'ları JSON olarak serialize/deserialize eder (`version: 1`, `seenCutscenes` Set↔Array dönüşümü, `dayTimeStore` ephemeral reset). `saveStore` 3 slotu yönetir: localStorage mirror + Electron IPC dosya tabanlı (`userData/saves/slot-N.json`). Günlük auto-save (`onDailyTick` callback), sezon geçişinde auto-save (`onWeeklyTick` içinde prevSeason kontrolü). `StartScreen` açılışta slot seçimi sunar (Devam Et / Yeni Oyun). `SaveLoadPanel` oyun içi overlay (şimdi kaydet, slot yükle, slot sil, ana menüye dön). HUD'da 💾 butonu. Eski partial `window.electronAPI?.saveGame({...})` çağrısı kaldırıldı.

---

### Faz 6A — Ekonomi Temeli Özeti

`economyEngine.ts`: maliyet, efektif fiyat, satış çarpanı hesapları. `economyStore`: haftalık sabit giderler (kira + sunucu + araç), kredi (25.000$, 12 hafta), kriz durumu (4 haftalık süre), platform indirim etkinlikleri (her 13 hafta). `GameProject`'e `price`, `discountPct`, `isOnSale`, `publishTickCount` eklendi. Fiyat seçimi `NewProjectModal`'da; fiyat düşürme `ProjectCard`'da. `scoreEngine` artık `project.price` ve indirim çarpanını kullanıyor. `SaleEventModal` etkinlik katılımı için, `CrisisModal` kurtarma seçenekleri için, `BankruptcyScreen` oyun sonu için. HUD'da haftalık gider + kriz rengi.

---

### Faz 6B — Platform & Pazar Dinamikleri Özeti

`marketEngine.ts`: `computeBaseCurve` (yıl 1→10 PC/Konsol/Mobil lineer eğrisi, sonrası sabit), `computeNormalizedShares` (clamp ±15, normalize toplam=100), `computePlatformShareMultiplier` (pay>50→bonus, pay<20→ceza, 20-50→1.0), `decayReactiveDelta` (%20 sönümleme). `marketStore`: haftalık pay güncellemesi, reaktif delta (`applyReactiveDelta` proje yayınında -3 uygular), fırsat sistemi (exclusive/featured/price_cut, %12/hafta, 8 hafta cooldown). `scoreEngine`'e trend × platformShare × featured × exclusive × priceCut çarpanları eklendi. `MarketPanel` 3 sekme: platform payları bar grafik, tür trendleri doluluk + durum etiketi, fırsatlar kartı. `OfferModal` ESC'siz zorunlu karar ekranı. HUD'a 🔥 trending tür rozeti + 📊 butonu.

---

### Faz 6C — Pazarlama Özeti

`campaignEngine.ts`: `CAMPAIGN_CONFIGS` (sosyal/influencer/billboard — peşin+haftalık+süre+çarpan), `computePreLaunchMultiplier` (max, stack yok), `computePostLaunchBonusRevenue` (publishRevenue × oran, süresi bitince 0), `rollSocialEvent` (viral: score≥80+kampanya+%15, review_bomb: score<40+kampanyasız+%10). `campaignStore`: `startCampaign` (peşin ödeme+isPreLaunch detect), `weeklyTick` (gider+itibar+bonus gelir+süresi biten+pasif olaylar), `triggerDevDiary` (2K$+itibar+5+cooldown 4h), `triggerCommunity` (5K$+itibar+10+cooldown 6h+2h bonus). `scoreEngine`'e `preLaunchMultiplier` eklendi. `ProjectCard`'a kampanya başlatma/durdurma butonları. `CampaignPanel` 3 sekme (aktif/aksiyonlar/geçmiş). `SocialEventToast` 4s bildirim. HUD'a 📣 butonu + aktif kampanya rozeti.

---

## Devam Edilecek: Sıradaki Faz

**Faz 7 — Oyun Polisajı**: UI iyileştirmeleri, balans tweaks, müzik/ses efektleri.

---

## Çalışma Akışı Hatırlatması
- Başlarken: `git pull`
- İş bitince: `git commit` + `git push`
- Spec/plan döngüsü: brainstorming skill → writing-plans skill → subagent-driven-development skill
