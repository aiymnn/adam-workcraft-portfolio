import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { db } from '@/lib/server/db/client';
import { sendVerificationEmail } from '@/lib/server/mailer';
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/server/admin-session';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const secret = process.env.AUTH_SECRET || '';
    if (!token || !secret) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const authenticated = await verifyAdminSessionToken(token, secret);
    if (!authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const username = payload.username;

    const admin = await db.adminUser.findUnique({ where: { username } });
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    if (admin.isVerified) {
      return NextResponse.json({ success: false, message: 'Already verified' }, { status: 400 });
    }

    const verificationToken = randomBytes(48).toString('hex');

    await db.adminUser.update({
      where: { id: admin.id },
      data: { verificationToken },
    });

    void sendVerificationEmail({
      to: admin.email,
      adminName: admin.fullName,
      token: verificationToken,
    });

    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('[SEND_VERIFICATION_ERROR]', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
