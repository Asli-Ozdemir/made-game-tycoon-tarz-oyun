# Hayat Yolu Altyapısı — Tasarım Dokümanı
_2026-06-01_

## Özet

Oyuncunun yan işlerde çalışarak biriktirebileceği üç hayat yolundan birini (Hırs / Huzur / Emek) organik olarak kazandığı sistem. Aktif yol `skillTreeStore.selectedLifePath`'i belirler, ilgili T5 skill node'unu açar ve NPC ilişki dinamiklerini etkiler. Yol değiştirilebilir ama ağır sonuçlar doğurur.

---

## 1. Hayat Yolları

| Yol | Kimlik | NPC'ler | T5 Bonusu |
|-----|--------|---------|-----------|
| `hirs` | The Way of Capital | — (Vivian ileride) | +30% income_mult |
| `huzur` | The Way of Soul | Marcus, Remy | +25% all_quality |
| `emek` | The Way of Iron | Theo | %100 bug_reduce |

---

## 2. İlerleme Mekaniği

### Faz 1 — Serbest
`activePathId === null` iken tüm yollar bağımsız olarak progress biriktirebilir. Oyuncu henüz kilitlenmemiştir.

### Faz 2 — Kilitli
Herhangi bir yolun `progress[path] >= PATH_THRESHOLD (100)` olduğunda:
- O yol `activePathId` olarak atanır
- `skillTreeStore.selectedLifePath` güncellenir → T5 node unlockable hale gelir
- Bundan sonra `addProgress()` sadece `activePathId === path` ise biriktirir

### Yol Değiştirme — `switchPath(newPath)`
1. `skillTreeStore.selectedLifePath` → `newPath` (eski T5 kilitlenir)
2. `npcStore`: eski yolun NPC'lerinde `relationship −20`
3. `npcStore`: eski yolun NPC'lerinde `gainMultiplier → 0.5` (kalıcı olmayan ceza, her diyalogda +0.05 artarak 1.0'a döner)
4. `progress[oldPath] −= 40` (kısmi reset — harcanan emek kaybolur)
5. `activePathId → newPath`

---

## 3. Veri Modeli

### `src/data/lifePathData.ts`

```ts
import type { LifePath } from '@/data/skillTree'

export const PATH_THRESHOLD = 100

export const PATH_NPC_MAP: Record<LifePath, string[]> = {
  huzur: ['marcus', 'remy'],
  emek:  ['theo'],
  hirs:  [],   // Vivian ileride eklenecek
}
```

### `src/store/lifePathStore.ts`

```ts
interface LifePathStore {
  progress: Record<LifePath, number>   // { hirs: 0, huzur: 0, emek: 0 }
  activePathId: LifePath | null

  addProgress(path: LifePath, amount: number): void
  switchPath(newPath: LifePath): void
  reset(): void
}
```

**`addProgress` kuralı:**
```
if activePathId === null → progress[path] += amount  (serbest faz)
if activePathId === path → progress[path] += amount  (kilitli, aynı yol)
if activePathId !== path → hiçbir şey yapma          (kilitli, başka yol)
```

Threshold geçilince store içinden `skillTreeStore.getState().set({ selectedLifePath: path })` çağrılır.

### `src/store/npcStore.ts` — Ek Alan

```ts
gainMultiplier: Record<string, number>  // npcId → çarpan (default 1.0)
```

`completeDialogue()` içinde relationship artışı `* gainMultiplier[npcId]` ile uygulanır. `switchPath()` eski yol NPC'lerini 0.5'e çeker; her `completeDialogue` çağrısında `Math.min(1.0, multiplier + 0.05)` ile normale döner.

---

## 4. Görsel — Skill Tree Yay Göstergesi

`SkillTreeCanvas.tsx`'e üç yay eklenir. Her yay T5 node'larının dışına (r ≈ 310) çizilir, kendi açısal bölgesinde:

| Yol | Açısal Bölge | Renk |
|-----|-------------|------|
| Huzur | üst yarı (nos/hik node'ları hizasında) | `#4488cc` |
| Hırs | sol/alt (kaos node'ları hizasında) | `#ff6644` |
| Emek | sağ/alt (zmn node'ları hizasında) | `#88cc44` |

- Doluluk oranı: `progress[path] / PATH_THRESHOLD`
- Aktif yol yayı glow efekti alır (`shadowBlur`)
- Threshold noktasında küçük ışıklı işaret
- Yol değiştirince eski yayın doluluk animasyonla düşer

---

## 5. Mimari

```
src/data/lifePathData.ts          ← PATH_THRESHOLD, PATH_NPC_MAP (yeni)
src/store/lifePathStore.ts        ← progress, activePathId, addProgress, switchPath (yeni)
src/store/__tests__/lifePathStore.test.ts  ← testler (yeni)
src/store/npcStore.ts             ← gainMultiplier alanı eklenir (değişiklik)
src/store/skillTreeStore.ts       ← selectedLifePath doğrudan set edilebilir (değişiklik)
src/components/SkillTreeCanvas.tsx ← dış halka yay çizimi (değişiklik)
```

---

## 6. Kapsam Dışı

- Yan işlerin kendisi (mini oyunlar) — ayrı brainstorming
- Yeni seed tipleri (Siber Hukuk, Tekelcilik, vb.) — yan işlerle birlikte
- Vivian NPC — Hırs yolu yan işleriyle birlikte
- Hayat yolu finallerinin içeriği — ayrı sistem
