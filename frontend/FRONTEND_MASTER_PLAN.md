# 🗺️ نقشه راه تکمیل فرانت‌اند (The Master Plan)

**تاریخ شروع:** 7 دسامبر 2025  
**وضعیت:** در حال اجرا - فاز ۱

---

## 📋 خلاصه فازها

| فاز | عنوان | وضعیت | اولویت |
|-----|-------|-------|---------|
| 🟢 فاز ۱ | زیرساخت و هماهنگی داده‌ها | ✅ تکمیل شد | بالا |
| 🔵 فاز ۲ | احراز هویت و جداسازی ورودی‌ها | 🚧 در حال اجرا | بالا |
| 🟠 فاز ۳ | پنل دانشجو | ⏳ در انتظار | متوسط |
| 🔴 فاز ۴ | پنل ادمین | ⏳ در انتظار | بالا |
| 🟣 فاز ۵ | تفکیک دسترسی‌ها | ⏳ در انتظار | متوسط |

---

## 🟢 فاز ۱: زیرساخت و هماهنگی داده‌ها (Data Sync Layer) ✅

### 🎯 هدف
قبل از ساختن صفحات، باید "زبان مشترک" بین فرانت و بک را اصلاح کنیم.

### ✅ وضعیت: **تکمیل شد** (7 دسامبر 2025)

### 📝 وظایف انجام شده

#### 1.1 بازنویسی `src/types/models.ts`

**هدف:** هماهنگی کامل با Serializer های Django

**اقدامات:**

- ✅ تعریف دقیق `ApplicationStatus` (34 وضعیت مطابق با بک‌اند)
- ✅ تعریف دقیق `AdmissionStatus` (PENDING, ACCEPTED, REJECTED, WAITING)
- ✅ **بازنویسی کامل `Application` interface:**
  - ✅ اضافه کردن فیلدهای امتیازدهی: `education_score`, `research_score`, `interview_score`, `total_score`
  - ✅ اضافه کردن فیلدهای بررسی: `university_review_status`, `university_review_comment`, `university_reviewed_at`, `university_reviewed_by`
  - ✅ اضافه کردن فیلدهای دانشکده: `faculty_review_completed`, `faculty_review_comment`, `faculty_reviewed_at`
  - ✅ اضافه کردن فیلدهای پذیرش: `admission_overall_status`, `admission_result_published_at`
  
- ✅ **بازنویسی `EducationRecord` interface:**
  - ✅ اضافه کردن فیلدهای امتیازدهی: `education_score`, `score_details`
  - ✅ اضافه کردن فیلدهای ویژه MA_TALENT: `total_units_passed`, `semester_count`, `class_size`, `rank_status`
  - ✅ اضافه کردن فیلدهای تاریخ: `start_month`, `start_year`, `graduation_month`, `graduation_year`

- ✅ **بازنویسی `ResearchRecord` با Union Types:**
  ```typescript
  // Base interface
  interface BaseResearchRecord {
    id: number;
    application: number;
    type: ResearchRecordType;
    score: number;
    created_at: string;
    updated_at: string;
  }

  // Specific types
  interface Article extends BaseResearchRecord {
    type: 'ARTICLE';
    article_type: ArticleType;
    title_fa: string;
    title_en?: string;
    journal_name: string;
    doi?: string;
    publish_year: number;
    status: string;
    authors: string;
    impact_factor?: number;
    citation_count?: number;
  }

  interface Patent extends BaseResearchRecord {
    type: 'PATENT';
    title_fa: string;
    patent_number: string;
    registration_date: string;
    inventors: string;
    description?: string;
  }

  interface Book extends BaseResearchRecord {
    type: 'BOOK';
    title_fa: string;
    book_type: 'AUTHORSHIP' | 'TRANSLATION';
    publisher: string;
    isbn?: string;
    publish_year: number;
    authors_or_translators: string;
  }

  // Union type
  type ResearchRecord = Article | Patent | Book | Conference | FestivalAward | MastersThesis;
  ```

- ✅ **ایجاد `Interview` interface:**
  ```typescript
  interface Interview {
    id: number;
    application: number;
    interview_date?: string;
    interview_time?: string;
    location?: string;
    interview_score?: number;
    attendance_status: 'SCHEDULED' | 'PRESENT' | 'ABSENT' | 'REJECTED_IN_INTERVIEW';
    interviewer_comment?: string;
    interviewed_by?: number;
    interviewed_at?: string;
  }
  ```

- ✅ **ایجاد `DocumentReview` interface:**
  ```typescript
  interface DocumentReview {
    id: number;
    application: number;
    document_type: 'IDENTITY_DOCS' | 'EDUCATION_DOCS';
    status: 'PENDING' | 'APPROVED' | 'APPROVED_WITH_DEFECT' | 'REJECTED';
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
  ```

