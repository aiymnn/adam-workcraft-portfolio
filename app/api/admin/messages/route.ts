import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import type { AdminContactMessageItem } from '@/types/content';

function mapMessage(row: {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}): AdminContactMessageItem {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const requestedLimit = Number.parseInt((url.searchParams.get('limit') || '50').trim(), 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 50;

  try {
    const [rows, totalCount, unreadCount] = await Promise.all([
      db.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.contactMessage.count(),
      db.contactMessage.count({ where: { isRead: false } }),
    ]);

    return NextResponse.json({
      success: true,
      messages: rows.map((row) => mapMessage(row)),
      totalCount,
      unreadCount,
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to load messages' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { id?: string; isRead?: boolean };
    const id = body.id?.trim();

    if (!id || typeof body.isRead !== 'boolean') {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const updated = await db.contactMessage.update({
      where: { id },
      data: { isRead: body.isRead },
    });

    return NextResponse.json({ success: true, messageItem: mapMessage(updated) });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update message' }, { status: 500 });
  }
}