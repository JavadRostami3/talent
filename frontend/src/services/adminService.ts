import api from './api';
import { StudentProfile } from './userService';

export interface CategoryStats {
  total: number;
  pendingReview: number;
  approved: number;
  rejected: number;
}

export interface AdminStats {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  registrationOpen: boolean;
  categories: {
    phd_exam: CategoryStats;
    masters_talented: CategoryStats;
    phd_talented: CategoryStats;
    olympiad: CategoryStats;
  };
}

export interface ApplicationFilter {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  // دسته متقاضی برای فیلتر کردن در صفحات مختلف مدیریت
  category?: 'phd_exam' | 'masters_talented' | 'phd_talented' | 'olympiad';
}

export interface ApplicationsResponse {
  applications: StudentProfile[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ReviewRequest {
  status: 'approved' | 'defective';
  feedback?: string;
}

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';
const MOCK_APPLICATIONS_KEY = 'mockApplications';
const MOCK_REGISTRATION_KEY = 'mockRegistrationOpen';

// ایجاد کاربران فیک برای ۴ دسته مختلف (آزمون دکتری، ارشد، دکتری، المپیاد)
const createMockApplications = (): StudentProfile[] => {
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const baseDocuments = (prefix: string, uploadedAt: string): StudentProfile['documents'] => [
    {
      id: `${prefix}-doc-1`,
      name: 'کارنامه_تحصیلی.pdf',
      url: '#',
      type: 'transcript',
      uploadedAt,
    },
    {
      id: `${prefix}-doc-2`,
      name: 'شناسنامه.jpg',
      url: '#',
      type: 'id_card',
      uploadedAt,
    },
    {
      id: `${prefix}-doc-3`,
      name: 'عکس_پرسنلی.jpg',
      url: '#',
      type: 'photo',
      uploadedAt,
    },
  ];

  const makeApplication = (
    id: string,
    name: string,
    nationalId: string,
    phone: string,
    gpa: number,
    universityRank: number,
    talentType: string,
    status: StudentProfile['status'],
    category: StudentProfile['category'],
    createdAt: string,
    adminFeedback?: string,
  ): StudentProfile => ({
    id,
    name,
    nationalId,
    phone,
    gpa,
    universityRank,
    talentType,
    status,
    category,
    adminFeedback,
    documents: baseDocuments(id, createdAt),
    createdAt,
    updatedAt: createdAt,
  });

  return [
    // آزمون دکتری - 3 کاربر: تأیید شده، رد شده، در حال بررسی
    makeApplication(
      'phd-exam-1',
      'علی آزمونی',
      '9000000001',
      '09120000001',
      18.5,
      10,
      'آزمون دکتری',
      'approved',
      'phd_exam',
      daysAgo(2),
    ),
    makeApplication(
      'phd-exam-2',
      'مریم آزمونی',
      '9000000002',
      '09120000002',
      17.8,
      25,
      'آزمون دکتری',
      'defective',
      'phd_exam',
      daysAgo(4),
      'مدارک تکمیلی پایان‌نامه بارگذاری نشده است.',
    ),
    (() => {
      const createdAt = daysAgo(1);
      const app = makeApplication(
        'phd-exam-3',
        'حسین آزمونی',
        '9000000003',
        '09120000003',
        18.9,
        5,
        'آزمون دکتری',
        'under_review',
        'phd_exam',
        createdAt,
      );
      return {
        ...app,
        documents: [
          ...app.documents!,
          {
            id: 'phd-exam-3-doc-national-id',
            name: 'کارت_ملی.jpg',
            url: '/test-assets/test-national-id.svg',
            type: 'national_id',
            uploadedAt: createdAt,
          },
        ],
      };
    })(),

    // استعدادهای درخشان ارشد - 3 کاربر: تأیید شده، رد شده، در حال بررسی
    makeApplication(
      'masters-talented-1',
      'زهرا ارشدی',
      '8000000001',
      '09130000001',
      19.2,
      8,
      'استعداد درخشان ارشد',
      'approved',
      'masters_talented',
      daysAgo(3),
    ),
    makeApplication(
      'masters-talented-2',
      'سینا ارشدی',
      '8000000002',
      '09130000002',
      18.1,
      20,
      'استعداد درخشان ارشد',
      'defective',
      'masters_talented',
      daysAgo(6),
      'کارنامه مقطع کارشناسی ناقص است.',
    ),
    makeApplication(
      'masters-talented-3',
      'نرگس ارشدی',
      '8000000003',
      '09130000003',
      18.7,
      12,
      'استعداد درخشان ارشد',
      'under_review',
      'masters_talented',
      daysAgo(1),
    ),

    // استعدادهای درخشان دکتری - 3 کاربر: تأیید شده، رد شده، در حال بررسی
    makeApplication(
      'phd-talented-1',
      'رضا دکتری',
      '7000000001',
      '09140000001',
      19.4,
      6,
      'استعداد درخشان دکتری',
      'approved',
      'phd_talented',
      daysAgo(5),
    ),
    makeApplication(
      'phd-talented-2',
      'لیلا دکتری',
      '7000000002',
      '09140000002',
      18.3,
      18,
      'استعداد درخشان دکتری',
      'defective',
      'phd_talented',
      daysAgo(9),
      'مدرک زبان معتبر بارگذاری نشده است.',
    ),
    makeApplication(
      'phd-talented-3',
      'مجتبی دکتری',
      '7000000003',
      '09140000003',
      18.0,
      22,
      'استعداد درخشان دکتری',
      'under_review',
      'phd_talented',
      daysAgo(2),
    ),

    // المپیاد علمی - 3 کاربر: تأیید شده، رد شده، در حال بررسی
    makeApplication(
      'olympiad-1',
      'سارا المپیادی',
      '6000000001',
      '09150000001',
      19.0,
      7,
      'المپیاد علمی',
      'approved',
      'olympiad',
      daysAgo(4),
    ),
    makeApplication(
      'olympiad-2',
      'مهدی المپیادی',
      '6000000002',
      '09150000002',
      18.2,
      19,
      'المپیاد علمی',
      'defective',
      'olympiad',
      daysAgo(8),
      'گواهی رتبه المپیاد به‌درستی خوانا نیست.',
    ),
    makeApplication(
      'olympiad-3',
      'الهام المپیادی',
      '6000000003',
      '09150000003',
      18.6,
      11,
      'المپیاد علمی',
      'under_review',
      'olympiad',
      daysAgo(2),
    ),
  ];
};

const getMockApplications = (): StudentProfile[] => {
  // برای هم‌خوانی با سناریوی تست جدید، همیشه داده‌های تستی را از نو می‌سازیم
  // این کار تضمین می‌کند که دقیقاً ۱۲ کاربر تستی (۳ کاربر برای هر دسته با وضعیت‌های مشخص) داشته باشیم
  // و هر داده‌ی قدیمی/آلوده‌ای در localStorage نادیده گرفته شود.
  const applications = createMockApplications();
  try {
    localStorage.setItem(MOCK_APPLICATIONS_KEY, JSON.stringify(applications));
  } catch (error) {
    console.error('Error saving mock applications to localStorage:', error);
  }
  return applications;
};

const persistMockApplications = (applications: StudentProfile[]) => {
  localStorage.setItem(MOCK_APPLICATIONS_KEY, JSON.stringify(applications));
};

const getMockStats = (): AdminStats => {
  const applications = getMockApplications();
  
  const calculateCategoryStats = (category: 'phd_exam' | 'masters_talented' | 'phd_talented' | 'olympiad'): CategoryStats => {
    const categoryApps = applications.filter((app) => app.category === category);
    return {
      total: categoryApps.length,
      pendingReview: categoryApps.filter((app) => app.status === 'under_review').length,
      approved: categoryApps.filter((app) => app.status === 'approved').length,
      rejected: categoryApps.filter((app) => app.status === 'defective').length,
    };
  };

  return {
    totalApplications: applications.length,
    pendingReview: applications.filter((app) => app.status === 'under_review').length,
    approved: applications.filter((app) => app.status === 'approved').length,
    rejected: applications.filter((app) => app.status === 'defective').length,
    registrationOpen: localStorage.getItem(MOCK_REGISTRATION_KEY) !== 'false',
    categories: {
      phd_exam: calculateCategoryStats('phd_exam'),
      masters_talented: calculateCategoryStats('masters_talented'),
      phd_talented: calculateCategoryStats('phd_talented'),
      olympiad: calculateCategoryStats('olympiad'),
    },
  };
};

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    if (USE_MOCK_API) {
      return Promise.resolve(getMockStats());
    }
    try {
      const response = await api.get<AdminStats>('/admin/stats');
      const data = response.data;
      // اگر API ساختار قدیمی را برگرداند، categories را محاسبه کنیم
      if (!data.categories) {
        const applications = getMockApplications();
        const calculateCategoryStats = (category: 'phd_exam' | 'masters_talented' | 'phd_talented' | 'olympiad'): CategoryStats => {
          const categoryApps = applications.filter((app) => app.category === category);
          return {
            total: categoryApps.length,
            pendingReview: categoryApps.filter((app) => app.status === 'under_review').length,
            approved: categoryApps.filter((app) => app.status === 'approved').length,
            rejected: categoryApps.filter((app) => app.status === 'defective').length,
          };
        };
        return {
          ...data,
          categories: {
            phd_exam: calculateCategoryStats('phd_exam'),
            masters_talented: calculateCategoryStats('masters_talented'),
            phd_talented: calculateCategoryStats('phd_talented'),
            olympiad: calculateCategoryStats('olympiad'),
          },
        };
      }
      return data;
    } catch (error) {
      // Fallback to mock if API is not available
      console.warn('API not available, using mock data:', error);
      return Promise.resolve(getMockStats());
    }
  },

