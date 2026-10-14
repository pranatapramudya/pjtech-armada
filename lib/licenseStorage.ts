export type PaketLangganan = 'TRIAL' | 'SEMESTER' | 'TAHUNAN';

export interface UserAccount {
  tenantId: string; // ID unik tenant (misal: "tenant_08123456789")
  namaJuragan: string;
  noHp: string;
  email?: string;
  pin: string; // 6 digit PIN
  paket: PaketLangganan;
  terdaftarPada: string; // ISO date
  aktifSampai: string; // ISO date
  isLoggedIn: boolean;
}

const ALL_ACCOUNTS_KEY = 'pjtech_armada_all_tenants_v1';
const ACTIVE_SESSION_KEY = 'pjtech_armada_active_tenant_id';

export const MAYAR_PAYMENT_LINKS = {
  SEMESTER: 'https://pranajayatech.myr.id/pl/pjtech-armada-langganan-6-bulan', // Paket 6 Bulan Rp 250.000
  TAHUNAN: 'https://pranajayatech.myr.id/pl/pjtech-armada-langganan-1-tahun',   // Paket 1 Tahun Rp 450.000
  WHATSAPP_ADMIN: 'https://wa.me/6281234567890?text=Halo%20Admin%20PJTech%2C%20saya%20mau%20konfirmasi%20langganan%20PJTech%20Armada'
};

export function getMayarPaymentUrl(
  paket: 'SEMESTER' | 'TAHUNAN',
  user?: { namaJuragan?: string; noHp?: string; email?: string } | null
): string {
  const baseUrl = MAYAR_PAYMENT_LINKS[paket];
  if (!baseUrl) return '';
  const acc = user || getUserAccount();
  const name = (acc?.namaJuragan || '').trim();
  const cleanPhone = (acc?.noHp || '').trim().replace(/[^0-9]/g, '');
  const email = (acc?.email || '').trim();

  const params = new URLSearchParams();
  if (name) params.append('name', name);
  if (cleanPhone) params.append('mobile', cleanPhone);
  if (email) params.append('email', email);

  const query = params.toString();
  return query ? baseUrl + "?" + query : baseUrl;
}

export function getAllAccounts(): Record<string, UserAccount> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(ALL_ACCOUNTS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveAllAccounts(accounts: Record<string, UserAccount>): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ALL_ACCOUNTS_KEY, JSON.stringify(accounts));
  }
}

