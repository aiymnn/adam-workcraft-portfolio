import { createHash, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';

interface VisitTrackBody {
  path?: string;
}

const VISIT_SESSION_COOKIE = 'aw_visit_sid';
const VISIT_DEDUP_WINDOW_MS = 45_000;
const DEFAULT_HASH_SALT = 'adam-workcraft-visit';

function normalizePath(value: string | undefined): string {
  if (!value) return '/';
  const trimmed = value.trim();
  if (!trimmed.startsWith('/')) return '/';
  return trimmed.slice(0, 255) || '/';
}

function getLanguage(request: NextRequest): string | null {
  const header = request.headers.get('accept-language');
  if (!header) return null;
  const first = header.split(',')[0]?.trim();
  return first ? first.slice(0, 32) : null;
}

function getReferrer(request: NextRequest): string | null {
  const ref = request.headers.get('referer')?.trim();
  if (!ref) return null;
  return ref.slice(0, 2048);
}

function getCountry(request: NextRequest): string | null {
  const country = (
    request.headers.get('x-vercel-ip-country')
    || request.headers.get('cf-ipcountry')
    || request.headers.get('x-country-code')
    || ''
  ).trim();

  return country ? country.slice(0, 8) : null;
}

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  return realIp || null;
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.VISIT_HASH_SALT || DEFAULT_HASH_SALT;
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

function parseBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
  if (ua.includes('chrome/') && !ua.includes('edg/')) return 'Chrome';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
  if (ua.includes('firefox/')) return 'Firefox';
  if (ua.includes('msie') || ua.includes('trident/')) return 'Internet Explorer';
  return 'Other';
}

function parseOs(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os')) return 'macOS';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'iOS';
  if (ua.includes('linux')) return 'Linux';
  return 'Other';
}

function parseDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) return 'Mobile';
  return 'Desktop';
}

export async function POST(request: NextRequest) {
  let body: VisitTrackBody = {};

  try {
    body = (await request.json()) as VisitTrackBody;
  } catch {
    body = {};
  }

  const path = normalizePath(body.path);
  const userAgent = (request.headers.get('user-agent') || 'unknown').slice(0, 512);
  const browser = parseBrowser(userAgent);
  const os = parseOs(userAgent);
  const deviceType = parseDeviceType(userAgent);
  const language = getLanguage(request);
  const referrer = getReferrer(request);
  const country = getCountry(request);

  let sessionId = request.cookies.get(VISIT_SESSION_COOKIE)?.value || '';
  const shouldSetCookie = !sessionId;
  if (!sessionId) sessionId = randomUUID();

  const visitedAtCutoff = new Date(Date.now() - VISIT_DEDUP_WINDOW_MS);
  const duplicate = await db.pageVisit.findFirst({
    where: {
      sessionId,
      path,
      visitedAt: { gte: visitedAtCutoff },
    },
    select: { id: true },
  });

  if (!duplicate) {
    await db.pageVisit.create({
      data: {
        path,
        sessionId,
        userAgent,
        browser,
        os,
        deviceType,
        language,
        referrer,
        country,
        ipHash: hashIp(getClientIp(request)),
      },
    });
  }

  const response = NextResponse.json({ success: true, tracked: !duplicate });
  if (shouldSetCookie) {
    response.cookies.set(VISIT_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}
