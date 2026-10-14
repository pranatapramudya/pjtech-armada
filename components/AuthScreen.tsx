'use client'

import { useState } from 'react'
import {
  Bus,
  User,
  Phone,
  Mail,
  KeyRound,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  HelpCircle,
  MessageCircle,
  RotateCcw,
  Building2,
  X,
  Lock,
} from 'lucide-react'
import {
  registerUser,
  loginUser,
  resetPinUser,
  getAllAccounts,
  UserAccount,
  PaketLangganan,
  MAYAR_PAYMENT_LINKS, getMayarPaymentUrl,
} from '@/lib/licenseStorage'
import { saveOfflineJuragan } from '@/lib/offlineStorage'
import { playClickSound, playSuccessSound, triggerHaptic } from '@/lib/audio'

interface AuthScreenProps {
  onAuthSuccess: (account: UserAccount) => void
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const allRegistered = Object.values(getAllAccounts())
  const primaryAccount: UserAccount | null = allRegistered[0] || null
  const hasRegistered = !!primaryAccount

  // Mode: jika sudah ada akun terdaftar di HP ini, kunci hanya ke mode login (1 user 1 device)
  const [isRegister, setIsRegister] = useState<boolean>(!hasRegistered)
  const [regStep, setRegStep] = useState<'form' | 'paket'>('form')

  // Form pendaftaran
  const [namaJuragan, setNamaJuragan] = useState('')
  const [noHp, setNoHp] = useState('')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [konfirmasiPin, setKonfirmasiPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [showKonfirmasiPin, setShowKonfirmasiPin] = useState(false)

  // Login PIN
  const [loginPin, setLoginPin] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Modal Lupa PIN
  const [isForgotPinOpen, setIsForgotPinOpen] = useState(false)
  const [forgotPhoneConfirm, setForgotPhoneConfirm] = useState('')
  const [forgotNewPin, setForgotNewPin] = useState('')
  const [forgotConfirmNewPin, setForgotConfirmNewPin] = useState('')
  const [showForgotPin, setShowForgotPin] = useState(false)
  const [forgotErrorMsg, setForgotErrorMsg] = useState<string | null>(null)
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null)

  // Numpad click for login PIN
  const handleNumpadPress = (num: string) => {
    playClickSound()
    triggerHaptic(25)
    setErrorMsg(null)
    if (loginPin.length < 6) {
      setLoginPin((prev) => prev + num)
    }
  }

  const handleNumpadDelete = () => {
    playClickSound()
    triggerHaptic(25)
    setErrorMsg(null)
    setLoginPin((prev) => prev.slice(0, -1))
  }

  const handleNumpadClear = () => {
    playClickSound()
    triggerHaptic(25)
    setLoginPin('')
    setErrorMsg(null)
  }

