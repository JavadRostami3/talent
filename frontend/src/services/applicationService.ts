/**
 * Application Service - سرویس یکپارچه مدیریت پرونده‌های ثبت‌نام
 * 
 * این سرویس تمام عملیات مربوط به پرونده‌های ثبت‌نام را مدیریت می‌کند:
 * - CRUD پرونده‌ها
 * - مدیریت انتخاب رشته‌ها
 * - مدیریت سوابق تحصیلی
 * - مدیریت سوابق پژوهشی
 * - مدیریت مدارک
 * - بررسی‌های ادمین (دانشگاه/دانشکده)
 * - امتیازدهی و مصاحبه
 * - تصمیمات پذیرش
 * 
 * @version 2.0
 * @date 2025-12-07
 */

import api from './api';
import type {
  Application,
  ApplicationChoice,
  ApplicationChoiceCreateRequest,
  EducationRecord,
  EducationRecordCreateRequest,
  ResearchRecord,
  ResearchRecordType,
  ResearchRecordCreateRequest,
  ApplicationDocument,
  PaginatedResponse,
  StatisticsResponse,
  UniversityReviewRequest,
  DocumentReviewRequest,
  FacultyReviewRequest,
  InterviewScoringRequest,
  ScoringRequest,
  ApplicationFilterValues,
  UnifiedResearchResponse,
  DocumentReview,
  DocumentUploadProgress,
  DocumentType,
} from '@/types/models';

// ============================================
// INTERFACES
// ============================================

/**
 * Bulk Document Upload Request
 */
export interface BulkDocumentUploadRequest {
  documents: Array<{
    file: File;
    type: DocumentType;
  }>;
  onProgress?: (progress: DocumentUploadProgress[]) => void;
}

/**
 * Application Submission Request
 */
export interface ApplicationSubmissionRequest {
  application_id: number;
  confirm_accuracy?: boolean;
}

// ============================================
// APPLICATION CRUD
// ============================================

/**
 * دریافت پرونده فعلی کاربر
 */
export const getMyApplication = async (): Promise<Application> => {
  const response = await api.get<Application>('/api/applications/my/');
  return response.data;
};

/**
 * دریافت یک پرونده با ID
 */
export const getApplicationById = async (id: number): Promise<Application> => {
  const response = await api.get<Application>(`/api/applications/${id}/`);
  return response.data;
};

/**
 * دریافت لیست پرونده‌ها (برای ادمین)
 */
export const getApplications = async (
  filters?: ApplicationFilterValues
): Promise<PaginatedResponse<Application>> => {
  const params = new URLSearchParams();
  
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.round_type) params.append('round_type', filters.round_type);
  if (filters?.faculty_id) params.append('faculty', filters.faculty_id);
  if (filters?.department_id) params.append('department', filters.department_id);
  if (filters?.university_review_status) params.append('university_review_status', filters.university_review_status);
  if (filters?.faculty_review_completed !== undefined) params.append('faculty_review_completed', filters.faculty_review_completed);
  if (filters?.admission_status) params.append('admission_status', filters.admission_status);
  if (filters?.min_score) params.append('min_score', filters.min_score.toString());
  if (filters?.max_score) params.append('max_score', filters.max_score.toString());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.page_size) params.append('page_size', filters.page_size.toString());
  
  const response = await api.get<PaginatedResponse<Application>>(
    `/api/applications/?${params.toString()}`
  );
  return response.data;
};

/**
 * به‌روزرسانی اطلاعات پایه پرونده
 */
export const updateApplication = async (
  id: number,
  data: Partial<Application>
): Promise<Application> => {
  const response = await api.patch<Application>(`/api/applications/${id}/`, data);
  return response.data;
};

/**
 * ارسال نهایی پرونده
 */
export const submitApplication = async (
  data: ApplicationSubmissionRequest
): Promise<Application> => {
  const response = await api.post<Application>(
    `/api/applications/${data.application_id}/submit/`,
    { confirm_accuracy: data.confirm_accuracy ?? true }
  );
  return response.data;
};

