import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim();

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid_token', request.url));
  }

  try {
    const admin = await db.adminUser.findFirst({
      where: { verificationToken: token },
      select: { id: true, verificationToken: true },
    });

    if (!admin) {
      return NextResponse.redirect(new URL('/admin/login?error=invalid_token', request.url));
    }

    await db.adminUser.update({
      where: { id: admin.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verificationToken: null,
      },
    });

    return NextResponse.redirect(
      new URL('/admin/login?verified=1', request.url),
    );
  } catch (error) {
    console.error('[verify-email] Error:', error);
    return NextResponse.redirect(new URL('/admin/login?error=server', request.url));
  }
}
