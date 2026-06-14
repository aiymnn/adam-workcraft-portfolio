import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { hashPassword } from '@/lib/server/password';

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

function validateNewPassword(password: string): string | null {
  if (password.length < MIN_LENGTH) return 'Password must be at least 8 characters.';
  if (password.length > MAX_LENGTH) return 'Password is too long.';
  if (/\s/.test(password)) return 'Password cannot contain spaces.';
  if (!/[a-z]/.test(password)) return 'Add at least one lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Add at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Add at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Add at least one symbol.';
  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string; password?: string };
    const token = body.token?.trim();
    const password = body.password || '';

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Reset token is required' },
        { status: 400 },
      );
    }

    const passwordError = validateNewPassword(password);
    if (passwordError) {
      return NextResponse.json(
        { success: false, message: passwordError },
        { status: 400 },
      );
    }

    const admin = await db.adminUser.findFirst({
      where: { resetToken: token },
      select: { id: true, resetToken: true, resetTokenExpiresAt: true },
    });

    if (!admin || !admin.resetTokenExpiresAt) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset link.' },
        { status: 400 },
      );
    }

    if (admin.resetTokenExpiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Reset link has expired. Request a new one.' },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    await db.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        isVerified: true,   // auto-verify if they proved email access
        verifiedAt: new Date(),
        verificationToken: null,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    console.error('[reset-password] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 },
    );
  }
}