/**
 * حذف پرونده (فقط در حالت DRAFT)
 */
export const deleteApplication = async (id: number): Promise<void> => {
  await api.delete(`/api/applications/${id}/`);
};

// ============================================
// APPLICATION CHOICES (انتخاب رشته)
// ============================================

/**
 * دریافت انتخاب‌های رشته یک پرونده
 */
export const getApplicationChoices = async (applicationId: number): Promise<ApplicationChoice[]> => {
  const response = await api.get<ApplicationChoice[]>(
    `/api/applications/${applicationId}/choices/`
  );
  return response.data;
};

/**
 * افزودن انتخاب رشته جدید
 */
export const addApplicationChoice = async (
  applicationId: number,
  data: ApplicationChoiceCreateRequest
): Promise<ApplicationChoice> => {
  const response = await api.post<ApplicationChoice>(
    `/api/applications/${applicationId}/choices/`,
    data
  );
  return response.data;
};

/**
 * ویرایش اولویت انتخاب رشته
 */
export const updateApplicationChoice = async (
  applicationId: number,
  choiceId: number,
  priority: number
): Promise<ApplicationChoice> => {
  const response = await api.patch<ApplicationChoice>(
    `/api/applications/${applicationId}/choices/${choiceId}/`,
    { priority }
  );
  return response.data;
};

/**
 * حذف انتخاب رشته
 */
export const deleteApplicationChoice = async (
  applicationId: number,
  choiceId: number
): Promise<void> => {
  await api.delete(`/api/applications/${applicationId}/choices/${choiceId}/`);
};

// ============================================
// EDUCATION RECORDS (سوابق تحصیلی)
// ============================================

/**
 * دریافت سوابق تحصیلی یک پرونده
 */
export const getEducationRecords = async (applicationId: number): Promise<EducationRecord[]> => {
  const response = await api.get<EducationRecord[]>(
    `/api/applications/${applicationId}/education/`
  );
  return response.data;
};

/**
 * افزودن سابقه تحصیلی جدید
 */
export const addEducationRecord = async (
  applicationId: number,
  data: EducationRecordCreateRequest
): Promise<EducationRecord> => {
  const response = await api.post<EducationRecord>(
    `/api/applications/${applicationId}/education/`,
    data
  );
  return response.data;
};

/**
 * ویرایش سابقه تحصیلی
 */
export const updateEducationRecord = async (
  applicationId: number,
  recordId: number,
  data: Partial<EducationRecordCreateRequest>
): Promise<EducationRecord> => {
  const response = await api.patch<EducationRecord>(
    `/api/applications/${applicationId}/education/${recordId}/`,
    data
  );
  return response.data;
};

/**
 * حذف سابقه تحصیلی
 */
export const deleteEducationRecord = async (
  applicationId: number,
  recordId: number
): Promise<void> => {
  await api.delete(`/api/applications/${applicationId}/education/${recordId}/`);
};

// ============================================
// RESEARCH RECORDS (سوابق پژوهشی)
// ============================================

/**
 * دریافت تمام سوابق پژوهشی یک پرونده
 */
export const getResearchRecords = async (
  applicationId: number
): Promise<ResearchRecord[]> => {
  const response = await api.get<ResearchRecord[]>(
    `/api/applications/${applicationId}/research-records/`
  );
  return response.data;
};

/**
 * دریافت یک سابقه پژوهشی خاص
 */
export const getResearchRecordById = async (
  applicationId: number,
  recordId: number
): Promise<ResearchRecord> => {
  const response = await api.get<ResearchRecord>(
    `/api/applications/${applicationId}/research/${recordId}/`
  );
  return response.data;
};

/**
 * افزودن سابقه پژوهشی جدید
 * Backend API: POST /api/applications/{id}/research-records/create/
 * Body: {type: string, data: object}
 */
