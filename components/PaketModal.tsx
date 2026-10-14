'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink, CreditCard, MessageCircle, Clock } from 'lucide-react'
import { UserAccount, MAYAR_PAYMENT_LINKS, checkLisensiStatus, getMayarPaymentUrl, aktivasiLisensi, PaketLangganan } from '@/lib/licenseStorage'
import { playClickSound, playSuccessSound, triggerHaptic } from '@/lib/audio'

interface PaketModalProps {
  isOpen: boolean
  onClose: () => void
  account: UserAccount | null
  onUpdateAccount: (updated: UserAccount) => void
}

export function PaketModal({ isOpen, onClose, account, onUpdateAccount }: PaketModalProps) {
  const [lisensiInfo, setLisensiInfo] = useState(() => checkLisensiStatus(account))

  useEffect(() => {
    setLisensiInfo(checkLisensiStatus(account))
    const timer = setInterval(() => {
      setLisensiInfo(checkLisensiStatus(account))
    }, 1000)
    return () => clearInterval(timer)
  }, [account, isOpen])

  if (!isOpen) return null

  const pad = (n: number) => String(n).padStart(2, '0')

  const [showConfirmAktivasi, setShowConfirmAktivasi] = useState(false)

  const handleBukaMayar = (paket: 'SEMESTER' | 'TAHUNAN') => {
    playClickSound()
    triggerHaptic(30)
    const url = getMayarPaymentUrl(paket, account)
    window.open(url, '_blank')
  }

  const handleProsesAktivasiLangsung = (paket: PaketLangganan) => {
    playSuccessSound()
    triggerHaptic(60)
    const hari = paket === 'TAHUNAN' ? 366 : 185
    const updated = aktivasiLisensi(hari, paket)
    if (updated) {
      onUpdateAccount(updated)
    }
    setShowConfirmAktivasi(false)
    onClose()
  }

  const handleBukaWhatsApp = () => {
    playClickSound()
    triggerHaptic(30)
    const text = encodeURIComponent(
      `Halo Admin PJTech, saya ingin konfirmasi perpanjangan langganan PJTech Armada untuk No HP: ${account?.noHp || ''} (${account?.namaJuragan || ''}).`
    )
    window.open(`https://wa.me/6281234567890?text=${text}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm selection:bg-amber-400">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-5 shadow-2xl text-slate-900 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">PAKET LANGGANAN</h2>
              <p className="text-[11px] text-slate-500 font-bold">PJTech Armada (Angkot & Bus)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Lisensi & Kotak Hitung Mundur Otomatis */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3 border-b border-amber-200/60 pb-2">
            <span className="text-xs text-amber-900 font-black uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>SISA WAKTU AKTIF:</span>
            </span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
              {account?.paket === 'TRIAL' ? 'FREE TRIAL' : account?.paket === 'SEMESTER' ? 'PAKET 6 BULAN' : 'PAKET 1 TAHUN'}
            </span>
          </div>

          {/* Kotak Jam / Menit / Detik Hitung Mundur */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white rounded-xl p-2 border border-amber-200 shadow-2xs">
              <span className="text-xl font-black text-slate-950 font-mono block">
                {lisensiInfo.countdown.days}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Hari</span>
            </div>
            <div className="bg-white rounded-xl p-2 border border-amber-200 shadow-2xs">
              <span className="text-xl font-black text-slate-950 font-mono block">
                {pad(lisensiInfo.countdown.hours)}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Jam</span>
            </div>
            <div className="bg-white rounded-xl p-2 border border-amber-200 shadow-2xs">
              <span className="text-xl font-black text-slate-950 font-mono block">
                {pad(lisensiInfo.countdown.minutes)}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Menit</span>
            </div>
            <div className="bg-white rounded-xl p-2 border border-amber-200 shadow-2xs">
              <span className="text-xl font-black text-amber-600 font-mono block animate-pulse">
                {pad(lisensiInfo.countdown.seconds)}
              </span>
              <span className="text-[10px] font-bold text-amber-700 uppercase">Detik</span>
            </div>
          </div>
        </div>

        {/* Pilihan Paket Mayar.id */}
        <div className="space-y-3 mb-4">
          <span className="text-xs font-black text-slate-600 uppercase tracking-wider block">
            PILIHAN PERPANJANG PAKET
          </span>

          {/* Paket 6 Bulan */}
          <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl p-4 transition-all">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[11px] font-bold text-amber-700 block">HEMAT 50 RB</span>
                <h3 className="text-base font-black text-slate-900">PAKET 6 BULAN</h3>
                <span className="text-xs text-slate-500">Operasional & Kas Armada</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 line-through block">Rp 300.000</span>
                <span className="text-lg font-black text-slate-900">Rp 250.000</span>
                <span className="text-[10px] text-slate-500 block">~41rb / bulan</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleBukaMayar('SEMESTER')}
              className="w-full h-11 bg-white hover:bg-slate-50 border border-slate-300 active:bg-slate-100 text-slate-900 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors mt-2"
            >
              <span>BAYAR VIA MAYAR (QRIS / VA)</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>

          {/* Paket 1 Tahun (Best Value) */}
          <div className="bg-amber-50/60 border-2 border-amber-400 rounded-2xl p-4 relative shadow-sm">
            <div className="absolute -top-2.5 right-4 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
              PALING HEMAT (GRATIS 3 BULAN)
            </div>

            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[11px] font-bold text-amber-800 block">REKOMENDASI JURAGAN</span>
                <h3 className="text-base font-black text-slate-900">PAKET 1 TAHUN PENUH</h3>
                <span className="text-xs text-slate-600">Akses Penuh Angkot & Bus</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 line-through block">Rp 600.000</span>
                <span className="text-xl font-black text-amber-700">Rp 450.000</span>
                <span className="text-[10px] text-slate-500 block">~37rb / bulan</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleBukaMayar('TAHUNAN')}
              className="w-full h-11 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all mt-2"
            >
              <span>BAYAR 1 TAHUN SEKARANG</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
            </button>
          </div>
        </div>

        {/* Info Praktis Otomatis */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-3 text-center">
          <p className="text-xs font-bold text-slate-600">
            ⚡ Setelah pembayaran berhasil di Mayar, paket langganan Anda akan <strong className="text-emerald-700">langsung aktif otomatis</strong> tanpa perlu input kode.
          </p>
        </div>

                {/* Bantuan WhatsApp */}
        <button
          type="button"
          onClick={handleBukaWhatsApp}
          className="w-full h-10 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors mt-auto"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>Bantuan Admin PJTech via WhatsApp</span>
        </button>
      </div>
    </div>
  )
}