#### 1.2 یکپارچه‌سازی سرویس‌ها ✅

**هدف:** تمام متدهای CRUD مربوط به پرونده در یک جا

**اقدامات:**

- ✅ **ایجاد `src/services/applicationService.ts`:**
  - ✅ ادغام متدهای `adminService.ts`
  - ✅ ادغام متدهای `uploadService.ts`
  - ✅ ادغام بخش‌های مربوط به application از `userService.ts`
  - ✅ پیاده‌سازی کامل تمام متدهای CRUD
  - ✅ پیاده‌سازی متدهای Admin Review (University + Faculty)
  - ✅ پیاده‌سازی متدهای Scoring & Interview
  - ✅ پیاده‌سازی Utility Functions (calculateCompletionPercentage, isApplicationReadyForSubmission)

**ساختار پیشنهادی:** ✅ پیاده‌سازی شد

```typescript
// ✅ Application CRUD - Implemented
- getApplication(id)
- getApplications(filters)
- updateApplication(id, data)
- submitApplication(id)

// Choices Management
- getChoices(applicationId)
- addChoice(applicationId, programId, priority)
- deleteChoice(applicationId, choiceId)

// Education Records
- getEducationRecords(applicationId)
- addEducationRecord(applicationId, data)
- updateEducationRecord(applicationId, recordId, data)
- deleteEducationRecord(applicationId, recordId)

// Research Records (Unified)
- getResearchRecords(applicationId)
- getResearchSummary(applicationId)
- addResearchRecord(applicationId, type, data)
- updateResearchRecord(applicationId, type, recordId, data)
- deleteResearchRecord(applicationId, type, recordId)

// Documents
- getDocuments(applicationId)
- uploadDocument(applicationId, file, type)
- deleteDocument(applicationId, documentId)

// Admin - University Review
- reviewApplication(applicationId, decision, comment)
- getDocumentReviews(applicationId)
- reviewDocuments(applicationId, documentType, status, comment, defects)

// Admin - Faculty Review
- scoringEducation(applicationId, score)
- scoringResearch(applicationId, score)
- scoreInterview(applicationId, score, comment)
- finalAdmissionDecision(applicationId, choicesDecisions, comment)

// Statistics
- getUniversityStatistics()
- getFacultyStatistics()
```

---

## 🔵 فاز ۲: احراز هویت و جداسازی ورودی‌ها (Auth & Gateways)

### 🎯 هدف
تفکیک مسیر ورود دانشجویان و مدیران

### 📝 وظایف

#### 2.1 صفحه ورود دانشجویان (`src/pages/Login.tsx`)

**طراحی:**
- فضای دانشجویی، رنگ‌های گرم و دوستانه
- لوگو و عنوان سیستم
- فرم ورود: کد ملی + کد پیگیری
- دکمه "ثبت‌نام" برای کاربران جدید
- **لینک کوچک در فوتر:** "ورود همکاران / پرسنل" → `/admin/login`

**Logic:**
```typescript
const handleLogin = async (nationalId, trackingCode) => {
  const response = await authService.login(nationalId, trackingCode);
  
  // Check user role
  if (response.user.role !== 'APPLICANT') {
    // Redirect to admin panel
    navigate('/admin');
    return;
  }
  
  // Regular student login
  navigate('/student/dashboard');
};
```

**API Endpoint:** `POST /api/auth/login/`

#### 2.2 صفحه ورود مدیران (`src/pages/AdminLogin.tsx`) ✨

**طراحی:**
- مینیمال، رسمی، ساده (بدون گرافیک‌های اضافی)
- لوگو سازمانی کوچک
- فرم ورود: کد ملی + رمز عبور
- دکمه "ورود به پنل مدیریت"

**Security:**
```typescript
const handleAdminLogin = async (nationalId, password) => {
  const response = await authService.adminLogin(nationalId, password);
  
  // Check user role
  if (response.user.role === 'APPLICANT') {
    showError('دسترسی غیرمجاز. لطفاً از صفحه ورود دانشجویان استفاده کنید.');
    return;
  }
  
  // Check staff status
  if (!response.user.is_staff) {
    showError('دسترسی محدود. لطفاً با پشتیبانی تماس بگیرید.');
    return;
  }
  
  // Redirect based on role
  if (response.user.role === 'UNIVERSITY_ADMIN') {
    navigate('/admin/university/applications');
  } else if (response.user.role === 'FACULTY_ADMIN') {
    navigate('/admin/faculty/applications');
  } else {
    navigate('/admin');
  }
};
```

**API Endpoint:** `POST /api/auth/admin-login/` (یا همان `/api/auth/login/`)

#### 2.3 صفحه اصلی و اطلاعیه‌ها (`src/pages/Landing.tsx`)

