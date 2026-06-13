import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';

interface SubmitReviewBody {
  code?: string;
  author?: string;
  role?: string;
  quote?: string;
  collection?: Array<{ src?: string; type?: 'image' | 'video' }>;
}

/**
 * POST /api/public/reviews/submit
 * Submits a review using a valid unique code. No auth required.
 * Atomically creates the Review and marks the Booking as submitted.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubmitReviewBody;

    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    const author = typeof body.author === 'string' ? body.author.trim() : '';
    const role = typeof body.role === 'string' ? body.role.trim() : '';
    const quote = typeof body.quote === 'string' ? body.quote.trim() : '';

    if (!code) {
      return NextResponse.json({ success: false, message: 'Review code is required' }, { status: 400 });
    }
    if (!author || !quote) {
      return NextResponse.json({ success: false, message: 'Name and review text are required' }, { status: 400 });
    }

    // Validate media collection
    const rawCollection = Array.isArray(body.collection) ? body.collection : [];
    const collection: Array<{ src: string; type: 'image' | 'video' }> = [];
    for (const item of rawCollection) {
      const src = typeof item?.src === 'string' ? item.src.trim() : '';
      if (!src) continue;
      const type = item.type === 'video' ? 'video' : 'image';
      collection.push({ src, type });
    }

    // Find booking by code
    const booking = await db.booking.findFirst({
      where: { reviewCode: code },
      select: { id: true, reviewSubmitted: true, status: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Invalid review code' }, { status: 404 });
    }
    if (booking.reviewSubmitted) {
      return NextResponse.json(
        { success: false, message: 'This code has already been used.' },
        { status: 409 }
      );
    }
    if (booking.status !== 'confirmed') {
      return NextResponse.json({ success: false, message: 'This code is not yet active.' }, { status: 400 });
    }

    // Create review + mark booking as submitted atomically
    await db.$transaction([
      db.review.create({
        data: {
          author,
          role: role || null,
          quote,
          media: {
            create: collection.map((item, index) => ({
              src: item.src,
              type: item.type,
              sortOrder: index,
            })),
          },
        },
      }),
      db.booking.update({
        where: { id: booking.id },
        data: { reviewSubmitted: true },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Review submitted successfully' }, { status: 201 });
  } catch (err) {
    console.error('[submit-review]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
