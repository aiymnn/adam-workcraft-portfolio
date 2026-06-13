import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';

/**
 * POST /api/public/reviews/verify
 * Verifies a review code without auth.
 * Returns basic booking info (name, service) so the form can pre-fill.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { code?: string };
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';

    if (!code) {
      return NextResponse.json({ success: false, message: 'Review code is required' }, { status: 400 });
    }

    const booking = await db.booking.findFirst({
      where: { reviewCode: code },
      select: {
        id: true,
        name: true,
        service: true,
        reviewSubmitted: true,
        status: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Invalid code. Please check and try again.' }, { status: 404 });
    }

    if (booking.reviewSubmitted) {
      return NextResponse.json(
        { success: false, message: 'This code has already been used to submit a review.' },
        { status: 409 }
      );
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { success: false, message: 'This code is not yet active.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        name: booking.name,
        service: booking.service,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}
