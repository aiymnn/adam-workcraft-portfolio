import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import { PublicSection } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminRequestAuthenticated(req);
    if (!authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items } = body as { items: { id: string; sortOrder: number }[] };

    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    // Process reordering sequentially using transactions for safety
    await prisma.$transaction(
      items.map((item) =>
        prisma.publicCollection.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true, message: 'Reordered successfully' });
  } catch (error: any) {
    console.error('[Admin] Reorder public collection error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