  // Submit pendaftaran langkah 1 -> lanjut pilih paket
  const handleNextToPaket = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!namaJuragan.trim()) {
      setErrorMsg('Nama Juragan / Nama Usaha wajib diisi!')
      triggerHaptic(50)
      return
    }
    if (!noHp.trim()) {
      setErrorMsg('Nomor HP / WhatsApp wajib diisi!')
      triggerHaptic(50)
      return
    }
    const cleanPhone = noHp.trim().replace(/[^0-9]/g, '');
    const existingAccounts = getAllAccounts();
    if (existingAccounts['tenant_' + cleanPhone]) {
      setErrorMsg('Nomor HP ini sudah terdaftar! Silakan login dengan PIN Anda.');
      triggerHaptic(50);
      return;
    }
    if (pin.length < 4) {
      setErrorMsg('Buat minimal 4 atau 6 digit PIN akun Anda!')
      triggerHaptic(50)
      return
    }
    if (konfirmasiPin && pin !== konfirmasiPin) {
      setErrorMsg('Konfirmasi PIN tidak cocok dengan PIN pertama!')
      triggerHaptic(50)
      return
    }

    playClickSound()
    triggerHaptic(30)
    setRegStep('paket')
  }

  // Selesai pilih paket -> simpan akun tunggal
  const handleSelectPaketAndFinish = (paket: PaketLangganan) => {
    playSuccessSound()
    triggerHaptic(50)

    const acc = registerUser(namaJuragan, noHp, pin, paket, email)
    saveOfflineJuragan(namaJuragan, noHp)

    if (paket === 'SEMESTER' || paket === 'TAHUNAN') {
      const url = getMayarPaymentUrl(paket, { namaJuragan, noHp, email })
      window.open(url, '_blank')
    }

    onAuthSuccess(acc)
  }

  // Submit login PIN
  const handleExecuteLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMsg(null)

    if (!primaryAccount) {
      setErrorMsg('Belum ada akun terdaftar di perangkat ini.')
      return
    }

    if (loginPin.length < 4) {
      setErrorMsg('Masukkan minimal 4 digit PIN Anda!')
      triggerHaptic(50)
      return
    }

    const res = loginUser(primaryAccount.noHp, loginPin)
    if (res.success && res.account) {
      playSuccessSound()
      triggerHaptic(40)
      onAuthSuccess(res.account)
    } else {
      setErrorMsg(res.pesan)
      triggerHaptic(70)
    }
  }

  // Submit Reset PIN Mandiri
  const handleExecuteResetPin = (e: React.FormEvent) => {
    e.preventDefault()
    setForgotErrorMsg(null)
    setForgotSuccessMsg(null)

    if (!primaryAccount) return

    const cleanInputPhone = forgotPhoneConfirm.trim().replace(/[^0-9]/g, '')
    const cleanRegisteredPhone = primaryAccount.noHp.trim().replace(/[^0-9]/g, '')

    if (cleanInputPhone !== cleanRegisteredPhone) {
      setForgotErrorMsg('Nomor WhatsApp tidak cocok dengan akun terdaftar!')
      triggerHaptic(60)
      return
    }

    if (forgotNewPin.length < 4) {
      setForgotErrorMsg('PIN baru minimal harus 4 atau 6 digit angka!')
      triggerHaptic(60)
      return
    }

    if (forgotNewPin !== forgotConfirmNewPin) {
      setForgotErrorMsg('Konfirmasi PIN baru tidak cocok!')
      triggerHaptic(60)
      return
    }

    const res = resetPinUser(primaryAccount.noHp, forgotNewPin)
    if (res.success && res.account) {
      playSuccessSound()
      triggerHaptic(50)
      setForgotSuccessMsg('PIN berhasil diperbarui! Membuka aplikasi...')
      setTimeout(() => {
        setIsForgotPinOpen(false)
        onAuthSuccess(res.account!)
      }, 1000)
    } else {
      setForgotErrorMsg(res.pesan)
      triggerHaptic(60)
    }
  }

  const handleOpenWhatsAppAdmin = () => {
    playClickSound()
    triggerHaptic(25)
    const phone = primaryAccount?.noHp || ''
    const nama = primaryAccount?.namaJuragan || ''
    const msg = encodeURIComponent(
      `Halo Admin PJTech, saya lupa PIN akun PO ${nama} (No HP: ${phone}). Mohon bantuannya untuk reset PIN akun saya.`
    )
    window.open(`https://wa.me/6281234567890?text=${msg}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center selection:bg-amber-400">
      <main className="w-full max-w-md bg-white min-h-screen flex flex-col justify-between p-6 shadow-xs border-x border-slate-200/70">
        <div>
          {/* HEADER BRANDING */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-500/25 flex items-center justify-center font-bold">
                <Bus className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                  PJTECH ARMADA
                </h1>
                <p className="text-[11px] text-amber-700 font-semibold uppercase tracking-wider">
                  Sistem Operasional Armada
                </p>
              </div>
            </div>

            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
              {hasRegistered ? '1 Akun Terdaftar' : 'Pendaftaran'}
            </span>
          </div>

          {/* JIKA SUDAH ADA AKUN: KUNCI KE 1 USER (LOGIN PIN), TIDAK BISA DAFTAR ULANG SEMBARANGAN */}
          {hasRegistered && (
            <div className="mt-5 space-y-4 animate-in fade-in duration-150">
              {/* KARTU AKUN TERDAFTAR */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Akun Juragan Armada
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {primaryAccount.namaJuragan}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {primaryAccount.noHp}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200/70 inline-block">
                    {primaryAccount.paket === 'TRIAL'
                      ? 'Free Trial'
                      : primaryAccount.paket === 'SEMESTER'
                      ? '6 Bulan'
                      : '1 Tahun'}
                  </span>
                </div>
              </div>

              {/* PETUNJUK INPUT PIN */}
              <div className="text-center pt-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-3">
                  Masukkan PIN Akun Anda (6 Digit)
                </label>

                {/* INDIKATOR 6 TITIK PIN */}
                <div className="flex justify-center items-center gap-3 mb-2">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all duration-150 ${
                        loginPin.length > idx
                          ? 'bg-slate-900 scale-110 shadow-xs'
                          : 'border-2 border-slate-300 bg-slate-50'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* PESAN ERROR */}
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 font-medium p-2.5 rounded-xl text-center text-xs animate-shake">
                  {errorMsg}
                </div>
              )}

              {/* NUMPAD SENTUH LEMBUT */}
              <div className="grid grid-cols-3 gap-2 pt-1 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpadPress(String(num))}
                    className="h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-slate-900 font-bold text-lg rounded-xl border border-slate-200/70 transition-all cursor-pointer shadow-xs flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleNumpadClear}
                  className="h-12 bg-slate-100/70 hover:bg-slate-200/70 active:scale-95 text-slate-500 font-semibold text-xs rounded-xl border border-slate-200/70 transition-all cursor-pointer flex items-center justify-center uppercase"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('0')}
                  className="h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-slate-900 font-bold text-lg rounded-xl border border-slate-200/70 transition-all cursor-pointer shadow-xs flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleNumpadDelete}
                  className="h-12 bg-slate-100/70 hover:bg-slate-200/70 active:scale-95 text-slate-700 font-bold text-sm rounded-xl border border-slate-200/70 transition-all cursor-pointer flex items-center justify-center"
                  title="Hapus digit"
                >
                  ⌫
                </button>
              </div>

              {/* TOMBOL MASUK KE APLIKASI */}
              <button
                type="button"
                onClick={() => handleExecuteLogin()}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Masuk ke Aplikasi</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* TOMBOL BANTUAN LUPA PIN & RESET AKUN */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    triggerHaptic(25)
                    setForgotErrorMsg(null)
                    setForgotSuccessMsg(null)
                    setForgotPhoneConfirm('')
                    setForgotNewPin('')
                    setForgotConfirmNewPin('')
                    setIsForgotPinOpen(true)
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Lupa PIN Akun Anda?</span>
                </button>


              </div>
            </div>
          )}

          {/* JIKA BELUM ADA AKUN SAMA SEKALI: FORM PENDAFTARAN BARU */}
          {!hasRegistered && regStep === 'form' && (
            <form onSubmit={handleNextToPaket} className="mt-5 space-y-3.5 animate-in fade-in duration-150">
              <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 text-xs text-blue-800">
                <span className="font-bold block">Pendaftaran 1 Akun Perangkat</span>
                Daftarkan profil armada Anda satu kali untuk dipakai seterusnya di HP ini.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Nama Juragan / Nama Usaha:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PO Nusantara Jaya"
                  value={namaJuragan}
                  onChange={(e) => setNamaJuragan(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm font-semibold text-slate-800 bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Nomor HP / WhatsApp:
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm font-semibold text-slate-800 bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  Email Aktif (Untuk Bukti Pembayaran / Invoice):
                </label>
                <input
                  type="email"
                  placeholder="Contoh: juragan@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm font-semibold text-slate-800 bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  Buat 6-Digit PIN Keamanan:
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    placeholder="Masukkan 6 angka PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full h-11 px-3.5 pr-11 text-center font-mono text-lg tracking-widest font-bold text-slate-900 bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 focus:outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg transition-colors"
                    title={showPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Konfirmasi PIN Ulang:
                </label>
                <div className="relative">
                  <input
                    type={showKonfirmasiPin ? 'text' : 'password'}
                    maxLength={6}
                    placeholder="Ketik ulang 6 angka PIN"
                    value={konfirmasiPin}
                    onChange={(e) => setKonfirmasiPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full h-11 px-3.5 pr-11 text-center font-mono text-lg tracking-widest font-bold text-slate-900 bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 focus:outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowKonfirmasiPin(!showKonfirmasiPin)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg transition-colors"
                    title={showKonfirmasiPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
                  >
                    {showKonfirmasiPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 font-medium p-2.5 rounded-xl text-center text-xs">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Lanjut: Pilih Paket Langganan</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          )}

          {/* STEP 2: PILIH PAKET SUBSCRIPTION PAS DAFTAR */}
          {!hasRegistered && regStep === 'paket' && (
            <div className="mt-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setRegStep('form')}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pilih Paket Langganan
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Halo {namaJuragan || 'Juragan'}, pilih paket operasional Anda:
                  </p>
                </div>
              </div>

              {/* OPSI 1: FREE TRIAL 14 HARI */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 shadow-xs">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      Uji Coba Gratis
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">14 Hari Free Trial</h4>
                    <p className="text-[11px] text-slate-500">Coba semua fitur operasional tanpa bayar</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-700">Rp 0</span>
                    <span className="text-[10px] text-slate-400 block">/ 14 hari</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectPaketAndFinish('TRIAL')}
                  className="w-full mt-2 h-10 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Aktifkan Free Trial (14 Hari)</span>
                </button>
              </div>

              {/* OPSI 2: PAKET 6 BULAN */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                      Reguler
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">Paket 6 Bulan</h4>
                    <p className="text-[11px] text-slate-500">Masa aktif bertambah 185 hari</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-slate-900">Rp 250.000</span>
                    <span className="text-[10px] text-slate-400 block">/ 6 bulan</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectPaketAndFinish('SEMESTER')}
                  className="w-full mt-2 h-10 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <span>Pilih & Bayar Mayar (Rp 250k)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* OPSI 3: PAKET 1 TAHUN */}
              <div className="bg-amber-50/40 border border-amber-300/80 rounded-xl p-3.5 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                  Diskon Rp 50.000
                </div>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                      Paling Hemat
                    </span>
                    <h4 className="text-sm font-bold text-slate-950 mt-1">Paket 1 Tahun Penuh</h4>
                    <p className="text-[11px] text-slate-600">Masa aktif 366 hari tanpa repot</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-slate-950">Rp 450.000</span>
                    <span className="text-[10px] text-slate-500 block">/ 1 tahun</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectPaketAndFinish('TAHUNAN')}
                  className="w-full mt-2 h-10 bg-amber-400 hover:bg-amber-500 active:scale-[0.99] text-slate-950 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border border-amber-500/50 transition-all"
                >
                  <span>Pilih & Bayar Mayar (Rp 450k)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] font-medium text-slate-400">
            PJTech Armada • Aplikasi Operasional Angkot & Bus
          </p>
        </div>
      </main>

      {/* MODAL BANTUAN & RESET LUPA PIN */}
      {isForgotPinOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Bantuan Lupa PIN
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Pemulihan Akses Akun Anda
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotPinOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* INFO AKUN YANG AKAN DIRESET */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs">
              <span className="text-slate-400 block text-[10px]">Akun Terdaftar:</span>
              <span className="font-bold text-slate-900 block text-sm">
                {primaryAccount?.namaJuragan}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                {primaryAccount?.noHp}
              </span>
            </div>

            {/* FORM RESET MANDIRI */}
            <form onSubmit={handleExecuteResetPin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konfirmasi Nomor WhatsApp Anda:
                </label>
                <input
                  type="tel"
                  placeholder="Masukkan No HP akun di atas"
                  value={forgotPhoneConfirm}
                  onChange={(e) => setForgotPhoneConfirm(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buat PIN Baru (6 Digit):
                </label>
                <div className="relative">
                  <input
                    type={showForgotPin ? 'text' : 'password'}
                    maxLength={6}
                    placeholder="Contoh: 123456"
                    value={forgotNewPin}
                    onChange={(e) => setForgotNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full h-10 px-3 pr-10 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotPin(!showForgotPin)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showForgotPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ulangi PIN Baru:
                </label>
                <input
                  type={showForgotPin ? 'text' : 'password'}
                  maxLength={6}
                  placeholder="Ketik ulang PIN baru"
                  value={forgotConfirmNewPin}
                  onChange={(e) => setForgotConfirmNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full h-10 px-3 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {forgotErrorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 font-medium p-2 rounded-lg text-center text-xs">
                  {forgotErrorMsg}
                </div>
              )}

              {forgotSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium p-2 rounded-lg text-center text-xs">
                  {forgotSuccessMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Simpan PIN Baru & Masuk</span>
              </button>
            </form>

            {/* BANTUAN VIA WHATSAPP ADMIN */}
            <div className="pt-2 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 block mb-1.5">
                Atau butuh bantuan langsung?
              </span>
              <button
                type="button"
                onClick={handleOpenWhatsAppAdmin}
                className="w-full h-9 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Hubungi Admin PJTech via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
