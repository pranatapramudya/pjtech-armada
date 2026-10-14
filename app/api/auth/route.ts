import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, noHp, pin, namaJuragan, email, paket } = body;
    const cleanPhone = (noHp || '').trim().replace(/[^0-9]/g, '');

    if (action === 'login') {
      if (!cleanPhone) {
        return NextResponse.json({ success: false, message: 'Nomor WhatsApp wajib diisi!' }, { status: 400 });
      }

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
      });

      if (!tenant) {
        return NextResponse.json({
          success: false,
          message: 'Nomor WhatsApp belum terdaftar di cloud database! Silakan pilih DAFTAR BARU.',
        }, { status: 404 });
      }

      if (tenant.pin !== (pin || '').trim()) {
        return NextResponse.json({ success: false, message: 'PIN akun salah! Silakan coba lagi.' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        message: 'Login berhasil! Data armada disinkronkan.',
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
      });
    }

    if (action === 'register') {
      if (!cleanPhone || cleanPhone.length < 9) {
        return NextResponse.json({ success: false, message: 'Nomor WhatsApp minimal 9 digit!' }, { status: 400 });
      }

      const existing = await prisma.tenant.findUnique({
        where: { noHp: cleanPhone },
      });

      if (existing) {
        return NextResponse.json({
          success: false,
          message: 'Nomor WhatsApp sudah terdaftar! Silakan login di tab Sudah Punya Akun.',
        }, { status: 409 });
      }

      const now = new Date();
      let days = 14;
      if (paket === 'SEMESTER') days = 185;
      if (paket === 'TAHUNAN') days = 366;
      const expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const newTenant = await prisma.tenant.create({
        data: {
          id: 'tenant_' + cleanPhone,
          namaJuragan: (namaJuragan || '').trim(),
          noHp: cleanPhone,
          email: (email || '').trim() || null,
          pin: (pin || '').trim(),
          paket: paket || 'TRIAL',
          aktifSampai: expiry,
        },
        include: {
          angkotList: true,
          setoranList: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Registrasi cloud berhasil!',
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
      });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak valid' }, { status: 400 });
  } catch (error: any) {
    console.error('API /api/auth error:', error);
    return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: 500 });
  }
}