  getApplications: async (filters: ApplicationFilter): Promise<ApplicationsResponse> => {
    const getMockApplicationsResponse = () => {
      let applications = getMockApplications();

      // فیلتر بر اساس دسته
      if (filters.category) {
        applications = applications.filter((app) => app.category === filters.category);
      }

      // فیلتر بر اساس وضعیت
      if (filters.status) {
        applications = applications.filter((app) => app.status === filters.status);
      }

      // فیلتر بر اساس جستجو (کد ملی، نام، دسته پرونده)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        applications = applications.filter(
          (app) =>
            app.nationalId.includes(searchTerm) ||
            app.name.toLowerCase().includes(searchTerm) ||
            (app.category && app.category.toLowerCase().includes(searchTerm))
        );
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const total = applications.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedApplications = applications.slice(startIndex, endIndex);

      return {
        applications: paginatedApplications,
        total,
        page,
        totalPages,
      };
    };

    if (USE_MOCK_API) {
      return Promise.resolve(getMockApplicationsResponse());
    }
    try {
      const response = await api.get<ApplicationsResponse>('/admin/applications', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      // Fallback to mock if API is not available
      console.warn('API not available, using mock data:', error);
      return Promise.resolve(getMockApplicationsResponse());
    }
  },

  getApplication: async (id: string): Promise<StudentProfile> => {
    if (USE_MOCK_API) {
      const applications = getMockApplications();
      const application = applications.find((app) => app.id === id);
      if (!application) {
        throw new Error('Application not found');
      }
      return Promise.resolve(application);
    }
    try {
      const response = await api.get<StudentProfile>(`/admin/applications/${id}`);
      return response.data;
    } catch (error) {
      // Fallback to mock if API is not available
      console.warn('API not available, using mock data:', error);
      const applications = getMockApplications();
      const application = applications.find((app) => app.id === id);
      if (!application) {
        throw new Error('Application not found');
      }
      return Promise.resolve(application);
    }
  },

