import axios from 'axios';
import type { TokenRefreshRequest, TokenRefreshResponse } from '@/types/models';

// If VITE_API_BASE_URL تعریف نشده باشد، از همان origin استفاده می‌کنیم تا درخواست‌ها روی دامنه جاری بروند
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const getLoginRedirectPath = () => {
  try {
    const path = window.location.pathname || '';
    return path.startsWith('/admin') ? '/admin/login' : '/login';
  } catch {
    return '/login';
  }
};

// Response interceptor to handle 401 errors and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const loginRedirect = getLoginRedirectPath();

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If the original request did not include an Authorization header,
    // it's likely an unauthenticated public request — do not treat its 401
    // as a reason to purge tokens and force logout (avoids race conditions
    // where a request fires before the auth header is attached).
    const hadAuthHeader = !!originalRequest.headers?.Authorization;
    if (!hadAuthHeader) {
      return Promise.reject(error);
    }

    // If already refreshing, queue the request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      // No refresh token, redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = loginRedirect;
      return Promise.reject(error);
    }

    try {
      // Request new access token
      const response = await axios.post<TokenRefreshResponse>(
        `${API_BASE_URL}/api/auth/refresh/`,
        { refresh: refreshToken } as TokenRefreshRequest
      );

      const newAccessToken = response.data.access;
      localStorage.setItem('access_token', newAccessToken);

      // Update authorization header
      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Process queued requests
      processQueue(null, newAccessToken);

      isRefreshing = false;

      // Retry original request
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh token failed, logout user
      processQueue(refreshError, null);
      isRefreshing = false;

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = loginRedirect;

      return Promise.reject(refreshError);
    }
  }
);

export default api;
