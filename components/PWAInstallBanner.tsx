'use client'

import { useState, useEffect } from 'react'
import { Download, Share2, PlusSquare, X, Smartphone, CheckCircle, Apple } from 'lucide-react'
import { playClickSound, triggerHaptic } from '@/lib/audio'

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Cek apakah sudah running dalam mode standalone / PWA / Installed
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    setIsStandalone(isStandaloneMode)

    // Cek perangkat iOS (iPhone / iPad)
    const ua = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(ua)
    setIsIOS(iosDevice)

    // Tangkap event instalasi browser (Chrome, Edge, Samsung Internet, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Jika sudah terinstall atau ditutup oleh user
  if (isStandalone || dismissed) return null

  const handleInstallClick = async () => {
    playClickSound()
    triggerHaptic(40)

    if (isIOS) {
      setShowIOSGuide(true)
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } else {
      // Jika browser tidak menembak prompt (misal desktop/chrome manual), buka modal panduan
      setShowIOSGuide(true)
    }
  }

  return (
    <>
      {/* FLOATING INSTALL NOTIFICATION BANNER */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3 mx-3 my-2.5 rounded-2xl shadow-lg border border-slate-700/80 flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-sm">
            <Download className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white tracking-tight truncate">
              Pasang Aplikasi PJTech Armada
            </h4>
            <p className="text-[10px] text-slate-300 truncate">
              Akses cepat di layar HP & lebih hemat kuota
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-black rounded-xl cursor-pointer shadow transition-all flex items-center gap-1"
          >
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-lg cursor-pointer"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODAL PANDUAN LENGKAP CARA INSTALL PWA (IOS & ANDROID) */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Panduan Pasang Aplikasi</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PANDUAN IPHONE / IPAD (IOS) */}
            <div className="space-y-3 mb-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                <span className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1.5 mb-2">
                  <Apple className="w-4 h-4 text-slate-900" />
                  <span>Untuk iPhone / iPad (Safari):</span>
                </span>
                <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside font-medium">
                  <li>
                    Buka situs ini di browser <strong>Safari</strong>.
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span>Klik tombol <strong>Share</strong> (ikon kotak berpanah ke atas <Share2 className="w-3.5 h-3.5 inline text-blue-600" /> di bawah layar).</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span>Gulir ke bawah dan pilih <strong>"Add to Home Screen"</strong> (Tambah ke Layar Utama <PlusSquare className="w-3.5 h-3.5 inline text-slate-700" />).</span>
                  </li>
                  <li>
                    Klik <strong>Add</strong> di pojok kanan atas. Aplikasi langsung muncul di layar iPhone Anda!
                  </li>
                </ol>
              </div>

              {/* PANDUAN ANDROID (CHROME) */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5">
                <span className="text-[11px] font-black uppercase text-emerald-900 flex items-center gap-1.5 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Untuk Android (Chrome / Browser Lain):</span>
                </span>
                <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside font-medium">
                  <li>
                    Klik tombol <strong>Titik Tiga (⋮)</strong> di pojok kanan atas Chrome.
                  </li>
                  <li>
                    Pilih <strong>"Install app"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                  </li>
                  <li>
                    Klik <strong>Install</strong>. Aplikasi akan terpasang otomatis seperti aplikasi Play Store!
                  </li>
                </ol>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  )
}