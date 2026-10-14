'use client'

import { formatRupiahAuto } from '@/lib/formatRupiah'
﻿import { useState, useTransition, useEffect } from 'react'
import {
  Banknote,
  BookOpen,
  Calendar,
  Share2,
  Trash2,
  Pencil,
  Check,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  Car,
  User,
  Wrench,
  ShieldCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { deleteOfflineSetoran, deleteOfflinePengeluaran, updateOfflineSetoran, updateOfflinePengeluaran, OfflinePengeluaran, OfflineAngkot } from '@/lib/offlineStorage'
import { MonthPickerModal } from './MonthPickerModal'
import { playClickSound, playSuccessSound, triggerHaptic } from '@/lib/audio'

export interface SetoranRecord {
  id: string
  angkotId: string
  nominal: number
  pengeluaran?: number
  keteranganPengeluaran?: string | null
  status: string
  catatan: string | null
  createdAt: string | Date
  tanggal: string | Date
  angkot: {
    platNomor: string
    namaSopirTetap: string | null
    tipeKendaraan?: string
    keteranganArmada?: string | null
  }
}

interface BukuKasViewProps {
  setoranHariIni: SetoranRecord[]
  setoranBulanIni: SetoranRecord[]
  pengeluaranHariIni: OfflinePengeluaran[]
  pengeluaranBulanIni: OfflinePengeluaran[]
  rawAngkotList: OfflineAngkot[]
  totalMobil: number
  namaJuragan: string
  currentSelectedDate?: string
  currentSelectedMonth?: string
  onSelectMonth?: (monthStr: string) => void
  onTambahMobilClick: () => void
  onCatatPengeluaranClick: () => void
  onDataChange?: () => void
}

export function BukuKasView({
  setoranHariIni,
  setoranBulanIni,
  pengeluaranHariIni,
  pengeluaranBulanIni,
  rawAngkotList,
  totalMobil,
  namaJuragan,
  currentSelectedDate,
  currentSelectedMonth,
  onSelectMonth,
  onTambahMobilClick,
  onCatatPengeluaranClick,
  onDataChange,
}: BukuKasViewProps) {
  const [periodeMode, setPeriodeMode] = useState<'harian' | 'bulanan'>('harian')
  const [filterMode, setFilterMode] = useState<'semua' | 'setoran' | 'pengeluaran'>('semua')
  const [copied, setCopied] = useState(false)
  const [deleteConfirmData, setDeleteConfirmData] = useState<{
    id: string
    tipe: 'MASUK' | 'KELUAR'
    judul: string
    nominal: number
    isDriverCommission?: boolean
  } | null>(null)

  const [editModalData, setEditModalData] = useState<{
    id: string
    tipe: 'MASUK' | 'KELUAR'
    judul: string
    nominal: number
    keterangan: string
    isDriverCommission?: boolean
  } | null>(null)
  const [editNominalInput, setEditNominalInput] = useState('')
  const [editKeteranganInput, setEditKeteranganInput] = useState('')
  const [editTanggalInput, setEditTanggalInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false)

  // Tanggal Hari Terpilih
  const refDate = currentSelectedDate ? new Date(currentSelectedDate + 'T12:00:00') : new Date()
  const labelHariIni = refDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  // State Lokal Bulan Terpilih agar UI langsung responsif seketika
  const defaultMonthStr = currentSelectedMonth || `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`
  const [localMonthStr, setLocalMonthStr] = useState<string>(defaultMonthStr)

  useEffect(() => {
    if (currentSelectedMonth) {
      setLocalMonthStr(currentSelectedMonth)
    }
  }, [currentSelectedMonth])

  const [mYear, mMonth] = localMonthStr.split('-').map(Number)
  const monthRefDate = new Date(mYear, mMonth - 1, 1, 12, 0, 0)
  const namaBulanTahun = monthRefDate.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })

  const handleChangeMonth = (newMonth: string) => {
    setLocalMonthStr(newMonth)
    if (onSelectMonth) {
      onSelectMonth(newMonth)
    }
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    playClickSound()
    triggerHaptic(30)
    const prev = new Date(mYear, mMonth - 2, 1)
    const yStr = prev.getFullYear()
    const mStr = String(prev.getMonth() + 1).padStart(2, '0')
    handleChangeMonth(`${yStr}-${mStr}`)
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    playClickSound()
    triggerHaptic(30)
    const next = new Date(mYear, mMonth, 1)
    const yStr = next.getFullYear()
    const mStr = String(next.getMonth() + 1).padStart(2, '0')
    handleChangeMonth(`${yStr}-${mStr}`)
  }

  const handleOpenMonthPicker = () => {
    playClickSound()
    triggerHaptic(30)
    setIsMonthModalOpen(true)
  }

  const currentPengeluaran = periodeMode === 'harian' ? pengeluaranHariIni : pengeluaranBulanIni
  const currentSetoran = periodeMode === 'harian' ? setoranHariIni : setoranBulanIni

  // 1. TOTAL PENDAPATAN KOTOR (Order / Sewa / Setoran Armada Kotor)
  const totalPendapatan = currentSetoran.reduce((acc, curr) => acc + curr.nominal, 0)

  // 2. TOTAL KOMISI DRIVER & POTONGAN OPERASIONAL DARI SETORAN (Kas keluar riil)
  const totalKomisiDriver = currentSetoran.reduce((acc, curr) => acc + (curr.pengeluaran || 0), 0)

  // 3. SETORAN BERSIH MASUK KAS KANTOR (Setelah dipotong komisi driver)
  const totalSetoranBersihKantor = Math.max(0, totalPendapatan - totalKomisiDriver)

  // 4. BREAKDOWN PENGELUARAN: KHUSUS ARMADA (Servis/bengkel catatan pengeluaran) vs UMUM
  const pengeluaranArmadaList = currentPengeluaran.filter((p) => !!p.angkotId)
  const pengeluaranUmumList = currentPengeluaran.filter((p) => !p.angkotId)

  const totalPengeluaranArmadaKhusus = pengeluaranArmadaList.reduce((acc, curr) => acc + curr.nominal, 0)
  const totalPengeluaranArmada = totalKomisiDriver + totalPengeluaranArmadaKhusus
  const totalPengeluaranUmum = pengeluaranUmumList.reduce((acc, curr) => acc + curr.nominal, 0)

  // 5. TOTAL SEMUA PENGELUARAN (KAS KELUAR RIIL):
  // Komisi driver (kas keluar) + Biaya servis armada + Operasional umum/maintenance
  const totalPengeluaranKeseluruhan = totalKomisiDriver + totalPengeluaranArmadaKhusus + totalPengeluaranUmum

  // 6. SISA UANG BERSIH (KAS JURAGAN):
  // Sisa Uang Bersih = Total Pendapatan Kotor - Total Semua Pengeluaran
  // (Hasilnya sama persis: Setoran Bersih Masuk Kantor - Total Pengeluaran Maintenance/Umum)
  const pendapatanBersih = totalPendapatan - totalPengeluaranKeseluruhan

  // STATUS MOBIL HARIAN
  const mobilSudahSetorIds = new Set(setoranHariIni.map((s) => s.angkotId))
  const jumlahSudahSetorHarian = mobilSudahSetorIds.size
  const jumlahBelumSetorHarian = Math.max(0, totalMobil - jumlahSudahSetorHarian)

  // Map Armada dari data ketersediaan armada
  const angkotMap = new Map<string, OfflineAngkot>(rawAngkotList.map((a) => [a.id, a]))

  // PERFORMA / KEUANGAN TIAP MOBIL (Armada Financial Breakdown)
  const armadaBreakdown = rawAngkotList.map((a) => {
    const setorMobil = currentSetoran.filter((s) => s.angkotId === a.id)
    const sumSetor = setorMobil.reduce((acc, curr) => acc + curr.nominal, 0)

    const expMobil = currentPengeluaran.filter((p) => p.angkotId === a.id)
    const sumExp = expMobil.reduce((acc, curr) => acc + curr.nominal, 0)

    const sumExpPotongan = setorMobil.reduce((acc, curr) => acc + (curr.pengeluaran || 0), 0)
    const totalExpArmada = sumExp + sumExpPotongan
    const netArmada = sumSetor - totalExpArmada

    return {
      id: a.id,
      platNomor: a.platNomor,
      namaSopir: a.namaSopirTetap || 'Belum Diisi',
      tipeKendaraan: a.tipeKendaraan || 'ANGKOT',
      totalSetoran: sumSetor,
      totalPengeluaran: totalExpArmada,
      bersih: netArmada,
      jumlahTransaksi: setorMobil.length,
    }
  })

  // Transaksi Gabungan untuk Arus Kas
  interface TransactionItem {
    id: string
    tipe: 'MASUK' | 'KELUAR'
    kategori: string
    nominal: number
    keterangan: string
    tanggal: string | Date
    subDetail?: string
    angkotId?: string | null
    platNomor?: string
    isDriverCommission?: boolean
    parentSetoranId?: string
  }

  const setoranTransactions: TransactionItem[] = []
  currentSetoran.forEach((s) => {
    const a = angkotMap.get(s.angkotId)
    const isBus = a?.tipeKendaraan === 'BUS' || s.angkot?.tipeKendaraan === 'BUS'
    let labelMasuk = s.catatan && s.catatan.trim() ? s.catatan.trim() : (isBus ? 'Uang Sewa / Carter Masuk' : 'Setoran Harian Armada')
    if (labelMasuk.toLowerCase() === 'komisi driver' || labelMasuk.toLowerCase() === 'komisi supir') {
      labelMasuk = isBus ? 'Uang Sewa / Carter Masuk' : 'Setoran Harian Armada'
    }

    setoranTransactions.push({
      id: s.id,
      tipe: 'MASUK' as const,
      kategori: isBus ? 'Sewa / Carter Bus' : 'Setoran Armada',
      nominal: s.nominal,
      keterangan: labelMasuk,
      tanggal: s.tanggal,
      subDetail: `${s.angkot?.platNomor || 'Armada'}${s.angkot?.namaSopirTetap ? ` (${s.angkot.namaSopirTetap})` : ''}`,
      angkotId: s.angkotId,
      platNomor: s.angkot?.platNomor,
    })

    // Komisi Driver / Potongan Operasional Armada dicatat sebagai KAS KELUAR riil
    if (s.pengeluaran && s.pengeluaran > 0) {
      setoranTransactions.push({
        id: `${s.id}_komisi`,
        tipe: 'KELUAR' as const,
        kategori: 'Komisi Driver / Operasional',
        nominal: s.pengeluaran,
        keterangan: s.keteranganPengeluaran || (isBus ? 'Komisi Driver (All In) & Biaya Jalan' : 'Potongan Operasional Sopir'),
        tanggal: s.tanggal,
        subDetail: `${s.angkot?.platNomor || 'Armada'}${s.angkot?.namaSopirTetap ? ` (${s.angkot.namaSopirTetap})` : ''}`,
        angkotId: s.angkotId,
        platNomor: s.angkot?.platNomor,
        isDriverCommission: true,
        parentSetoranId: s.id,
      })
    }
  })

  const mergedTransactions: TransactionItem[] = [
    ...setoranTransactions,
    ...currentPengeluaran.map((p) => {
      const a = p.angkotId ? angkotMap.get(p.angkotId) : null
      return {
        id: p.id,
        tipe: 'KELUAR' as const,
        kategori: p.kategori || 'Operasional Umum',
        nominal: p.nominal,
        keterangan: p.keterangan,
        tanggal: p.tanggal,
        subDetail: a ? `Armada ${a.platNomor}` : 'Operasional Umum / Maintenance',
        angkotId: p.angkotId,
        platNomor: a?.platNomor,
      }
    }),
  ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())

  // Filter List Sesuai Tab
  const filteredTransactions = mergedTransactions.filter((item) => {
    if (filterMode === 'setoran') return item.tipe === 'MASUK'
    if (filterMode === 'pengeluaran') return item.tipe === 'KELUAR'
    return true
  })

  // Format Pesan WhatsApp Rekapan
  const handleShareWhatsApp = () => {
    playClickSound()
    triggerHaptic(50)

    const periodeLabel =
      periodeMode === 'harian'
        ? labelHariIni
        : `Bulan ${namaBulanTahun}`

    let text = `*LAPORAN BUKU KAS SETORAN ARMADA*
`
    text += `Juragan: ${namaJuragan}
`
    text += `Periode: ${periodeLabel}

`
    text += `💰 *TOTAL ORDER / SEWA KOTOR: Rp ${totalPendapatan.toLocaleString('id-ID')}*
`
    text += `🔻 *TOTAL PENGELUARAN (KAS KELUAR): Rp ${totalPengeluaranKeseluruhan.toLocaleString('id-ID')}*
`
    if (totalKomisiDriver > 0) {
      text += `  • Komisi Driver & Operasional Armada: Rp ${totalKomisiDriver.toLocaleString('id-ID')}
`
    }
    if (totalPengeluaranArmadaKhusus > 0) {
      text += `  • Biaya Servis Khusus Armada: Rp ${totalPengeluaranArmadaKhusus.toLocaleString('id-ID')}
`
    }
    if (totalPengeluaranUmum > 0) {
      text += `  • Maintenance & Operasional Umum: Rp ${totalPengeluaranUmum.toLocaleString('id-ID')}
`
    }
    text += `💵 *SETORAN BERSIH MASUK KANTOR: Rp ${totalSetoranBersihKantor.toLocaleString('id-ID')}*
`
    text += `✨ *SISA KAS BERSIH (JURAGAN): Rp ${pendapatanBersih.toLocaleString('id-ID')}*

`

    if (armadaBreakdown.length > 0) {
      text += `*RINCIAN PER ARMADA:*
`
      armadaBreakdown.forEach((m, idx) => {
        text += `${idx + 1}. ${m.platNomor} (${m.namaSopir}): Kotor Rp ${m.totalSetoran.toLocaleString('id-ID')}`
        if (m.totalPengeluaran > 0) {
          text += ` (Biaya: -Rp ${m.totalPengeluaran.toLocaleString('id-ID')})`
        }
        text += ` -> Bersih Rp ${m.bersih.toLocaleString('id-ID')}
`
      })
    }

    if (pengeluaranUmumList.length > 0) {
      text += `
*PENGELUARAN OPERASIONAL UMUM & MAINTENANCE:*
`
      pengeluaranUmumList.forEach((p, idx) => {
        text += `${idx + 1}. ${p.keterangan}: -Rp ${p.nominal.toLocaleString('id-ID')}
`
      })
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  const handleOpenDeleteConfirm = (
    id: string,
    tipe: 'MASUK' | 'KELUAR',
    judul: string,
    nominal: number,
    isDriverCommission?: boolean
  ) => {
    playClickSound()
    triggerHaptic(25)
    setDeleteConfirmData({ id, tipe, judul, nominal, isDriverCommission })
  }

  const handleExecuteDelete = () => {
    if (!deleteConfirmData) return
    playClickSound()
    triggerHaptic(50)

    startTransition(() => {
      if (deleteConfirmData.isDriverCommission || deleteConfirmData.id.endsWith('_komisi')) {
        const parentId = deleteConfirmData.id.replace('_komisi', '')
        updateOfflineSetoran(parentId, {
          pengeluaran: 0,
          keteranganPengeluaran: null,
        })
      } else if (deleteConfirmData.tipe === 'MASUK') {
        deleteOfflineSetoran(deleteConfirmData.id)
      } else {
        deleteOfflinePengeluaran(deleteConfirmData.id)
      }
      setDeleteConfirmData(null)
      if (onDataChange) onDataChange()
      else window.location.reload()
    })
  }

  const handleOpenEdit = (item: TransactionItem) => {
    playClickSound()
    triggerHaptic(25)
    setEditModalData({
      id: item.id,
      tipe: item.tipe,
      judul: item.isDriverCommission
        ? `Komisi Driver (${item.subDetail})`
        : (item.subDetail || (item.tipe === 'MASUK' ? 'Setoran Armada' : 'Pengeluaran Umum')),
      nominal: item.nominal,
      keterangan: item.keterangan || '',
      isDriverCommission: item.isDriverCommission,
    })
    setEditNominalInput(String(item.nominal))
    setEditKeteranganInput(item.keterangan || '')
    const d = new Date(item.tanggal)
    const yStr = d.getFullYear()
    const mStr = String(d.getMonth() + 1).padStart(2, '0')
    const dStr = String(d.getDate()).padStart(2, '0')
    setEditTanggalInput(`${yStr}-${mStr}-${dStr}`)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModalData) return

    const parsedNominal = parseInt(editNominalInput.replace(/[^0-9]/g, ''), 10) || 0
    if (parsedNominal <= 0) return

    playSuccessSound()
    triggerHaptic(40)

    startTransition(() => {
      const targetDate = editTanggalInput ? new Date(editTanggalInput + 'T12:00:00').toISOString() : undefined

      if (editModalData.isDriverCommission || editModalData.id.endsWith('_komisi')) {
        const parentId = editModalData.id.replace('_komisi', '')
        updateOfflineSetoran(parentId, {
          pengeluaran: parsedNominal,
          keteranganPengeluaran: editKeteranganInput.trim() || undefined,
        })
      } else if (editModalData.tipe === 'MASUK') {
        updateOfflineSetoran(editModalData.id, {
          nominal: parsedNominal,
          catatan: editKeteranganInput.trim(),
          tanggal: targetDate,
        })
      } else {
        updateOfflinePengeluaran(editModalData.id, {
          nominal: parsedNominal,
          keterangan: editKeteranganInput.trim(),
          tanggal: targetDate,
        })
      }

      setEditModalData(null)
      if (onDataChange) onDataChange()
      else window.location.reload()
    })
  }

  return (
    <div className="space-y-4">
      {/* PILIHAN PERIODE: HARIAN / BULANAN */}
      <div className="bg-slate-200/70 p-1.5 rounded-2xl grid grid-cols-2 gap-2 border border-slate-300/60 shadow-xs">
        <button
          id="btn-rekap-harian"
          type="button"
          onClick={() => {
            playClickSound()
            triggerHaptic(25)
            setPeriodeMode('harian')
          }}
          className={`h-11 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
            periodeMode === 'harian'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
          }`}
        >
          <Calendar className="w-4 h-4 stroke-[2.3]" />
          <span>Rekap Harian</span>
        </button>
        <button
          id="btn-laporan-bulanan"
          type="button"
          onClick={() => {
            playClickSound()
            triggerHaptic(25)
            setPeriodeMode('bulanan')
          }}
          className={`h-11 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
            periodeMode === 'bulanan'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
          }`}
        >
          <TrendingUp className="w-4 h-4 stroke-[2.3]" />
          <span>Laporan Bulanan</span>
        </button>
      </div>

      {/* NAVIGASI KALENDER BULAN JIKA MODE BULANAN AKTIF */}
      {periodeMode === 'bulanan' && (
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-2.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-blue-900 uppercase tracking-wider pl-1">
              PILIH BULAN:
            </span>
          </div>

          <div className="flex items-center bg-slate-100 rounded-xl border border-slate-300 p-0.5 relative">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 flex items-center justify-center hover:bg-white active:bg-blue-600 active:text-white rounded-lg text-slate-700 transition-all cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleOpenMonthPicker}
              className="px-3 h-8 flex items-center gap-1.5 font-black text-xs text-slate-900 hover:text-blue-700 hover:bg-white rounded-lg cursor-pointer transition-colors"
              title="Klik untuk memilih bulan dari kalender modal"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{namaBulanTahun.toUpperCase()}</span>
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 flex items-center justify-center hover:bg-white active:bg-blue-600 active:text-white rounded-lg text-slate-700 transition-all cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL DIALOG PEMILIHAN BULAN INTERAKTIF */}
      <MonthPickerModal
        isOpen={isMonthModalOpen}
        currentMonthStr={localMonthStr}
        onClose={() => setIsMonthModalOpen(false)}
        onSelect={(newMonth) => {
          handleChangeMonth(newMonth)
        }}
      />

      {/* KARTU RINGKASAN BUKU KAS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                {periodeMode === 'harian' ? 'BUKU KAS HARIAN' : `BUKU KAS ${namaBulanTahun.toUpperCase()}`}
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {periodeMode === 'harian' ? labelHariIni : `Laporan Akumulasi Bulan ${namaBulanTahun}`}
              </span>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
    periodeMode === "harian"
      ? "bg-blue-50 text-blue-700 border-blue-200/80"
      : "bg-indigo-50 text-indigo-700 border-indigo-200/80"
  }`}>
            {periodeMode === 'harian' ? 'Rekap Harian' : 'Rekap Bulanan'}
          </span>
        </div>

        {/* UTAMA: PENDAPATAN BERSIH / SISA KAS JURAGAN */}
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-center shadow-xs">
          <span className="text-xs font-black text-emerald-900 tracking-wider block mb-0.5 uppercase">
            SISA UANG BERSIH (KAS JURAGAN)
          </span>
          <div className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight font-mono">
            {formatRupiahAuto(pendapatanBersih)}
          </div>
          {Math.abs(pendapatanBersih) >= 10_000_000 && (
            <span className="text-xs font-mono font-bold text-emerald-800 block mt-0.5">
              (Rp {pendapatanBersih.toLocaleString('id-ID')})
            </span>
          )}
          <span className="text-[11px] text-emerald-800 font-bold block mt-1.5">
            (Total Setoran Masuk dikurangi Komisi Driver & Semua Biaya)
          </span>
        </div>

        {/* ARUS KAS MASUK VS KELUAR */}
        <div className="grid grid-cols-2 gap-3">
          {/* Uang Masuk Kotor */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-600 uppercase">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>TOTAL ORDER / SEWA</span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1 font-mono truncate" title={`Rp ${totalPendapatan.toLocaleString('id-ID')}`}>
              {formatRupiahAuto(totalPendapatan)}
            </div>
            {Math.abs(totalPendapatan) >= 10_000_000 ? (
              <span className="text-[10px] text-slate-500 font-mono font-bold block mt-0.5 truncate">
                Rp {totalPendapatan.toLocaleString('id-ID')}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                {currentSetoran.length} Transaksi Masuk
              </span>
            )}
          </div>

          {/* Uang Keluar (Komisi Driver + Maintenance) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-red-600 uppercase">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span>PENGELUARAN</span>
            </div>
            <div className="text-xl font-black text-red-600 mt-1 font-mono truncate" title={`Rp ${totalPengeluaranKeseluruhan.toLocaleString('id-ID')}`}>
              {formatRupiahAuto(totalPengeluaranKeseluruhan)}
            </div>
            {Math.abs(totalPengeluaranKeseluruhan) >= 10_000_000 ? (
              <span className="text-[10px] text-red-500/80 font-mono font-bold block mt-0.5 truncate">
                Rp {totalPengeluaranKeseluruhan.toLocaleString('id-ID')}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                {(totalKomisiDriver > 0 ? 1 : 0) + pengeluaranArmadaList.length + pengeluaranUmumList.length} Catatan Biaya
              </span>
            )}
          </div>
        </div>

        {/* Breakdown Pengeluaran: Komisi Driver vs Servis vs Operasional Umum */}
        {totalPengeluaranKeseluruhan > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs font-bold text-slate-600">
            <span className="text-[11px] font-black uppercase text-slate-500 block border-b border-slate-200 pb-1.5">
              Rincian Kas Keluar / Pengeluaran:
            </span>
            {totalKomisiDriver > 0 && (
              <div className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Komisi Driver & Operasional Armada:</span>
                </span>
                <span className="text-red-600 font-mono font-black">
                  - {formatRupiahAuto(totalKomisiDriver)}
                </span>
              </div>
            )}
            {totalPengeluaranArmadaKhusus > 0 && (
              <div className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-500" />
                  <span>Servis Khusus Armada:</span>
                </span>
                <span className="text-red-600 font-mono font-black">
                  - {formatRupiahAuto(totalPengeluaranArmadaKhusus)}
                </span>
              </div>
            )}
            {totalPengeluaranUmum > 0 && (
              <div className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-slate-500" />
                  <span>Maintenance & Operasional Umum:</span>
                </span>
                <span className="text-red-600 font-mono font-black">
                  - {formatRupiahAuto(totalPengeluaranUmum)}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-900 font-black">
              <span>Setoran Bersih Masuk Kas Kantor:</span>
              <span className="text-emerald-700 font-mono">
                {formatRupiahAuto(totalSetoranBersihKantor)}
              </span>
            </div>
          </div>
        )}

        {/* STATUS OPERASIONAL MOBIL JIKA HARIAN */}
        {periodeMode === 'harian' && (
          <div className="grid grid-cols-2 gap-2 text-center pt-1 border-t border-slate-100">
            <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200">
              <span className="text-xs font-black text-emerald-800 uppercase block">
                SUDAH SETOR
              </span>
              <span className="text-xl font-black text-emerald-900">
                {jumlahSudahSetorHarian} Mobil
              </span>
            </div>
            <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200">
              <span className="text-xs font-black text-amber-800 uppercase block">
                BELUM SETOR
              </span>
              <span className="text-xl font-black text-amber-900">
                {jumlahBelumSetorHarian} Mobil
              </span>
            </div>
          </div>
        )}
      </div>

      {/* PERFORMA KEUANGAN TIAP ARMADA */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-black text-slate-900">
              {periodeMode === 'harian' ? 'STATUS SETORAN PER ARMADA' : `AKUMULASI TIAP ARMADA (${namaBulanTahun})`}
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {armadaBreakdown.length} Armada
          </span>
        </div>

        {armadaBreakdown.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Belum ada armada yang terdaftar.
          </div>
        ) : (
          <div className="space-y-2">
            {armadaBreakdown.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl p-3 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900">
                      {item.platNomor}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      {item.tipeKendaraan}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {item.namaSopir}
                    </span>
                    <span>•</span>
                    <span>{item.jumlahTransaksi}x Transaksi</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 block font-mono">
                    {formatRupiahAuto(item.totalSetoran)}
                  </span>
                  {item.totalPengeluaran > 0 ? (
                    <div className="text-[11px] font-bold text-red-600 block">
                      Biaya: -{formatRupiahAuto(item.totalPengeluaran)}
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-700 block">
                      Tanpa Potongan
                    </span>
                  )}
                  {item.totalPengeluaran > 0 && (
                    <span className="text-[11px] font-black text-emerald-700 block">
                      Bersih: {formatRupiahAuto(item.bersih)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIWAYAT ARUS KAS LENGKAP */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 overflow-hidden">
        {/* FILTER TAB TABEL TRANSAKSI */}
        <div className="flex items-center justify-between pt-1">
          <h3 className="text-base font-black text-slate-900">
            RINCIAN ARUS KAS {periodeMode === 'harian' ? 'HARI INI' : `BULAN ${namaBulanTahun.toUpperCase()}`}
          </h3>
          <button
            type="button"
            onClick={onCatatPengeluaranClick}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Catat Pengeluaran
          </button>
        </div>

        {/* Tab Filter Arus Kas */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 text-xs font-black">
          <button
            type="button"
            onClick={() => setFilterMode('semua')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              filterMode === 'semua' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Semua ({mergedTransactions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('setoran')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              filterMode === 'setoran' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            Masuk ({currentSetoran.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('pengeluaran')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              filterMode === 'pengeluaran' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            Keluar ({currentPengeluaran.length})
          </button>
        </div>

        {/* Daftar Transaksi */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs font-bold text-slate-500">
              Tidak ada catatan arus kas pada periode ini.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((item) => {
              const d = new Date(item.tanggal)
              const tgl = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
              const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

              return (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                        item.tipe === 'MASUK'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.tipe === "MASUK" ? <TrendingUp className="w-4 h-4 text-emerald-700" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight">
                        {item.keterangan}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{tgl}, {jam}</span>
                        <span>•</span>
                        <span className="text-slate-600">{item.subDetail}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                    <span
                      className={`text-sm font-bold font-mono ${
                        item.tipe === 'MASUK' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {item.tipe === "MASUK" ? <TrendingUp className="w-4 h-4 text-emerald-700" /> : <TrendingDown className="w-4 h-4 text-red-600" />}{formatRupiahAuto(item.nominal)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* TOMBOL EDIT */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="h-7 px-2.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 text-xs font-bold rounded-lg border border-blue-200/80 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title="Edit Catatan"
                      >
                        <Pencil className="w-3 h-3 stroke-[2.2]" />
                        <span>Edit</span>
                      </button>

                      {/* TOMBOL HAPUS */}
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenDeleteConfirm(
                            item.id,
                            item.tipe,
                            item.isDriverCommission ? `Komisi Driver (${item.subDetail})` : (item.tipe === 'MASUK' ? (item.subDetail || 'Armada') : item.keterangan),
                            item.nominal,
                            item.isDriverCommission
                          )
                        }}
                        className="h-7 px-2.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 text-xs font-bold rounded-lg border border-rose-200/80 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3 h-3 stroke-[2.2]" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* TOMBOL BAGIKAN REKAPAN KE WHATSAPP */}
      <button
        type="button"
        onClick={handleShareWhatsApp}
        className="w-full min-h-[58px] bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-base font-black rounded-2xl flex items-center justify-center gap-2 border-2 border-emerald-950 shadow-md cursor-pointer transition-transform"
      >
        <Share2 className="w-5 h-5" />
        <span>{copied ? '✓ DISALIN! MEMBUKA WA...' : 'BAGIKAN REKAPAN BUKU KAS KE WA'}</span>
      </button>

      
      {/* POP-UP MODAL MODERN EDIT CATATAN KAS */}
      {editModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editModalData.isDriverCommission ? "Edit Komisi Driver" : "Edit Catatan Kas"}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {editModalData.tipe === 'MASUK' ? 'Setoran Armada' : 'Pengeluaran Kas'} • {editModalData.judul}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalData(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal (Rp):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 150000"
                  value={editNominalInput}
                  onChange={(e) => setEditNominalInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full h-11 px-3 text-base font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
                {editNominalInput && (
                  <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                    {formatRupiahAuto(parseInt(editNominalInput, 10) || 0)}
                  </span>
                )}
              </div>

              {!editModalData.isDriverCommission && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Tanggal Transaksi:
                  </label>
                  <input
                    type="date"
                    value={editTanggalInput}
                    onChange={(e) => setEditTanggalInput(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Ubah tanggal jika setoran ini kelupaan diinput di hari sebelumnya.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Catatan:
                </label>
                <input
                  type="text"
                  placeholder={editModalData.tipe === 'MASUK' ? 'Catatan supir / shift' : 'Keterangan pengeluaran'}
                  value={editKeteranganInput}
                  onChange={(e) => setEditKeteranganInput(e.target.value)}
                  className="w-full h-11 px-3 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalData(null)}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  id="btn-confirm-save-edit"
                  type="submit"
                  disabled={isPending}
                  className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP MODAL MODERN KONFIRMASI HAPUS CATATAN KAS */}
      {deleteConfirmData && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-xl border border-slate-100 space-y-3.5 text-center animate-in zoom-in-95 duration-150 relative">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {deleteConfirmData.isDriverCommission ? "Hapus Komisi Driver?" : "Hapus Catatan Kas?"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Yakin ingin menghapus catatan {deleteConfirmData.isDriverCommission ? 'komisi driver' : (deleteConfirmData.tipe === 'MASUK' ? 'setoran' : 'pengeluaran')}{' '}
                <strong className="text-slate-800 font-semibold">{deleteConfirmData.judul}</strong> senilai{' '}
                <strong className="text-slate-900 font-bold">{formatRupiahAuto(deleteConfirmData.nominal)}</strong>?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmData(null)}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-kas"
                type="button"
                disabled={isPending}
                onClick={handleExecuteDelete}
                className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                {isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
