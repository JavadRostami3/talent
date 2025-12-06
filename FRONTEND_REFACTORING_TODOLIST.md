# 📋 تودولیست جامع: همگام‌سازی Frontend با Backend

## 🎯 خلاصه وضعیت

**مشکل اصلی:** فرانت فعلی یک پروتوتایپ Mock است و با backend واقعی سینک نیست.

**هدف:** تبدیل فرانت به یک کلاینت واقعی متصل به Django REST API.

---

## 📊 آمار کلی تغییرات

- ✅ **فایل‌های موجود برای ویرایش:** 15 فایل
- 🆕 **فایل‌های جدید برای ساخت:** 8 فایل
- 🗑️ **فایل‌های حذفی:** 0 فایل (فقط refactor)
- 🔧 **کامپوننت‌های جدید:** 5 کامپوننت

---

## 🔴 فاز 1: پایه‌سازی و TypeScript Types (اولویت بالا)

### ✅ Task 1.1: ایجاد فایل Types اصلی
**فایل جدید:** `src/types/models.ts`

**محتوا:**
```typescript
// Round Types (دقیقاً از backend)
export type RoundType = 'MA_TALENT' | 'PHD_TALENT' | 'PHD_EXAM' | 'OLYMPIAD';

// Application Status (همه حالت‌های بک‌اند)
export type ApplicationStatus = 
  | 'NEW'
  | 'PROGRAM_SELECTED'
  | 'PERSONAL_INFO_COMPLETED'
  | 'IDENTITY_DOCS_UPLOADED'
  | 'EDU_INFO_COMPLETED'
  | 'EDU_DOCS_UPLOADED'
  | 'SUBMITTED'
  | 'UNDER_UNIVERSITY_REVIEW'
  | 'APPROVED_BY_UNIVERSITY'
  | 'REJECTED_BY_UNIVERSITY'
  | 'RETURNED_FOR_CORRECTION'
  | 'UNDER_FACULTY_REVIEW'
  | 'FACULTY_REVIEW_COMPLETED'
  | 'COMPLETED'
  | 'INELIGIBLE'
  | 'DELETED';

// Degree Levels
export type DegreeLevel = 'BSC' | 'MSC' | 'PHD';

// Document Types (دقیقاً از backend)
export type DocumentType =
  | 'PERSONAL_PHOTO'
  | 'NATIONAL_CARD'
  | 'ID_CARD'
  | 'BSC_CERT'
  | 'BSC_TRANSCRIPT'
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

// Gender
export type Gender = 'MALE' | 'FEMALE';

// Military Status
export type MilitaryStatus = 
  | 'EXEMPT'
  | 'EDUCATIONAL_EXEMPT'
  | 'SERVING'
  | 'COMPLETED'
  | 'MEDICAL_EXEMPT';

// Research Record Types
export type ResearchRecordType = 
  | 'ARTICLE'
  | 'PATENT'
  | 'FESTIVAL_AWARD'
  | 'CONFERENCE'
  | 'BOOK'
  | 'MASTERS_THESIS';

// University Interface
export interface University {
  id: number;
  name: string;
  code?: string;
  is_active: boolean;
}

// Program Interface
export interface Program {
  id: number;
  name: string;
  code: string;
  faculty_name?: string;
  department_name?: string;
}

// Application Interface
export interface Application {
  id: number;
  tracking_code: string;
  status: ApplicationStatus;
  round: {
    id: number;
    type: RoundType;
    name: string;
  };
  total_score: number;
  created_at: string;
  updated_at: string;
}

// Education Record
export interface EducationRecord {
  id: number;
  degree_level: DegreeLevel;
  university: University;
  field_of_study: string;
  gpa: number;
  start_month?: number;
  start_year?: number;
  graduation_month?: number;
  graduation_year?: number;
  status?: string;
  // فیلدهای ویژه MA
  total_units_passed?: number;
  semester_count?: number;
  class_size?: number;
  rank_status?: string;
}

// Research Record (Unified)
export interface ResearchRecord {
  id: number;
  type: ResearchRecordType;
  title_fa: string;
  title_en?: string;
  score: number;
  created_at: string;
  reviewed_by?: string;
  // فیلدهای مخصوص مقاله
  article_type?: string;
  journal_name?: string;
  doi?: string;
  publish_year?: number;
  // فیلدهای مخصوص اختراع
  patent_number?: string;
  registration_date?: string;
  // ... بقیه فیلدها
}
```

**زمان تخمینی:** 30 دقیقه

---

