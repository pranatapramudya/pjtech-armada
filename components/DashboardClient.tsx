'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Bus, RefreshCw, Settings, TrendingDown, Calendar, ChevronLeft, ChevronRight, LogOut, Clock, AlertTriangle } from 'lucide-react'
import { MobilCard } from './MobilCard'
import { NumpadModal, SelectedAngkotData } from './NumpadModal'
import { SuccessModal } from './SuccessModal'
import { TambahAngkotModal } from './TambahAngkotModal'
import { EditAngkotModal } from './EditAngkotModal'
import { PengaturanModal } from './PengaturanModal'
import { BukuKasView, SetoranRecord } from './BukuKasView'
import { CatatPengeluaranModal } from './CatatPengeluaranModal'
import { BottomNav, TabType } from './BottomNav'
import { PaketView } from './PaketView'
import { PengaturanView } from './PengaturanView'
import { PWAInstallBanner } from './PWAInstallBanner'
import { OfflinePengeluaran, OfflineAngkot } from '@/lib/offlineStorage'
import { UserAccount, checkLisensiStatus, logoutUser } from '@/lib/licenseStorage'
import { playClickSound, triggerHaptic } from '@/lib/audio'

interface DashboardClientProps {
  onDataChange?: () => void
  tenantNama: string
  tenantNoHp?: string
  angkotList: SelectedAngkotData[]
  rawAngkotList: OfflineAngkot[]
  setoranHariIni: SetoranRecord[]
  setoranBulanIni: SetoranRecord[]
  pengeluaranHariIni: OfflinePengeluaran[]
  pengeluaranBulanIni: OfflinePengeluaran[]
  selectedDateStr: string
  onSelectDate: (dateStr: string) => void
  selectedMonthStr?: string
  onSelectMonth?: (monthStr: string) => void
  userAccount?: UserAccount | null
  onOpenPaketModal?: () => void
  onLogout?: () => void
}

