import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';

interface ReorderPayload {
  collections: Array<{ id: string; sortOrder: number }>;
}

export async function PATCH(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ReorderPayload;

    if (!body.collections || !Array.isArray(body.collections)) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    // Execute updates in a transaction to ensure atomicity
    await db.$transaction(
      body.collections.map((item) =>
        db.vaultCollection.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true, message: 'Order updated' });
  } catch (error) {
    console.error('Failed to reorder vault collections', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    );
  }
}