### ✅ Task 1.2: بروزرسانی api.ts با Refresh Token
**فایل:** `src/services/api.ts`

**تغییرات:**
1. اضافه کردن interceptor برای refresh token
2. مدیریت 401 با تلاش مجدد

**زمان تخمینی:** 20 دقیقه

---

## 🔐 فاز 2: احراز هویت (Authentication)

### ✅ Task 2.1: ایجاد صفحه Register
**فایل جدید:** `src/pages/Register.tsx`

**ویژگی‌ها:**
- فرم با 6 فیلد: کد ملی، نام، نام خانوادگی، موبایل، ایمیل، نوع فراخوان
- اتصال به `/api/auth/register/`
- نمایش بزرگ `tracking_code` پس از موفقیت
- دکمه کپی کد پیگیری
- هدایت به صفحه لاگین

**زمان تخمینی:** 1 ساعت

---

### ✅ Task 2.2: ویرایش Login.tsx
**فایل:** `src/pages/Login.tsx`

**تغییرات:**
- حذف فیلد `otp`
- اضافه فیلد `trackingCode` (الزامی)
- اضافه فیلد `captcha` (اختیاری - UI فقط)
- لینک به صفحه Register
- اتصال به `/api/auth/login/`

**زمان تخمینی:** 30 دقیقه

---

### ✅ Task 2.3: بازنویسی authService.ts
**فایل:** `src/services/authService.ts`

**تغییرات:**
- حذف تمام mock data
- متد `register()` جدید
- متد `login()` با tracking_code
- ذخیره `access` و `refresh` tokens
- مدیریت logout

**زمان تخمینی:** 30 دقیقه

---

## 📝 فاز 3: ویزارد ثبت‌نام - مرحله 1 (انتخاب رشته)

### ✅ Task 3.1: ایجاد ProgramSelector Component
**فایل جدید:** `src/components/features/ProgramSelector.tsx`

**ویژگی‌ها:**
- Combobox قابل جستجو
- دریافت لیست از `/api/core/programs/`
- انتخاب تا 3 اولویت
- Drag & Drop برای تغییر ترتیب
- ارسال به `/api/applications/{id}/choices/`

**زمان تخمینی:** 2 ساعت

---

### ✅ Task 3.2: افزودن Step به RegistrationWizard
**فایل:** `src/pages/student/RegistrationWizard.tsx`

**تغییرات:**
- تبدیل از 3 Step به 6 Step
- Step 1 جدید: انتخاب رشته (استفاده از ProgramSelector)
- تغییر شماره Step‌های قبلی

**زمان تخمینی:** 45 دقیقه

---

## 👤 فاز 4: ویزارد ثبت‌نام - مرحله 2 (اطلاعات شخصی)

### ✅ Task 4.1: اصلاح Step اطلاعات شخصی
**فایل:** `src/pages/student/RegistrationWizard.tsx` (Step2Form)

**فیلدهای جدید:**
- `father_name` (الزامی)
- `birth_certificate_number` (الزامی)
- `birth_certificate_serial` (الزامی)
- `birth_certificate_issue_place` (الزامی)
- `birth_year` (Select: 1340-1385)
- `gender` (Radio: مرد/زن)
- `military_status` (Select - شرطی: فقط مرد)

**تغییرات Schema:**
- بروزرسانی zod validation
- شرطی کردن military_status

**زمان تخمینی:** 1.5 ساعت

---

## 📚 فاز 5: ویزارد ثبت‌نام - مرحله 3 (سوابق تحصیلی)

### ✅ Task 5.1: ایجاد UniversitySelector Component
**فایل جدید:** `src/components/features/UniversitySelector.tsx`

**ویژگی‌ها:**
- AsyncSelect قابل جستجو
- دریافت از `/api/core/universities/`
- Cache کردن نتایج
- نمایش نام فارسی دانشگاه

**زمان تخمینی:** 1 ساعت

---

### ✅ Task 5.2: ایجاد EducationRecordForm Component
**فایل جدید:** `src/components/features/EducationRecordForm.tsx`

**ویژگی‌ها:**
- فرم داینامیک بر اساس degree_level
- فیلدهای MA: شامل total_units_passed, semester_count, rank_status
- فیلدهای PhD: ساده‌تر (فقط پایه)
- استفاده از UniversitySelector
- Validation کامل

**زمان تخمینی:** 2 ساعت

---

### ✅ Task 5.3: بازنویسی Step سوابق تحصیلی در Wizard
**فایل:** `src/pages/student/RegistrationWizard.tsx` (Step3Form)

