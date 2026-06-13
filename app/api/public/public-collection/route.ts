import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section');

  try {
    const whereClause = section ? { section: section as any, isActive: true } : { isActive: true };

    const rows = await db.publicCollection.findMany({
      where: whereClause,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      items: rows,
    });
  } catch (error) {
    console.error('Failed to list public collection', error);
    return NextResponse.json({ success: false, items: [] }, { status: 500 });
  }
}
