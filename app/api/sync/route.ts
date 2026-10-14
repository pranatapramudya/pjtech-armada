import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const noHp = searchParams.get('noHp');

    if (!tenantId && !noHp) {
      return NextResponse.json({ success: false, message: 'tenantId atau noHp diperlukan' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: tenantId ? { id: tenantId } : { noHp: noHp! },
      include: {
        angkotList: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
        setoranList: {
          orderBy: { tanggal: 'desc' },
          take: 500,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ success: false, message: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      angkotList: tenant.angkotList,
      setoranList: tenant.setoranList,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, noHp, angkotList, setoranList } = body;

    const tenant = await prisma.tenant.findFirst({
      where: tenantId ? { id: tenantId } : (noHp ? { noHp } : undefined),
    });

    if (!tenant) {
      return NextResponse.json({ success: false, message: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    // 1. Sync / Upsert Angkot List
    if (Array.isArray(angkotList) && angkotList.length > 0) {
      for (const a of angkotList) {
        if (!a.platNomor) continue;
        const plat = a.platNomor.trim().toUpperCase();
        await prisma.angkot.upsert({
          where: {
            tenantId_platNomor: {
              tenantId: tenant.id,
              platNomor: plat,
            },
          },
          update: {
            namaSopirTetap: a.namaSopirTetap || null,
            tipeKendaraan: a.tipeKendaraan || 'ANGKOT',
            keterangan: a.keteranganArmada || a.keterangan || null,
            isActive: a.isActive !== false,
          },
          create: {
            id: a.id || `armada_${Date.now()}`,
            tenantId: tenant.id,
            platNomor: plat,
            namaSopirTetap: a.namaSopirTetap || null,
            tipeKendaraan: a.tipeKendaraan || 'ANGKOT',
            keterangan: a.keteranganArmada || a.keterangan || null,
            targetHarian: 1500000,
            isActive: true,
          },
        });
      }
    }

    // 2. Sync Setoran List
    if (Array.isArray(setoranList) && setoranList.length > 0) {
      for (const s of setoranList) {
        if (!s.id || !s.angkotId) continue;
        const exists = await prisma.setoran.findUnique({ where: { id: s.id } });
        if (!exists) {
          const angkotExists = await prisma.angkot.findUnique({ where: { id: s.angkotId } });
          if (angkotExists) {
            await prisma.setoran.create({
              data: {
                id: s.id,
                tenantId: tenant.id,
                angkotId: s.angkotId,
                nominal: s.nominal || 0,
                targetHariIni: 1500000,
                status: s.status || 'LUNAS',
                catatan: s.catatan || null,
                tanggal: s.tanggal ? new Date(s.tanggal) : new Date(),
                createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
              },
            });
          }
        }
      }
    }

    const latestAngkot = await prisma.angkot.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    const latestSetoran = await prisma.setoran.findMany({
      where: { tenantId: tenant.id },
      orderBy: { tanggal: 'desc' },
      take: 500,
    });

    return NextResponse.json({
      success: true,
      angkotList: latestAngkot,
      setoranList: latestSetoran,
    });
  } catch (err: any) {
    console.error('Sync error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