**تغییرات:**
- شناسایی نوع فراخوان (MA_TALENT vs PHD_TALENT)
- نمایش یک فرم برای MA (فقط کارشناسی)
- نمایش دو فرم برای PhD (کارشناسی + ارشد)
- استفاده از EducationRecordForm
- ارسال به `/api/applications/{id}/education-records/`

**زمان تخمینی:** 2 ساعت

---

## 🔬 فاز 6: سوابق پژوهشی (فقط دکتری - حیاتی)

### ✅ Task 6.1: ایجاد ResearchRecordsTable Component
**فایل جدید:** `src/components/features/ResearchRecordsTable.tsx`

**ویژگی‌ها:**
- Table با ستون‌های: نوع، عنوان، امتیاز، تاریخ، عملیات
- دریافت داده از `/api/applications/{id}/research-records/`
- دکمه "افزودن سابقه جدید"
- دکمه‌های Edit و Delete برای هر رکورد
- نمایش خلاصه آمار (تعداد کل، جمع امتیاز)
- Badge برای نوع سابقه (مقاله/کتاب/اختراع...)

**زمان تخمینی:** 2 ساعت

---

### ✅ Task 6.2: ایجاد ResearchRecordFormModal Component
**فایل جدید:** `src/components/features/ResearchRecordFormModal.tsx`

**ویژگی‌ها:**
- Dialog/Modal برای افزودن/ویرایش
- Select برای انتخاب نوع (type)
- فرم داینامیک بر اساس نوع:
  - **ARTICLE:** title_fa, title_en, article_type, journal_name, doi, publish_year, authors
  - **PATENT:** title_fa, patent_number, registration_date, inventors
  - **BOOK:** title_fa, publisher, publish_year, isbn
  - **CONFERENCE:** title_fa, conference_name, presentation_date
  - **FESTIVAL_AWARD:** award_name, festival_name, award_year
- آپلود فایل مدرک
- ارسال به `/api/applications/{id}/research-records/create/`
- ویرایش از `/api/applications/{id}/research-records/{type}/{id}/`

**زمان تخمینی:** 3 ساعت

---

### ✅ Task 6.3: افزودن Step سوابق پژوهشی به Wizard
**فایل:** `src/pages/student/RegistrationWizard.tsx` (Step4 جدید)

**تغییرات:**
- Step جدید برای سوابق پژوهشی
- نمایش ResearchRecordsTable
- شرطی: فقط برای PHD_TALENT و PHD_EXAM نمایش داده شود
- برای MA_TALENT این Step skip می‌شود

**زمان تخمینی:** 1 ساعت

---

## 📤 فاز 7: آپلود مدارک

### ✅ Task 7.1: بازنویسی FileUploader Component
**فایل:** `src/components/ui/FileUploader.tsx`

**تغییرات:**
- ارسال تک‌تک فایل‌ها با type مشخص
- اتصال به `/api/documents/upload/`
- نمایش وضعیت هر فایل (pending/uploading/success/error)
- دکمه پیش‌نمایش فایل
- دکمه حذف و آپلود مجدد
- Progress bar واقعی

**زمان تخمینی:** 2 ساعت

---

### ✅ Task 7.2: اصلاح Step آپلود مدارک در Wizard
**فایل:** `src/pages/student/RegistrationWizard.tsx` (Step5/6)

**تغییرات:**
- لیست داینامیک documentTypes بر اساس round_type:
  - **همه:** PERSONAL_PHOTO, NATIONAL_CARD, ID_CARD, BSC_CERT, BSC_TRANSCRIPT
  - **MA_TALENT:** + MSC_EXCELLENCE_CERT
  - **PHD_TALENT/PHD_EXAM:** + MSC_CERT, MSC_TRANSCRIPT, MSC_THESIS
- استفاده از FileUploader بازنویسی شده
- Validation: بررسی اینکه همه مدارک الزامی آپلود شده‌اند

**زمان تخمینی:** 1.5 ساعت

---

## 🎯 فاز 8: داشبورد دانشجو

### ✅ Task 8.1: بازنویسی Dashboard.tsx
**فایل:** `src/pages/student/Dashboard.tsx`

