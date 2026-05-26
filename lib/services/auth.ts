const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

export function authenticate(username: string, password: string): boolean {
  return username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('admin_auth') === 'true';
}

export function login(username: string, password: string): boolean {
  if (!authenticate(username, password)) return false;
  localStorage.setItem('admin_auth', 'true');
  return true;
}

export function logout() {
  localStorage.removeItem('admin_auth');
}

export function getLastPage(): string | null {
  const page = localStorage.getItem('admin_last_page');
  localStorage.removeItem('admin_last_page');
  return page;
}

export function setLastPage(page: string) {
  localStorage.setItem('admin_last_page', page);
}
