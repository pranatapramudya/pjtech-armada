/**
 * Utility pemformatan rupiah otomatis agar tidak memakan ruang layar HP pada angka besar (ratusan juta/miliar).
 */

export function formatRupiah(amount: number): string {
  return `Rp ${(amount || 0).toLocaleString('id-ID')}`
}

/**
 * Format otomatis ringkas untuk angka besar (puluhan juta, ratusan juta, miliaran):
 * - < 10 Juta: Format penuh (contoh: Rp 150.000, Rp 5.000.000)
 * - 10 Juta s/d < 1 Miliar: Format 'Jt' (contoh: Rp 25 Jt, Rp 150 Jt, Rp 250,5 Jt)
 * - >= 1 Miliar: Format 'M' (contoh: Rp 1 M, Rp 1,5 M, Rp 2,25 M)
 */
export function formatRupiahAuto(amount: number): string {
  const num = amount || 0
  const abs = Math.abs(num)
  const isNegative = num < 0
  const sign = isNegative ? '-' : ''

  if (abs >= 1_000_000_000) {
    const val = abs / 1_000_000_000
    // Maksimal 2 desimal di belakang koma
    const str = val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    return `${sign}Rp ${str} M`
  }

  if (abs >= 10_000_000) {
    const val = abs / 1_000_000
    // Maksimal 1 desimal di belakang koma
    const str = val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
    return `${sign}Rp ${str} Jt`
  }

  return `${sign}Rp ${abs.toLocaleString('id-ID')}`
}

/**
 * Terbilang ringkas untuk bantu input & konfirmasi angka di HP (misal: "150 Juta", "1,5 Miliar")
 */
export function getTerbilangRingkas(amount: number): string {
  const num = amount || 0
  const abs = Math.abs(num)
  if (abs >= 1_000_000_000) {
    const val = abs / 1_000_000_000
    const str = val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    return `${str} Miliar`
  }
  if (abs >= 1_000_000) {
    const val = abs / 1_000_000
    const str = val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
    return `${str} Juta`
  }
  if (abs >= 1_000) {
    const val = abs / 1_000
    const str = val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    return `${str} Ribu`
  }
  return ''
}
