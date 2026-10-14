'use client'

import { formatRupiahAuto } from '@/lib/formatRupiah'
﻿import { Bus, Check, ArrowRight, RotateCw, FileText, TrendingDown } from 'lucide-react'
import { playClickSound, triggerHaptic } from '@/lib/audio'
import { SelectedAngkotData } from './NumpadModal'

interface MobilCardProps {
  angkot: SelectedAngkotData
  onSelectSetor: (angkot: SelectedAngkotData) => void
  onEditAngkot?: (angkot: SelectedAngkotData) => void
}

export function MobilCard({ angkot, onSelectSetor, onEditAngkot }: MobilCardProps) {
  const setoran = angkot.setoranHariIni
  const isSetor = !!setoran
  const pengeluaran = setoran?.pengeluaran || 0
  const setorBersih = setoran ? Math.max(0, setoran.nominal - pengeluaran) : 0
  const isBus = angkot.tipeKendaraan === 'BUS'

  const handleClickSetor = () => {
    playClickSound()
    triggerHaptic(40)
    onSelectSetor(angkot)
  }

  const handleClickEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    playClickSound()
    triggerHaptic(40)
    if (onEditAngkot) {
      onEditAngkot(angkot)
    }
  }

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all ${
        isSetor
          ? 'bg-emerald-50/30 border-emerald-200/80'
          : 'bg-white border-slate-200/70 hover:border-slate-300/80'
      }`}
    >
      {/* Baris Atas: Icon Tipe, Plat Nomor, Driver */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-start gap-2.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 text-xl font-bold shadow-sm ${
              isBus ? 'bg-blue-600 text-white' : 'bg-amber-400 text-slate-950'
            }`}
          >
            {isBus ? '🚌' : '🚐'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-wider text-slate-950 font-mono">
                {angkot.platNomor}
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  isBus ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {isBus ? 'BUS / TRAVEL' : 'ANGKOT'}
              </span>
            </div>
            <div className="flex flex-col mt-0.5">
              <span className="text-xs sm:text-sm font-bold text-slate-600">
                {isBus ? 'Driver' : 'Sopir'}:{' '}
                <strong className="text-slate-900">{angkot.namaSopirTetap || 'Belum Diisi'}</strong>
              </span>
              {angkot.keteranganArmada && (
                <span className="text-[11px] text-slate-500 font-semibold italic">
                  {angkot.keteranganArmada}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col items-end gap-1.5">
          {isSetor ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black text-[11px] shadow-sm">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              SUDAH SETOR
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-red-50 border border-red-300 text-red-700 font-black text-[11px]">
              BELUM SETOR
            </span>
          )}

          <button
            type="button"
            onClick={handleClickEdit}
            className="text-[11px] font-bold text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-2 py-0.5 flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            title="Ubah data armada atau ganti nama driver"
          >
            <span>Ubah</span>
          </button>
        </div>
      </div>

      {/* Bagian Nominal & Interaksi */}
      <div className="mt-3.5">
        {isSetor ? (
          <div className="space-y-2.5">
            {pengeluaran > 0 ? (
              <div className="space-y-1.5 bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>{isBus ? 'Uang Sewa / Kotor:' : 'Setoran Kotor:'}</span>
                  <span className="text-slate-900 font-black">
                    {formatRupiahAuto(setoran.nominal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-red-600">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Biaya ({setoran.keteranganPengeluaran || 'Operasional'}):
                  </span>
                  <span className="font-black">- {formatRupiahAuto(pengeluaran)}</span>
                </div>
                <div className="border-t border-slate-100 pt-1 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                    SETORAN BERSIH:
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700">
                    {formatRupiahAuto(setorBersih)}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  {isBus ? 'UANG SEWA DITERIMA' : 'UANG DISETOR HARI INI'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-950">
                  {formatRupiahAuto(setoran.nominal)}
                </span>
              </div>
            )}

            {setoran.catatan && (
              <div className="text-xs font-bold text-slate-800 bg-amber-50 border border-amber-200 rounded-xl p-2 flex items-start gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>{setoran.catatan}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleClickSetor}
              className="w-full min-h-[48px] bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 text-sm font-black rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-transform"
            >
              <RotateCw className="w-4 h-4 stroke-[2.5]" />
              UBAH / CATAT ULANG TRANSAKSI
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={handleClickSetor}
              className="w-full min-h-[58px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-base sm:text-lg font-black rounded-2xl flex items-center justify-center gap-2 border-2 border-emerald-950 shadow-md cursor-pointer transition-transform"
            >
              <span>{isBus ? 'CATAT UANG SEWA' : 'MASUKKAN SETORAN'}</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
