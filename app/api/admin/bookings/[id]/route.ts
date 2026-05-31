import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import { generateReviewCode, isBookingStatus, isValidTimeLabel, parseDateOnlyToUtc, toScheduleBooking } from '../_utils';

interface BookingUpdateBody {
  date?: string;
  time?: string;
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  notes?: string;
  status?: string;
  reviewSubmitted?: boolean;
  generateReviewCode?: boolean;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing booking id' }, { status: 400 });
  }

  try {
    const body = (await request.json()) as BookingUpdateBody;
    const data: Prisma.BookingUpdateInput = {};

    if (body.date !== undefined) {
      const date = parseDateOnlyToUtc(String(body.date).trim());
      if (!date) {
        return NextResponse.json({ success: false, message: 'Invalid date format' }, { status: 400 });
      }
      data.date = date;
    }

    if (body.time !== undefined) {
      const time = String(body.time).trim();
      if (!isValidTimeLabel(time)) {
        return NextResponse.json({ success: false, message: 'Invalid time format' }, { status: 400 });
      }
      data.timeLabel = time;
    }

    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.email !== undefined) data.email = String(body.email).trim();
    if (body.phone !== undefined) data.phone = String(body.phone).trim() || null;
    if (body.service !== undefined) data.service = String(body.service).trim();
    if (body.notes !== undefined) data.notes = String(body.notes).trim() || null;

    if (body.status !== undefined) {
      const status = String(body.status).trim().toLowerCase();
      if (!isBookingStatus(status)) {
        return NextResponse.json({ success: false, message: 'Invalid booking status' }, { status: 400 });
      }
      data.status = status;
    }

    if (body.reviewSubmitted !== undefined) {
      data.reviewSubmitted = Boolean(body.reviewSubmitted);
    }

    if (body.generateReviewCode === true) {
      data.reviewCode = generateReviewCode();
      data.reviewSubmitted = false;
    }

    const updated = await db.booking.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, booking: toScheduleBooking(updated) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing booking id' }, { status: 400 });
  }

  try {
    await db.booking.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Failed to delete booking' }, { status: 400 });
  }
}
