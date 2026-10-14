'use client'

import { getTerbilangRingkas } from '@/lib/formatRupiah'
﻿import { useState, useTransition, useEffect } from 'react'
import {
  X,
  Delete,
  Banknote,
  AlertCircle,
  RotateCcw,
  TrendingDown,
  Bus,
  User,
  Calendar
} from 'lucide-react'
import { addOfflineSetoran, TipeKendaraan } from '@/lib/offlineStorage'
import { playClickSound, playSuccessSound, triggerHaptic } from '@/lib/audio'

export interface SelectedAngkotData {
  id: string
  platNomor: string
  namaSopirTetap: string | null
  tipeKendaraan?: TipeKendaraan
  keteranganArmada?: string | null
  setoranHariIni?: {
    id: string
    nominal: number
    pengeluaran?: number
    keteranganPengeluaran?: string | null
    status: string
    catatan: string | null
  } | null
}

interface NumpadModalProps {
  isOpen: boolean
  angkot: SelectedAngkotData | null
  currentSelectedDate?: string // format YYYY-MM-DD
  onClose: () => void
  onSuccess: (result: {
    nominal: number
    pengeluaran?: number
    platNomor: string
    namaSopir: string
    status: string
  }) => void
}

export function NumpadModal({
  isOpen,
  angkot,
  currentSelectedDate,
  onClose,
  onSuccess,
}: NumpadModalProps) {
  const [nominalStr, setNominalStr] = useState('0')
  const [pengeluaranStr, setPengeluaranStr] = useState('0')
  const [keteranganPengeluaran, setKeteranganPengeluaran] = useState('')
  const [showPengeluaranInput, setShowPengeluaranInput] = useState(false)
  const [keterangan, setKeterangan] = useState('')
  const [tanggalInput, setTanggalInput] = useState(currentSelectedDate || new Date().toISOString().split('T')[0])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (isOpen) {
      setTanggalInput(currentSelectedDate || new Date().toISOString().split('T')[0])
    }
    if (isOpen && angkot) {
      if (angkot.setoranHariIni) {
        setNominalStr(String(angkot.setoranHariIni.nominal || 0))
        setPengeluaranStr(String(angkot.setoranHariIni.pengeluaran || 0))
        setKeteranganPengeluaran(angkot.setoranHariIni.keteranganPengeluaran || '')
        setShowPengeluaranInput(Boolean(angkot.setoranHariIni.pengeluaran))
        setKeterangan(angkot.setoranHariIni.catatan || '')
      } else {
        setNominalStr('0')
        setPengeluaranStr('0')
        setKeteranganPengeluaran('')
        setShowPengeluaranInput(false)
        setKeterangan('')
      }
      setErrorMessage(null)
    }
  }, [isOpen, angkot])

  if (!isOpen || !angkot) return null

  const nominal = parseInt(nominalStr, 10) || 0
  const pengeluaran = parseInt(pengeluaranStr, 10) || 0
  const setoranBersih = Math.max(0, nominal - pengeluaran)

  const handleDigit = (digit: string) => {
    playClickSound()
    triggerHaptic(30)
    setNominalStr((prev) => {
      if (prev === '0') return digit
      if (prev.length >= 10) return prev
      return prev + digit
    })
  }

  const handleQuickAdd = (amount: number) => {
    playClickSound()
    triggerHaptic(40)
    setNominalStr((prev) => {
      const cur = parseInt(prev, 10) || 0
      return String(cur + amount)
    })
  }

  const handleDelete = () => {
    playClickSound()
    triggerHaptic(30)
    setNominalStr((prev) => {
      if (prev.length <= 1) return '0'
      return prev.slice(0, -1)
    })
  }

  const handleReset = () => {
    playClickSound()
    triggerHaptic(40)
    setNominalStr('0')
  }

  const handleSubmit = () => {
    if (nominal <= 0) {
      setErrorMessage('Masukkan jumlah uang setoran / sewa armada!')
      triggerHaptic(80)
      return
    }

    playClickSound()
    triggerHaptic(50)

    startTransition(() => {
      try {
        const targetDate = tanggalInput ? new Date(tanggalInput + 'T12:00:00').toISOString() : (currentSelectedDate ? new Date(currentSelectedDate).toISOString() : new Date().toISOString())

        addOfflineSetoran({
          angkotId: angkot.id,
          nominal,
          pengeluaran: showPengeluaranInput ? pengeluaran : 0,
          keteranganPengeluaran: showPengeluaranInput ? keteranganPengeluaran : undefined,
          catatan: keterangan.trim() || undefined,
          tanggal: targetDate,
        })

        playSuccessSound()
        triggerHaptic(60)

        onSuccess({
          nominal,
          pengeluaran: showPengeluaranInput ? pengeluaran : 0,
          platNomor: angkot.platNomor,
          namaSopir: angkot.namaSopirTetap || 'Sopir',
          status: 'TERCATAT',
        })
        onClose()
      } catch (err) {
        setErrorMessage('Gagal mencatat transaksi')
      }
    })
  }

  const isBus = angkot.tipeKendaraan === 'BUS'

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 backdrop-blur-sm selection:bg-amber-400">
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200/90 p-5 shadow-2xl flex flex-col max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <span className="text-xl">{isBus ? '🚌' : '🚐'}</span>
            </div>
            <div>
              <span className="text-xl font-black text-slate-950 font-mono tracking-wider block leading-tight">
                {angkot.platNomor}
              </span>
              <span className="text-xs font-bold text-slate-600 block">
                {isBus ? 'Driver' : 'Sopir'}: <strong className="text-slate-900">{angkot.namaSopirTetap || 'Belum Diisi'}</strong>
                {angkot.keteranganArmada ? ` • ${angkot.keteranganArmada}` : ''}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 cursor-pointer"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* PILIH TANGGAL SETORAN (ANTISIPASI JIKA LUPA INPUT TANGGAL KEMARIN / SUSULAN) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex items-center justify-between mb-3 text-xs shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Tanggal Setoran:</span>
          </div>
          <input
            type="date"
            value={tanggalInput}
            onChange={(e) => setTanggalInput(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-lg text-xs cursor-pointer focus:outline-none focus:border-blue-500 shadow-2xs"
            title="Ubah tanggal jika ini setoran susulan / kemarin"
          />
        </div>

        {/* Display Angka Besar */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 mb-3 border-2 border-slate-950 shadow-inner">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              {isBus ? 'UANG SEWA / CARTER (RP)' : 'UANG SETORAN MASUK (RP)'}
            </span>
            <span className="text-xs font-black text-slate-400">INPUT MANUAL</span>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-white flex items-baseline">
            <span className="text-amber-400 text-xl mr-1.5">Rp</span>
            <span>{nominal.toLocaleString('id-ID')}</span>
          </div>

          {/* Quick presets sesuai jenis armada */}
          <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-slate-800">
            {isBus ? (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(500000)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
                >
                  +500rb
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(1000000)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
                >
                  +1 Juta
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(2000000)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
                >
                  +2 Juta
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(3500000)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
                >
                  +3.5 Jt
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(50000)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
                >
                  +50rb
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(100000)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
                >
                  +100rb
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(150000)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
                >
                  +150rb
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(200000)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
                >
                  +200rb
                </button>
              </>
            )}
          </div>
        </div>

        {/* Numpad Angka */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-amber-400 text-xl font-black text-slate-900 border border-slate-300 shadow-sm flex items-center justify-center cursor-pointer transition-colors"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleReset}
            className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-600 border border-slate-300 flex items-center justify-center cursor-pointer"
          >
            RESET
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-amber-400 text-xl font-black text-slate-900 border border-slate-300 shadow-sm flex items-center justify-center cursor-pointer transition-colors"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700 border border-slate-300 flex items-center justify-center cursor-pointer"
          >
            ⌫ HAPUS
          </button>
        </div>

        {/* Opsi Catatan / Pengeluaran */}
        <div className="space-y-2 mb-3">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              Keterangan Setoran / Sewa:
            </label>
            <input
              type="text"
              placeholder={isBus ? "Contoh: DP Sewa Ziarah / Pelunasan Carter" : "Contoh: Setoran Siang / Full Day"}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full h-11 px-3 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          {/* Toggle Potong Biaya Operasional Armada */}
          <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/80">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPengeluaranInput}
                onChange={(e) => setShowPengeluaranInput(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800">
                {isBus ? "Ada potongan komisi driver / operasional (Solar, Tol, dll)?" : "Ada potongan biaya operasional armada (BBM / Tol / Servis)?"}
              </span>
            </label>

            {showPengeluaranInput && (
              <div className="mt-2.5 pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Potongan (Rp):</span>
                  <input
                    type="number"
                    value={pengeluaranStr}
                    onChange={(e) => setPengeluaranStr(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full h-9 px-2 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Untuk Keperluan:</span>
                  <input
                    type="text"
                    value={keteranganPengeluaran}
                    onChange={(e) => setKeteranganPengeluaran(e.target.value)}
                    placeholder={isBus ? "Contoh: Komisi driver all in / Solar" : "Contoh: Solar / Tol / Oli"}
                    className="w-full h-9 px-2 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-100 border border-red-500 text-red-900 text-xs font-bold p-2.5 rounded-xl flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tombol Simpan */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full min-h-[56px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-base font-black rounded-2xl flex items-center justify-center gap-2 border-2 border-emerald-900 shadow-xl cursor-pointer"
        >
          {isPending ? (
            <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
          ) : (
            <span>SIMPAN TRANSAKSI MASUK</span>
          )}
        </button>
      </div>
    </div>
  )
}