**محتوا:**
- لیست اطلاعیه‌های عمومی
- لینک‌های سریع: ثبت‌نام، ورود، راهنما
- معرفی فراخوان‌های فعال

**API Endpoint:** `GET /api/content/announcements/?is_published=true`

---

## 🟠 فاز ۳: پنل دانشجو (Student Panel)

### 🎯 هدف
ایجاد تجربه ثبت‌نام هوشمند و شرطی بر اساس نوع فراخوان

### 📝 وظایف

#### 3.1 موتور ثبت‌نام (Registration Wizard Engine)

**کامپوننت اصلی:** `src/components/wizard/WizardLayout.tsx`

**Props:**
```typescript
interface WizardLayoutProps {
  roundType: RoundType;
  applicationId: number;
  initialStep?: number;
}
```

**مراحل متغیر:**

```typescript
const getSteps = (roundType: RoundType) => {
  const baseSteps = [
    { id: 1, title: 'مشخصات شخصی', component: PersonalInfoStep },
    { id: 2, title: 'سوابق تحصیلی', component: EducationStep },
  ];

  // Add research step for PhD
  if (roundType === 'PHD_TALENT' || roundType === 'PHD_EXAM') {
    baseSteps.push({
      id: 3,
      title: 'سوابق پژوهشی',
      component: ResearchStep
    });
  }

  baseSteps.push(
    { id: 4, title: 'بارگذاری مدارک', component: DocumentsStep },
    { id: 5, title: 'انتخاب رشته', component: ProgramSelectionStep }
  );

  return baseSteps;
};
```

#### 3.2 گام سوابق پژوهشی (مخصوص دکتری)

**کامپوننت:** `src/components/wizard/steps/ResearchStep.tsx`

**فرم‌های داینامیک:**
- فرم مقاله (Article)
- فرم کتاب (Book)
- فرم اختراع (Patent)
- فرم کنفرانس (Conference)
- فرم جایزه (FestivalAward)
- فرم پایان‌نامه ارشد (MastersThesis)

**API:** `POST /api/applications/{id}/research-records/create/`

#### 3.3 داشبورد دانشجو

**کامپوننت:** `src/pages/student/Dashboard.tsx`

**بخش‌ها:**
1. **Timeline وضعیت:** نمایش مراحل پیشرفت پرونده
2. **نواقص پرونده:** اگر `university_review_status = APPROVED_WITH_DEFECT`
3. **کارت مصاحبه:** فقط برای دکتری + اگر `interview_date` مقداردهی شده باشد
4. **اطلاعیه‌های شخصی**

---

## 🔴 فاز ۴: پنل ادمین (Admin Panel)

### 🎯 هدف
پیاده‌سازی مدل ذهنی ۵ مرحله‌ای برای بررسی پرونده‌ها

### 📝 وظایف

#### 4.1 صفحه لیست پرونده‌ها (`ApplicantsList`)

**مسیرها:**
- `/admin/university/applications` - مسئول دانشگاه
- `/admin/faculty/applications` - مسئول دانشکده

**فیلترهای پیشرفته:**
- جستجو (کد ملی، نام، کد پیگیری)
- دانشکده
- گروه آموزشی
- وضعیت بررسی
- نوع فراخوان
- رنج امتیاز

**API:**
- `GET /api/admin/university/applications/`
- `GET /api/admin/faculty/applications/`

#### 4.2 صفحه جزئیات با ۵ تب

**کامپوننت:** `src/pages/admin/ApplicationDetails.tsx`

**تب ۱: مشخصات هویتی (Identity Review)**

**محتوا:**
- نمایش عکس، شناسنامه، کارت ملی
- فرم اطلاعات شخصی (read-only برای دانشکده)

**عملیات (مسئول دانشگاه):**
```typescript
interface IdentityReviewForm {
  status: 'APPROVED' | 'APPROVED_WITH_DEFECT' | 'REJECTED';
  comment?: string;
  defects?: {
    missing_documents?: string[];
    quality_issues?: string[];
  };
}
```

**API:** `POST /api/admin/applications/{id}/documents/`

**تب ۲: سوابق تحصیلی و پژوهشی**

**محتوا:**
- لیست سوابق تحصیلی
- لیست سوابق پژوهشی (برای دکتری)
- دانلود فایل‌های پیوست

**عملیات (مسئول دانشکده - فقط دکتری):**
```typescript
interface ScoringForm {
  education_score?: number;
  research_score?: number;
  comment?: string;
}
```

**API:**
- `GET /api/applications/{id}/education/`
- `GET /api/applications/{id}/research-records/`
- `POST /api/admin/faculty/applications/{id}/scoring/`

**تب ۳: مصاحبه (Interview - مخصوص دکتری)**

