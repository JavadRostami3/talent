/**
 * TypeScript Type Definitions for Talent Admission System
 * این فایل تمام Type های مورد نیاز را از Backend به Frontend منتقل می‌کند
 */

// ============================================
// Round Types
// ============================================
export type RoundType = 'MA_TALENT' | 'PHD_TALENT' | 'PHD_EXAM' | 'OLYMPIAD';

// ============================================
// Application Status (تمام وضعیت‌های Backend)
// ============================================
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

// ============================================
// Degree Levels
// ============================================
export type DegreeLevel = 'BSC' | 'MSC' | 'PHD';

// ============================================
// Document Types (دقیقاً از Backend)
// ============================================
export type DocumentType =
  | 'PERSONAL_PHOTO'
  | 'NATIONAL_CARD'
  | 'NATIONAL_ID' // alias for NATIONAL_CARD
  | 'ID_CARD'
  | 'BIRTH_CERTIFICATE'
  | 'PHOTO' // alias for PERSONAL_PHOTO
  | 'BSC_CERT'
  | 'BSC_TRANSCRIPT'
  | 'TRANSCRIPT' // general transcript
  | 'DEGREE' // general degree certificate
  | 'MSC_CERT'
  | 'MSC_TRANSCRIPT'
  | 'MSC_THESIS'
  | 'MSC_EXCELLENCE_CERT'
  | 'OLYMPIAD_CERT'
  | 'LANGUAGE_CERT'
  | 'RESEARCH_ARTICLE'
  | 'PATENT_DOC'
  | 'FESTIVAL_AWARD_DOC'
  | 'BOOK_COVER'
  | 'OTHER';

// ============================================
// Gender
// ============================================
export type Gender = 'MALE' | 'FEMALE';

// ============================================
// Military Status
// ============================================
export type MilitaryStatus =
  | 'EXEMPT'
  | 'EDUCATIONAL_EXEMPT'
  | 'SERVING'
  | 'COMPLETED'
  | 'MEDICAL_EXEMPT';

// ============================================
// Research Record Types
// ============================================
export type ResearchRecordType =
  | 'ARTICLE'
  | 'PATENT'
  | 'FESTIVAL_AWARD'
  | 'AWARD' // alias for FESTIVAL_AWARD
  | 'CONFERENCE'
  | 'BOOK'
  | 'PROJECT'
  | 'MASTERS_THESIS';

// ============================================
// Interfaces
// ============================================

/**
 * User Interface
 */
export interface User {
  id: number;
  nationalId: string;
  national_id: string; // alias for compatibility
  first_name: string;
  last_name: string;
  father_name?: string;
  mobile: string;
  email: string;
  gender?: Gender;
  birth_date?: string;
  birth_year?: number;
  role: 'APPLICANT' | 'UNIVERSITY_ADMIN' | 'FACULTY_ADMIN' | 'SYSTEM_ADMIN';
}

/**
 * University Interface
 */
export interface University {
  id: number;
  name: string;
  code?: string;
  location?: string; // city or province
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Program Interface (رشته تحصیلی)
 */
export interface Program {
  id: number;
  name: string;
  code: string;
  faculty: number;
  faculty_name?: string;
  department: number;
  department_name?: string;
  degree_level: DegreeLevel;
  is_active: boolean;
}

/**
 * Admission Round Interface (فراخوان)
 */
export interface AdmissionRound {
  id: number;
  type: RoundType;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  description?: string;
}

/**
 * Application Interface (پرونده ثبت‌نام)
 */
export interface Application {
  id: number;
  tracking_code: string;
  status: ApplicationStatus;
  round: {
    id: number;
    type: RoundType;
    name: string;
  };
  round_type: RoundType;
  total_score: number;
  education_score?: number;
  research_score?: number;
  interview_score?: number;
  score_calculated_at?: string;
  interview_date?: string;
  submitted_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  
  // User info (populated from backend)
  user_name?: string;
  user_national_id?: string;
  user_mobile?: string;
  
  // Related data
  program_choices?: ApplicationChoice[];
  education_records?: EducationRecord[];
  research_records?: ResearchRecord[];
  documents?: ApplicationDocument[];
}

/**
 * Application Choice (انتخاب رشته)
 */
export interface ApplicationChoice {
  id: number;
  application: number;
  program: Program;
  program_name?: string; // populated from backend
  faculty_name?: string; // populated from backend
  department_name?: string; // populated from backend
  priority: number;
  created_at: string;
}

/**
 * Education Record (سوابق تحصیلی)
 */
export interface EducationRecord {
  id: number;
  application: number;
  degree_level: DegreeLevel;
  university: University;
  university_id: number;
  university_name?: string; // populated from backend
  field_of_study: string;
  gpa: number;
  start_month?: number;
  start_year?: number;
  entrance_year?: number; // alias for start_year
  graduation_month?: number;
  graduation_year?: number;
  status?: string;
  // فیلدهای ویژه MA_TALENT
  total_units_passed?: number;
  semester_count?: number;
  class_size?: number;
  rank_status?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Research Record (سوابق پژوهشی - Unified)
 */
export interface ResearchRecord {
  id: number;
  type: ResearchRecordType;
  title?: string; // general title field
  title_fa: string;
  title_en?: string;
  description?: string; // general description
  reference_link?: string; // URL to external resource
  date?: string; // date of publication/achievement
  score: number;
  impact_factor?: number; // for articles
  citation_count?: number; // for articles
  created_at: string;
  reviewed_by?: string;
  review_comment?: string;
  file?: string;
  
  // فیلدهای مخصوص Article
  article_type?: string;
  journal_name?: string;
  doi?: string;
  publish_year?: number;
  authors?: string;
  
  // فیلدهای مخصوص Patent
  patent_number?: string;
  registration_date?: string;
  inventors?: string;
  
  // فیلدهای مخصوص Book
  publisher?: string;
  isbn?: string;
  
  // فیلدهای مخصوص Conference
  conference_name?: string;
  presentation_date?: string;
  
  // فیلدهای مخصوص Festival Award
  award_name?: string;
  festival_name?: string;
  award_year?: number;
}

/**
 * Research Summary Response
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
 * Document Interface
 */
export interface ApplicationDocument {
  id: number;
  application: number;
  doc_type?: DocumentType; // backend field name
  document_type?: string; // alternative field name
  file: string;
  file_url?: string; // full URL for accessing file
  file_name: string;
  file_size: number;
  uploaded_at: string;
  reviewed_by?: number;
  reviewed_at?: string;
  is_approved?: boolean;
  review_comment?: string;
}

// Alias for backward compatibility
export type Document = ApplicationDocument;

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

// ============================================
// API Request/Response Types
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
  user_created: boolean;
  application_created: boolean;
}

/**
 * Login Request
 */
export interface LoginRequest {
  national_id: string;
  tracking_code: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
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
 * Unified Research Records Response
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

/**
 * Research Record Create Request
 */
export interface ResearchRecordCreateRequest {
  type: ResearchRecordType;
  data: Record<string, unknown>;
}

/**
 * Personal Info Update Request
 */
export interface PersonalInfoUpdateRequest {
  father_name: string;
  birth_certificate_number: string;
  birth_certificate_serial: string;
  birth_certificate_issue_place: string;
  birth_year: number;
  gender: Gender;
  military_status?: MilitaryStatus;
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
 * Application Choice Create Request
 */
export interface ApplicationChoiceCreateRequest {
  program_id: number;
  priority: number;
}

// ============================================
// Helper Types
// ============================================

/**
 * Pagination Response
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
  [key: string]: unknown;
}

/**
 * Status Badge Config
 */
export interface StatusBadgeConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}
