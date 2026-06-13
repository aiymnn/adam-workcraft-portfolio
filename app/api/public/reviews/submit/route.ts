import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { uploadFileToGoogleDrive } from '@/lib/server/google-drive';

/**
 * POST /api/public/reviews/submit
 * Submits a review using a valid unique code. No auth required.
 * Handles multipart/form-data for local file uploads to Google Drive.
 * Atomically creates the Review and marks the Booking as submitted.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const codeRaw = formData.get('code');
    const authorRaw = formData.get('author');
    const roleRaw = formData.get('role');
    const quoteRaw = formData.get('quote');

    const code = typeof codeRaw === 'string' ? codeRaw.trim().toUpperCase() : '';
    const author = typeof authorRaw === 'string' ? authorRaw.trim() : '';
    const role = typeof roleRaw === 'string' ? roleRaw.trim() : '';
    const quote = typeof quoteRaw === 'string' ? quoteRaw.trim() : '';

    if (!code) {
      return NextResponse.json({ success: false, message: 'Review code is required' }, { status: 400 });
    }
    if (!author || !quote) {
      return NextResponse.json({ success: false, message: 'Name and review text are required' }, { status: 400 });
    }

    // Find booking by code first to prevent unauthorized uploads
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

    // Extract files from formData
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value);
      }
    }

    const collection: Array<{ src: string; type: 'image' | 'video' }> = [];

    // Upload files to Google Drive
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      
      // We make public by default since it's a review collection that the admin will view/use
      const uploaded = await uploadFileToGoogleDrive(file, {
        makePublic: true,
      });

      collection.push({
        src: `/api/media/${uploaded.id}`,
        type,
      });
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
