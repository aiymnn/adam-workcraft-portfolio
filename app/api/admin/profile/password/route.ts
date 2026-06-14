import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import { hashPassword, verifyPassword } from '@/lib/server/password';

function validateNewPassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 128) return 'Password is too long.';
  if (/\s/.test(password)) return 'Password cannot contain spaces.';
  if (!/[a-z]/.test(password)) return 'Add at least one lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Add at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Add at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Add at least one symbol.';
  return null;
}

export async function PATCH(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { currentPassword?: string; newPassword?: string };
    const currentPassword = body.currentPassword || '';
    const newPassword = body.newPassword || '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current and new password are required' },
        { status: 400 },
      );
    }

    const passwordError = validateNewPassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ success: false, message: passwordError }, { status: 400 });
    }

    // Get current admin from session cookie
    const { getAdminSessionUsername } = await import('@/lib/server/admin-session');
    const { ADMIN_SESSION_COOKIE } = await import('@/lib/server/admin-session');
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || '';
    const username = getAdminSessionUsername(token);

    if (!username) {
      return NextResponse.json({ success: false, message: 'Session invalid' }, { status: 401 });
    }

    const admin = await db.adminUser.findUnique({
      where: { username },
      select: { id: true, passwordHash: true },
    });

    if (!admin) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    const isCurrentValid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect.' },
        { status: 400 },
      );
    }

    const newHash = await hashPassword(newPassword);
    await db.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('[profile/password] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 },
    );
  }
}
