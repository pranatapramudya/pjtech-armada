import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const event = payload.event || payload.type || '';
    const data = payload.data || payload;

    const status = (data.status || payload.status || '').toLowerCase();
    const isSuccess =
      status === 'paid' ||
      status === 'success' ||
      status === 'settlement' ||
      event.includes('payment.success') ||
      event.includes('payment.received');

    if (!isSuccess) {
      return NextResponse.json({ received: true, note: 'Payment status not success yet' });
    }

    const customerMobile =
      data.customer?.mobile ||
      data.customer?.phone ||
      data.customerMobile ||
      data.mobile ||
      payload.mobile ||
      '';

    const cleanPhone = customerMobile.trim().replace(/[^0-9]/g, '');

    const amount = Number(data.amount || payload.amount || 0);
    const productName = (data.productName || data.name || payload.productName || '').toLowerCase();

    let paketBaru = 'SEMESTER';
    let hariTambahan = 185;

    if (amount >= 400000 || productName.includes('1 tahun') || productName.includes('tahunan')) {
      paketBaru = 'TAHUNAN';
      hariTambahan = 366;
    }

    if (cleanPhone) {
      const tenant = await prisma.tenant.findUnique({
        where: { noHp: cleanPhone },
      });

      if (tenant) {
        const currentExpiry = tenant.aktifSampai ? new Date(tenant.aktifSampai).getTime() : Date.now();
        const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
        const newExpiry = new Date(baseTime + hariTambahan * 24 * 60 * 60 * 1000);

        await prisma.tenant.update({
          where: { noHp: cleanPhone },
          data: {
            paket: paketBaru,
            aktifSampai: newExpiry,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      extendedDays: hariTambahan,
      paket: paketBaru,
    });
  } catch (error: any) {
    console.error('Error processing Mayar webhook:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
