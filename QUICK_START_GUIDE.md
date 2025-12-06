# 🚀 راهنمای شروع سریع - همگام‌سازی Frontend

## 📌 قبل از شروع

### نصب Dependencies
```bash
cd frontend
npm install
# یا
bun install
```

### تنظیم Environment
فایل `.env.local` بسازید:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=false
```

---

## 🎯 ترتیب اجرای Task ها (مرحله به مرحله)

### روز 1: پایه‌سازی (4-5 ساعت)

#### صبح (2 ساعت)
```bash
# 1. ایجاد فایل Types
touch src/types/models.ts
# کپی کردن محتوا از FRONTEND_REFACTORING_TODOLIST.md - Task 1.1
```

**تست:**
```typescript
// در یک فایل دلخواه
import { RoundType, ApplicationStatus } from '@/types/models';
const type: RoundType = 'MA_TALENT'; // باید خطا ندهد
```

#### بعدازظهر (2-3 ساعت)
```bash
# 2. بهبود api.ts با Refresh Token
# ویرایش src/services/api.ts
```

**تست:**
```bash
# در console مرورگر
localStorage.setItem('token', 'fake-expired-token');
# درخواست API بزنید - باید به صفحه لاگین برود
```

---

### روز 2: احراز هویت (4-5 ساعت)

#### Task 2.1: صفحه Register (1.5 ساعت)
```bash
touch src/pages/Register.tsx
```

**فیلدهای فرم:**
- `national_id` (10 رقم - با validation)
- `first_name` (فارسی)
- `last_name` (فارسی)
- `mobile` (09xxxxxxxxx)
- `email` (valid email)
- `round_type` (Select: MA_TALENT, PHD_TALENT, PHD_EXAM, OLYMPIAD)

**API Endpoint:**
```typescript
POST /api/auth/register/
Response: { tracking_code, application_id }
```

**نکته:** tracking_code را در یک Alert بزرگ نمایش دهید + دکمه Copy

#### Task 2.2: ویرایش Login (1 ساعت)
```bash
# ویرایش src/pages/Login.tsx
```

**تغییرات:**
- حذف: `otp` field
- اضافه: `trackingCode` field (required)
- اضافه: لینک "ثبت‌نام نکرده‌اید؟" → `/register`

**API Endpoint:**
```typescript
POST /api/auth/login/
Body: { national_id, tracking_code }
Response: { access, refresh, user }
```

#### Task 2.3: authService.ts (1 ساعت)
```bash
# ویرایش src/services/authService.ts
```

**متدهای جدید:**
```typescript
register(data: RegisterRequest): Promise<RegisterResponse>
login(national_id: string, tracking_code: string): Promise<LoginResponse>
```

**تست کامل:**
1. ثبت‌نام کنید → tracking_code بگیرید
2. با tracking_code لاگین کنید
3. token در localStorage ذخیره شود
4. هدایت به داشبورد

---

### روز 3-4: ویزارد ثبت‌نام - قسمت 1 (8-10 ساعت)

#### Task 3.1: ProgramSelector Component (2 ساعت)
```bash
mkdir -p src/components/features
touch src/components/features/ProgramSelector.tsx
```

**ویژگی‌ها:**
- Combobox با جستجو (از shadcn/ui)
- دریافت لیست از `/api/core/programs/`
- Multiple select (تا 3 عدد)
- نمایش ترتیب (اولویت 1، 2، 3)

**API:**
```typescript
GET /api/core/programs/?round_type=MA_TALENT
Response: [{ id, name, code, faculty_name, department_name }]
```

#### Task 4.1: اصلاح Step اطلاعات شخصی (2 ساعت)
```bash
# ویرایش src/pages/student/RegistrationWizard.tsx
```

**فیلدهای جدید Step 2:**
- `father_name`
- `birth_certificate_number`
- `birth_certificate_serial`
- `birth_certificate_issue_place`
- `birth_year` (Select dropdown)
- `gender` (Radio: MALE/FEMALE)
- `military_status` (Conditional - فقط MALE)

**Zod Schema:**
```typescript
const step2Schema = z.object({
  father_name: z.string().min(2),
  birth_certificate_number: z.string().min(1),
  birth_certificate_serial: z.string().min(1),
  birth_certificate_issue_place: z.string().min(2),
  birth_year: z.number().min(1340).max(1385),
  gender: z.enum(['MALE', 'FEMALE']),
  military_status: z.enum([...]).optional()
}).refine(data => {
  if (data.gender === 'MALE') {
    return !!data.military_status;
  }
  return true;
}, { message: "وضعیت نظام وظیفه الزامی است" });
```

---

### روز 5-6: سوابق تحصیلی (8-10 ساعت)

#### Task 5.1: UniversitySelector (1 ساعت)
```bash
touch src/components/features/UniversitySelector.tsx
```

**استفاده از React-Select Async:**
```typescript
import AsyncSelect from 'react-select/async';

