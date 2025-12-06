import api from './api';
import type { 
  RegisterRequest, 
  RegisterResponse, 
  LoginRequest, 
  LoginResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  User 
} from '@/types/models';

/**
 * Admin Login Request (with password)
 */
export interface AdminLoginRequest {
  national_id: string;
  password: string;
}

export const authService = {
  /**
   * ثبت‌نام اولیه داوطلب
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/api/auth/register/', data);
    return response.data;
  },

  /**
   * ورود دانشجویان با کد ملی و کد پیگیری
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
      
      // Store application info if available
      if (response.data.application_id) {
        localStorage.setItem('application_id', response.data.application_id.toString());
      }
      if (response.data.tracking_code) {
        localStorage.setItem('tracking_code', response.data.tracking_code);
      }
    }

    return response.data;
  },

  /**
   * ورود مدیران با کد ملی و رمز عبور
   */
  adminLogin: async (national_id: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/login/', {
      national_id,
      password,
    } as AdminLoginRequest);

    // بررسی نقش کاربر
    if (response.data.user.role === 'APPLICANT') {
      throw new Error('دسترسی غیرمجاز. لطفاً از صفحه ورود دانشجویان استفاده کنید.');
    }

    if (!response.data.user.is_staff) {
      throw new Error('دسترسی محدود. لطفاً با پشتیبانی تماس بگیرید.');
    }

    if (response.data.access && response.data.refresh) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  /**
   * تمدید توکن
   */
  refreshToken: async (): Promise<string> => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      throw new Error('Refresh token not found');
    }

    const response = await api.post<TokenRefreshResponse>('/api/auth/refresh/', {
      refresh,
    } as TokenRefreshRequest);

    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
    }

    return response.data.access;
  },

  /**
   * خروج از سیستم
   */
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('application_id');
    localStorage.removeItem('tracking_code');
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
   * بررسی نقش کاربر
   */
  isApplicant: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === 'APPLICANT';
  },

  isUniversityAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === 'UNIVERSITY_ADMIN';
  },

  isFacultyAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === 'FACULTY_ADMIN';
  },

  isSystemAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === 'SYSTEM_ADMIN';
  },

  isAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.is_staff === true;
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

  /**
   * دریافت Application ID
   */
  getApplicationId: (): number | null => {
    const id = localStorage.getItem('application_id');
    return id ? parseInt(id, 10) : null;
  },

  /**
   * دریافت Tracking Code
   */
  getTrackingCode: (): string | null => {
    return localStorage.getItem('tracking_code');
  },
};
