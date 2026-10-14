'use client'

import { Bus, BookOpen, Package, Settings } from 'lucide-react'
import { playClickSound, triggerHaptic } from '@/lib/audio'

export type TabType = 'setor' | 'buku-kas' | 'paket' | 'pengaturan'

interface BottomNavProps {
  activeTab: TabType
  onChangeTab: (tab: TabType) => void
  belumSetorCount: number
  isExpired?: boolean
  sisaHari?: number
}

export function BottomNav({
  activeTab,
  onChangeTab,
  belumSetorCount,
  isExpired,
  sisaHari,
}: BottomNavProps) {
  const handleTabClick = (tab: TabType) => {
    playClickSound()
    triggerHaptic(25)
    onChangeTab(tab)
  }

  const isUrgentUpgrade = isExpired || (sisaHari !== undefined && sisaHari <= 1)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex justify-center">
      <nav
        className="pointer-events-auto w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(15,23,42,0.04)] px-3 py-2 grid grid-cols-4 gap-2"
        style={{ minHeight: '66px' }}
        aria-label="Navigasi Menu Utama"
      >
        {/* MENU 1: SETOR MOBIL */}
        <button
          id="btn-nav-setor"
          type="button"
          onClick={() => handleTabClick('setor')}
          className={`min-h-[50px] rounded-xl flex flex-col items-center justify-center py-1.5 px-1 cursor-pointer transition-all duration-200 ${
            activeTab === 'setor'
              ? 'bg-slate-900 text-amber-400 font-bold shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 font-medium'
          }`}
        >
          <div className="relative">
            <Bus className="w-5 h-5 stroke-[2.2]" />
            {belumSetorCount > 0 && (
              <span className="w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center absolute -top-1 -right-2.5 border border-white shadow-xs">
                {belumSetorCount}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">
            Setor Mobil
          </span>
        </button>

        {/* MENU 2: BUKU KAS */}
        <button
          id="btn-nav-bukukas"
          type="button"
          onClick={() => handleTabClick('buku-kas')}
          className={`min-h-[50px] rounded-xl flex flex-col items-center justify-center py-1.5 px-1 cursor-pointer transition-all duration-200 ${
            activeTab === 'buku-kas'
              ? 'bg-slate-900 text-amber-400 font-bold shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 font-medium'
          }`}
        >
          <BookOpen className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">
            Buku Kas
          </span>
        </button>

        {/* MENU 3: PAKET LANGGANAN */}
        <button
          id="btn-nav-paket"
          type="button"
          onClick={() => handleTabClick('paket')}
          className={`min-h-[50px] rounded-xl flex flex-col items-center justify-center py-1.5 px-1 cursor-pointer transition-all duration-200 relative ${
            activeTab === 'paket'
              ? 'bg-slate-900 text-amber-400 font-bold shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 font-medium'
          }`}
        >
          <div className="relative">
            <Package className="w-5 h-5 stroke-[2.2]" />
            {isUrgentUpgrade && activeTab !== 'paket' && (
              <span className="w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center absolute -top-1 -right-2 border border-white shadow animate-pulse">
                !
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">
            Paket
          </span>
        </button>

        {/* MENU 4: PENGATURAN */}
        <button
          id="btn-nav-pengaturan"
          type="button"
          onClick={() => handleTabClick('pengaturan')}
          className={`min-h-[50px] rounded-xl flex flex-col items-center justify-center py-1.5 px-1 cursor-pointer transition-all duration-200 ${
            activeTab === 'pengaturan'
              ? 'bg-slate-900 text-amber-400 font-bold shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 font-medium'
          }`}
        >
          <Settings className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">
            Pengaturan
          </span>
        </button>
      </nav>
    </div>
  )
}
