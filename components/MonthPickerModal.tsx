'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { playClickSound, triggerHaptic } from '@/lib/audio'

interface MonthPickerModalProps {
  isOpen: boolean
  currentMonthStr: string // Format "YYYY-MM"
  onClose: () => void
  onSelect: (monthStr: string) => void
}

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export function MonthPickerModal({
  isOpen,
  currentMonthStr,
  onClose,
  onSelect,
}: MonthPickerModalProps) {
  const [initialYear, initialMonth] = (currentMonthStr || '2026-10').split('-').map(Number)
  const [selectedYear, setSelectedYear] = useState<number>(initialYear || new Date().getFullYear())

  // Sinkronkan tahun ketika currentMonthStr berubah atau modal dibuka
  useEffect(() => {
    if (isOpen && currentMonthStr) {
      const [y] = currentMonthStr.split('-').map(Number)
      if (y) setSelectedYear(y)
    }
  }, [isOpen, currentMonthStr])

  if (!isOpen) return null

  const handlePrevYear = () => {
    playClickSound()
    triggerHaptic(20)
    setSelectedYear((prev) => prev - 1)
  }

  const handleNextYear = () => {
    playClickSound()
    triggerHaptic(20)
    setSelectedYear((prev) => prev + 1)
  }

  const handlePickMonth = (monthIndex: number) => {
    playClickSound()
    triggerHaptic(40)
    const mStr = String(monthIndex + 1).padStart(2, '0')
    onSelect(`${selectedYear}-${mStr}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm selection:bg-amber-400">
      <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl text-slate-900 flex flex-col">
        {/* Header Dialog */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
            PILIH BULAN LAPORAN
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pemilih Tahun (< 2026 >) */}
        <div className="flex items-center justify-between bg-slate-100 rounded-2xl p-1.5 mb-4 border border-slate-200">
          <button
            type="button"
            onClick={handlePrevYear}
            className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-800 shadow-sm cursor-pointer transition-transform active:scale-90"
            title="Tahun Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-lg font-black font-mono text-slate-900 tracking-wider">
            {selectedYear}
          </span>

          <button
            type="button"
            onClick={handleNextYear}
            className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-800 shadow-sm cursor-pointer transition-transform active:scale-90"
            title="Tahun Berikutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Grid 12 Bulan */}
        <div className="grid grid-cols-3 gap-2">
          {NAMA_BULAN.map((nama, idx) => {
            const isCurrent =
              selectedYear === initialYear && idx === initialMonth - 1

            return (
              <button
                key={nama}
                type="button"
                onClick={() => handlePickMonth(idx)}
                className={`h-12 rounded-xl text-xs font-black flex items-center justify-center cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md border-2 border-blue-700'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                <span>{nama}</span>
              </button>
            )
          })}
        </div>

        {/* Tombol Kembali ke Bulan Sekarang */}
        <button
          type="button"
          onClick={() => {
            const now = new Date()
            const y = now.getFullYear()
            const m = String(now.getMonth() + 1).padStart(2, '0')
            onSelect(`${y}-${m}`)
            onClose()
          }}
          className="mt-4 w-full h-10 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition-colors"
        >
          KEMBALI KE BULAN INI
        </button>
      </div>
    </div>
  )
}