**تغییرات:**
- دریافت اطلاعات از `/api/applications/my-applications/`
- State Mapping دقیق:
  - `NEW` → "شروع نشده" + دکمه "شروع ثبت‌نام"
  - `PROGRAM_SELECTED` تا `EDU_DOCS_UPLOADED` → "در حال تکمیل" + دکمه "ادامه ثبت‌نام"
  - `SUBMITTED` → "ارسال شده - در انتظار بررسی"
  - `UNDER_UNIVERSITY_REVIEW` → "در حال بررسی توسط دانشگاه"
  - `RETURNED_FOR_CORRECTION` → "نیاز به اصلاح" + دکمه "ویرایش پرونده" + نمایش feedback
  - `APPROVED_BY_UNIVERSITY` → "تایید شده توسط دانشگاه"
  - `COMPLETED` → "تکمیل شده" + نمایش امتیاز نهایی
- نمایش Timeline پیشرفت
- نمایش کد پیگیری
- دکمه دانلود فرم نهایی (اگر تایید شده)

**زمان تخمینی:** 2.5 ساعت

---

### ✅ Task 8.2: ایجاد ApplicationTimeline Component
**فایل جدید:** `src/components/features/ApplicationTimeline.tsx`

**ویژگی‌ها:**
- نمایش تاریخچه تغییرات وضعیت
- آیکون و رنگ مناسب برای هر مرحله
- نمایش تاریخ و توضیحات
- نمایش نام بررسی‌کننده (اگر موجود باشد)

**زمان تخمینی:** 1.5 ساعت

---

## 🔄 فاز 9: سرویس‌ها و Context

### ✅ Task 9.1: بازنویسی userService.ts
**فایل:** `src/services/userService.ts`

**تغییرات:**
- حذف تمام Mock data و USE_MOCK_API
- متدهای جدید:
  - `getMyApplications()` → `/api/applications/my-applications/`
  - `getApplication(id)` → `/api/applications/{id}/`
  - `createApplication(roundId)` → `/api/applications/create/`
  - `updatePersonalInfo(appId, data)` → `/api/applications/{id}/personal-info/`
  - `addEducationRecord(appId, data)` → `/api/applications/{id}/education-records/`
  - `submitApplication(appId)` → `/api/applications/{id}/submit/`
- تطابق با Interface های TypeScript

**زمان تخمینی:** 2 ساعت

---

### ✅ Task 9.2: بازنویسی UserContext.tsx
**فایل:** `src/context/UserContext.tsx`

**تغییرات:**
- حذف Mock logic
- State management برای application جاری
- متدهای Helper:
  - `refreshApplication()`
  - `canEdit()` - بررسی اینکه آیا وضعیت قابل ویرایش است
  - `isPhD()` - بررسی نوع فراخوان
  - `getRequiredDocuments()` - لیست مدارک الزامی بر اساس نوع

**زمان تخمینی:** 1 ساعت

---

### ✅ Task 9.3: ایجاد documentsService.ts
**فایل جدید:** `src/services/documentsService.ts`

**متدها:**
- `uploadDocument(applicationId, file, type, onProgress)`
- `deleteDocument(documentId)`
- `getDocument(documentId)` - دانلود/پیش‌نمایش
- `getApplicationDocuments(applicationId)`

**زمان تخمینی:** 1 ساعت

---

## 👨‍💼 فاز 10: پنل ادمین

### ✅ Task 10.1: بازنویسی adminService.ts
**فایل:** `src/services/adminService.ts`

**تغییرات:**
- حذف تمام Mock data
- متدهای جدید:
  - `getStats()` → `/api/admin/dashboard/stats/`
  - `getApplications(filters)` → `/api/admin/applications/?page=1&status=...`
  - `getApplicationDetail(id)` → `/api/admin/applications/{id}/`
  - `reviewDocuments(appId, data)` → `/api/admin/applications/{id}/review-documents/`
  - `scoreEducation(appId, data)` → `/api/admin/applications/{id}/score-education/`
  - `updateStatus(appId, status, feedback)` → `/api/admin/applications/{id}/update-status/`

**زمان تخمینی:** 2 ساعت

---

### ✅ Task 10.2: اصلاح صفحات Admin Applicants
**فایل‌ها:**
- `src/pages/admin/applicants/MastersTalentedApplicants.tsx`
- `src/pages/admin/applicants/PhdTalentedApplicants.tsx`
- `src/pages/admin/applicants/PhdExamApplicants.tsx`
- `src/pages/admin/applicants/OlympiadApplicants.tsx`

**تغییرات مشترک:**
- دریافت داده از API با فیلتر مناسب
- Pagination واقعی (نه Fake)
- فیلترهای کاربردی: status, search, date range
- ستون‌های داینامیک بر اساس نوع:
  - دکتری: ستون "امتیاز پژوهشی"
  - ارشد: ستون "رتبه دانشگاهی"
