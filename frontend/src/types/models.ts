/**
 * TypeScript Type Definitions for Talent Admission System
 * 
 * این فایل تمام Type های مورد نیاز را از Backend به Frontend منتقل می‌کند
 * مطابق با API Documentation و Django Serializers
 * 
 * @version 2.0
 * @date 2025-12-07
 * @synced-with backend/API_ENDPOINTS_GUIDE.md
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

/**
 * Round Types - انواع فراخوان
 */
export type RoundType = 'MA_TALENT' | 'PHD_TALENT' | 'PHD_EXAM' | 'OLYMPIAD';

export const RoundTypeDisplay: Record<RoundType, string> = {
  MA_TALENT: 'استعداد درخشان کارشناسی ارشد',
  PHD_TALENT: 'استعداد درخشان دکتری',
  PHD_EXAM: 'آزمون دکتری',
  OLYMPIAD: 'المپیاد علمی'
};

/**
 * Application Status - وضعیت پرونده (34 حالت)
 */
export type ApplicationStatus =
  | 'NEW'
  | 'DRAFT'
  | 'PROGRAM_SELECTED'
  | 'PERSONAL_INFO_COMPLETED'
  | 'IDENTITY_DOCS_UPLOADED'
  | 'EDU_INFO_COMPLETED'
  | 'EDU_DOCS_UPLOADED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'UNDER_UNIVERSITY_REVIEW'
  | 'APPROVED'
  | 'APPROVED_BY_UNIVERSITY'
  | 'REJECTED'
  | 'REJECTED_BY_UNIVERSITY'
  | 'RETURNED_FOR_CORRECTION'
  | 'PENDING_DOCUMENTS'
  | 'UNDER_FACULTY_REVIEW'
  | 'FACULTY_REVIEW_COMPLETED'
  | 'COMPLETED'
  | 'INELIGIBLE'
  | 'DELETED';

/**
 * Admission Status - وضعیت پذیرش
 */
export type AdmissionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WAITING';

export const AdmissionStatusDisplay: Record<AdmissionStatus, string> = {
  PENDING: 'در انتظار',
  ACCEPTED: 'پذیرفته شده',
  REJECTED: 'پذیرفته نشده',
  WAITING: 'لیست انتظار'
};

/**
 * University Review Status - وضعیت بررسی دانشگاه
 */
export type UniversityReviewStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'APPROVED_WITH_DEFECT'
  | 'REJECTED';

export const UniversityReviewStatusDisplay: Record<UniversityReviewStatus, string> = {
  PENDING: 'در انتظار بررسی',
  APPROVED: 'تایید شده',
  APPROVED_WITH_DEFECT: 'تایید شده با نقص',
  REJECTED: 'رد شده'
};

/**
 * Degree Levels - مقاطع تحصیلی
 */
export type DegreeLevel = 'BSC' | 'MSC' | 'PHD';

export const DegreeLevelDisplay: Record<DegreeLevel, string> = {
  BSC: 'کارشناسی',
  MSC: 'کارشناسی ارشد',
  PHD: 'دکتری'
};

/**
 * Education Status - وضعیت تحصیلی
 */
export type EducationStatus = 'STUDYING' | 'GRADUATED';

export const EducationStatusDisplay: Record<EducationStatus, string> = {
  STUDYING: 'در حال تحصیل',
  GRADUATED: 'فارغ‌التحصیل'
};

/**
 * Rank Status - وضعیت رتبه
 */
export type RankStatus = 'TOP_TEN_PERCENT' | 'TOP_TWENTY_FIVE_PERCENT' | 'OTHER';

export const RankStatusDisplay: Record<RankStatus, string> = {
  TOP_TEN_PERCENT: '10٪ برتر',
  TOP_TWENTY_FIVE_PERCENT: '25٪ برتر',
  OTHER: 'سایر'
};

/**
 * Gender - جنسیت
 */
export type Gender = 'MALE' | 'FEMALE';

export const GenderDisplay: Record<Gender, string> = {
  MALE: 'مرد',
  FEMALE: 'زن'
};

/**
 * Military Status - وضعیت نظام وظیفه
 */
