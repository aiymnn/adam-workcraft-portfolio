export const ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_AUTH_STATE_COOKIE = 'admin_auth_state';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload {
  u: string;
  exp: number;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function signValue(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export function getAdminSessionTtlSeconds(): number {
  return SESSION_TTL_SECONDS;
}

export async function createAdminSessionToken(username: string, secret: string): Promise<string> {
  const payload: SessionPayload = {
    u: username,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };

  const payloadEncoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signValue(payloadEncoded, secret);
  return `${payloadEncoded}.${signature}`;
}

export async function verifyAdminSessionToken(token: string, secret: string): Promise<boolean> {
  if (!secret) return false;
  const [payloadEncoded, signature] = token.split('.');
  if (!payloadEncoded || !signature) return false;

  const expectedSignature = await signValue(payloadEncoded, secret);
  if (signature !== expectedSignature) return false;

  try {
    const payloadJson = new TextDecoder().decode(base64UrlToBytes(payloadEncoded));
    const payload = JSON.parse(payloadJson) as SessionPayload;
    if (!payload.u || !payload.exp) return false;
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}