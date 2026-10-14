import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getPhoneVariants(phone: string): string[] {
  const digits = (phone || '').trim().replace(/[^0-9]/g, '');
  if (!digits) return [];

  const variants = new Set<string>();
  variants.add(digits);

  if (digits.startsWith('0')) {
    variants.add('62' + digits.slice(1));
    variants.add(digits.slice(1));
  } else if (digits.startsWith('62')) {
    variants.add('0' + digits.slice(2));
    variants.add(digits.slice(2));
  } else {
    variants.add('0' + digits);
    variants.add('62' + digits);
  }

  return Array.from(variants);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, noHp, pin, namaJuragan, email, paket, newPin } = body;
    const variants = getPhoneVariants(noHp);

    if (variants.length === 0) {
      return NextResponse.json({ success: false, message: 'Nomor WhatsApp wajib diisi!' }, { status: 400 });
    }

    if (action === 'login') {
      const tenant = await prisma.tenant.findFirst({
        where: { noHp: { in: variants } },
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

      if ((tenant.pin || '').trim() !== (pin || '').trim()) {
        return NextResponse.json({
          success: false,
          message: 'PIN akun salah! Silakan periksa kembali PIN Anda.',
        }, { status: 401 });
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

    if (action === 'reset_pin') {
      const tenant = await prisma.tenant.findFirst({
        where: { noHp: { in: variants } },
      });

      if (!tenant) {
        return NextResponse.json({
          success: false,
          message: 'Nomor WhatsApp tidak ditemukan!',
        }, { status: 404 });
      }

      if (!newPin || newPin.length < 4) {
        return NextResponse.json({
          success: false,
          message: 'PIN baru minimal 4 atau 6 digit!',
        }, { status: 400 });
      }

      const updated = await prisma.tenant.update({
        where: { id: tenant.id },
        data: { pin: newPin.trim() },
        include: {
          angkotList: true,
          setoranList: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'PIN berhasil direset!',
        user: {
          tenantId: updated.id,
          namaJuragan: updated.namaJuragan,
          noHp: updated.noHp,
          pin: updated.pin,
          paket: updated.paket,
          angkotList: updated.angkotList,
          setoranList: updated.setoranList,
        },
      });
    }

    if (action === 'register') {
      const cleanPhone = variants[0].startsWith('0') ? variants[0] : (variants.find(v => v.startsWith('0')) || variants[0]);

      const existing = await prisma.tenant.findFirst({
        where: { noHp: { in: variants } },
      });

      if (existing) {
        return NextResponse.json({
          success: false,
          message: 'Nomor WhatsApp sudah terdaftar! Silakan login di tab Masuk (Sudah Ada Akun).',
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