export const addResearchRecord = async (
  applicationId: number,
  data: ResearchRecordCreateRequest
): Promise<ResearchRecord> => {
  const response = await api.post<{ message: string; record_id: number; type: string }>(
    `/api/applications/${applicationId}/research-records/create/`,
    data
  );
  
  // بازگشت سابقه جدید
  const recordId = response.data.record_id;
  return await getResearchRecordById(applicationId, recordId);
};

/**
 * ویرایش سابقه پژوهشی
 * Backend API: PUT /api/applications/{id}/research-records/{type}/{record_id}/
 */
export const updateResearchRecord = async (
  applicationId: number,
  type: ResearchRecordType,
  recordId: number,
  data: Record<string, unknown>
): Promise<ResearchRecord> => {
  const response = await api.put<ResearchRecord>(
    `/api/applications/${applicationId}/research-records/${type.toLowerCase()}/${recordId}/`,
    data
  );
  return response.data;
};

/**
 * حذف سابقه پژوهشی
 * Backend API: DELETE /api/applications/{id}/research-records/{type}/{record_id}/
 */
export const deleteResearchRecord = async (
  applicationId: number,
  type: ResearchRecordType,
  recordId: number
): Promise<void> => {
  await api.delete(`/api/applications/${applicationId}/research-records/${type.toLowerCase()}/${recordId}/`);
};

// ============================================
// DOCUMENTS (مدارک)
// ============================================

/**
 * دریافت مدارک یک پرونده
 */
export const getDocuments = async (applicationId: number): Promise<ApplicationDocument[]> => {
  const response = await api.get<ApplicationDocument[]>(
    `/api/applications/${applicationId}/documents/`
  );
  return response.data;
};

/**
 * آپلود یک مدرک
 */
