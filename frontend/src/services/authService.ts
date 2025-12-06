import api from './api';
import type { 
  RegisterRequest, 
  RegisterResponse, 
  LoginRequest, 
  LoginResponse,
  User 
} from '@/types/models';

export const authService = {
  /**
   * ثبت‌نام اولیه داوطلب
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/api/auth/register/', data);
    return response.data;
  },

  /**
   * ورود با کد ملی و کد پیگیری
   */
  login: async (national_id: string, tracking_code: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/login/', {
      national_id,
      tracking_code,
    } as LoginRequest);

    if (response.data.access && response.data.refresh) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  /**
   * خروج از سیستم
   */
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  /**
   * دریافت اطلاعات کاربر فعلی
   */
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * بررسی وضعیت احراز هویت
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },

  /**
   * دریافت Access Token
   */
  getAccessToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  /**
   * دریافت Refresh Token
   */
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refresh_token');
  },
};
