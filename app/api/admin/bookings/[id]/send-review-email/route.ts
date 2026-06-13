import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import { generateReviewCode, toScheduleBooking } from '../../_utils';
import { sendReviewInviteEmail } from '@/lib/server/mailer';

/**
 * POST /api/admin/bookings/[id]/send-review-email
 * Generates a review code (if not yet set) and sends it to the client's email.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing booking id' }, { status: 400 });
  }

  try {
    const booking = await db.booking.findUnique({ where: { id } });

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { success: false, message: 'Only confirmed bookings can receive review invites' },
        { status: 400 }
      );
    }

    if (booking.reviewSubmitted) {
      return NextResponse.json(
        { success: false, message: 'A review has already been submitted for this booking' },
        { status: 400 }
      );
    }

    // Generate a new code if one doesn't exist yet
    const reviewCode = booking.reviewCode || generateReviewCode();

    const updated = await db.booking.update({
      where: { id },
      data: { reviewCode },
    });

    // Send the email
    const emailResult = await sendReviewInviteEmail({
      to: booking.email,
      clientName: booking.name,
      service: booking.service,
      reviewCode,
    });

    return NextResponse.json({
      success: true,
      booking: toScheduleBooking(updated),
      email: emailResult,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }
    console.error('[send-review-email]', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