export type MilitaryStatus =
  | 'EXEMPT'
  | 'EDUCATIONAL_EXEMPT'
  | 'SERVING'
  | 'COMPLETED'
  | 'MEDICAL_EXEMPT';

export const MilitaryStatusDisplay: Record<MilitaryStatus, string> = {
  EXEMPT: 'معاف',
  EDUCATIONAL_EXEMPT: 'معافیت تحصیلی',
  SERVING: 'در حال خدمت',
  COMPLETED: 'پایان خدمت',
  MEDICAL_EXEMPT: 'معافیت پزشکی'
};

/**
 * Document Types - انواع مدارک
 */
export type DocumentType =
  | 'PERSONAL_PHOTO'
  | 'NATIONAL_CARD'
  | 'NATIONAL_ID'
  | 'ID_CARD'
  | 'BIRTH_CERTIFICATE'
  | 'BSC_TRANSCRIPT'
  | 'BSC_CERTIFICATE'
  | 'TRANSCRIPT'
  | 'DEGREE'
  | 'MSC_CERT'
  | 'MSC_TRANSCRIPT'
  | 'MSC_CERTIFICATE'
  | 'MSC_THESIS'
  | 'MSC_EXCELLENCE_CERT'
  | 'OLYMPIAD_CERT'
  | 'LANGUAGE_CERTIFICATE'
  | 'RECOMMENDATION_LETTER'
  | 'RESEARCH_PROPOSAL'
  | 'WORK_EXPERIENCE'
  | 'RESEARCH_ARTICLE'
  | 'PATENT_DOC'
  | 'FESTIVAL_AWARD_DOC'
  | 'BOOK_COVER'
  | 'OTHER';

/**
 * Research Record Types - انواع سوابق پژوهشی
 */
export type ResearchRecordType =
  | 'ARTICLE'
  | 'PROMOTIONAL_ARTICLE'
  | 'PATENT'
  | 'FESTIVAL_AWARD'
  | 'AWARD'
  | 'CONFERENCE'
  | 'BOOK'
  | 'PROJECT'
  | 'MASTERS_THESIS';

/**
 * Article Types - انواع مقاله
 */
export type ArticleType =
  | 'RESEARCH_NATIONAL'
  | 'RESEARCH_INTERNATIONAL'
  | 'PROMOTIONAL_NATIONAL'
  | 'PROMOTIONAL_INTERNATIONAL';

export const ArticleTypeDisplay: Record<ArticleType, string> = {
  RESEARCH_NATIONAL: 'علمی-پژوهشی (ملی)',
  RESEARCH_INTERNATIONAL: 'علمی-پژوهشی (بین‌المللی)',
  PROMOTIONAL_NATIONAL: 'علمی-ترویجی (ملی)',
  PROMOTIONAL_INTERNATIONAL: 'علمی-ترویجی (بین‌المللی)'
};

/**
 * Conference Types
 */
export type ConferenceType = 'NATIONAL' | 'INTERNATIONAL';

/**
 * Book Types
 */
export type BookType = 'AUTHORSHIP' | 'TRANSLATION';

/**
 * Interview Attendance Status
 */
export type InterviewAttendanceStatus = 
  | 'SCHEDULED'
  | 'PRESENT'
  | 'ABSENT'
  | 'REJECTED_IN_INTERVIEW';

export const InterviewAttendanceStatusDisplay: Record<InterviewAttendanceStatus, string> = {
  SCHEDULED: 'زمان‌بندی شده',
  PRESENT: 'حاضر',
  ABSENT: 'غایب',
  REJECTED_IN_INTERVIEW: 'عدم پذیرش در مصاحبه'
};

/**
 * Document Review Status
 */
export type DocumentReviewStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'APPROVED_WITH_DEFECT'
  | 'REJECTED';

/**
 * Document Category for Review
 */
export type DocumentCategory = 'IDENTITY_DOCS' | 'EDUCATION_DOCS';

export const DocumentCategoryDisplay: Record<DocumentCategory, string> = {
  IDENTITY_DOCS: 'مدارک شناسایی',
  EDUCATION_DOCS: 'مدارک تحصیلی'
};