export function getActiveTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function setActiveTenantId(tenantId: string | null): void {
  if (typeof window === 'undefined') return;
  if (tenantId) {
    localStorage.setItem(ACTIVE_SESSION_KEY, tenantId);
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

export function getUserAccount(): UserAccount | null {
  const activeId = getActiveTenantId();
  if (!activeId) return null;
  const accounts = getAllAccounts();
  return accounts[activeId] || null;
}

export function registerUser(namaJuragan: string, noHp: string, pin: string, paket: PaketLangganan = 'TRIAL', email: string = ''): UserAccount {
  const cleanPhone = noHp.trim().replace(/[^0-9]/g, '');
  const tenantId = `tenant_${cleanPhone}`;
  const now = new Date();
  
  let days = 14;
  if (paket === 'SEMESTER') days = 185;
  if (paket === 'TAHUNAN') days = 366;
  
  const expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const account: UserAccount = {
    tenantId,
    namaJuragan: namaJuragan.trim(),
    noHp: noHp.trim(),
    email: email.trim(),
    pin: pin.trim(),
    paket,
    terdaftarPada: now.toISOString(),
    aktifSampai: expiry.toISOString(),
    isLoggedIn: true,
  };

  const accounts = getAllAccounts();
  accounts[tenantId] = account;
  saveAllAccounts(accounts);
  setActiveTenantId(tenantId);

  return account;
}

export function loginUser(noHp: string, pin: string): { success: boolean; account?: UserAccount; pesan: string } {
  const cleanPhone = noHp.trim().replace(/[^0-9]/g, '');
  const tenantId = `tenant_${cleanPhone}`;
  const accounts = getAllAccounts();
  const account = accounts[tenantId];

  if (!account) {
    return { success: false, pesan: 'Nomor HP belum terdaftar di sistem. Silakan klik DAFTAR BARU.' };
  }

  if (account.pin !== pin.trim()) {
    return { success: false, pesan: 'PIN salah! Silakan coba lagi.' };
  }

  account.isLoggedIn = true;
  accounts[tenantId] = account;
  saveAllAccounts(accounts);
  setActiveTenantId(tenantId);

  return { success: true, account, pesan: 'Login berhasil!' };
}

export function resetPinUser(noHp: string, newPin: string): { success: boolean; pesan: string; account?: UserAccount } {
  const cleanPhone = noHp.trim().replace(/[^0-9]/g, '');
  const tenantId = `tenant_${cleanPhone}`;
  const accounts = getAllAccounts();
  const account = accounts[tenantId];

  if (!account) {
    return { success: false, pesan: 'Nomor HP tidak cocok dengan akun terdaftar di perangkat ini.' };
  }

  if (newPin.trim().length < 4) {
    return { success: false, pesan: 'PIN baru minimal harus 4 atau 6 digit angka.' };
  }

  account.pin = newPin.trim();
  account.isLoggedIn = true;
  accounts[tenantId] = account;
  saveAllAccounts(accounts);
  setActiveTenantId(tenantId);

  return { success: true, pesan: 'PIN berhasil direset! Anda otomatis masuk.', account };
}

export function logoutUser(): void {
  const account = getUserAccount();
  if (account) {
    const accounts = getAllAccounts();
    if (accounts[account.tenantId]) {
      accounts[account.tenantId].isLoggedIn = false;
      saveAllAccounts(accounts);
    }
  }
  setActiveTenantId(null);
}

export function updateUserAccountProfile(updates: { namaJuragan?: string; email?: string }): UserAccount | null {
  const account = getUserAccount();
  if (!account) return null;
  if (updates.namaJuragan !== undefined) account.namaJuragan = updates.namaJuragan.trim();
  if (updates.email !== undefined) account.email = updates.email.trim();
  const accounts = getAllAccounts();
  accounts[account.tenantId] = account;
  saveAllAccounts(accounts);
  return account;
}

export function verifikasiTokenLisensi(tokenInput: string): { valid: boolean; paket?: PaketLangganan; hari?: number; pesan: string } {
  const clean = tokenInput.trim().toUpperCase();
  if (!clean) return { valid: false, pesan: 'Kode lisensi tidak boleh kosong.' };

  if (clean.includes('PJ6B') || clean.includes('ARMADA6B') || clean.startsWith('PJ-6B')) {
    return { valid: true, paket: 'SEMESTER', hari: 185, pesan: 'Kode Lisensi Paket 6 Bulan Berhasil Diaktifkan!' };
  }

  if (clean.includes('PJ1T') || clean.includes('ARMADA1T') || clean.startsWith('PJ-1T')) {
    return { valid: true, paket: 'TAHUNAN', hari: 366, pesan: 'Kode Lisensi Paket 1 Tahun Berhasil Diaktifkan!' };
  }

  if (clean === 'PJTECH2026' || clean === 'VIPARMADA') {
    return { valid: true, paket: 'TAHUNAN', hari: 366, pesan: 'Akses VIP Berhasil Diaktifkan (1 Tahun)!' };
  }

  return { valid: false, pesan: 'Kode lisensi tidak valid atau sudah kedaluwarsa.' };
}

export function aktivasiLisensi(hariTambahan: number, paketBaru: PaketLangganan): UserAccount | null {
  const account = getUserAccount();
  if (!account) return null;

  const currentExpiry = new Date(account.aktifSampai).getTime();
  const now = Date.now();
  const baseTime = currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(baseTime + hariTambahan * 24 * 60 * 60 * 1000);

  account.paket = paketBaru;
  account.aktifSampai = newExpiry.toISOString();

  const accounts = getAllAccounts();
  accounts[account.tenantId] = account;
  saveAllAccounts(accounts);

  return account;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function checkLisensiStatus(account: UserAccount | null): {
  isExpired: boolean;
  sisaHari: number;
  sisaTotalDetik: number;
  countdown: CountdownTime;
  labelStatus: string;
  labelCountdown: string;
} {
  const emptyCountdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  if (!account) {
    return {
      isExpired: true,
      sisaHari: 0,
      sisaTotalDetik: 0,
      countdown: emptyCountdown,
      labelStatus: 'Belum Terdaftar',
      labelCountdown: '00:00:00',
    };
  }

  const now = Date.now();
  const expiry = new Date(account.aktifSampai).getTime();
  const diffMs = expiry - now;

  if (diffMs <= 0) {
    return {
      isExpired: true,
      sisaHari: 0,
      sisaTotalDetik: 0,
      countdown: emptyCountdown,
      labelStatus: 'Masa Aktif Habis',
      labelCountdown: 'Habis',
    };
  }

  const sisaTotalDetik = Math.floor(diffMs / 1000);
  const days = Math.floor(sisaTotalDetik / (24 * 3600));
  const hours = Math.floor((sisaTotalDetik % (24 * 3600)) / 3600);
  const minutes = Math.floor((sisaTotalDetik % 3600) / 60);
  const seconds = sisaTotalDetik % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  
  // Format countdown cerdas:
  // Jika masih > 1 hari: "13h 23j 59m"
  // Jika < 1 hari: "23:59:45" (Jam:Menit:Detik live)
  let labelCountdown = '';
  if (days > 0) {
    labelCountdown = `${days}h ${pad(hours)}j ${pad(minutes)}m`;
  } else {
    labelCountdown = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  const prefix = account.paket === 'TRIAL' ? 'Trial' : account.paket === 'SEMESTER' ? '6 Bulan' : '1 Tahun';
  const labelStatus = `${prefix} (${labelCountdown})`;

  return {
    isExpired: false,
    sisaHari: days,
    sisaTotalDetik,
    countdown: { days, hours, minutes, seconds },
    labelStatus,
    labelCountdown,
  };
}