**محتوا:**
- زمان و مکان مصاحبه
- فرم ثبت نمره مصاحبه

**عملیات (مسئول دانشکده):**
```typescript
interface InterviewForm {
  interview_score: number;
  attendance_status: 'PRESENT' | 'ABSENT' | 'REJECTED_IN_INTERVIEW';
  comment?: string;
}
```

**API:** `POST /api/admin/faculty/applications/{id}/interview/`

**تب ۴: گزارش و گردش کار (Workflow & Log)**

**محتوا:**
- Timeline تغییرات وضعیت
- لاگ فعالیت‌ها

**عملیات:**
- دکمه "ارسال به دانشکده" (مسئول دانشگاه)
- دکمه "اعلام نتیجه نهایی" (مسئول دانشکده)

**تب ۵: وضعیت پذیرش (Admission Status)**

**محتوا:**
- جدول انتخاب رشته‌ها

**عملیات (مسئول دانشکده):**
```typescript
interface AdmissionDecisionForm {
  choices_decisions: Array<{
    choice_id: number;
    admission_status: 'ACCEPTED' | 'REJECTED' | 'WAITING';
    admission_note?: string;
  }>;
  overall_comment?: string;
}
```

**API:** `POST /api/admin/faculty/applications/{id}/review/`

---

## 🟣 فاز ۵: تفکیک دسترسی‌ها (Permission Handling)

### 🎯 هدف
پیاده‌سازی سیستم دسترسی بر اساس نقش کاربر

### 📝 وظایف

#### 5.1 Context مدیریت دسترسی

**فایل:** `src/context/PermissionContext.tsx`

```typescript
interface PermissionContextType {
  role: UserRole;
  permissions: {
    canViewIdentityDocs: boolean;
    canEditIdentityDocs: boolean;
    canViewEducationDocs: boolean;
    canEditEducationDocs: boolean;
    canViewResearch: boolean;
    canScoreResearch: boolean;
    canViewInterview: boolean;
    canScoreInterview: boolean;
    canApproveUniversity: boolean;
    canApproveFaculty: boolean;
    canManageAdmission: boolean;
  };
  faculties: Faculty[];
  departments: Department[];
}
```

#### 5.2 ماتریس دسترسی‌ها

| عملیات | UNIVERSITY_ADMIN | FACULTY_ADMIN |
|--------|------------------|---------------|
| مشاهده مشخصات هویتی | ✅ | ✅ (Read-only) |
| ویرایش مشخصات هویتی | ✅ | ❌ |
| مشاهده سوابق تحصیلی | ✅ | ✅ |
| امتیازدهی تحصیلی | ❌ | ✅ (دکتری) |
| مشاهده سوابق پژوهشی | ✅ | ✅ |
| امتیازدهی پژوهشی | ❌ | ✅ (دکتری) |
| مشاهده مصاحبه | ✅ (Read-only) | ✅ |
| امتیازدهی مصاحبه | ❌ | ✅ (دکتری) |
| تایید نهایی مدارک | ✅ | ❌ |
| ارسال به دانشکده | ✅ | ❌ |
| تصمیم پذیرش نهایی | ❌ | ✅ |

---

## 📊 وضعیت پیشرفت کلی

```
🟢 فاز ۱: ██████████ 100% ✅ تکمیل شد
🔵 فاز ۲: ░░░░░░░░░░   0%
🟠 فاز ۳: ░░░░░░░░░░   0%
🔴 فاز ۴: ░░░░░░░░░░   0%
🟣 فاز ۵: ░░░░░░░░░░   0%

کل: ████░░░░░░░░░░░░░░░░ 20%
```

### 🎉 دستاوردهای فاز ۱:

✅ **فایل `models.ts` (1009 خط):**
- 13 Enum Type با Display Mappings
- 20+ Interface کامل
- Union Types برای ResearchRecord
- Type Guards برای تشخیص نوع
- Request/Response Types
- Filter & Pagination Types

✅ **فایل `applicationService.ts` (780 خط):**
- 30+ متد CRUD کامل
- Application Management (CRUD, Submit, Delete)
- Choices Management (Add, Update, Delete)
- Education Records (CRUD)
- Research Records (CRUD با Union Types)
- Documents (Upload Single/Bulk, Delete, Download)
- Admin Reviews (University + Faculty)
- Scoring & Interview Management
- Bulk Operations (Email, Export)
- Utility Functions (Completion %, Validation)

### 📅 تاریخ تکمیل فاز ۱: 7 دسامبر 2025

---

## 📚 مراجع

- **API Documentation:** `backend/API_ENDPOINTS_GUIDE.md`
- **Backend Models:** `backend/apps/*/models.py`
- **Serializers:** `backend/apps/api/*_serializers.py`

---

**آخرین به‌روزرسانی:** 7 دسامبر 2025