/**
 * User Roles
 */
export type UserRole = 
  | 'APPLICANT'
  | 'UNIVERSITY_ADMIN'
  | 'FACULTY_ADMIN'
  | 'SYSTEM_ADMIN'
  | 'SUPERADMIN';

export const UserRoleDisplay: Record<UserRole, string> = {
  APPLICANT: 'متقاضی',
  UNIVERSITY_ADMIN: 'مسئول دانشگاه',
  FACULTY_ADMIN: 'مسئول دانشکده',
  SYSTEM_ADMIN: 'مدیر سیستم',
  SUPERADMIN: 'سوپر ادمین'
};

// ============================================
// CORE INTERFACES
// ============================================

/**
 * User Interface - کاربر
 */
export interface User {
  id: number;
  national_id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  father_name?: string;
  mobile: string;
  email: string;
  gender?: Gender;
  birth_year?: number;
  birth_place?: string;
  military_status?: MilitaryStatus;
  role: UserRole;
  round_type?: RoundType; // نوع فراخوان برای متقاضیان
  is_staff?: boolean;
  is_superuser?: boolean;
  profile?: {
    address?: string;
    phone?: string;
  };
}

/**
 * University - دانشگاه
 */
export interface University {
  id: number;
  name: string;
  code?: string;
  city?: string;
  address?: string;
  website?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Faculty - دانشکده
 */
export interface Faculty {
  id: number;
  name: string;
  code?: string;
  university?: number;
  university_name?: string;
  is_active: boolean;
}

/**
 * Department - گروه آموزشی
 */
export interface Department {
  id: number;
  name: string;
  code?: string;
  faculty: number;
  faculty_name?: string;
  is_active: boolean;
}

/**
 * Program - برنامه تحصیلی (رشته)
 */
export interface Program {
  id: number;
  name: string;
  code: string;
  faculty: Faculty | number;
  faculty_name?: string;
  department: Department | number;
  department_name?: string;
  degree_level: DegreeLevel;
  degree_level_display?: string;
  study_type?: 'FULL_TIME' | 'PART_TIME';
  study_type_display?: string;
  capacity?: number;
  description?: string;
  requirements?: string;
  is_active: boolean;
}

/**
 * Admission Round - فراخوان
 */
export interface AdmissionRound {
  id: number;
  title: string;
  type: RoundType;
  start_date: string;
  end_date: string;
  is_active: boolean;
  description?: string;
  year?: number;
}

// ============================================
// APPLICATION INTERFACES
// ============================================

/**
 * Application Choice - انتخاب رشته
 * این interface نحوه انتخاب رشته توسط متقاضی و نتیجه پذیرش را مدیریت می‌کند
 */
export interface ApplicationChoice {
  id: number;
  application: number;
  program: Program;
  program_name?: string;
  faculty_name?: string;
  department_name?: string;
  priority: number;
  // فیلدهای نتیجه پذیرش (از Backend)
  admission_status?: AdmissionStatus | string | null;
  admission_status_display?: string;
  admission_priority_result?: number;
  admission_note?: string;
  created_at: string;
}

// Alias برای سازگاری
export type Choice = ApplicationChoice;

/**
 * Education Record - سوابق تحصیلی
 */
export interface EducationRecord {
  id: number;
  application: number;
  degree_level: DegreeLevel;
  degree_level_display?: string;
  university: University;
  university_id?: number;
  university_name?: string;
  field_of_study: string;
  gpa: number;
  start_date?: string;
  start_month?: number;
  start_year?: number;
  entrance_year?: number;
  end_date?: string;
  graduation_month?: number;
  graduation_year?: number;
  status?: EducationStatus;
  status_display?: string;
  // فیلدهای امتیازدهی
  education_score?: number;
  score_details?: string;
  // فیلدهای ویژه MA_TALENT
  total_units_passed?: number;
  semester_count?: number;
  class_size?: number;
  rank_status?: RankStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Application Document - مدرک پرونده
 */
export interface ApplicationDocument {
  id: number;
  application: number;
  doc_type?: DocumentType;
  document_type?: DocumentType;
  type_display?: string;
  file: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  status?: 'UPLOADED' | 'APPROVED' | 'REJECTED';
  uploaded_at: string;
  reviewed_by?: number;
  reviewed_at?: string;
  is_approved?: boolean;
  review_comment?: string;
}

// Alias برای سازگاری
export type DocumentRecord = ApplicationDocument;

/**
 * Application - پرونده ثبت‌نام
 * 
 * Interface اصلی که تمام اطلاعات یک پرونده را شامل می‌شود
 */
export interface Application {
  // اطلاعات پایه
  id: number;
  tracking_code: string;
  status: ApplicationStatus;
  status_display?: string;
  
