import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { sendVerificationEmail } from '@/lib/server/mailer';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 },
      );
    }

    // Always respond with success to prevent email enumeration
    const admin = await db.adminUser.findUnique({
      where: { email },
      select: { id: true, fullName: true, email: true, isActive: true },
    });

    if (admin && admin.isActive) {
      const token = randomBytes(48).toString('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await db.adminUser.update({
        where: { id: admin.id },
        data: {
          resetToken: token,
          resetTokenExpiresAt: expiresAt,
        },
      });

      await sendPasswordResetEmail({
        to: admin.email,
        adminName: admin.fullName,
        token,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('[forgot-password] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 },
    );
  }
}

// Lazy import to avoid ESM issues
async function sendPasswordResetEmail(
  opts: { to: string; adminName: string; token: string },
) {
  const { sendPasswordResetEmail: fn } = await import('@/lib/server/mailer');
  return fn(opts);
}
