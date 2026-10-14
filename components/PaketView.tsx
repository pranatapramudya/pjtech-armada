'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Clock, ExternalLink, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react'
import { UserAccount, MAYAR_PAYMENT_LINKS, checkLisensiStatus, getMayarPaymentUrl, aktivasiLisensi, PaketLangganan } from '@/lib/licenseStorage'
import { playClickSound, playSuccessSound, triggerHaptic } from '@/lib/audio'

interface PaketViewProps {
  account: UserAccount | null
  onUpdateAccount?: (updated: UserAccount) => void
}

export function PaketView({ account, onUpdateAccount }: PaketViewProps) {
  const [lisensiInfo, setLisensiInfo] = useState(() => checkLisensiStatus(account))

  useEffect(() => {
    setLisensiInfo(checkLisensiStatus(account))
    const timer = setInterval(() => {
      setLisensiInfo(checkLisensiStatus(account))
    }, 1000)
    return () => clearInterval(timer)
  }, [account])

  const pad = (n: number) => String(n).padStart(2, '0')

  const [showAktifkanModal, setShowAktifkanModal] = useState(false)
  const [aktivasiSuksesPesan, setAktivasiSuksesPesan] = useState<string | null>(null)

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
    if (updated && onUpdateAccount) {
      onUpdateAccount(updated)
    }
    setShowAktifkanModal(false)
    setAktivasiSuksesPesan(
      paket === 'TAHUNAN'
        ? '🎉 Selamat! Paket 1 Tahun Berhasil Diaktifkan! Masa aktif bertambah 366 hari.'
        : '🎉 Selamat! Paket 6 Bulan Berhasil Diaktifkan! Masa aktif bertambah 185 hari.'
    )
    setTimeout(() => setAktivasiSuksesPesan(null), 6000)
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
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* HEADER CARD */}
      <div className="bg-white border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black shadow-sm">
            <CreditCard className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 block">
              Status Langganan
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Paket & Lisensi
            </h2>
          </div>
        </div>

        {/* STATUS COUNTDOWN TIMER REAL-TIME */}
        <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-3.5 mt-3.5">
          <div className="flex items-center justify-between mb-3 border-b border-amber-200 pb-2">
            <span className="text-xs text-amber-950 font-black uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>SISA WAKTU AKTIF:</span>
            </span>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
              {account?.paket === 'TRIAL'
                ? 'FREE TRIAL 14 HARI'
                : account?.paket === 'SEMESTER'
                ? 'PAKET 6 BULAN'
                : 'PAKET 1 TAHUN'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-sm">
              <span className="block text-xl font-black text-slate-900 font-mono">
                {lisensiInfo.countdown.days}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Hari</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-sm">
              <span className="block text-xl font-black text-slate-900 font-mono">
                {pad(lisensiInfo.countdown.hours)}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Jam</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-sm">
              <span className="block text-xl font-black text-slate-900 font-mono">
                {pad(lisensiInfo.countdown.minutes)}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Menit</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-sm">
              <span className="block text-xl font-black text-amber-600 font-mono">
                {pad(lisensiInfo.countdown.seconds)}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Detik</span>
            </div>
          </div>
        </div>
      </div>

      {/* PILIHAN PERPANJANGAN PAKET */}
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase text-slate-700 tracking-wide px-1">
          Pilihan Paket Perpanjangan Otomatis:
        </h3>

        {/* Paket 6 Bulan */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-400 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-black uppercase text-blue-700 tracking-wider">REGULER</span>
              <h4 className="text-lg font-black text-slate-900">Paket 6 Bulan</h4>
              <p className="text-xs font-bold text-slate-500">Masa aktif bertambah 185 hari</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-slate-900">Rp 250.000</span>
              <span className="text-[11px] text-slate-500 block">/ 6 bulan</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleBukaMayar('SEMESTER')}
            className="w-full mt-2 min-h-[46px] bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
          >
            <span>BAYAR VIA MAYAR (QRIS / TF)</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Paket 1 Tahun */}
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Paling Hemat</span>
          </div>

          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider">HEMAT Rp 50.000</span>
              <h4 className="text-lg font-black text-slate-950">Paket 1 Tahun</h4>
              <p className="text-xs font-bold text-slate-600">Masa aktif bertambah 366 hari penuh</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-slate-950">Rp 450.000</span>
              <span className="text-[11px] text-slate-600 block">/ 1 tahun</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleBukaMayar('TAHUNAN')}
            className="w-full mt-2 min-h-[46px] bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 text-sm font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow border border-amber-500 transition-all"
          >
            <span>BAYAR VIA MAYAR (QRIS / TF)</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

            {/* PESAN NOTIFIKASI SUKSES AKTIVASI */}
      {aktivasiSuksesPesan && (
        <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-950 p-4 rounded-2xl shadow-sm text-center animate-in zoom-in-95 duration-200">
          <p className="font-black text-sm">{aktivasiSuksesPesan}</p>
        </div>
      )}

      {/* TOMBOL SAYA SUDAH BAYAR DI MAYAR */}
      <button
        type="button"
        onClick={() => {
          playClickSound()
          triggerHaptic(30)
          setShowAktifkanModal(true)
        }}
        className="w-full min-h-[50px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-black rounded-2xl flex items-center justify-center gap-2 shadow cursor-pointer transition-all border border-emerald-700"
      >
        <CheckCircle2 className="w-5 h-5 text-white" />
        <span>⚡ SAYA SUDAH BAYAR DI MAYAR (AKTIFKAN SEKARANG)</span>
      </button>

      {/* MODAL KONFIRMASI AKTIVASI MANDIRI */}
      {showAktifkanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2 font-black">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">Konfirmasi Pembayaran</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Pilih paket yang telah Anda bayar di Mayar untuk mengaktifkan masa aktif sekarang:
              </p>
            </div>

            <div className="space-y-2.5 mb-4">
              <button
                type="button"
                onClick={() => handleProsesAktivasiLangsung('SEMESTER')}
                className="w-full p-3.5 bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-black uppercase text-blue-800 block">Paket 6 Bulan</span>
                    <span className="text-xs font-bold text-slate-700">+185 Hari Masa Aktif</span>
                  </div>
                  <span className="text-sm font-black text-blue-900">Rp 250.000</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleProsesAktivasiLangsung('TAHUNAN')}
                className="w-full p-3.5 bg-amber-50 hover:bg-amber-100 border-2 border-amber-400 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-black uppercase text-amber-800 block">Paket 1 Tahun (Hemat)</span>
                    <span className="text-xs font-bold text-slate-700">+366 Hari Masa Aktif</span>
                  </div>
                  <span className="text-sm font-black text-amber-900">Rp 450.000</span>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound()
                setShowAktifkanModal(false)
              }}
              className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* BANTUAN WHATSAPP */}
      <button
        type="button"
        onClick={handleBukaWhatsApp}
        className="w-full min-h-[50px] bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-sm font-black rounded-2xl flex items-center justify-center gap-2 shadow cursor-pointer transition-all border border-emerald-900"
      >
        <MessageCircle className="w-4 h-4" />
        <span>KONFIRMASI / BANTUAN ADMIN WA</span>
      </button>
    </div>
  )
}