const loadUniversities = async (inputValue: string) => {
  const res = await api.get(`/api/core/universities/?search=${inputValue}`);
  return res.data.map(u => ({ value: u.id, label: u.name }));
};
```

#### Task 5.2: EducationRecordForm (3 ساعت)
```bash
touch src/components/features/EducationRecordForm.tsx
```

**Props:**
```typescript
interface Props {
  degreeLevel: 'BSC' | 'MSC';
  roundType: RoundType;
  onSubmit: (data: EducationRecord) => void;
}
```

**Logic:**
```typescript
// اگر MA_TALENT
if (roundType === 'MA_TALENT') {
  // نمایش فیلدهای اضافه: total_units_passed, semester_count, rank_status
}

// اگر PHD_TALENT
// فرم ساده‌تر بدون فیلدهای اضافه
```

#### Task 5.3: اضافه به Wizard (2 ساعت)
```bash
# ویرایش RegistrationWizard.tsx - Step 3
```

**Logic:**
```typescript
const { application } = useUser();

if (application.round.type === 'MA_TALENT') {
  return <EducationRecordForm degreeLevel="BSC" roundType="MA_TALENT" />;
}

if (application.round.type === 'PHD_TALENT') {
  return (
    <>
      <EducationRecordForm degreeLevel="BSC" roundType="PHD_TALENT" />
      <EducationRecordForm degreeLevel="MSC" roundType="PHD_TALENT" />
    </>
  );
}
```

---

### روز 7-8: سوابق پژوهشی (دکتری) (8-10 ساعت)

#### Task 6.1: ResearchRecordsTable (2.5 ساعت)
```bash
touch src/components/features/ResearchRecordsTable.tsx
```

**ستون‌های جدول:**
- نوع (Badge: مقاله/کتاب/اختراع)
- عنوان (فارسی)
- امتیاز (عدد)
- تاریخ ثبت
- عملیات (Edit/Delete)

**API:**
```typescript
GET /api/applications/{id}/research-records/
Response: {
  total_records: 10,
  total_score: 35.5,
  records: [...]
}
```

#### Task 6.2: ResearchRecordFormModal (4 ساعت)
```bash
touch src/components/features/ResearchRecordFormModal.tsx
```

**Flow:**
1. انتخاب Type از Select
2. بر اساس Type، فرم تغییر می‌کند:

```typescript
switch (type) {
  case 'ARTICLE':
    return <ArticleForm />;
  case 'PATENT':
    return <PatentForm />;
  case 'BOOK':
    return <BookForm />;
  // ...
}
```

**API:**
```typescript
POST /api/applications/{id}/research-records/create/
Body: {
  type: 'ARTICLE',
  data: { title_fa, journal_name, doi, ... }
}
```

#### Task 6.3: افزودن به Wizard (1 ساعت)
```bash
# Step جدید در Wizard - فقط برای PHD
```

**Conditional Rendering:**
```typescript
{application.round.type === 'PHD_TALENT' && (
  <ResearchStep>
    <ResearchRecordsTable applicationId={application.id} />
  </ResearchStep>
)}
```

---

### روز 9: آپلود مدارک (4-5 ساعت)

#### Task 7.1 & 7.2: FileUploader + Wizard Integration
```bash
# ویرایش src/components/ui/FileUploader.tsx
# ویرایش RegistrationWizard.tsx Step Documents
```

**Document Types (Conditional):**
```typescript
const getRequiredDocs = (roundType: RoundType) => {
  const base = ['PERSONAL_PHOTO', 'NATIONAL_CARD', 'ID_CARD', 'BSC_CERT', 'BSC_TRANSCRIPT'];
  
  if (roundType === 'MA_TALENT') {
    return [...base, 'MSC_EXCELLENCE_CERT'];
  }
  
  if (roundType === 'PHD_TALENT') {
    return [...base, 'MSC_CERT', 'MSC_TRANSCRIPT', 'MSC_THESIS'];
  }
  
  return base;
};
```

**API:**
```typescript
POST /api/documents/upload/
Headers: { 'Content-Type': 'multipart/form-data' }
Body: FormData {
  file: File,
  type: 'PERSONAL_PHOTO',
  application_id: number
}
```

---

### روز 10: داشبورد دانشجو (5-6 ساعت)

#### Task 8.1: بازنویسی Dashboard (3 ساعت)
```bash
# ویرایش src/pages/student/Dashboard.tsx
```

**Status Mapping:**
```typescript
const getStatusInfo = (status: ApplicationStatus) => {
  switch (status) {
    case 'NEW':
      return { 
        title: 'شروع نشده', 
        action: 'شروع ثبت‌نام',
        color: 'blue',
        icon: PlayCircle 
      };
    case 'SUBMITTED':
      return { 
        title: 'ارسال شده', 
        description: 'در انتظار بررسی',
        color: 'yellow',
        icon: Clock 
      };
    case 'RETURNED_FOR_CORRECTION':
      return { 
        title: 'نیاز به اصلاح', 
        action: 'ویرایش پرونده',
        color: 'red',
        icon: AlertCircle,
        showFeedback: true 
      };
    // ...
  }
};
```

#### Task 8.2: ApplicationTimeline (2 ساعت)
```bash
touch src/components/features/ApplicationTimeline.tsx
```

**نمایش:**
- لیست عمودی رویدادها
- آیکون و رنگ برای هر مرحله
- تاریخ و توضیحات
- نام کاربری که تغییر داده

---

### روز 11-12: پنل ادمین (10-12 ساعت)

#### Task 10.1: adminService.ts (2 ساعت)
```bash
# ویرایش src/services/adminService.ts
# حذف تمام Mock و اتصال به API
```

#### Task 10.2: صفحات Applicants (4 ساعت)
```bash
# ویرایش 4 فایل:
# - MastersTalentedApplicants.tsx
# - PhdTalentedApplicants.tsx
# - PhdExamApplicants.tsx
# - OlympiadApplicants.tsx
```

**ویژگی‌های مشترک:**
- Pagination واقعی
- فیلتر status
- جستجو
- دکمه "مشاهده جزئیات"

#### Task 10.3: ApplicationReview (5 ساعت)
```bash
# ویرایش src/pages/admin/ApplicationReview.tsx
```

**Tabs:**
1. اطلاعات کلی
2. سوابق تحصیلی
3. سوابق پژوهشی (شرطی)
4. مدارک
5. امتیازدهی

---

### روز 13: تست و بهینه‌سازی (6-8 ساعت)

#### صبح: تست جریان کامل
```bash
# تست MA_TALENT (2 ساعت)
# تست PHD_TALENT (3 ساعت)
# تست پنل ادمین (2 ساعت)
```

#### بعدازظهر: بهینه‌سازی
```bash
# Code splitting
# حذف Mock ها
# بررسی Bundle size
```

---

## 🧪 دستورات تست

### تست Local با Backend
```bash
# Terminal 1: Backend
cd backend
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm run dev
```

### تست Production Build
```bash
npm run build
npm run preview
```

---

## 🐛 مشکلات رایج و راه‌حل

### 1. CORS Error
**علت:** Backend CORS تنظیم نشده

**راه‌حل:**
```python
# backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]
```

### 2. 401 Unauthorized
**علت:** Token منقضی شده

**راه‌حل:** Refresh Token Interceptor را چک کنید

### 3. فرم Submit نمی‌شود
**علت:** Validation خطا دارد

**راه‌حل:**
```typescript
console.log(form.formState.errors);
```

### 4. File Upload خطا می‌دهد
**علت:** Content-Type اشتباه

**راه‌حل:**
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('type', documentType);

await api.post('/api/documents/upload/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

---

## 📊 پیشرفت را Track کنید

### فایل Progress
```bash
touch PROGRESS.md
```

**محتوا:**
```markdown
## Week 1
- [x] Task 1.1: Types
- [x] Task 1.2: API
- [x] Task 2.1: Register Page
- [ ] Task 2.2: Login Update
...
```

---

## 🎯 Milestone ها

### Milestone 1: احراز هویت (End of Day 2)
- ✅ Register کار می‌کند
- ✅ Login کار می‌کند
- ✅ Token refresh اتوماتیک است

### Milestone 2: ویزارد اولیه (End of Day 6)
- ✅ انتخاب رشته
- ✅ اطلاعات شخصی
- ✅ سوابق تحصیلی

### Milestone 3: ویزارد کامل (End of Day 9)
- ✅ سوابق پژوهشی (دکتری)
- ✅ آپلود مدارک
- ✅ Submit نهایی

### Milestone 4: پنل ادمین (End of Day 12)
- ✅ لیست پرونده‌ها
- ✅ بررسی جزئیات
- ✅ امتیازدهی

### Milestone 5: Production Ready (End of Day 13)
- ✅ تست کامل
- ✅ بدون Bug
- ✅ Performance خوب

---

## 📞 در صورت نیاز به کمک

### چک‌لیست Debug:
1. آیا Backend در حال اجرا است؟ → `http://localhost:8000/admin`
2. آیا CORS تنظیم شده؟ → Console Error چک کنید
3. آیا Token موجود است؟ → `localStorage.getItem('token')`
4. آیا API URL درست است؟ → `.env.local` چک کنید
5. آیا Validation پاس می‌شود؟ → `console.log(errors)`

---

**🚀 موفق باشید! با این راهنما در 13 روز کاری پروژه آماده Production می‌شود.**
