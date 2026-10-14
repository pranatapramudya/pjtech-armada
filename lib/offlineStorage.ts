import { getActiveTenantId } from './licenseStorage';

export type TipeKendaraan = 'ANGKOT' | 'BUS';

export interface OfflineAngkot {
  id: string;
  tenantId: string; // Multi-tenant ID
  platNomor: string;
  namaSopirTetap: string | null;
  tipeKendaraan: TipeKendaraan;
  keteranganArmada?: string | null;
  isActive: boolean;
}

export interface OfflineSetoran {
  id: string;
  tenantId: string; // Multi-tenant ID
  angkotId: string;
  nominal: number;
  pengeluaran?: number;
  keteranganPengeluaran?: string | null;
  status: string;
  catatan: string | null;
  tanggal: string;
  createdAt: string;
}

export interface OfflinePengeluaran {
  id: string;
  tenantId: string; // Multi-tenant ID
  angkotId?: string | null;
  nominal: number;
  keterangan: string;
  kategori?: string;
  tanggal: string;
  createdAt: string;
}

// Prefix key per tenant agar data 100% terisolasi antar juragan
function getTenantKey(baseKey: string): string {
  const currentTenant = getActiveTenantId() || 'tenant_default';
  return `pjtech_${currentTenant}_${baseKey}`;
}

export function syncCloudDataToOffline(cloudData: {
  namaJuragan: string
  noHp: string
  angkotList?: any[]
  setoranList?: any[]
}) {
  if (typeof window === 'undefined') return
  saveOfflineJuragan(cloudData.namaJuragan, cloudData.noHp)

  if (cloudData.angkotList && cloudData.angkotList.length > 0) {
    const mappedAngkot: OfflineAngkot[] = cloudData.angkotList.map((a: any) => ({
      id: a.id,
      tenantId: a.tenantId,
      platNomor: a.platNomor,
      namaSopirTetap: a.namaSopirTetap || null,
      tipeKendaraan: (a.tipeKendaraan as any) || 'ANGKOT',
      keteranganArmada: a.keterangan || null,
      isActive: a.isActive !== false,
    }))
    localStorage.setItem(getTenantKey('armada_v1'), JSON.stringify(mappedAngkot))
  }

  if (cloudData.setoranList && cloudData.setoranList.length > 0) {
    const mappedSetoran: OfflineSetoran[] = cloudData.setoranList.map((s: any) => ({
      id: s.id,
      tenantId: s.tenantId,
      angkotId: s.angkotId,
      nominal: s.nominal,
      status: s.status,
      catatan: s.catatan || null,
      tanggal: typeof s.tanggal === 'string' ? s.tanggal.split('T')[0] : new Date(s.tanggal).toISOString().split('T')[0],
      createdAt: typeof s.createdAt === 'string' ? s.createdAt : new Date(s.createdAt).toISOString(),
    }))
    localStorage.setItem(getTenantKey('setoran_v1'), JSON.stringify(mappedSetoran))
  }
}

export function getOfflineJuragan(): { namaJuragan: string; noHp: string } {
  if (typeof window === 'undefined') {
    return { namaJuragan: 'PJTech Armada', noHp: '' };
  }
  const nama = localStorage.getItem(getTenantKey('juragan')) || 'PJTech Armada';
  const noHp = localStorage.getItem(getTenantKey('nohp')) || '';
  return { namaJuragan: nama, noHp };
}

export function saveOfflineJuragan(namaJuragan: string, noHp: string = '') {
  if (typeof window !== 'undefined') {
    localStorage.setItem(getTenantKey('juragan'), namaJuragan.trim());
    localStorage.setItem(getTenantKey('nohp'), noHp.trim());
  }
}

export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// --- MANAJEMEN ARMADA (PER TENANT) ---

export function getOfflineAngkotList(): OfflineAngkot[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(getTenantKey('kendaraan'));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const tenantId = getActiveTenantId() || 'tenant_default';
    return parsed.map((item: any) => ({
      ...item,
      tenantId: item.tenantId || tenantId,
      tipeKendaraan: item.tipeKendaraan || 'ANGKOT',
    }));
  } catch {
    return [];
  }
}

export function addOfflineAngkot(
  platNomor: string,
  namaSopirTetap?: string,
  tipeKendaraan: TipeKendaraan = 'ANGKOT',
  keteranganArmada?: string
): OfflineAngkot {
  const current = getOfflineAngkotList();
  const tenantId = getActiveTenantId() || 'tenant_default';
  const newAngkot: OfflineAngkot = {
    id: 'armada_' + Date.now(),
    tenantId,
    platNomor: platNomor.trim().toUpperCase(),
    namaSopirTetap: namaSopirTetap?.trim() || null,
    tipeKendaraan,
    keteranganArmada: keteranganArmada?.trim() || null,
    isActive: true,
  };
  const updated = [...current, newAngkot];
  if (typeof window !== 'undefined') {
    localStorage.setItem(getTenantKey('kendaraan'), JSON.stringify(updated));
  }
  return newAngkot;
}

