# 🚐 PJTech Armada (Sistem Manajemen Operasional Angkot & Bus)

Aplikasi Progressive Web App (PWA) & Android Native berbasis **Next.js 16 (App Router)**, **Capacitor 7**, **Tailwind CSS**, dan **Neon Cloud PostgreSQL (Prisma ORM)** yang dirancang khusus untuk juragan dan pengusaha transportasi umum (Angkot, Bus Medium, Bus Besar, Minibus/Travel).

Live Web: [https://armada.pjtechumkm.com](https://armada.pjtechumkm.com)

---

## 🌟 Fitur Utama

### 1. 👥 Multi-Tenant & Keamanan Akun
- **Isolasi Penuh 100%**: Setiap juragan memiliki tenant ID unik berbasis nomor HP (	enant_0812xxx). Data armada, setoran, dan catatan kas terisolasi total antar-juragan.
- **Single Device Binding**: Satu perangkat dikunci untuk satu akun juragan aktif guna mencegah tumpang tindih data.
- **PIN Keamanan 6 Digit**: Akses masuk cepat dengan numpad PIN + fitur reset mandiri jika lupa PIN.
- **Armada Unlimited**: Tidak ada batasan jumlah unit armada yang didaftarkan per juragan.

### 2. 🚌 Manajemen Armada Fleksibel (Angkot & Bus)
- Dukungan tipe armada:
  - **🚐 Angkot** (Angkutan Kota / Mikrolet)
  - **🚌 Bus** (Bus Kota, AKDP, Pariwisata, Minibus)
- Informasi plat nomor, supir tetap/tembak, target setoran harian dinamis, dan catatan kondisi armada.

### 3. 💵 Pencatatan Setoran & Kas Operasional
- **Numpad Sentuh Super Cepat**: Input nominal setoran hanya dalam hitungan detik.
- **Input Tanggal Susulan (Retroactive Date)**: Fleksibilitas memilih tanggal setoran mundur jika ada sopir yang terlambat setor hari sebelumnya.
- **Koreksi & Edit Buku Kas**: Setiap transaksi kas memiliki tombol [✏️ Edit] dan [🗑️ Hapus] dengan dialog in-app Tailwind (aman di WebView Android).
- **Audio Feedback & Haptic**: Efek suara dan getaran haptic responsif di perangkat mobile.

### 4. 💳 Sistem Lisensi & Integrasi Mayar.id
- **Free Trial 14 Hari**: Akun baru langsung mendapatkan akses penuh 14 hari otomatis.
- **Paket Perpanjangan**:
  - **Paket 6 Bulan**: Rp 250.000 (+185 hari masa aktif)
  - **Paket 1 Tahun**: Rp 450.000 (+366 hari masa aktif - Hemat Rp 50.000)
- **Auto-Fill Data User**: Saat memilih pembayaran, nama, no HP, dan email user otomatis terisi di checkout Mayar.
- **Aktivasi Instan**: Tombol aktivasi mandiri langsung setelah bayar tanpa perlu menunggu verifikasi manual admin.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (React 19, TypeScript), Tailwind CSS, Lucide Icons
- **Mobile Engine**: Capacitor 7 (Android Native Export)
- **Database**: Neon Serverless PostgreSQL (Cloud) & Prisma ORM
- **Offline Storage**: Local Storage / IndexedDB Cache (Zero-latency offline operations)
- **Payment Gateway**: Mayar.id (QRIS, Virtual Account, E-Wallet, Retail)
- **Hosting & DNS**: Vercel & Cloudflare (rmada.pjtechumkm.com)

---

## 🚀 Menjalankan Secara Lokal

`ash
# Install dependencies
npm install

# Setup database Prisma
npx prisma db push

# Jalankan server development
npm run dev -- -p 3002
`

Buka [http://localhost:3002](http://localhost:3002) di browser Anda.

---

## 📱 Build APK Android

`ash
# Build web production bundle
npm run build

# Sinkronisasi ke Android Capacitor
npx cap sync android

# Kompilasi APK Debug
cd android
./gradlew assembleDebug
`
File APK biner tersimpan di: PJTech-Armada-MultiTenant.apk.