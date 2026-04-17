import { User, UserRole } from '@/types';

const COOKIE_NAME = 'accessToken';

function writeCookie(value: string, days = 7): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  // Omit Secure so it works on http://localhost in development.
  document.cookie = `${COOKIE_NAME}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function eraseCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

/** Called after login AND after a silent token refresh — keeps cookie in sync. */
export const setToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
  writeCookie(token);
};

export const setStoredUser = (user: User, token: string): void => {
  localStorage.setItem('user', JSON.stringify(user));
  setToken(token);
};

export const clearStoredAuth = (): void => {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  eraseCookie();
};

export const getRoleRedirect = (role: UserRole): string => {
  switch (role) {
    case 'saas_admin': return '/saas-admin/dashboard';
    case 'management': return '/dashboard';
    case 'teacher':    return '/dashboard';
    case 'student':    return '/portal/profile';
    default:           return '/login';
  }
};

export const canAccess = (role: UserRole, allowedRoles: UserRole[]): boolean =>
  allowedRoles.includes(role);