- دکمه "مشاهده جزئیات" → هدایت به ApplicationReview

**زمان تخمینی:** 3 ساعت (برای 4 صفحه)

---

### ✅ Task 10.3: بازنویسی ApplicationReview.tsx
**فایل:** `src/pages/admin/ApplicationReview.tsx`

**تغییرات:**
- دریافت جزئیات کامل از API
- تبدیل به Tabbed Interface:
  - **Tab 1: اطلاعات کلی** - نمایش اطلاعات شخصی، رشته‌های انتخابی
  - **Tab 2: سوابق تحصیلی** - نمایش مدارک و سوابق
  - **Tab 3: سوابق پژوهشی** (فقط دکتری) - لیست مقالات/کتاب‌ها
  - **Tab 4: مدارک** - پیش‌نمایش و تایید/رد هر مدرک
  - **Tab 5: امتیازدهی** - فرم EducationScoring دستی
- دکمه‌های عملیاتی:
  - "تایید پرونده"
  - "رد پرونده" + textarea برای دلیل
  - "برگشت برای اصلاح" + textarea برای توضیحات
- نمایش Timeline تغییرات

**زمان تخمینی:** 4 ساعت

---

## 🎨 فاز 11: بهبود UX و UI

### ✅ Task 11.1: ایجاد StatusBadge پیشرفته
**فایل:** `src/components/ui/StatusBadge.tsx` (بهبود)

**تغییرات:**
- رنگ‌بندی دقیق برای تمام status ها
- آیکون مناسب
- Tooltip با توضیحات

**زمان تخمینی:** 30 دقیقه

---

### ✅ Task 11.2: ایجاد ProgressStepper پیشرفته
**فایل:** `src/components/ui/Stepper.tsx` (بهبود)

**تغییرات:**
- نمایش درصد پیشرفت
- امکان ذخیره موقت در هر مرحله
- نمایش آیکون ✓ برای مراحل تکمیل شده
- قابلیت بازگشت به مراحل قبلی (اگر مجاز باشد)

**زمان تخمینی:** 1 ساعت

---

### ✅ Task 11.3: ایجاد ErrorBoundary
**فایل جدید:** `src/components/ErrorBoundary.tsx`

**ویژگی‌ها:**
- Catch کردن خطاهای React
- نمایش پیام دوستانه به فارسی
- دکمه "تلاش مجدد"
- لاگ کردن خطا (در production)

**زمان تخمینی:** 45 دقیقه

---

### ✅ Task 11.4: بهبود Error Handling در فرم‌ها
**فایل‌ها:** تمام فرم‌های react-hook-form

**تغییرات:**
- نمایش خطاهای API زیر فیلد مربوطه
- ترجمه خطاهای backend به فارسی
- نمایش خطای کلی در Toast
- Validation realtime (onChange)

**زمان تخمینی:** 2 ساعت

---

## 🧪 فاز 12: تست و Validation

### ✅ Task 12.1: تست جریان کامل MA_TALENT
**چک‌لیست:**
- [ ] ثبت‌نام اولیه
- [ ] لاگین با tracking_code
- [ ] انتخاب رشته
- [ ] ورود اطلاعات شخصی
- [ ] ورود سابقه تحصیلی (فقط کارشناسی)
- [ ] آپلود مدارک
- [ ] ارسال نهایی
- [ ] مشاهده در داشبورد

**زمان تخمینی:** 2 ساعت

---

### ✅ Task 12.2: تست جریان کامل PHD_TALENT
**چک‌لیست:**
- [ ] ثبت‌نام اولیه
- [ ] لاگین
- [ ] انتخاب رشته
- [ ] ورود اطلاعات شخصی
- [ ] ورود سوابق تحصیلی (کارشناسی + ارشد)
- [ ] ثبت سوابق پژوهشی (مقاله، کتاب، اختراع)
- [ ] آپلود مدارک
- [ ] ارسال نهایی
- [ ] بررسی امتیاز محاسبه شده

**زمان تخمینی:** 3 ساعت

---

### ✅ Task 12.3: تست پنل ادمین
**چک‌لیست:**
- [ ] مشاهده داشبورد با آمار واقعی
- [ ] فیلتر کردن پرونده‌ها
- [ ] مشاهده جزئیات پرونده
- [ ] تایید/رد مدارک
- [ ] امتیازدهی دستی
- [ ] برگشت برای اصلاح
- [ ] تایید نهایی

