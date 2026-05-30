# Proje Durumu — Nerede Kaldık

**Son güncelleme:** 2026-05-30

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

**Testler:** 173/173 geçiyor (`npx vitest run`). Build çalışıyor (`npm run build`).

### Faz 3 özeti
PixiJS tile-based şehir haritası, WASD karakter hareketi, Stardew tarzı günlük saat sistemi (`dayTimeStore`), tycoon/keşif çift modu (`worldStore`), trigger sistemi, Kafe ve Fuar panelleri. PixiJS kendi canvas'ını oluşturuyor; CSP'ye `unsafe-eval` eklendi (shader compilation için).

### Faz 4A özeti
3 adımlı karakter yaratma wizard'ı: arkaplan seçimi (5 seçenek — KK Uzmanı, Yaratıcı Direktör, Baş Mühendis, Yapımcı, Eski CEO), kişilik stat dağılımı (5 puan), kimlik (isim + stüdyo adı). `characterStore` + `data/backgrounds.ts`. Zorluk seçimi arkaplana gömülü (ev satış değeri + sosyal statü). CEO özel: başlangıç itibarı 20, başarısız projede 2× itibar kaybı. `scoreEngine`'e `playerSkillBonus` eklendi. App.tsx'te wizard gate, Dashboard'da "Yeni Oyun" butonu.

---

### Senaryo — Giriş Sahneleri özeti
Faz 4B cutscene altyapısının `[PLACEHOLDER]` diyaloglarının yerine gerçek senaryo. Ton: buruk-gerçekçi, anlatıcısız. Kovulma artık arkaplana özgü **5 varyant**, her biri **4 frame**: kovulma → boşanma (aldatma + anlaşmalı) → mahkeme → ölen anne-babadan kalan sahil evine yalnız dönüş. İlk yayın: yalnız, kişisel an. Veri modeli `variants: Record<BackgroundId, CutsceneFrame[]>` + `getCutsceneFrames` resolver; yeni `court`/`coast` arka planları, `Eş`/`Hâkim` speaker. Gameplay notu (ileride): sahil evinde yalnız başla, opsiyonel "ofis tut" ana görevi, NPC freelance işleri (garsonluk, web sitesi vb.). **Spec + plan hazır; kod bu PC'de değil — diğer PC'de plan uygulanacak.**

---

## Devam Edilecek: Faz 4C — Rakip Şirket Arc'ı

**Durum:** Henüz başlanmadı.

Faz 4 (Karakter + Hikaye) üç alt sisteme bölündü:
- **4A — Karakter Yaratma** ✅ bitti
- **4B — Ara Sahne Sistemi** ✅ bitti
- **4C — Rakip Şirket Arc'ı** ← şu an buradayız

---

## Çalışma Akışı Hatırlatması
- Başlarken: `git pull`
- İş bitince: `git commit` + `git push`
- Spec/plan döngüsü: brainstorming skill → writing-plans skill → subagent-driven-development skill
