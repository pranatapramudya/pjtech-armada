# 🏗️ Architecture & System Design — PJTech Armada

Dokumentasi arsitektur teknis sistem **PJTech Armada**, platform operasional multi-tenant untuk armada Angkot dan Bus.

---

## 1. High-Level Architecture Diagram

`
+-------------------------------------------------------------+
|                      Clients / Frontend                     |
|  +---------------------------+  +------------------------+  |
|  | Web (Desktop & Mobile)    |  | Android Native (APK)   |  |
|  | armada.pjtechumkm.com     |  | Capacitor 7 WebLayer   |  |
|  +---------------------------+  +------------------------+  |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     Application Layer                       |
|   Next.js 16 (App Router + Turbopack)                       |
|   - Multi-Tenant Auth Guard & PIN System                    |
|   - Dual-Storage Engine (Offline Cache + Neon PostgreSQL)   |
|   - License & Mayar Payment Link Engine                     |
+-------------------------------------------------------------+
                               |
         +---------------------+---------------------+
         |                                           |
         v                                           v
+-----------------------------+       +-----------------------------+
|  Cloud PostgreSQL (Neon)    |       |      Payment Gateway        |
|  Prisma ORM Client          |       |      Mayar.id API / Links   |
|  - Tenant Table             |       |      - QRIS, VA, E-Wallet   |
|  - Angkot & Bus Table       |       |      - Pre-filled Checkout  |
|  - Setoran & Kas Table      |       |      - Instant Activation   |
+-----------------------------+       +-----------------------------+
`

---

## 2. Multi-Tenancy Strategy

### A. Data Isolation
Setiap entitas data diikat oleh tenantId (tenant_{nomorHp}):
- Di Database Cloud (PostgreSQL): Model Tenant sebagai root, Angkot & Setoran berelasi cascade.
- Di Local Storage (Offline Engine): Prefix dinamis pjtech_{tenantId}_... menjamin isolasi data tanpa tercampur.

### B. Single Device Binding
- 1 Perangkat di-bind ke 1 akun juragan primer untuk keamanan kas operasional sopir.

---

## 3. Database Schema (Prisma PostgreSQL)
- Tenant: id, namaJuragan, noHp, createdAt
- Angkot: id, tenantId, platNomor, namaSopirTetap, targetHarian, isActive
- Setoran: id, tenantId, angkotId, tanggal, nominal, targetHariIni, status, catatan

---

## 4. Payment Gateway & Licensing (Mayar.id)
- Free Trial 14 Hari otomatis saat registrasi.
- Paket 6 Bulan (Rp 250.000) & Paket 1 Tahun (Rp 450.000).
- Auto-fill URL query parameters: name, mobile, email langsung terisi di checkout Mayar.
- Tombol aktivasi instan mandiri langsung aktif setelah pembayaran.

---

## 5. Deployment Topology
- DNS: Cloudflare (armada.pjtechumkm.com)
- Host: Vercel Edge Serverless
- DB: Neon Serverless PostgreSQL (Singapore Region)