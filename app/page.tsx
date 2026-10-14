'use client'

import { useState, useEffect } from 'react'
import {
  getOfflineJuragan,
  getOfflineAngkotList,
  getOfflineSetoranList,
  getOfflinePengeluaranList,
  syncCloudDataToOffline,
  OfflineAngkot,
  OfflineSetoran,
  OfflinePengeluaran,
} from '@/lib/offlineStorage'
import { getUserAccount, UserAccount, checkLisensiStatus, aktivasiLisensi } from '@/lib/licenseStorage'
import { DashboardClient } from '@/components/DashboardClient'
import { AuthScreen } from '@/components/AuthScreen'
import { PaketModal } from '@/components/PaketModal'
import { SkeletonList } from '@/components/SkeletonList'
import { ModernLoadingOverlay } from '@/components/ModernLoadingOverlay'
import { playSuccessSound, triggerHaptic } from '@/lib/audio'

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [loadingOverlay, setLoadingOverlay] = useState<{
    active: boolean
    mode: 'login' | 'logout'
    message?: string
  } | null>(null)
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null)
  const [isPaketModalOpen, setIsPaketModalOpen] = useState(false)
  const [pesanAktivasiOtomatis, setPesanAktivasiOtomatis] = useState<string | null>(null)
  const [juragan, setJuragan] = useState({ namaJuragan: 'PJTech Armada', noHp: '' })
  const [angkotList, setAngkotList] = useState<OfflineAngkot[]>([])
  const [setoranList, setSetoranList] = useState<OfflineSetoran[]>([])
  const [pengeluaranList, setPengeluaranList] = useState<OfflinePengeluaran[]>([])

  const getTodayStr = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getTodayMonthStr = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayStr())
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(getTodayMonthStr())

  const loadData = () => {
    const acc = getUserAccount()
    setUserAccount(acc)
    const j = getOfflineJuragan()
    const a = getOfflineAngkotList()
    const s = getOfflineSetoranList()
    const p = getOfflinePengeluaranList()
    setJuragan(j)
    setAngkotList(a)
    setSetoranList(s)
    setPengeluaranList(p)
  }

  useEffect(() => {
    loadData()
    setMounted(true)

    // Sinkronisasi data otomatis dengan Neon Cloud Database (Multi-Device HP & PC)
    const acc = getUserAccount()
    if (acc && acc.isLoggedIn) {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: acc.tenantId,
          noHp: acc.noHp,
          angkotList: getOfflineAngkotList(),
          setoranList: getOfflineSetoranList(),
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            syncCloudDataToOffline({
              namaJuragan: acc.namaJuragan,
              noHp: acc.noHp,
              angkotList: data.angkotList,
              setoranList: data.setoranList,
            })
            setAngkotList(getOfflineAngkotList())
            setSetoranList(getOfflineSetoranList())
          }
        })
        .catch(() => {})
    }

    // Deteksi Otomatis Redirect dari Mayar.id via Query Params
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const paymentStatus = urlParams.get('status') || urlParams.get('payment_status')
      const paketParam = urlParams.get('paket') || urlParams.get('plan')

      if (paymentStatus === 'success' || paymentStatus === 'berhasil' || urlParams.has('mayar_success')) {
        const acc = getUserAccount()
        if (acc) {
          if (paketParam === '1tahun' || paketParam === 'tahunan' || paketParam === '1thn') {
            aktivasiLisensi(366, 'TAHUNAN')
            playSuccessSound()
            triggerHaptic(70)
            setPesanAktivasiOtomatis('🎉 Pembayaran Mayar Berhasil! Paket 1 Tahun Anda Telah Aktif!')
          } else {
            aktivasiLisensi(185, 'SEMESTER')
            playSuccessSound()
            triggerHaptic(70)
            setPesanAktivasiOtomatis('🎉 Pembayaran Mayar Berhasil! Paket 6 Bulan Anda Telah Aktif!')
          }
          window.history.replaceState({}, document.title, window.location.pathname)
          loadData()
        }
      }
    }

    const handleStorageChange = () => loadData()
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center">
        <main className="w-full max-w-md bg-white min-h-screen flex flex-col p-4">
          <SkeletonList />
        </main>
      </div>
    )
  }

  if (!userAccount || !userAccount.isLoggedIn) {
    return (
      <>
        {loadingOverlay?.active && (
          <ModernLoadingOverlay mode={loadingOverlay.mode} message={loadingOverlay.message} />
        )}
        <AuthScreen
          onAuthSuccess={(acc) => {
            setLoadingOverlay({
              active: true,
              mode: 'login',
              message: `Menyiapkan dashboard untuk ${acc.namaJuragan || 'Juragan'}...`
            })
            setTimeout(() => {
              setUserAccount(acc)
              loadData()
              setLoadingOverlay(null)
            }, 850)
          }}
        />
      </>
    )
  }

  const lisensiStatus = checkLisensiStatus(userAccount)

  // Filter Harian (Berdasarkan selectedDateStr)
  const [y, m, d] = selectedDateStr.split('-').map(Number)
  const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0).getTime()
  const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999).getTime()

  // Filter Bulanan Terpilih (Berdasarkan selectedMonthStr YYYY-MM)
  const [bYear, bMonth] = selectedMonthStr.split('-').map(Number)
  const startOfMonth = new Date(bYear, bMonth - 1, 1, 0, 0, 0, 0).getTime()
  const endOfMonth = new Date(bYear, bMonth, 0, 23, 59, 59, 999).getTime()

  const setoranHariIni = setoranList.filter((item) => {
    const t = new Date(item.tanggal).getTime()
    return t >= startOfDay && t <= endOfDay
  })

  const setoranBulanIni = setoranList.filter((item) => {
    const t = new Date(item.tanggal).getTime()
    return t >= startOfMonth && t <= endOfMonth
  })

  const pengeluaranHariIni = pengeluaranList.filter((item) => {
    const t = new Date(item.tanggal).getTime()
    return t >= startOfDay && t <= endOfDay
  })

  const pengeluaranBulanIni = pengeluaranList.filter((item) => {
    const t = new Date(item.tanggal).getTime()
    return t >= startOfMonth && t <= endOfMonth
  })

  // Format data armada
  const angkotFormatted = angkotList.map((a) => {
    const sHariIni = setoranHariIni.find((s) => s.angkotId === a.id)
    return {
      id: a.id,
      platNomor: a.platNomor,
      namaSopirTetap: a.namaSopirTetap,
      tipeKendaraan: a.tipeKendaraan,
      keteranganArmada: a.keteranganArmada,
      setoranHariIni: sHariIni
        ? {
            id: sHariIni.id,
            nominal: sHariIni.nominal,
            pengeluaran: sHariIni.pengeluaran || 0,
            keteranganPengeluaran: sHariIni.keteranganPengeluaran || null,
            status: sHariIni.status,
            catatan: sHariIni.catatan,
          }
        : null,
    }
  })

  const angkotMap = new Map(angkotList.map((a) => [a.id, a]))

  const formatRecords = (list: OfflineSetoran[]) =>
    list.map((s) => {
      const a = angkotMap.get(s.angkotId)
      return {
        id: s.id,
        angkotId: s.angkotId,
        nominal: s.nominal,
        pengeluaran: s.pengeluaran || 0,
        keteranganPengeluaran: s.keteranganPengeluaran || null,
        status: s.status,
        catatan: s.catatan,
        createdAt: s.createdAt,
        tanggal: s.tanggal,
        angkot: {
          platNomor: a?.platNomor || 'D XXXX XX',
          namaSopirTetap: a?.namaSopirTetap || 'Sopir',
          tipeKendaraan: a?.tipeKendaraan || 'ANGKOT',
          keteranganArmada: a?.keteranganArmada,
        },
      }
    })

  return (
    <>
      {pesanAktivasiOtomatis && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white font-black px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-emerald-400 animate-bounce max-w-sm text-xs text-center">
          <span>{pesanAktivasiOtomatis}</span>
          <button
            type="button"
            onClick={() => setPesanAktivasiOtomatis(null)}
            className="text-white hover:text-emerald-200 font-bold px-1.5 py-0.5 rounded-lg bg-emerald-800"
          >
            ✕
          </button>
        </div>
      )}

      {loadingOverlay?.active && (
        <ModernLoadingOverlay mode={loadingOverlay.mode} message={loadingOverlay.message} />
      )}

      <DashboardClient
        tenantNama={userAccount.namaJuragan || juragan.namaJuragan}
        tenantNoHp={userAccount.noHp || juragan.noHp}
        angkotList={angkotFormatted}
        rawAngkotList={angkotList}
        setoranHariIni={formatRecords(setoranHariIni)}
        setoranBulanIni={formatRecords(setoranBulanIni)}
        pengeluaranHariIni={pengeluaranHariIni}
        pengeluaranBulanIni={pengeluaranBulanIni}
        selectedDateStr={selectedDateStr}
        onSelectDate={(newDate) => setSelectedDateStr(newDate)}
        selectedMonthStr={selectedMonthStr}
        onSelectMonth={(newMonth) => setSelectedMonthStr(newMonth)}
        onDataChange={loadData}
        userAccount={userAccount}
        onOpenPaketModal={() => setIsPaketModalOpen(true)}
        onLogout={() => {
          setLoadingOverlay({
            active: true,
            mode: 'logout',
            message: 'Mengamankan sesi & keluar...'
          });
          setTimeout(() => {
            setUserAccount(null);
            loadData();
            setLoadingOverlay(null);
          }, 800);
        }}
      />

      <PaketModal
        isOpen={isPaketModalOpen}
        onClose={() => setIsPaketModalOpen(false)}
        account={userAccount}
        onUpdateAccount={(updated) => {
          setUserAccount(updated)
          loadData()
        }}
      />
    </>
  )
}