export function updateOfflineAngkot(
  id: string,
  data: {
    platNomor: string;
    namaSopirTetap?: string;
    tipeKendaraan?: TipeKendaraan;
    keteranganArmada?: string;
  }
): OfflineAngkot | null {
  const current = getOfflineAngkotList();
  const index = current.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const updatedAngkot: OfflineAngkot = {
    ...current[index],
    platNomor: data.platNomor.trim().toUpperCase(),
    namaSopirTetap: data.namaSopirTetap !== undefined ? (data.namaSopirTetap?.trim() || null) : current[index].namaSopirTetap,
    tipeKendaraan: data.tipeKendaraan || current[index].tipeKendaraan || 'ANGKOT',
    keteranganArmada: data.keteranganArmada !== undefined ? (data.keteranganArmada?.trim() || null) : current[index].keteranganArmada,
  };

  current[index] = updatedAngkot;
  if (typeof window !== 'undefined') {
    localStorage.setItem(getTenantKey('kendaraan'), JSON.stringify(current));
  }
  return updatedAngkot;
}

export function deleteOfflineAngkot(id: string): boolean {
  const current = getOfflineAngkotList();
  const updated = current.filter((a) => a.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(getTenantKey('kendaraan'), JSON.stringify(updated));
  }
  return true;
}

// --- MANAJEMEN SETORAN (PER TENANT) ---

export function getOfflineSetoranList(): OfflineSetoran[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(getTenantKey('transaksi'));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addOfflineSetoran(data: {
  angkotId: string;
  nominal: number;
  pengeluaran?: number;
  keteranganPengeluaran?: string;
  catatan?: string;
  tanggal?: string;
}): OfflineSetoran {
  const current = getOfflineSetoranList();
  const tenantId = getActiveTenantId() || 'tenant_default';
  const targetDate = data.tanggal ? new Date(data.tanggal) : new Date();

  const newSetoran: OfflineSetoran = {
    id: 'setoran_' + Date.now(),
    tenantId,
    angkotId: data.angkotId,
    nominal: data.nominal,
    pengeluaran: data.pengeluaran || 0,
    keteranganPengeluaran: data.keteranganPengeluaran?.trim() || null,
    status: 'TERCATAT',
    catatan: data.catatan?.trim() || null,
    tanggal: targetDate.toISOString(),
    createdAt: new Date().toISOString(),
  };

  const updated = [newSetoran, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(getTenantKey('transaksi'), JSON.stringify(updated));
  }
  return newSetoran;
}

export function deleteOfflineSetoran(id: string) {
  const current = getOfflineSetoranList();
  const updated = current.filter((s) => s.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(getTenantKey('transaksi'), JSON.stringify(updated));
  }
}

export function updateOfflineSetoran(id: string, data: { nominal: number; catatan?: string | null; tanggal?: string }) {
  const current = getOfflineSetoranList();
  const updated = current.map((s) => {
    if (s.id === id) {
      return {
        ...s,
        nominal: data.nominal,
        catatan: data.catatan !== undefined ? data.catatan : s.catatan,
        tanggal: data.tanggal ? new Date(data.tanggal).toISOString() : s.tanggal,
      };
    }
    return s;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(getTenantKey('transaksi'), JSON.stringify(updated));
  }
}

// --- MANAJEMEN PENGELUARAN UMUM (PER TENANT) ---

export function getOfflinePengeluaranList(): OfflinePengeluaran[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(getTenantKey('pengeluaran'));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addOfflinePengeluaran(data: {
  nominal: number;
  keterangan: string;
  kategori?: string;
  angkotId?: string | null;
  tanggal?: string;
}): OfflinePengeluaran {
  const current = getOfflinePengeluaranList();
  const tenantId = getActiveTenantId() || 'tenant_default';
  const targetDate = data.tanggal ? new Date(data.tanggal) : new Date();

  const newPengeluaran: OfflinePengeluaran = {
    id: 'pengeluaran_' + Date.now(),
    tenantId,
    angkotId: data.angkotId || null,
    nominal: data.nominal,
    keterangan: data.keterangan.trim(),
    kategori: data.kategori?.trim() || 'Operasional',
    tanggal: targetDate.toISOString(),
    createdAt: new Date().toISOString(),
  };

  const updated = [newPengeluaran, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(getTenantKey('pengeluaran'), JSON.stringify(updated));
  }
  return newPengeluaran;
}

export function deleteOfflinePengeluaran(id: string) {
  const current = getOfflinePengeluaranList();
  const updated = current.filter((p) => p.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(getTenantKey('pengeluaran'), JSON.stringify(updated));
  }
}

export function updateOfflinePengeluaran(id: string, data: { nominal: number; keterangan: string; tanggal?: string }) {
  const current = getOfflinePengeluaranList();
  const updated = current.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        nominal: data.nominal,
        keterangan: data.keterangan.trim(),
        tanggal: data.tanggal ? new Date(data.tanggal).toISOString() : p.tanggal,
      };
    }
    return p;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(getTenantKey('pengeluaran'), JSON.stringify(updated));
  }
}
