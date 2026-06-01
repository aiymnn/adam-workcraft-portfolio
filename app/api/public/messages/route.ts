import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import type { PublicContactMessageInput } from '@/types/content';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

type ContactMessagePayload = PublicContactMessageInput & {
  website?: string;
};

const requestLog = new Map<string, number[]>();

function clientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for') || '';
  const first = xForwardedFor.split(',')[0]?.trim();
  const ip = first || request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const attempts = (requestLog.get(key) || []).filter((time) => time >= windowStart);
  attempts.push(now);
  requestLog.set(key, attempts);
  return attempts.length > RATE_LIMIT_MAX_REQUESTS;
}

function validate(payload: PublicContactMessageInput): string | null {
  const name = payload.name.trim();
  const email = payload.email.trim().toLowerCase();
  const message = payload.message.trim();

  if (name.length < 2 || name.length > 80) {
    return 'Name must be between 2 and 80 characters';
  }

  if (!EMAIL_REGEX.test(email) || email.length > 120) {
    return 'Please provide a valid email address';
  }

  if (message.length < 10 || message.length > 2000) {
    return 'Message must be between 10 and 2000 characters';
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactMessagePayload;

    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return NextResponse.json({ success: true, message: 'Message sent successfully' });
    }

    const validationError = validate(body);

    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 400 });
    }

    const email = body.email.trim().toLowerCase();
    const rateLimitKey = `${clientIp(request)}:${email}`;
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)),
          },
        },
      );
    }

    await db.contactMessage.create({
      data: {
        name: body.name.trim(),
        email,
        message: body.message.trim(),
      },
    });

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to send message' }, { status: 500 });
  }
}