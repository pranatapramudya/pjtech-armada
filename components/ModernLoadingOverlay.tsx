'use client'

import { Bus, ShieldCheck, Sparkles } from 'lucide-react'

interface ModernLoadingOverlayProps {
  mode: 'login' | 'logout'
  message?: string
}

export function ModernLoadingOverlay({ mode, message }: ModernLoadingOverlayProps) {
  const isLogin = mode === 'login'

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xs bg-white border border-slate-200/90 rounded-3xl p-7 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Soft Ambient Glow */}
        <div className={`absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-30 ${isLogin ? 'bg-amber-300' : 'bg-red-300'}`} />
        <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${isLogin ? 'bg-blue-300' : 'bg-amber-300'}`} />

        {/* Animated Icon Circle */}
        <div className="relative my-3">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg relative z-10 ${
            isLogin ? 'bg-amber-400 text-slate-950 shadow-amber-400/25' : 'bg-red-600 text-white shadow-red-600/25'
          }`}>
            {isLogin ? (
              <Bus className="w-10 h-10 stroke-[2.5] animate-bounce" />
            ) : (
              <ShieldCheck className="w-10 h-10 stroke-[2.5]" />
            )}
          </div>
          {/* Animated pulse ring */}
          <div className={`absolute inset-0 rounded-3xl animate-ping opacity-25 ${isLogin ? 'bg-amber-400' : 'bg-red-500'}`} />
        </div>

        {/* Title & Message */}
        <div className="mt-2 space-y-1 relative z-10">
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isLogin ? 'MEMUAT SISTEM' : 'MENGAMANKAN SESI'}</span>
          </span>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {isLogin ? 'Masuk ke Armada...' : 'Memproses Keluar...'}
          </h3>
          <p className="text-xs font-bold text-slate-500">
            {message || (isLogin ? 'Menyiapkan dashboard operasional Anda' : 'Sesi Anda telah dikunci dengan aman')}
          </p>
        </div>

        {/* Modern Shimmer Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mt-5 overflow-hidden relative border border-slate-200">
          <div className={`h-full rounded-full transition-all duration-700 animate-pulse ${
            isLogin ? 'w-4/5 bg-gradient-to-r from-amber-500 to-amber-400' : 'w-4/5 bg-gradient-to-r from-red-600 to-amber-500'
          }`} />
        </div>
      </div>
    </div>
  )
}
