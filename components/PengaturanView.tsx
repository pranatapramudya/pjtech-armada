'use client'

import { useState, useTransition } from 'react'
import { Settings, Check, AlertCircle, User, Phone, Mail, CheckCircle2, LogOut, ShieldCheck, Smartphone, Download, Apple, Share2, PlusSquare, X } from 'lucide-react'
import { saveOfflineJuragan } from '@/lib/offlineStorage'
import { getUserAccount, updateUserAccountProfile } from '@/lib/licenseStorage'
import { playClickSound, playSuccessSound, triggerHaptic } from '@/lib/audio'

interface PengaturanViewProps {
  currentNamaJuragan: string
  currentNoHp?: string
  onSuccess: (newNama: string) => void
  onLogout?: () => void
}

export function PengaturanView({
  currentNamaJuragan,
  currentNoHp = '',
  onSuccess,
  onLogout,
}: PengaturanViewProps) {
  const [namaJuragan, setNamaJuragan] = useState(currentNamaJuragan)
  const [noHp, setNoHp] = useState(currentNoHp)
  const [email, setEmail] = useState(() => getUserAccount()?.email || '')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [showPanduanPWA, setShowPanduanPWA] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!namaJuragan.trim()) {
      setErrorMessage('Nama Juragan / Nama Usaha wajib diisi!')
      triggerHaptic(60)
      return
    }

    playClickSound()
    triggerHaptic(30)

    startTransition(() => {
      try {
        saveOfflineJuragan(namaJuragan, noHp)
        playSuccessSound()
        triggerHaptic(50)
        setIsSuccess(true)
        onSuccess(namaJuragan)
        setTimeout(() => {
          setIsSuccess(false)
        }, 2000)
      } catch (err) {
        setErrorMessage('Gagal menyimpan pengaturan')
      }
    })
  }

  const handleExecuteLogout = () => {
    playClickSound()
    triggerHaptic(50)
    setConfirmLogout(false)
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* KARTU PROFIL USAHA */}
      <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Settings className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 block uppercase">
              Pengaturan Akun
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Profil Usaha & Kontak
            </h2>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-1.5 bg-emerald-50/80 rounded-xl border border-emerald-200/70 mt-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">
              Pengaturan Tersimpan
            </h3>
            <p className="text-xs text-slate-500">
              Profil usaha dan nama juragan berhasil diperbarui.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Nama Juragan / Nama Usaha
              </label>
              <input
                type="text"
                placeholder="Contoh: PO Nusantara Jaya"
                value={namaJuragan}
                onChange={(e) => setNamaJuragan(e.target.value)}
                className="w-full h-11 px-3.5 text-sm font-semibold text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 placeholder:font-normal"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Nama ini tampil di header atas dan rekapan laporan WhatsApp.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Nomor HP / WhatsApp
              </label>
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                className="w-full h-11 px-3.5 text-sm font-semibold text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                Email Aktif (Bukti Bayar / Invoice Mayar)
              </label>
              <input
                type="email"
                placeholder="Contoh: juragan@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 text-sm font-semibold text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Invoice dan resi pembayaran resmi dari Mayar akan dikirim ke email ini.
              </span>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 font-medium p-3 rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              {isPending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* SEKSI AKUN & KEAMANAN */}
      <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
        <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2.5">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">
            Akun & Keamanan
          </span>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 px-0.5">
          <span>Nomor Terdaftar</span>
          <span className="font-mono text-slate-800 font-semibold">{currentNoHp || '081xxxxxxx'}</span>
        </div>

        <button
          id="btn-trigger-logout"
          type="button"
          onClick={() => {
            playClickSound()
            triggerHaptic(25)
            setConfirmLogout(true)
          }}
          className="w-full h-11 bg-rose-50/80 hover:bg-rose-100 active:bg-rose-200/70 border border-rose-200/80 text-rose-600 hover:text-rose-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 stroke-[2]" />
          <span>Keluar dari Akun</span>
        </button>
      </div>

      {/* POP-UP MODERN DI DEPAN LAYAR UNTUK KONFIRMASI LOGOUT */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-xl border border-slate-100 space-y-3.5 text-center animate-in zoom-in-95 duration-150 relative">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Logout
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin keluar dari akun armada ini? Anda dapat masuk kembali kapan saja dengan PIN.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                id="btn-confirm-logout-yes"
                type="button"
                onClick={handleExecuteLogout}
                className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2]" />
                <span>Ya, Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