  // اطلاعات فراخوان
  round: {
    id: number;
    title: string;
    type: RoundType;
    year?: number;
  };
  round_type?: RoundType;
  
  // اطلاعات متقاضی
  applicant?: {
    user: User;
  };
  user_name?: string;
  user_national_id?: string;
  user_mobile?: string;
  
  // انتخاب رشته‌ها (حداکثر 3)
  choices?: ApplicationChoice[];
  selected_programs?: ApplicationChoice[]; // alias
  
  // سوابق تحصیلی
  education_records?: EducationRecord[];
  
  // سوابق پژوهشی
  research_records?: ResearchRecord[];
  
  // مدارک
  documents?: ApplicationDocument[];
  
  // ============================================
  // فیلدهای امتیازدهی
  // ============================================
  education_score?: number;
  research_score?: number;
  interview_score?: number;
  total_score?: number;
  score_calculated_at?: string;
  
  // ============================================
  // فیلدهای بررسی دانشگاه (UNIVERSITY_ADMIN)
  // ============================================
  university_review_status?: UniversityReviewStatus;
  university_review_status_display?: string;
  university_review_comment?: string;
  university_reviewed_at?: string;
  university_reviewed_by?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name?: string;
  };
  
  // ============================================
  // فیلدهای بررسی دانشکده (FACULTY_ADMIN)
  // ============================================
  faculty_review_completed?: boolean;
  faculty_review_comment?: string;
  faculty_reviewed_at?: string;
  faculty_reviewed_by?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name?: string;
  };
  
  // ============================================
  // فیلدهای مصاحبه (فقط دکتری)
  // ============================================
  interview_date?: string;
  interview_time?: string;
  interview_location?: string;
  interview_attendance_status?: InterviewAttendanceStatus;
  interviewer_comment?: string;
  interviewed_by?: number;
  interviewed_at?: string;
  
  // ============================================
  // فیلدهای پذیرش نهایی
  // ============================================
  admission_overall_status?: 'PENDING' | 'ADMITTED' | 'NOT_ADMITTED' | 'WAITING_LIST';
  admission_overall_status_display?: string;
  admission_result_published_at?: string;
  
