# Proje Durum Özeti

Son güncelleme: 2026-06-02

---

## Bu Oturumda Tamamlananlar

### Nehir Sal Kaptanlığı (Søren) — Side Job #6

Subagent-driven development akışıyla 5 task, 8 commit olarak tamamlandı.

**Oluşturulan dosyalar:**
- `src/data/nehirShifts.ts` — 10 shift, 3 arc, `RaftObstacle` / `NehirShift` interface'leri
- `src/store/nehirStore.ts` — Phase state machine (`idle → briefing → rafting → result`), ödül hesabı, emek path progress
- `src/store/__tests__/nehirStore.test.ts` — 17 test (phase guard'lar, 3 ödül katmanı, session-10 bonusu)
- `src/pixi/RaftScene.ts` — PixiJS yan-kaydırmalı nehir sahnesi, sal fiziği, engel çarpışması, hasar/zamanlayıcı UI
- `src/components/NehirPanel.tsx` — React panel (briefing / rafting / result fazları)

**Değiştirilen dosyalar:**
- `src/store/worldStore.ts` — `LocationId` union'ına `'nehir'` eklendi
- `src/App.tsx` — `NehirPanel` bağlandı
- `tsconfig.json` — `"jsx": "react-jsx"` eklendi (önceden var olan 1080 TSX hatasını kapattı)

**Commit geçmişi:**
```
4476a0a fix: NehirPanel — capture damage/timeLeft before endShift zeroes them
3840535 feat: NehirPanel + worldStore + App.tsx — nehir location, Søren river side job
abccc4b fix: RaftScene — key-repeat guard, remove sky/river double-paint
e7b8ff6 feat: RaftScene — side-scroll raft physics, obstacle collision, damage/timer UI
c0bdac8 test: nehirStore — phase guards, reward tiers, session-10 bonus
6f016f4 feat: nehirStore — phase state machine, reward calc, emek path progress
74adbab fix: nehirShifts — correct arc-4 comment to arc-3 continuation
6edd46e feat: nehirShifts — 10 shifts, 3 arcs, RaftObstacle/NehirShift interfaces
```

**Önemli teknik notlar:**
- `lastResultRef` pattern: `endShift()` store değerlerini sıfırlamadan önce `damage/timeLeft` yakalanmalı
- `getState()` stale closure sorunu: `onComplete` callback içinde `useNehirStore.getState()` kullanılır
- `cancelled` flag: PixiJS async init'in useEffect cleanup'ı için
- `if (e.repeat) return` key guard: tuş basılı tutulduğunda momentum birikimini önler
- `destroyed` guard: her PixiJS handler'da kontrol edilir

---

### Dünya Lore Düzeltmesi (deniz → nehir)

"Şimdiki şehirde deniz yoktur" kuralı gereği kaynak dosyalardaki yanlış referanslar düzeltildi:

| Dosya | Değişiklik |
|---|---|
| `src/data/npcDialogues.ts` | Nadia T1: `"Denizi resmederim"` → `"Nehri resmederim"` |
| `src/data/npcDialogues.ts` | Nadia T1: `"Deniz de demiyor"` → `"Nehir de demiyor"` |
| `src/data/skillTree.ts` | `"deniz gibi derin"` → `"okyanus gibi derin"` |

**Korunan referanslar (kasıtlı):**
- `npcDialogues.ts:245-247` — Remy, geçmişteki liman kentini anlatıyor → doğru
- `barShifts.ts` ve `pubShifts.ts` — "Deniz" bir müşteri adı (Türkçe isim) → doğru

---

## Mevcut Side Job Listesi

| # | Side Job | NPC | Konum | Ödül Seeds |
|---|---|---|---|---|
| 1 | Pub Garsonluk | Theo | pub | zaman_yonetimi, kaos |
| 2 | Sahaf Arşiv | Marcus | sahaf | nostalji, hikaye |
| 3 | Bar Bodyguard | — | bar | kaos, emek |
| 4 | Dedektif Asistanı | — | detective | analiz, emek |
| 5 | Balıkçılık | Remy | nehir kenarı | nostalji → huzur path |
| 6 | Nehir Sal Kaptanlığı | Søren | nehir | kaos, zaman_yonetimi → emek path |

---

## Mevcut NPC Listesi

16 NPC (12 felsefe + 4 romantizm), hepsi yazılı ve `npcDialogues.ts`'de mevcut.

Detaylar için: `docs/KARAKTERLER-VE-SENARYO.md`

---

## Sonraki Adımlar (yapılmadı)

- Harita entegrasyonu: `nehir` lokasyonu dünya haritasında gösterilmeli
- Balıkçılık (Remy) side job — hâlâ tasarım aşamasında mı, implement edildi mi kontrol et
- NehirPanel'in gece/akşam görsel paleti (mevcut RaftScene gökyüzü gradient'i var)
- Side job sayısını arttırma kararı bekliyor
