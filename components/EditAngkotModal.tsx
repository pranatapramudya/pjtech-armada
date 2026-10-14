'use client'

import { useState, useTransition, useEffect } from 'react'
import { X, Check, Trash2, AlertCircle, Bus, Edit3 } from 'lucide-react'
import { updateOfflineAngkot, deleteOfflineAngkot, TipeKendaraan } from '@/lib/offlineStorage'
import { playClickSound, playSuccessSound, triggerHaptic } from '@/lib/audio'

interface EditAngkotModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  angkot: {
    id: string
    platNomor: string
    namaSopirTetap: string | null
    tipeKendaraan?: TipeKendaraan
    keteranganArmada?: string | null
  } | null
}

export function EditAngkotModal({ isOpen, onClose, onSuccess, angkot }: EditAngkotModalProps) {
  const [tipeKendaraan, setTipeKendaraan] = useState<TipeKendaraan>('ANGKOT')
  const [platNomor, setPlatNomor] = useState('')
  const [namaSopir, setNamaSopir] = useState('')
  const [keteranganArmada, setKeteranganArmada] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmHapus, setConfirmHapus] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (angkot) {
      setPlatNomor(angkot.platNomor || '')
      setNamaSopir(angkot.namaSopirTetap || '')
      setTipeKendaraan(angkot.tipeKendaraan || 'ANGKOT')
      setKeteranganArmada(angkot.keteranganArmada || '')
      setConfirmHapus(false)
      setErrorMessage(null)
    }
  }, [angkot, isOpen])

  if (!isOpen || !angkot) return null

  const handleSimpan = (e: React.FormEvent) => {
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
        updateOfflineAngkot(angkot.id, {
          platNomor: platNomor.trim(),
          namaSopirTetap: namaSopir.trim() || undefined,
          tipeKendaraan,
          keteranganArmada: keteranganArmada.trim() || undefined,
        })
        playSuccessSound()
        triggerHaptic(60)
        onSuccess()
        onClose()
      } catch (err) {
        setErrorMessage('Gagal memperbarui data armada')
      }
    })
  }

  const handleHapus = () => {
    playClickSound()
    triggerHaptic(60)

    startTransition(() => {
      try {
        deleteOfflineAngkot(angkot.id)
        playSuccessSound()
        triggerHaptic(80)
        onSuccess()
        onClose()
      } catch (err) {
        setErrorMessage('Gagal menghapus armada')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl border-4 border-slate-900 p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Edit3 className="w-7 h-7 text-amber-600 stroke-[2.5]" />
            <h2 className="text-xl font-black text-slate-900">UBAH DATA ARMADA</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 cursor-pointer"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tipe Kendaraan */}
        <div className="mb-4">
          <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase">
            TIPE KENDARAAN:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                playClickSound()
                setTipeKendaraan('ANGKOT')
              }}
              className={`p-3 rounded-2xl border-2 flex items-center gap-2 transition-all cursor-pointer ${
                tipeKendaraan === 'ANGKOT'
                  ? 'border-amber-500 bg-amber-50 text-slate-950 font-black'
                  : 'border-slate-200 bg-slate-50 text-slate-600 font-bold'
              }`}
            >
              <span className="text-xl">🚐</span>
              <span className="text-sm font-black">ANGKOT</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound()
                setTipeKendaraan('BUS')
              }}
              className={`p-3 rounded-2xl border-2 flex items-center gap-2 transition-all cursor-pointer ${
                tipeKendaraan === 'BUS'
                  ? 'border-blue-600 bg-blue-50 text-slate-950 font-black'
                  : 'border-slate-200 bg-slate-50 text-slate-600 font-bold'
              }`}
            >
              <span className="text-xl">🚌</span>
              <span className="text-sm font-black">BUS / TRAVEL</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSimpan} className="space-y-3.5">
          <div>
            <label className="block text-sm font-black text-slate-800 mb-1">
              Plat Nomor:
            </label>
            <input
              type="text"
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
              value={namaSopir}
              onChange={(e) => setNamaSopir(e.target.value)}
              className="w-full h-13 px-4 text-base font-bold text-slate-900 bg-slate-50 border-2 border-slate-800 rounded-2xl focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-800 mb-1">
              Keterangan (Trayek / Kapasitas Seat):
            </label>
            <input
              type="text"
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
            className="w-full min-h-[58px] bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-base font-black rounded-2xl flex items-center justify-center gap-2 border-3 border-emerald-950 shadow-xl cursor-pointer mt-4"
          >
            {isPending ? (
              <div className="animate-spin rounded-full h-7 w-7 border-4 border-white border-t-transparent" />
            ) : (
              <>
                <Check className="w-6 h-6 stroke-[3]" />
                SIMPAN PERUBAHAN
              </>
            )}
          </button>
        </form>

        <div className="border-t-2 border-dashed border-slate-300 mt-5 pt-4">
          {!confirmHapus ? (
            <button
              type="button"
              onClick={() => {
                playClickSound()
                setConfirmHapus(true)
              }}
              className="w-full min-h-[48px] bg-red-50 hover:bg-red-100 text-red-700 text-sm font-bold rounded-2xl border-2 border-red-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4 stroke-[2]" />
              Hapus Armada Ini
            </button>
          ) : (
            <div className="bg-red-50 border-2 border-red-600 rounded-2xl p-3.5 text-center space-y-2.5">
              <p className="text-sm font-black text-red-900">
                Yakin hapus armada {angkot.platNomor}?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmHapus(false)}
                  className="min-h-[44px] bg-white border-2 border-slate-400 font-black text-slate-800 rounded-xl text-xs"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  onClick={handleHapus}
                  disabled={isPending}
                  className="min-h-[44px] bg-red-700 text-white font-black rounded-xl border-2 border-red-950 text-xs"
                >
                  YA, HAPUS
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
