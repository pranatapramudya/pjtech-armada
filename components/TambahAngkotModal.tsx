'use client'

import { useState, useTransition } from 'react'
import { X, Plus, AlertCircle, Bus, Car } from 'lucide-react'
import { addOfflineAngkot, TipeKendaraan } from '@/lib/offlineStorage'
import { playClickSound, playSuccessSound, triggerHaptic } from '@/lib/audio'

interface TambahAngkotModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TambahAngkotModal({ isOpen, onClose }: TambahAngkotModalProps) {
  const [tipeKendaraan, setTipeKendaraan] = useState<TipeKendaraan>('ANGKOT')
  const [platNomor, setPlatNomor] = useState('')
  const [namaSopir, setNamaSopir] = useState('')
  const [keteranganArmada, setKeteranganArmada] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!platNomor.trim()) {
      setErrorMessage('Plat nomor armada wajib diisi!')
      triggerHaptic(80)
      return
    }

    playClickSound()
    triggerHaptic(50)

    startTransition(() => {
      try {
        addOfflineAngkot(platNomor, namaSopir, tipeKendaraan, keteranganArmada)
        playSuccessSound()
        triggerHaptic(60)
        onClose()
        setPlatNomor('')
        setNamaSopir('')
        setKeteranganArmada('')
      } catch (err) {
        setErrorMessage('Gagal menambah armada')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl border-4 border-slate-900 p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Bus className="w-7 h-7 text-blue-700 stroke-[2.5]" />
            <h2 className="text-xl font-black text-slate-900">TAMBAH ARMADA BARU</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 cursor-pointer"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Pilihan Jenis Armada (Angkot vs Bus Pariwisata) */}
        <div className="mb-4">
          <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase">
            PILIH JENIS ARMADA:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                playClickSound()
                setTipeKendaraan('ANGKOT')
              }}
              className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                tipeKendaraan === 'ANGKOT'
                  ? 'border-amber-500 bg-amber-50 text-slate-950 font-black shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 font-bold hover:bg-slate-100'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                🚐
              </div>
              <div className="text-left">
                <span className="text-sm font-black block leading-tight">ANGKOT</span>
                <span className="text-[10px] text-slate-500 block">Setoran Harian</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound()
                setTipeKendaraan('BUS')
              }}
              className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                tipeKendaraan === 'BUS'
                  ? 'border-blue-600 bg-blue-50 text-slate-950 font-black shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 font-bold hover:bg-slate-100'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                🚌
              </div>
              <div className="text-left">
                <span className="text-sm font-black block leading-tight">BUS / TRAVEL</span>
                <span className="text-[10px] text-slate-500 block">Pariwisata / Carter</span>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-sm font-black text-slate-800 mb-1">
              Plat Nomor Armada:
            </label>
            <input
              type="text"
              placeholder={tipeKendaraan === 'ANGKOT' ? 'Contoh: D 1234 AB' : 'Contoh: D 7890 BUS'}
              value={platNomor}
              onChange={(e) => setPlatNomor(e.target.value.toUpperCase())}
              className="w-full h-14 px-4 text-xl font-black text-slate-900 uppercase bg-slate-50 border-2 border-slate-800 rounded-2xl focus:bg-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-800 mb-1">
              Nama Sopir / Driver:
            </label>
            <input
              type="text"
              placeholder="Contoh: Mang Ujang / Pak Joko"
              value={namaSopir}
              onChange={(e) => setNamaSopir(e.target.value)}
              className="w-full h-13 px-4 text-base font-bold text-slate-900 bg-slate-50 border-2 border-slate-800 rounded-2xl focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-800 mb-1">
              Keterangan Armada (Opsional):
            </label>
            <input
              type="text"
              placeholder={
                tipeKendaraan === 'ANGKOT'
                  ? 'Contoh: Trayek Cicaheum - Kalapa'
                  : 'Contoh: Bus Pariwisata 35 Seat / Elf Long'
              }
              value={keteranganArmada}
              onChange={(e) => setKeteranganArmada(e.target.value)}
              className="w-full h-13 px-4 text-sm font-bold text-slate-900 bg-slate-50 border-2 border-slate-700 rounded-2xl focus:bg-white focus:outline-none"
            />
          </div>

          {errorMessage && (
            <div className="bg-red-100 border-2 border-red-700 text-red-900 font-bold p-3 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full min-h-[58px] bg-blue-700 hover:bg-blue-800 active:scale-95 text-white text-base font-black rounded-2xl flex items-center justify-center gap-2 border-3 border-blue-950 shadow-xl cursor-pointer mt-4"
          >
            {isPending ? (
              <div className="animate-spin rounded-full h-7 w-7 border-4 border-white border-t-transparent" />
            ) : (
              <>
                <Plus className="w-6 h-6 stroke-[3]" />
                SIMPAN ARMADA KE SISTEM
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
