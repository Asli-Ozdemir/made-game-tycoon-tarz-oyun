// Platform payı tarihsel eğri tablosu (yıl → {pc, konsol, mobil})
const CURVE_TABLE: Array<{ year: number; pc: number; konsol: number; mobil: number }> = [
  { year: 1, pc: 60, konsol: 30, mobil: 10 },
  { year: 5, pc: 50, konsol: 30, mobil: 20 },
  { year: 10, pc: 40, konsol: 28, mobil: 32 },
]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Platforma göre baz pay eğrisi — yıla göre lineer interpolasyon
export function computeBaseCurve(year: number): Record<string, number> {
  // Yıl 1 öncesi: başlangıç değerlerini döndür
  if (year < 1) {
    const first = CURVE_TABLE[0]
    return { pc: first.pc, konsol: first.konsol, mobil: first.mobil }
  }

  // Yıl 10 sonrası sabit
  if (year >= 10) {
    const last = CURVE_TABLE[CURVE_TABLE.length - 1]
    return { pc: last.pc, konsol: last.konsol, mobil: last.mobil }
  }

  // Hangi iki nokta arasındayız?
  let lower = CURVE_TABLE[0]
  let upper = CURVE_TABLE[1]
  for (let i = 0; i < CURVE_TABLE.length - 1; i++) {
    if (year >= CURVE_TABLE[i].year && year <= CURVE_TABLE[i + 1].year) {
      lower = CURVE_TABLE[i]
      upper = CURVE_TABLE[i + 1]
      break
    }
  }

  const t = (year - lower.year) / (upper.year - lower.year)
  return {
    pc: Math.round(lerp(lower.pc, upper.pc, t)),
    konsol: Math.round(lerp(lower.konsol, upper.konsol, t)),
    mobil: Math.round(lerp(lower.mobil, upper.mobil, t)),
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

// Reaktif delta sonrası normalize edilmiş pay hesabı
// Her platform: clamp(base + delta, 5, 80), sonra /toplam × 100
export function computeNormalizedShares(
  baseCurve: Record<string, number>,
  reactiveDeltas: Record<string, number>
): Record<string, number> {
  const clamped: Record<string, number> = {}
  for (const id of Object.keys(baseCurve)) {
    const base = baseCurve[id] ?? 0
    const delta = clamp(reactiveDeltas[id] ?? 0, -15, 15)
    clamped[id] = clamp(base + delta, 5, 80)
  }

  const total = Object.values(clamped).reduce((a, b) => a + b, 0)
  const normalized: Record<string, number> = {}
  for (const id of Object.keys(clamped)) {
    normalized[id] = total > 0 ? (clamped[id] / total) * 100 : 0
  }
  return normalized
}

// Platforma özgü satış çarpanı
// share > 50 → 1.0 + (share - 50) / 100   (max ~1.3 pay=80'de)
// share < 20 → 0.7 + (share - 5) / 50     (min ~0.4 pay=5'te)
// 20–50 arası → 1.0
export function computePlatformShareMultiplier(share: number): number {
  if (share > 50) return 1.0 + (share - 50) / 100
  if (share < 20) return 0.7 + (share - 5) / 50
  return 1.0
}

// Reaktif delta decay — her hafta %20 sönümlenir
export function decayReactiveDelta(delta: number): number {
  if (Math.abs(delta) < 0.5) return 0
  return delta * 0.8
}
