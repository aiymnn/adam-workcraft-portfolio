import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import { isBookingStatus, isValidTimeLabel, parseDateOnlyToUtc, toScheduleBooking } from './_utils';

interface BookingCreateBody {
  date?: string;
  time?: string;
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  notes?: string;
  status?: string;
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.booking.findMany({
    orderBy: [{ date: 'asc' }, { timeLabel: 'asc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json({ success: true, bookings: rows.map(toScheduleBooking) });
}

export async function POST(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as BookingCreateBody;

    const dateValue = (body.date || '').trim();
    const timeValue = (body.time || '').trim();
    const nameValue = (body.name || '').trim();
    const emailValue = (body.email || '').trim();
    const serviceValue = (body.service || '').trim();

    if (!dateValue || !timeValue || !nameValue || !emailValue || !serviceValue) {
      return NextResponse.json(
        { success: false, message: 'date, time, name, email, and service are required' },
        { status: 400 },
      );
    }

    const parsedDate = parseDateOnlyToUtc(dateValue);
    if (!parsedDate) {
      return NextResponse.json({ success: false, message: 'Invalid date format' }, { status: 400 });
    }

    if (!isValidTimeLabel(timeValue)) {
      return NextResponse.json({ success: false, message: 'Invalid time format' }, { status: 400 });
    }

    const statusValue = (body.status || 'pending').trim().toLowerCase();
    if (!isBookingStatus(statusValue)) {
      return NextResponse.json({ success: false, message: 'Invalid booking status' }, { status: 400 });
    }

    const created = await db.booking.create({
      data: {
        date: parsedDate,
        timeLabel: timeValue,
        name: nameValue,
        email: emailValue,
        phone: (body.phone || '').trim() || null,
        service: serviceValue,
        notes: (body.notes || '').trim() || null,
        status: statusValue,
      },
    });

    return NextResponse.json({ success: true, booking: toScheduleBooking(created) }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}
