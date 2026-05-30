# Faz 4D-4 — Sequel & DLC: Tasarım Dokümanı

**Tarih:** 2026-05-30
**Kapsam:** Sequel, DLC, Ücretsiz Güncelleme içerik tipleri + NewProjectModal entegrasyonu
**Önceki faz:** 4D-3 — Çalışan Gelişimi
**Sonraki faz:** —

---

## Genel Bakış

Yayınlanmış bir oyunun üzerine üç tip devam içeriği üretilebilir: **Sequel** (bağımsız yeni oyun, fan base bonusu taşır), **DLC** (ayrı satılan eklenti, ana oyunun satışını artırır), **Ücretsiz Güncelleme** (gelir yok, ana oyunun itibarını/puanını artırır). Tüm içerik tipleri "Yeni Proje" modalından kaynak oyun seçilerek başlatılır.

---

## Veri Modeli

### `GameProject` — Discriminated Union (`src/types/index.ts`)

Mevcut `GameProject` interface'i kaldırılır, yerine ortak taban + dört somut tip gelir:

```typescript
// Ortak taban — tüm project tiplerinde mevcut alanlar
interface BaseProject {
  id:           string
  name:         string
  genreId:      string
  topicId:      string
  platformId:   string
  scope:        ProjectScope
  startDate:    GameDate
  totalWeeks:   number
  weeksElapsed: number
  qualityPoints: number
  status:       ProjectStatus
  publishResult?: PublishResult
}

// Bağımsız oyun (mevcut davranış)
export interface StandaloneProject extends BaseProject {
  contentType: 'standalone'
}

// Sequel — kaynak oyunun fan kitlesini ve skor bonusunu taşır
export interface SequelProject extends BaseProject {
  contentType:       'sequel'
  parentProjectId:   string
  fanBaseMultiplier: number  // yayın anında hesaplanır: 1.0 + (parentSales/50000)*0.5, max 2.0
}

// DLC — ayrı satılır; fiyatı ana oyun birim fiyatını geçemez
export interface DlcProject extends BaseProject {
  contentType:     'dlc'
  parentProjectId: string
  priceOverride:   number  // oyuncu belirler, max = parent revenue/sales
}

// Ücretsiz Güncelleme — gelir yok; ana oyunun score ve itibarını artırır
export interface UpdateProject extends BaseProject {
  contentType:     'guncelleme'
  parentProjectId: string
}

export type GameProject = StandaloneProject | SequelProject | DlcProject | UpdateProject
```

Mevcut kodda `GameProject` kullanan tüm yerler union ile çalışmaya devam eder. `contentType` narrowing yalnızca `scoreEngine` ve `applyFollowUpEffect`'te gerekir.

### Kapsam Kısıtları

| İçerik Tipi | Maksimum Kapsam |
|---|---|
| Standalone | iddialı (kısıtsız) |
| Sequel | iddialı (kısıtsız) |
| DLC | büyük |
| Güncelleme | orta |

---

## Mekanikler

### Sequel — `scoreEngine`

Kaynak oyun referansı `calculatePublishResult`'a opsiyonel parametre olarak geçilir:

```typescript
export function calculatePublishResult(
  project: GameProject,
  opts: ScoreOptions,
  playerSkillBonus: number = 0,
  parentProject?: GameProject & { publishResult: PublishResult }
): PublishResult
```

**`SequelProject` için ek hesaplamalar:**

1. **Fan Base Çarpanı** — `fanBaseMultiplier` proje oluşturulurken hesaplanır:
   ```
   fanBaseMultiplier = clamp(1.0 + (parentSales / 50000) * 0.5, 1.0, 2.0)
   ```

2. **Skor Bonusu** — kaynak oyun puanına göre:
   - Kaynak puan ≥ 85 → `+20`
   - Kaynak puan ≥ 70 → `+10`
   - Kaynak puan < 70 → `+0`

3. **Satış** — `baseSales * salesMultiplier * fanBaseMultiplier * (score/50) * (1 + rep/100)`

### DLC — `scoreEngine`

`DlcProject` için:
- `pricePerUnit` = `project.priceOverride` (oyuncunun girdiği değer)
- Skor hesabı standalone ile aynı (parent bonusu yok)
- Yayın sonrası `applyFollowUpEffect` parent oyunun satışını `+%20` artırır

### Ücretsiz Güncelleme — `scoreEngine`

`UpdateProject` için:
- `revenue: 0`, `sales: 0` — sabit
- `score` hesabı normal akışla yapılır (kalite × süre)
- Yayın sonrası `applyFollowUpEffect` parent oyunun score'unu artırır:
  - `scope: 'kucuk'` → `+5`
  - `scope: 'orta'` → `+10`
  - `scope: 'buyuk'` → `+15` *(güncelleme max orta olduğundan büyük hiç uygulanmaz; bu değer korunur ileride kapsam limiti değişirse diye)*
- `gameStore.gainReputation(+3)` tetiklenir

---

## `projectStore` Güncellemeleri (`src/store/projectStore.ts`)

### Yeni action: `applyFollowUpEffect`