export function DashboardClient({
  onDataChange,
  tenantNama: initialTenantNama,
  tenantNoHp = '',
  angkotList,
  rawAngkotList,
  setoranHariIni,
  setoranBulanIni,
  pengeluaranHariIni,
  pengeluaranBulanIni,
  selectedDateStr,
  onSelectDate,
  selectedMonthStr,
  onSelectMonth,
  userAccount,
  onOpenPaketModal,
  onLogout,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('setor')
  const [tenantNama, setTenantNama] = useState(initialTenantNama)
  const [selectedAngkot, setSelectedAngkot] = useState<SelectedAngkotData | null>(null)
  const [editingAngkot, setEditingAngkot] = useState<SelectedAngkotData | null>(null)
  const [isNumpadOpen, setIsNumpadOpen] = useState(false)
  const [isTambahOpen, setIsTambahOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPengaturanOpen, setIsPengaturanOpen] = useState(false)
  const [isCatatPengeluaranOpen, setIsCatatPengeluaranOpen] = useState(false)

  // Realtime Countdown State
  const [lisensiInfo, setLisensiInfo] = useState(() => checkLisensiStatus(userAccount || null))

  useEffect(() => {
    setLisensiInfo(checkLisensiStatus(userAccount || null))
    const timer = setInterval(() => {
      setLisensiInfo(checkLisensiStatus(userAccount || null))
    }, 1000)
    return () => clearInterval(timer)
  }, [userAccount])

  const dateInputRef = useRef<HTMLInputElement>(null)

  // Success modal state
  const [successData, setSuccessData] = useState<{
    isOpen: boolean
    nominal: number
    platNomor: string
    namaSopir: string
    status: string
  }>({
    isOpen: false,
    nominal: 0,
    platNomor: '',
    namaSopir: '',
    status: '',
  })

  const belumSetorCount = angkotList.filter((a) => !a.setoranHariIni).length

  // Date formatting helpers
  const refDate = new Date(selectedDateStr + 'T12:00:00')
  const isToday = () => {
    const today = new Date()
    return (
      refDate.getDate() === today.getDate() &&
      refDate.getMonth() === today.getMonth() &&
      refDate.getFullYear() === today.getFullYear()
    )
  }

  const handlePrevDay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    playClickSound()
    triggerHaptic(30)
    const d = new Date(selectedDateStr + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    const yStr = d.getFullYear()
    const mStr = String(d.getMonth() + 1).padStart(2, '0')
    const dStr = String(d.getDate()).padStart(2, '0')
    onSelectDate(`${yStr}-${mStr}-${dStr}`)
  }

  const handleNextDay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    playClickSound()
    triggerHaptic(30)
    const d = new Date(selectedDateStr + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    const yStr = d.getFullYear()
    const mStr = String(d.getMonth() + 1).padStart(2, '0')
    const dStr = String(d.getDate()).padStart(2, '0')
    onSelectDate(`${yStr}-${mStr}-${dStr}`)
  }

  const handleOpenCalendar = () => {
    playClickSound()
    triggerHaptic(30)
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker()
      } else {
        dateInputRef.current.click()
      }
    }
  }

  const handleOpenSetor = (angkot: SelectedAngkotData) => {
    setSelectedAngkot(angkot)
    setIsNumpadOpen(true)
  }

  const handleOpenEdit = (angkot: SelectedAngkotData) => {
    setEditingAngkot(angkot)
    setIsEditOpen(true)
  }

  const handleSetoranSuccess = (res: {
    nominal: number
    platNomor: string
    namaSopir: string
    status: string
  }) => {
    setSuccessData({
      isOpen: true,
      nominal: res.nominal,
      platNomor: res.platNomor,
      namaSopir: res.namaSopir,
      status: res.status,
    })
    if (onDataChange) onDataChange()
  }

  const handleArmadaChange = () => {
    if (onDataChange) {
      onDataChange()
    } else {
      window.location.reload()
    }
  }

  const handleLogout = () => {
    playClickSound()
    triggerHaptic(50)
    logoutUser()
    if (onLogout) {
      onLogout()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-slate-100/70 flex justify-center selection:bg-amber-400 selection:text-slate-950">
      <main className="w-full max-w-md bg-slate-50/70 min-h-screen flex flex-col pb-28 relative border-x border-slate-200/70">
        {/* HEADER APLIKASI (CLEAN MODE) */}
        <header className="bg-white text-slate-800 px-4 pt-3.5 pb-2.5 sticky top-0 z-20 border-b border-slate-200 shadow-xs" style={{ transform: "translate3d(0, 0, 0)", WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-500/25 flex items-center justify-center font-bold shrink-0">
                <Bus className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight leading-tight text-slate-900">
                  {tenantNama}
                </h1>
                <span className="text-[10px] font-medium text-slate-400 tracking-wider block uppercase">
                  Operasional Armada
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5" />
          </div>

          {/* BANNER TANGGAL DENGAN KALENDER & BADGE JUMLAH (HANYA TAB SETOR) */}
          {activeTab === 'setor' && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 p-0.5">
              <button
                type="button"
                onClick={handlePrevDay}
                className="w-8 h-8 flex items-center justify-center hover:bg-white active:bg-amber-400 active:text-slate-950 rounded-lg text-slate-700 transition-all cursor-pointer"
                title="Geser ke Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleOpenCalendar}
                className="px-2.5 h-8 flex items-center gap-1.5 font-black text-[11px] text-slate-900 hover:text-amber-700 hover:bg-white rounded-lg cursor-pointer transition-colors"
                title="Klik untuk buka kalender"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  {refDate.toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                  {isToday() && ' (HARI INI)'}
                </span>
              </button>

              <input
                ref={dateInputRef}
                type="date"
                value={selectedDateStr}
                onChange={(e) => {
                  if (e.target.value) {
                    playClickSound()
                    onSelectDate(e.target.value)
                  }
                }}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />

              <button
                type="button"
                onClick={handleNextDay}
                className="w-8 h-8 flex items-center justify-center hover:bg-white active:bg-amber-400 active:text-slate-950 rounded-lg text-slate-700 transition-all cursor-pointer"
                title="Geser ke Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">
                Total: <strong className="text-slate-900">{angkotList.length} Unit</strong>
              </span>
              <span className="text-[11px] font-bold text-amber-600">
                Belum: <strong>{belumSetorCount} Unit</strong>
              </span>
            </div>
          </div>
          )}
        </header>
        {/* NOTIFIKASI / BANNER PASANG APLIKASI (PWA INSTALL PROMPT) */}
        <PWAInstallBanner />

        {/* KONTEN UTAMA */}
        <div className="flex-1 p-4 space-y-4">
          {/* BANNER NOTIFIKASI UPGRADE JIKA MASA AKTIF TINGGAL <= 1 HARI ATAU HABIS */}
          {(lisensiInfo.isExpired || lisensiInfo.sisaHari <= 1) && (
            <div className="bg-gradient-to-r from-red-600 via-amber-600 to-amber-700 text-white rounded-2xl p-4 shadow-md border-2 border-amber-300 flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-200">
                    {lisensiInfo.isExpired ? 'MASA TRIAL / PAKET HABIS' : 'UPGRADE PAKET (SISA 1 HARI)'}
                  </h4>
                  <p className="text-[11px] font-bold leading-tight text-white/95 mt-0.5">
                    {lisensiInfo.isExpired
                      ? 'Masa aktif sistem Anda telah berakhir. Upgrade sekarang agar pencatatan tidak terhenti.'
                      : `Masa aktif Anda tinggal ${lisensiInfo.sisaHari === 0 ? 'hari ini' : '1 hari lagi'}! Segera upgrade paket.`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(40)
                  setActiveTab('paket')
                }}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-transform active:scale-95 shrink-0"
              >
                UPGRADE
              </button>
            </div>
          )}
          {activeTab === 'setor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Daftar Armada {isToday() ? 'Hari Ini' : ''}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Pilih armada di bawah untuk input setoran / sewa
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    triggerHaptic(50)
                    setIsTambahOpen(true)
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Tambah Armada
                </button>
              </div>

              {angkotList.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300/90 rounded-2xl p-8 text-center mt-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
                    <Bus className="w-9 h-9 stroke-[2.2]" />
                  </div>
                  <p className="text-base font-black text-slate-900 mb-1">
                    Belum Ada Armada Terdaftar
                  </p>
                  <p className="text-xs font-bold text-slate-500 mb-5">
                    Tambahkan armada Angkot atau Bus Pariwisata pertama Anda.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsTambahOpen(true)}
                    className="w-full min-h-[56px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-2xl flex items-center justify-center gap-2 border border-blue-900 shadow-md cursor-pointer"
                  >
                    <Plus className="w-5 h-5 stroke-[3]" />
                    TAMBAH ARMADA PERTAMA
                  </button>
                </div>
              ) : (
                angkotList.map((item) => (
                  <MobilCard
                    key={item.id}
                    angkot={item}
                    onSelectSetor={handleOpenSetor}
                    onEditAngkot={handleOpenEdit}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'buku-kas' && (
            <BukuKasView
              setoranHariIni={setoranHariIni}
              setoranBulanIni={setoranBulanIni}
              pengeluaranHariIni={pengeluaranHariIni}
              pengeluaranBulanIni={pengeluaranBulanIni}
              totalMobil={angkotList.length}
              namaJuragan={tenantNama}
              onTambahMobilClick={() => setIsTambahOpen(true)}
              onCatatPengeluaranClick={() => setIsCatatPengeluaranOpen(true)}
              currentSelectedDate={selectedDateStr}
              currentSelectedMonth={selectedMonthStr}
              onSelectMonth={onSelectMonth}
              rawAngkotList={rawAngkotList}
              onDataChange={onDataChange}
            />
          )}

          {activeTab === 'paket' && (
            <PaketView
              account={userAccount || null}
              onUpdateAccount={() => {
                if (onDataChange) onDataChange()
              }}
            />
          )}

          {activeTab === 'pengaturan' && (
            <PengaturanView
              currentNamaJuragan={tenantNama}
              currentNoHp={tenantNoHp}
              onSuccess={(newNama) => setTenantNama(newNama)}
              onLogout={handleLogout}
            />
          )}
        </div>

        {/* MODAL FULLSCREEN NUMPAD */}
        <NumpadModal
          isOpen={isNumpadOpen}
          angkot={selectedAngkot}
          currentSelectedDate={selectedDateStr}
          onClose={() => setIsNumpadOpen(false)}
          onSuccess={handleSetoranSuccess}
        />

        {/* MODAL CATAT PENGELUARAN */}
        <CatatPengeluaranModal
          isOpen={isCatatPengeluaranOpen}
          onClose={() => setIsCatatPengeluaranOpen(false)}
          onSuccess={() => {
            if (onDataChange) onDataChange()
          }}
          angkotList={rawAngkotList}
        />

        {/* MODAL SUKSES LAYAR PENUH */}
        <SuccessModal
          isOpen={successData.isOpen}
          nominal={successData.nominal}
          platNomor={successData.platNomor}
          namaSopir={successData.namaSopir}
          status={successData.status}
          onClose={() => setSuccessData((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* MODAL TAMBAH MOBIL / BUS */}
        <TambahAngkotModal
          isOpen={isTambahOpen}
          onClose={() => {
            setIsTambahOpen(false)
            handleArmadaChange()
          }}
        />

        {/* MODAL EDIT MOBIL & BUS */}
        <EditAngkotModal
          isOpen={isEditOpen}
          angkot={editingAngkot}
          onClose={() => setIsEditOpen(false)}
          onSuccess={handleArmadaChange}
        />

        {/* MODAL PENGATURAN AKUN */}
        <PengaturanModal
          isOpen={isPengaturanOpen}
          currentNamaJuragan={tenantNama}
          currentNoHp={tenantNoHp}
          onClose={() => setIsPengaturanOpen(false)}
          onSuccess={(newNama) => setTenantNama(newNama)}
          onLogout={handleLogout}
        />

        {/* BOTTOM NAVIGATION DUA MENU UTAMA */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            playClickSound()
            triggerHaptic(40)
            setActiveTab(tab)
          }}
          belumSetorCount={belumSetorCount}
          isExpired={lisensiInfo.isExpired}
          sisaHari={lisensiInfo.sisaHari}
        />
      </main>
    </div>
  )
}