export const uploadDocument = async (
  applicationId: number,
  file: File,
  documentType: DocumentType,
  onProgress?: (progress: number) => void
): Promise<ApplicationDocument> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);
  
  const response = await api.post<ApplicationDocument>(
    `/api/applications/${applicationId}/documents/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      },
    }
  );
  return response.data;
};

/**
 * آپلود دسته‌ای مدارک
 */
export const uploadDocumentsBulk = async (
  applicationId: number,
  request: BulkDocumentUploadRequest
): Promise<ApplicationDocument[]> => {
  const results: ApplicationDocument[] = [];
  const progressMap = new Map<number, DocumentUploadProgress>();
  
  // Initialize progress tracking
  request.documents.forEach((_, index) => {
    progressMap.set(index, {
      type: request.documents[index].type,
      status: 'pending',
      progress: 0,
    });
  });
  
  // Upload files sequentially
  for (let i = 0; i < request.documents.length; i++) {
    const { file, type } = request.documents[i];
    
    try {
      // Update status to uploading
      progressMap.set(i, {
        type,
        status: 'uploading',
        progress: 0,
      });
      request.onProgress?.(Array.from(progressMap.values()));
      
      // Upload file
      const document = await uploadDocument(
        applicationId,
        file,
        type,
        (progress) => {
          progressMap.set(i, {
            type,
            status: 'uploading',
            progress,
          });
          request.onProgress?.(Array.from(progressMap.values()));
        }
      );
      
      // Update status to success
      progressMap.set(i, {
        type,
        status: 'success',
        progress: 100,
        document,
      });
      results.push(document);
      
    } catch (error) {
      // Update status to error
      progressMap.set(i, {
        type,
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'خطا در آپلود فایل',
      });
    }
    
    request.onProgress?.(Array.from(progressMap.values()));
  }
  
  return results;
};

/**
 * حذف یک مدرک
 */
export const deleteDocument = async (
  applicationId: number,
  documentId: number
): Promise<void> => {
  await api.delete(`/api/applications/${applicationId}/documents/${documentId}/`);
};

/**
 * دانلود یک مدرک
 */
export const downloadDocument = async (documentId: number): Promise<Blob> => {
  const response = await api.get(`/api/documents/${documentId}/download/`, {
    responseType: 'blob',
  });
  return response.data;
};

// ============================================
// ADMIN ACTIONS - UNIVERSITY REVIEW
// ============================================

/**
 * دریافت آمار برای پنل ادمین
 */
export const getAdminStatistics = async (): Promise<StatisticsResponse> => {
  const response = await api.get<StatisticsResponse>('/api/admin/statistics/');
  return response.data;
};

/**
 * بررسی پرونده توسط مسئول دانشگاه
 */
export const performUniversityReview = async (
  applicationId: number,
  data: UniversityReviewRequest
): Promise<Application> => {
  const response = await api.post<Application>(
    `/api/admin/applications/${applicationId}/university-review/`,
    data
  );
  return response.data;
};

/**
 * امتیازدهی به سوابق تحصیلی یا پژوهشی
 */
export const scoreApplication = async (
  applicationId: number,
  data: ScoringRequest
): Promise<Application> => {
  const response = await api.post<Application>(
    `/api/admin/applications/${applicationId}/score/`,
    data
  );
  return response.data;
};

/**
 * بررسی مدارک پرونده
 */
export const reviewDocuments = async (
  applicationId: number,
  data: DocumentReviewRequest
): Promise<DocumentReview> => {
  const response = await api.post<DocumentReview>(
    `/api/admin/applications/${applicationId}/document-review/`,
    data
  );
  return response.data;
};

/**
 * دریافت تاریخچه بررسی مدارک
 */
export const getDocumentReviews = async (applicationId: number): Promise<DocumentReview[]> => {
  const response = await api.get<DocumentReview[]>(
    `/api/admin/applications/${applicationId}/document-reviews/`
  );
  return response.data;
};

// ============================================
// ADMIN ACTIONS - FACULTY REVIEW
// ============================================

/**
 * بررسی نهایی توسط مسئول دانشکده
 */
export const performFacultyReview = async (
  applicationId: number,
  data: FacultyReviewRequest
): Promise<Application> => {
  const response = await api.post<Application>(
    `/api/admin/applications/${applicationId}/faculty-review/`,
    data
  );
  return response.data;
};

/**
 * زمان‌بندی مصاحبه (فقط دکتری)
 */
export const scheduleInterview = async (
  applicationId: number,
  data: {
    interview_date: string;
    interview_time: string;
    location: string;
  }
): Promise<Application> => {
  const response = await api.post<Application>(
    `/api/admin/applications/${applicationId}/schedule-interview/`,
    data
  );
  return response.data;
};

/**
 * امتیازدهی مصاحبه
 */
export const scoreInterview = async (
  applicationId: number,
  data: InterviewScoringRequest
): Promise<Application> => {
  const response = await api.post<Application>(
    `/api/admin/applications/${applicationId}/interview-score/`,
    data
  );
  return response.data;
};

/**
 * اعلام نتیجه پذیرش نهایی
 */
export const publishAdmissionResults = async (
  applicationId: number,
  data: {
    admission_overall_status: 'ADMITTED' | 'NOT_ADMITTED' | 'WAITING_LIST';
  }
): Promise<Application> => {
  const response = await api.post<Application>(
    `/api/admin/applications/${applicationId}/publish-result/`,
    data
  );
  return response.data;
};

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * ارسال دسته‌ای ایمیل به متقاضیان
 */
export const sendBulkEmail = async (data: {
  application_ids: number[];
  subject: string;
  message: string;
}): Promise<{ success: number; failed: number }> => {
  const response = await api.post('/api/admin/applications/bulk-email/', data);
  return response.data;
};

/**
 * Export به Excel
 */
export const exportToExcel = async (filters?: ApplicationFilterValues): Promise<Blob> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.round_type) params.append('round_type', filters.round_type);
  
  const response = await api.get(`/api/admin/applications/export/?${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * محاسبه درصد تکمیل پرونده
 */
export const calculateCompletionPercentage = (application: Application): number => {
  let completed = 0;
  let total = 0;
  
  // Personal info (20%)
  total += 20;
  if (application.applicant?.user.father_name && 
      application.applicant?.user.birth_year &&
      application.applicant?.user.gender) {
    completed += 20;
  }
  
  // Program choices (20%)
  total += 20;
  if (application.choices && application.choices.length > 0) {
    completed += 20;
  }
  
  // Education records (20%)
  total += 20;
  if (application.education_records && application.education_records.length > 0) {
    completed += 20;
  }
  
  // Documents (20%)
  total += 20;
  const requiredDocs = ['NATIONAL_CARD', 'PERSONAL_PHOTO', 'BSC_TRANSCRIPT'];
  const uploadedTypes = new Set(application.documents?.map(d => d.doc_type) || []);
  const hasAllRequired = requiredDocs.every(type => uploadedTypes.has(type as DocumentType));
  if (hasAllRequired) {
    completed += 20;
  }
  
  // Research records (20% - optional for some rounds)
  total += 20;
  if (application.round_type === 'MA_TALENT' || application.round_type === 'PHD_TALENT') {
    if (application.research_records && application.research_records.length > 0) {
      completed += 20;
    }
  } else {
    // Not required for other round types
    completed += 20;
  }
  
  return Math.round((completed / total) * 100);
};

/**
 * بررسی اینکه آیا پرونده آماده ارسال است
 */
export const isApplicationReadyForSubmission = (application: Application): {
  ready: boolean;
  missingItems: string[];
} => {
  const missing: string[] = [];
  
  // Check personal info
  if (!application.applicant?.user.father_name || 
      !application.applicant?.user.birth_year ||
      !application.applicant?.user.gender) {
    missing.push('اطلاعات شخصی کامل نیست');
  }
  
  // Check program choices
  if (!application.choices || application.choices.length === 0) {
    missing.push('حداقل یک رشته انتخاب کنید');
  }
  
  // Check education records
  if (!application.education_records || application.education_records.length === 0) {
    missing.push('سوابق تحصیلی را وارد کنید');
  }
  
  // Check required documents
  const requiredDocs = ['NATIONAL_CARD', 'PERSONAL_PHOTO', 'BSC_TRANSCRIPT'];
  const uploadedTypes = new Set(application.documents?.map(d => d.doc_type) || []);
  const missingDocs = requiredDocs.filter(type => !uploadedTypes.has(type as DocumentType));
  if (missingDocs.length > 0) {
    missing.push(`مدارک لازم: ${missingDocs.join(', ')}`);
  }
  
  return {
    ready: missing.length === 0,
    missingItems: missing,
  };
};

// ============================================
// EXPORT DEFAULT
// ============================================

const applicationService = {
  // CRUD
  getMyApplication,
  getApplicationById,
  getApplications,
  updateApplication,
  submitApplication,
  deleteApplication,
  
  // Choices (Program Selection)
  getApplicationChoices,
  getChoices: getApplicationChoices, // Alias
  addApplicationChoice,
  createChoice: addApplicationChoice, // Alias
  updateApplicationChoice,
  updateChoice: updateApplicationChoice, // Alias
  deleteApplicationChoice,
  deleteChoice: deleteApplicationChoice, // Alias
  
  // Education
  getEducationRecords,
  addEducationRecord,
  createEducationRecord: addEducationRecord, // Alias
  updateEducationRecord,
  deleteEducationRecord,
  
  // Research
  getResearchRecords,
  getResearchRecordById,
  addResearchRecord,
  createResearchRecord: addResearchRecord, // Alias
  updateResearchRecord,
  deleteResearchRecord,
  
  // Documents
  getDocuments,
  uploadDocument,
  uploadDocumentsBulk,
  deleteDocument,
  downloadDocument,
  
  // Admin - University Review
  getAdminStatistics,
  getStatistics: getAdminStatistics, // Alias
  performUniversityReview,
  scoreApplication,
  reviewDocuments,
  getDocumentReviews,
  
  // Admin - Faculty Review
  performFacultyReview,
  scheduleInterview,
  scoreInterview,
  publishAdmissionResults,
  
  // Bulk Operations
  sendBulkEmail,
  exportToExcel,
  
  // Utilities
  calculateCompletionPercentage,
  isApplicationReadyForSubmission,
};

export default applicationService;