```typescript
applyFollowUpEffect: (parentId: string, contentType: 'dlc' | 'guncelleme', scope: ProjectScope) => void
```

- `'dlc'`: parent projenin `publishResult.sales`'ını `× 1.2` (Math.round) yapar
- `'guncelleme'`: parent projenin `publishResult.score`'unu `+ scoreBonus` yapar (küçük: +5, orta: +10)
- Sadece `status === 'yayinlandi'` olan parent etkilenir
- Parent bulunamazsa veya `publishResult` yoksa sessizce çıkar

`publishProject` action'ı genişler: yayınlanan proje `DlcProject` veya `UpdateProject` ise `applyFollowUpEffect` otomatik çağrılır.

---

## `NewProjectModal` Güncellemeleri (`src/components/NewProjectModal.tsx`)

Mevcut form'a iki yeni alan eklenir:

### 1. Kaynak Oyun Dropdown

Sadece `status === 'yayinlandi'` projeler listelenir. Seçim opsiyoneldir — seçilmezse `contentType: 'standalone'` oluşturulur.

### 2. İçerik Tipi Seçimi

Kaynak oyun seçilince görünür:

| Seçenek | Açıklama |
|---|---|
| Sequel | Bağımsız devam oyunu |
| DLC | Ücretli ek içerik (fiyat input'u açılır) |
| Ücretsiz Güncelleme | Ücretsiz, max orta kapsam |

### 3. DLC Fiyat Input'u

Sadece DLC seçilince görünür. Min: 1$, Max: `Math.floor(parentRevenue / parentSales)` (parent oyunun birim fiyatı). Default: max değerin yarısı.

### Kapsam Kısıtı

İçerik tipine göre kapsam dropdown'u otomatik filtrelenir (DLC → max büyük, Güncelleme → max orta).

### `addProject` çağrısında oluşturulan tip

```typescript
// Standalone (kaynak seçilmemişse):
{ contentType: 'standalone', ...diğer alanlar }

// Sequel:
{ contentType: 'sequel', parentProjectId, fanBaseMultiplier, ...diğer alanlar }

// DLC:
{ contentType: 'dlc', parentProjectId, priceOverride, ...diğer alanlar }

// Güncelleme:
{ contentType: 'guncelleme', parentProjectId, ...diğer alanlar }
```

`fanBaseMultiplier` Sequel seçilince hemen hesaplanır ve modalda gösterilir: `"Fan kitlesi çarpanı: ×1.4"`

---

## `ProjectCard` Güncellemesi (`src/components/ProjectCard.tsx`)

Yayınlanmış projelerde şu rozet eklenir:

```
DLC: 2  |  Sequel: 1  |  Güncelleme: 3
```

Projenin kendisi kaynak olarak seçilmiş child project sayısı `projectStore`'dan hesaplanır:
```typescript
projects.filter(p => p.contentType !== 'standalone' && p.parentProjectId === id)
```
(`StandaloneProject`'te `parentProjectId` olmadığından `contentType !== 'standalone'` guard'ı gereklidir.)

---

## Entegrasyon Noktaları

| Dosya | Değişiklik |
|---|---|
| `src/types/index.ts` | `GameProject` discriminated union; `StandaloneProject`, `SequelProject`, `DlcProject`, `UpdateProject` |
| `src/engine/scoreEngine.ts` | `calculatePublishResult`'a opsiyonel `parentProject` parametresi; sequel skor + satış bonusu; güncelleme sıfır gelir |
| `src/store/projectStore.ts` | `applyFollowUpEffect` action; `publishProject`'te DLC/güncelleme için otomatik efekt |
| `src/components/NewProjectModal.tsx` | Kaynak oyun dropdown, içerik tipi seçimi, DLC fiyat input, kapsam filtreleme |
| `src/components/ProjectCard.tsx` | Child proje sayısı rozeti (DLC/Sequel/Güncelleme) |

---

## Test Stratejisi

### `tests/engine/scoreEngine.test.ts` (eklenti)

1. Sequel: kaynak puan ≥ 85 ise skor +20 alır
2. Sequel: kaynak puan < 70 ise skor bonusu yok
3. Sequel: fanBaseMultiplier satışa doğru uygulanır
4. DLC: `priceOverride` gelir hesabında kullanılır
5. Güncelleme: `revenue` ve `sales` her zaman 0
6. Standalone: parent geçilmese de sonuç değişmez

### `tests/store/projectStore.test.ts` (eklenti)

1. `applyFollowUpEffect('dlc')`: parent satışı ×1.2 olur
2. `applyFollowUpEffect('guncelleme', 'orta')`: parent score +10 olur
3. `applyFollowUpEffect` parent bulunamazsa store değişmez

---

## Kapsam Dışı (Faz 4D-4)

- DLC/Sequel'in save/load'da persist edilmesi
- Parent oyunun satış grafiğinde DLC boost görselleştirmesi
- Birden fazla DLC'nin kümülatif etkisi (her DLC ayrı +%20 verir)
- Sequel'in kendi sequel'ini oluşturma zinciri (teknik olarak çalışır ama UI'da gösterilmez)
