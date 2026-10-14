'use server'

import 'server-only'
import { prisma } from '@/lib/prisma'

export interface CloudAuthResponse {
  success: boolean
  message: string
  user?: {
    tenantId: string
    namaJuragan: string
    noHp: string
    email?: string
    pin: string
    paket: string
    terdaftarPada: string
    aktifSampai: string
    angkotList: any[]
    setoranList: any[]
  }
}

// 1. Registrasi Akun ke Cloud Neon Database
export async function registerTenantCloudAction(data: {
  namaJuragan: string
  noHp: string
  email?: string
  pin: string
  paket?: string
}): Promise<CloudAuthResponse> {
  const cleanPhone = data.noHp.trim().replace(/[^0-9]/g, '')
  if (!cleanPhone || cleanPhone.length < 9) {
    return { success: false, message: 'Nomor WhatsApp tidak valid (minimal 9 digit)!' }
  }

  try {
    const existing = await prisma.tenant.findUnique({
      where: { noHp: cleanPhone },
    })

    if (existing) {
      return {
        success: false,
        message: 'Nomor WhatsApp ini sudah terdaftar di sistem! Silakan gunakan menu LOGIN / MASUK.',
      }
    }

    const now = new Date()
    let days = 14
    if (data.paket === 'SEMESTER') days = 185
    if (data.paket === 'TAHUNAN') days = 366
    const expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const newTenant = await prisma.tenant.create({
      data: {
        id: 'tenant_' + cleanPhone,
        namaJuragan: data.namaJuragan.trim(),
        noHp: cleanPhone,
        email: data.email?.trim() || null,
        pin: data.pin.trim(),
        paket: data.paket || 'TRIAL',
        aktifSampai: expiry,
      },
      include: {
        angkotList: true,
        setoranList: true,
      },
    })

    return {
      success: true,
      message: 'Pendaftaran akun berhasil di cloud!',
      user: {
        tenantId: newTenant.id,
        namaJuragan: newTenant.namaJuragan,
        noHp: newTenant.noHp,
        email: newTenant.email || undefined,
        pin: newTenant.pin,
        paket: newTenant.paket,
        terdaftarPada: newTenant.createdAt.toISOString(),
        aktifSampai: newTenant.aktifSampai ? newTenant.aktifSampai.toISOString() : expiry.toISOString(),
        angkotList: newTenant.angkotList,
        setoranList: newTenant.setoranList,
      },
    }
  } catch (error: any) {
    console.error('Error registerTenantCloudAction:', error)
    return { success: false, message: 'Gagal mendaftar ke server: ' + (error.message || 'Koneksi error') }
  }
}

// 2. Login Akun Lintas Perangkat (Sync dari Cloud Neon Database)
export async function loginTenantCloudAction(noHp: string, pin: string): Promise<CloudAuthResponse> {
  const cleanPhone = noHp.trim().replace(/[^0-9]/g, '')
  if (!cleanPhone) {
    return { success: false, message: 'Masukkan nomor WhatsApp Anda!' }
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { noHp: cleanPhone },
      include: {
        angkotList: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
        setoranList: {
          orderBy: { tanggal: 'desc' },
          take: 200,
        },
      },
    })

    if (!tenant) {
      return {
        success: false,
        message: 'Nomor WhatsApp belum terdaftar di database! Silakan DAFTAR BARU terlebih dahulu.',
      }
    }

    if (tenant.pin !== pin.trim()) {
      return { success: false, message: 'PIN akun salah! Silakan coba lagi.' }
    }

    return {
      success: true,
      message: 'Login berhasil! Data armada Anda berhasil ditarik dari Cloud.',
      user: {
        tenantId: tenant.id,
        namaJuragan: tenant.namaJuragan,
        noHp: tenant.noHp,
        email: tenant.email || undefined,
        pin: tenant.pin,
        paket: tenant.paket,
        terdaftarPada: tenant.createdAt.toISOString(),
        aktifSampai: tenant.aktifSampai ? tenant.aktifSampai.toISOString() : new Date().toISOString(),
        angkotList: tenant.angkotList,
        setoranList: tenant.setoranList,
      },
    }
  } catch (error: any) {
    console.error('Error loginTenantCloudAction:', error)
    return { success: false, message: 'Gagal terhubung ke database cloud: ' + (error.message || '') }
  }
}