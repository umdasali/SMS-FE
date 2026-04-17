import { User, UserRole } from '@/types';

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User, token: string): void => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('accessToken', token);
};

export const clearStoredAuth = (): void => {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
};

export const getRoleRedirect = (role: UserRole): string => {
  switch (role) {
    case 'saas_admin': return '/saas-admin/dashboard';
    case 'management': return '/dashboard';
    case 'teacher': return '/dashboard';
    case 'student': return '/portal/profile';
    default: return '/login';
  }
};

export const canAccess = (role: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(role);
};
