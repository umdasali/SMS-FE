import axios from 'axios';
import { setToken, clearStoredAuth } from '@/lib/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
});

// Attach access token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// On 401 — try a silent token refresh, then retry the original request.
// If the refresh also fails, wipe all auth state and send the user to login.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newToken = (res.data as { data: { accessToken: string } }).data.accessToken;
        // Keep localStorage + cookie in sync so middleware sees the new token too
        setToken(newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        clearStoredAuth();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
