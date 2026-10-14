'use client'

import { useState } from 'react'
import { X, TrendingDown, Check, Bus, AlertCircle, Building2, User, Calendar } from 'lucide-react'
import { addOfflinePengeluaran, OfflineAngkot } from '@/lib/offlineStorage'
import { playClickSound, playSuccessSound, triggerHaptic } from '@/lib/audio'

interface CatatPengeluaranModalProps {
  isOpen: boolean
  currentSelectedDate?: string
  onClose: () => void
  onSuccess: (item: { nominal: number; keterangan: string; platNomor?: string; namaSopir?: string }) => void
  angkotList: OfflineAngkot[]
}

const QUICK_KETERANGAN = [
  { label: 'Beli Bensin / Solar', kategori: 'BBM' },
  { label: 'Ganti Oli', kategori: 'Bengkel' },
  { label: 'Tambal / Ganti Ban', kategori: 'Sparepart' },
  { label: 'Servis Bengkel', kategori: 'Bengkel' },
  { label: 'Tol & Parkir', kategori: 'Operasional' },
  { label: 'Uang Makan Driver', kategori: 'Operasional' },
  { label: 'Cuci Mobil', kategori: 'Operasional' },
  { label: 'KIR / Pajak STNK', kategori: 'Pajak/Surat' },
]

export function CatatPengeluaranModal({
  isOpen,
  currentSelectedDate,
  onClose,
  onSuccess,
  angkotList,
}: CatatPengeluaranModalProps) {
  const getTodayStr = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [nominalStr, setNominalStr] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [selectedAngkotId, setSelectedAngkotId] = useState<string>('')
  const [kategori, setKategori] = useState('Operasional')
  const [targetDateStr, setTargetDateStr] = useState<string>(currentSelectedDate || getTodayStr())
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const nominalNumber = parseInt(nominalStr.replace(/\D/g, '') || '0', 10)
  const selectedArmada = angkotList.find((a) => a.id === selectedAngkotId)

  const handleQuickKet = (item: { label: string; kategori: string }) => {
    playClickSound()
    triggerHaptic(35)
    setKeterangan(item.label)
    setKategori(item.kategori)
    setErrorMsg(null)
  }

  const handleSelectArmada = (id: string) => {
    playClickSound()
    triggerHaptic(30)
    setSelectedAngkotId(id)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (nominalNumber <= 0) {
      triggerHaptic(100)
      setErrorMsg('Nominal pengeluaran wajib diisi dan lebih dari Rp 0!')
      return
    }

    if (!keterangan.trim()) {
      triggerHaptic(100)
      setErrorMsg('Keterangan pengeluaran wajib diisi (misal: Bensin, Ganti Oli, dll)!')
      return
    }

    try {
      setIsSubmitting(true)
      playSuccessSound()
      triggerHaptic(60)

      const targetIsoDate = targetDateStr
        ? new Date(targetDateStr + 'T12:00:00').toISOString()
        : new Date().toISOString()

      addOfflinePengeluaran({
        angkotId: selectedAngkotId || null,
        nominal: nominalNumber,
        keterangan: keterangan.trim(),
        kategori,
        tanggal: targetIsoDate,
      })

      onClose()
      onSuccess({
        nominal: nominalNumber,
        keterangan: keterangan.trim(),
        platNomor: selectedArmada?.platNomor,
        namaSopir: selectedArmada?.namaSopirTetap || undefined,
      })

      setNominalStr('')
      setKeterangan('')
      setSelectedAngkotId('')
      setErrorMsg(null)
      setIsSubmitting(false)
    } catch (err: any) {
      setIsSubmitting(false)
      setErrorMsg('Gagal menyimpan pengeluaran: ' + err.message)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl p-5 text-slate-900 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                CATAT PENGELUARAN
              </h2>
              <p className="text-xs font-bold text-slate-500">
                Catat biaya operasional armada atau umum
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playClickSound()
              onClose()
            }}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2 text-red-700 text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* PILIHAN TANGGAL */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <Calendar className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-black text-slate-700 uppercase">Tgl Pengeluaran:</span>
            </div>
            <input
              type="date"
              value={targetDateStr}
              onChange={(e) => setTargetDateStr(e.target.value)}
              className="bg-white text-slate-900 text-xs font-black px-2.5 py-1.5 rounded-xl border border-slate-300 outline-none cursor-pointer"
            />
          </div>

          {/* PILIH KETERSEDIAAN ARMADA */}
          <div>
            <label className="text-xs font-black tracking-wider text-slate-700 uppercase block mb-1.5">
              1. Pilih Armada Mobil / Umum *
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {/* Opsi Operasional Umum */}
              <button
                type="button"
                onClick={() => handleSelectArmada('')}
                className={`w-full p-2.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedAngkotId === ''
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedAngkotId === '' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-black block leading-tight">
                      Operasional Umum Juragan
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      Bukan untuk mobil spesifik (Pajak kantor, dll.)
                    </span>
                  </div>
                </div>
                {selectedAngkotId === '' && (
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </button>

              {/* List Armada */}
              {angkotList.map((arm) => {
                const isSelected = selectedAngkotId === arm.id
                return (
                  <button
                    key={arm.id}
                    type="button"
                    onClick={() => handleSelectArmada(arm.id)}
                    className={`w-full p-2.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-red-600 bg-red-50/70 text-red-950 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
                        <Bus className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-900 font-mono block">
                          {arm.platNomor}
                        </span>
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          Driver: <strong className="text-slate-900">{arm.namaSopirTetap || 'Tanpa Driver'}</strong>
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* INPUT NOMINAL BIAYA (BERSIH & SIMPEL TANPA TOMBOL DERETAN UANG) */}
          <div>
            <label className="text-xs font-black tracking-wider text-slate-700 uppercase block mb-1">
              2. Nominal Biaya Pengeluaran (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-red-600">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={nominalStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  setNominalStr(val ? parseInt(val, 10).toLocaleString('id-ID') : '')
                  setErrorMsg(null)
                }}
                placeholder="Masukkan nominal (contoh: 75.000)"
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-red-500 focus:bg-white rounded-2xl py-3.5 pl-14 pr-4 text-2xl font-black text-red-600 placeholder:text-slate-400 placeholder:text-sm outline-none transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* KETERANGAN PENGELUARAN */}
          <div>
            <label className="text-xs font-black tracking-wider text-slate-700 uppercase block mb-1">
              3. Keterangan Pengeluaran *
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => {
                setKeterangan(e.target.value)
                setErrorMsg(null)
              }}
              placeholder="Contoh: Beli Bensin, Ganti Oli, Tambal Ban, dll."
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-red-500 focus:bg-white rounded-2xl p-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
            />

            {/* Quick Chips Keterangan Ringkas */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_KETERANGAN.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleQuickKet(item)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black cursor-pointer transition-all border ${
                    keterangan === item.label
                      ? 'bg-red-600 text-white border-red-600 shadow-sm scale-105'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* TOMBOL SIMPAN */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[56px] bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 text-white text-base font-black rounded-2xl flex items-center justify-center gap-2 border-2 border-red-700 shadow-lg cursor-pointer transition-all"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              {isSubmitting
                ? 'MENYIMPAN...'
                : `SIMPAN PENGELUARAN (Rp ${nominalNumber.toLocaleString('id-ID')})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
