const AUTH_STATE_COOKIE = 'admin_auth_state';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const found = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split('=')[1] || '') : null;
}

export function isAuthenticated(): boolean {
  return readCookie(AUTH_STATE_COOKIE) === '1';
}

export async function checkSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
    });

    if (!res.ok) return false;
    const data = (await res.json()) as { authenticated?: boolean };
    return data.authenticated === true;
  } catch {
    return false;
  }
}

export async function login(
  username: string,
  password: string,
): Promise<{ success: boolean; requiresVerification?: boolean }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ username, password }),
    });

    const data = (await res.json()) as {
      success?: boolean;
      requiresVerification?: boolean;
    };

    if (res.ok && data.success) {
      return {
        success: true,
        requiresVerification: data.requiresVerification === true,
      };
    }

    return { success: false };
  } catch {
    return { success: false };
  }
}


export async function logout(): Promise<void> {
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_STATE_COOKIE}=; Max-Age=0; path=/; samesite=lax`;
  }
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch {}
}

export function getLastPage(): string | null {
  const page = localStorage.getItem('admin_last_page');
  localStorage.removeItem('admin_last_page');
  return page;
}

export function setLastPage(page: string) {
  localStorage.setItem('admin_last_page', page);
}