  reviewApplication: async (id: string, data: ReviewRequest): Promise<StudentProfile> => {
    const updateMockApplication = () => {
      const applications = getMockApplications();
      const applicationIndex = applications.findIndex((app) => app.id === id);
      if (applicationIndex === -1) {
        throw new Error('Application not found');
      }

      const updatedApplication: StudentProfile = {
        ...applications[applicationIndex],
        status: data.status,
        adminFeedback: data.feedback || undefined,
        updatedAt: new Date().toISOString(),
      };

      applications[applicationIndex] = updatedApplication;
      persistMockApplications(applications);

      return updatedApplication;
    };

    if (USE_MOCK_API) {
      return Promise.resolve(updateMockApplication());
    }
    try {
      const response = await api.post<StudentProfile>(`/admin/applications/${id}/review`, data);
      return response.data;
    } catch (error) {
      // Fallback to mock if API is not available
      console.warn('API not available, using mock data:', error);
      return Promise.resolve(updateMockApplication());
    }
  },

  toggleRegistration: async (isOpen: boolean): Promise<{ registrationOpen: boolean }> => {
    if (USE_MOCK_API) {
      localStorage.setItem(MOCK_REGISTRATION_KEY, String(isOpen));
      return Promise.resolve({ registrationOpen: isOpen });
    }
    try {
      const response = await api.post<{ registrationOpen: boolean }>('/admin/registration/toggle', {
        isOpen,
      });
      return response.data;
    } catch (error) {
      // Fallback to mock if API is not available
      console.warn('API not available, using mock data:', error);
      localStorage.setItem(MOCK_REGISTRATION_KEY, String(isOpen));
      return Promise.resolve({ registrationOpen: isOpen });
    }
  },
};

// Helper function for development/testing - change application status manually
export const resetApplicationStatus = (
  userId: string,
  newStatus: 'draft' | 'under_review' | 'defective' | 'approved',
  feedback?: string
): void => {
  if (!USE_MOCK_API) {
    console.warn('resetApplicationStatus only works in mock mode');
    return;
  }

  const applications = getMockApplications();
  const applicationIndex = applications.findIndex((app) => app.id === userId);
  
  if (applicationIndex === -1) {
    console.error(`Application with id ${userId} not found`);
    return;
  }

  applications[applicationIndex] = {
    ...applications[applicationIndex],
    status: newStatus,
    adminFeedback: feedback || undefined,
    updatedAt: new Date().toISOString(),
  };

  persistMockApplications(applications);
  console.log(`Application ${userId} status changed to: ${newStatus}`);
};

// Make it available globally for easy access from browser console
if (typeof window !== 'undefined' && USE_MOCK_API) {
  (window as any).resetApplicationStatus = resetApplicationStatus;
  (window as any).getMockApplications = () => getMockApplications();
  console.log('Mock helpers available: resetApplicationStatus(userId, status, feedback?), getMockApplications()');
}
