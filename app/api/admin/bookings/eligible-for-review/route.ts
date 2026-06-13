import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import { toScheduleBooking } from '../_utils';

/**
 * GET /api/admin/bookings/eligible-for-review
 * Returns bookings that are confirmed, date has already passed,
 * and no review has been submitted yet.
 */
export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const rows = await db.booking.findMany({
    where: {
      status: 'confirmed',
      date: { lt: now },
      reviewSubmitted: false,
    },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({
    success: true,
    bookings: rows.map(toScheduleBooking),
  });
}