**زمان تخمینی:** 2 ساعت

---

## 🔧 فاز 13: تنظیمات و Deployment

### ✅ Task 13.1: تنظیم Environment Variables
**فایل:** `.env.local`

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=false
```

**زمان تخمینی:** 15 دقیقه

---

### ✅ Task 13.2: حذف کدهای Mock
**فایل‌ها:**
- `src/services/userService.ts` - حذف USE_MOCK_API logic
- `src/services/adminService.ts` - حذف Mock data generators

**زمان تخمینی:** 30 دقیقه

---

### ✅ Task 13.3: بهینه‌سازی Bundle Size
**اقدامات:**
- Code splitting با React.lazy
- Tree shaking
- Minification
- بررسی bundle analyzer

**زمان تخمینی:** 1 ساعت

---

## 📊 خلاصه زمان‌بندی

| فاز | تعداد Task | زمان تخمینی |
|-----|-----------|-------------|
| فاز 1: Types | 2 | 50 دقیقه |
| فاز 2: Auth | 3 | 2 ساعت |
| فاز 3: انتخاب رشته | 2 | 2.75 ساعت |
| فاز 4: اطلاعات شخصی | 1 | 1.5 ساعت |
| فاز 5: سوابق تحصیلی | 3 | 5 ساعت |
| فاز 6: سوابق پژوهشی | 3 | 6 ساعت |
| فاز 7: آپلود مدارک | 2 | 3.5 ساعت |
| فاز 8: داشبورد | 2 | 4 ساعت |
| فاز 9: سرویس‌ها | 3 | 4 ساعت |
| فاز 10: پنل ادمین | 3 | 9 ساعت |
| فاز 11: UX بهبود | 4 | 4.25 ساعت |
| فاز 12: تست | 3 | 7 ساعت |
| فاز 13: Deployment | 3 | 1.75 ساعت |
| **جمع کل** | **34 Task** | **~52 ساعت** |

---

## 🎯 اولویت‌بندی برای شروع کار

### ⚡ High Priority (شروع فوری)
1. ✅ Task 1.1 & 1.2: Types و API setup
2. ✅ Task 2.1-2.3: احراز هویت کامل
3. ✅ Task 9.1: userService بازنویسی

### 🔥 Medium Priority (هفته اول)
4. ✅ Task 3.1-3.2: انتخاب رشته
5. ✅ Task 4.1: اطلاعات شخصی
6. ✅ Task 5.1-5.3: سوابق تحصیلی
7. ✅ Task 7.1-7.2: آپلود مدارک

### 📌 Normal Priority (هفته دوم)
8. ✅ Task 6.1-6.3: سوابق پژوهشی (دکتری)
9. ✅ Task 8.1-8.2: داشبورد دانشجو
10. ✅ Task 10.1-10.3: پنل ادمین

### 🎨 Low Priority (پالایش نهایی)
11. ✅ Task 11.1-11.4: بهبود UX
12. ✅ Task 12.1-12.3: تست کامل
13. ✅ Task 13.1-13.3: Deployment

---

## 📝 نکات مهم برای Developer

### ⚠️ Convention ها
- **snake_case vs camelCase:** در لایه API از snake_case استفاده کنید (مثل backend)
- **Date Format:** همه تاریخ‌ها در فرمت ISO 8601 (backend) و تبدیل به شمسی در UI
- **Validation:** همیشه client-side و server-side هر دو
- **Error Messages:** همیشه به فارسی برای کاربر

### 🔒 امنیت
- هرگز token در console.log نزنید
- همیشه از HTTPS در production استفاده کنید
- فایل‌های آپلودی را validate کنید (نوع و سایز)

### 🚀 Performance
- از React Query برای cache کردن استفاده کنید
- Debounce برای search inputs
- Lazy loading برای تصاویر و کامپوننت‌های سنگین

---

## ✅ چک‌لیست نهایی قبل از Production

- [ ] تمام Mock API ها حذف شدند
- [ ] Environment variables تنظیم شدند
- [ ] Error Boundary فعال است
- [ ] تمام فرم‌ها Validation دارند
- [ ] Refresh Token صحیح کار می‌کند
- [ ] Logout در تمام سناریوها کار می‌کند
- [ ] Responsive در موبایل تست شد
- [ ] تست با داده‌های واقعی backend انجام شد
- [ ] Bundle size قابل قبول است (< 500KB gzipped)
- [ ] Lighthouse Score > 90

---

**🎉 با تکمیل این تودولیست، فرانت شما 100% آماده است!**