  // ============================================
  // فیلدهای سایر
  // ============================================
  submitted_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Document Review - بررسی مدارک
 */
export interface DocumentReview {
  id: number;
  application: number;
  document_type: DocumentCategory;
  document_type_display?: string;
  status: DocumentReviewStatus;
  status_display?: string;
  comment?: string;
  defects?: {
    missing_documents?: string[];
    quality_issues?: string[];
    content_issues?: string[];
  };
  reviewer: number;
  reviewer_name?: string;
  reviewed_at: string;
}

// ============================================
// RESEARCH RECORD INTERFACES (Union Types)
// ============================================

/**
 * Article - مقاله
 */
export interface Article {
  type: 'ARTICLE';
  id: number;
  application: number;
  article_type: ArticleType;
  title_fa: string;
  title_en?: string;
  journal_name: string;
  doi?: string;
  publish_year: number;
  status: 'PUBLISHED' | 'ACCEPTED' | 'SUBMITTED';
  authors: string;
  impact_factor?: number;
  citation_count?: number;
  score?: number;
  score_comment?: string;
  reviewed_by?: string;
  review_comment?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Patent - اختراع
 */
export interface Patent {
  type: 'PATENT';
  id: number;
  application: number;
  title_fa: string;
  patent_number: string;
  registration_date: string;
  inventors: string;
  description?: string;
  score?: number;
  score_comment?: string;
  reviewed_by?: string;
  review_comment?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Book - کتاب
 */
export interface Book {
  type: 'BOOK';
  id: number;
  application: number;
  title_fa: string;
  book_type: BookType;
  publisher: string;
  isbn?: string;
  publish_year: number;
  authors_or_translators: string;
  score?: number;
  score_comment?: string;
  reviewed_by?: string;
  review_comment?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Conference - کنفرانس
 */
export interface Conference {
  type: 'CONFERENCE';
  id: number;
  application: number;
  title_fa: string;
  title_en?: string;
  conference_name: string;
  conference_type: ConferenceType;
  year: number;
  authors: string;
  score?: number;
  score_comment?: string;
  reviewed_by?: string;
  review_comment?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Festival Award - جایزه جشنواره
 */
export interface FestivalAward {
  type: 'FESTIVAL_AWARD';
  id: number;
  application: number;
  festival_name: string;
  award_title: string;
  year: number;
  description?: string;
  score?: number;
  score_comment?: string;
  reviewed_by?: string;
  review_comment?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Masters Thesis - پایان‌نامه ارشد
 */
export interface MastersThesis {
  type: 'MASTERS_THESIS';
  id: number;
  application: number;
  title_fa: string;
  grade: number;
  defense_date: string;
  main_supervisor: string;
  second_supervisor?: string;
  advisor_1?: string;
  advisor_2?: string;
  score?: number;
  score_comment?: string;
  reviewed_by?: string;
  review_comment?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Research Record Union Type
 * 
 * استفاده از Union Type برای type safety کامل
 * بر اساس مقدار type، فقط فیلدهای مربوطه در دسترس هستند
 */
export type ResearchRecord = 
  | Article
  | Patent
  | Book
  | Conference
  | FestivalAward
  | MastersThesis;

/**
 * Research Summary - خلاصه آماری سوابق پژوهشی
 */
export interface ResearchSummary {
  total_score: number;
  max_possible_score: number;
  completion_percentage: number;
  breakdown: {
    articles_score: number;
    patents_score: number;
    awards_score: number;
    conferences_score: number;
    books_score: number;
    thesis_score: number;
  };
  max_limits: {
    articles: number;
    promotional_articles: number;
    conferences: number;
    books: number;
    thesis: number;
  };
}

/**
 * Unified Research Response - پاسخ یکپارچه سوابق
 */
export interface UnifiedResearchResponse {
  total_records: number;
  total_score: number;
  summary: {
    articles: number;
    patents: number;
    awards: number;
    conferences: number;
    books: number;
    thesis: number;
  };
  records: ResearchRecord[];
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/**
 * Register Request
 */
export interface RegisterRequest {
  national_id: string;
  first_name: string;
  last_name: string;
  mobile: string;
  email: string;
  round_type: RoundType;
}

/**
 * Register Response
 */
export interface RegisterResponse {
  message: string;
  tracking_code: string;
  application_id: number;
  user_id: number;
  user_created?: boolean;
  application_created?: boolean;
}

/**
 * Login Request
 */
export interface LoginRequest {
  national_id: string;
  tracking_code: string;
  captcha?: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  message: string;
  access: string;
  refresh: string;
  user: User;
  application_id?: number;
  tracking_code?: string;
}

/**
 * Token Refresh Request
 */
export interface TokenRefreshRequest {
  refresh: string;
}

/**
 * Token Refresh Response
 */
export interface TokenRefreshResponse {
  access: string;
}

/**
 * Profile Update Request
 */
export interface ProfileUpdateRequest {
  father_name?: string;
  birth_certificate_number?: string;
  birth_certificate_serial?: string;
  birth_certificate_issue_place?: string;
  mobile?: string;
  birth_year?: number;
  birth_place?: string;
  gender?: Gender;
  military_status?: MilitaryStatus;
}

/**
 * Application Choice Create Request
 */
export interface ApplicationChoiceCreateRequest {
  program_id: number;
  priority: number;
}

/**
 * Education Record Create Request
 */
export interface EducationRecordCreateRequest {
  degree_level: DegreeLevel;
  university_id: number;
  field_of_study: string;
  gpa: number;
  start_month?: number;
  start_year?: number;
  graduation_month?: number;
  graduation_year?: number;
  status?: string;
  // MA fields
  total_units_passed?: number;
  semester_count?: number;
  class_size?: number;
  rank_status?: string;
}

/**
 * Research Record Create Request
 */
export interface ResearchRecordCreateRequest {
  type: ResearchRecordType;
  data: Record<string, unknown>;
}

/**
 * University Review Request
 */
export interface UniversityReviewRequest {
  decision: 'APPROVED' | 'REJECTED' | 'RETURNED_FOR_CORRECTION';
  comment: string;
}

/**
 * Document Review Request
 */
export interface DocumentReviewRequest {
  document_type: DocumentCategory;
  status: DocumentReviewStatus;
  comment?: string;
  defects?: {
    missing_documents?: string[];
    quality_issues?: string[];
    content_issues?: string[];
  };
}

/**
 * Faculty Review Request
 */
export interface FacultyReviewRequest {
  decision: 'APPROVED' | 'REJECTED';
  comment: string;
  choices_decisions: Array<{
    choice_id: number;
    admission_status: AdmissionStatus;
    admission_note?: string;
  }>;
}

/**
 * Interview Scoring Request
 */
export interface InterviewScoringRequest {
  interview_score: number;
  attendance_status: InterviewAttendanceStatus;
  comment?: string;
}

/**
 * Scoring Request (Education/Research)
 */
export interface ScoringRequest {
  education_score?: number;
  research_score?: number;
  comment?: string;
}

// ============================================
// PAGINATION & ERRORS
// ============================================

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * API Error Response
 */
export interface ApiError {
  detail?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

// ============================================
// ADMIN INTERFACES
// ============================================

/**
 * Admin Profile Response
 */
export interface AdminProfile {
  user: User;
  permissions: {
    has_ma_talent_access: boolean;
    has_phd_talent_access: boolean;
    has_phd_exam_access: boolean;
    has_olympiad_access: boolean;
    has_full_access: boolean;
    faculties: Faculty[];
    departments: Department[];
  };
}

/**
 * Statistics Response
 */
export interface StatisticsResponse {
  total_applications: number;
  by_status: Record<string, number>;
  by_round: Record<string, number>;
  pending_reviews?: number;
  today_submissions?: number;
}

/**
 * Announcement - اطلاعیه
 */
export interface Announcement {
  id: number;
  title: string;
  content: string;
  is_important: boolean;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  attachments?: Array<{
    title: string;
    file: string;
  }>;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Status Badge Configuration
 */
export interface StatusBadgeConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

/**
 * Document Upload Progress
 */
export interface DocumentUploadProgress {
  type: DocumentType;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  document?: ApplicationDocument;
}

/**
 * Filter Values for Applications List
 */
export interface ApplicationFilterValues {
  search?: string;
  status?: ApplicationStatus;
  round_type?: RoundType;
  faculty_id?: string;
  department_id?: string;
  university_review_status?: UniversityReviewStatus;
  faculty_review_completed?: string;
  admission_status?: AdmissionStatus;
  min_score?: number;
  max_score?: number;
  page?: number;
  page_size?: number;
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type Guards برای Research Records
 */
export function isArticle(record: ResearchRecord): record is Article {
  return record.type === 'ARTICLE';
}

export function isPatent(record: ResearchRecord): record is Patent {
  return record.type === 'PATENT';
}

export function isBook(record: ResearchRecord): record is Book {
  return record.type === 'BOOK';
}

export function isConference(record: ResearchRecord): record is Conference {
  return record.type === 'CONFERENCE';
}

export function isFestivalAward(record: ResearchRecord): record is FestivalAward {
  return record.type === 'FESTIVAL_AWARD';
}

export function isMastersThesis(record: ResearchRecord): record is MastersThesis {
  return record.type === 'MASTERS_THESIS';
}
