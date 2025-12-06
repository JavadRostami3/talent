import api from './api';

export interface StudentProfile {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
  // دسته متقاضی برای صفحات مدیریت (آزمون دکتری، استعداد درخشان ارشد/دکتری، المپیاد)
  category?: 'phd_exam' | 'masters_talented' | 'phd_talented' | 'olympiad';
  gpa?: number;
  universityRank?: number;
  talentType?: string;
  status: 'draft' | 'under_review' | 'defective' | 'approved';
  adminFeedback?: string;
  documents?: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  gpa?: number;
  universityRank?: number;
  talentType?: string;
}

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';
const MOCK_PROFILE_KEY = 'mockStudentProfile';

const createMockProfile = (): StudentProfile => ({
  id: 'mock-student',
  name: 'دانشجوی نمونه',
  nationalId: '0000000000',
  phone: '09120000000',
  gpa: 18.5,
  universityRank: 25,
  talentType: 'پژوهشی',
  status: 'draft',
  documents: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const getMockProfile = (): StudentProfile => {
  const stored = localStorage.getItem(MOCK_PROFILE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const profile = createMockProfile();
  localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(profile));
  return profile;
};

const persistMockProfile = (profile: StudentProfile) => {
  const updated = { ...profile, updatedAt: new Date().toISOString() };
  localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(updated));
  return updated;
};

export const userService = {
  getProfile: async (): Promise<StudentProfile> => {
    if (USE_MOCK_API) {
      return Promise.resolve(getMockProfile());
    }
    const response = await api.get<StudentProfile>('/user/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<StudentProfile> => {
    if (USE_MOCK_API) {
      const profile = getMockProfile();
      const updatedProfile = persistMockProfile({
        ...profile,
        ...data,
      });
      return Promise.resolve(updatedProfile);
    }
    const response = await api.put<StudentProfile>('/user/profile', data);
    return response.data;
  },

  submitApplication: async (): Promise<StudentProfile> => {
    if (USE_MOCK_API) {
      const profile = getMockProfile();
      const updatedProfile = persistMockProfile({
        ...profile,
        status: 'under_review',
        adminFeedback: undefined,
      });
      return Promise.resolve(updatedProfile);
    }
    const response = await api.post<StudentProfile>('/user/submit');
    return response.data;
  },
};
