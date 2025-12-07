# گزارش وضعیت فرایند ثبت نهایی درخواست

## ✅ موارد پیاده‌سازی شده در Backend:

### 1. مدل Application (models.py)
- ✅ وضعیت‌های مختلف تعریف شده:
  - `NEW`: ثبت‌نام اولیه
  - `PERSONAL_INFO_COMPLETED`: اطلاعات شخصی تکمیل شد
  - `EDU_INFO_COMPLETED`: اطلاعات تحصیلی تکمیل شد
  - `SUBMITTED`: ارسال شده (منتظر بررسی) ⭐
  - `UNDER_UNIVERSITY_REVIEW`: در حال بررسی توسط مسئول دانشگاه
  - `APPROVED_BY_UNIVERSITY`: تایید شده توسط مسئول دانشگاه
  - `UNDER_FACULTY_REVIEW`: در حال بررسی توسط مسئول دانشکده
  - `COMPLETED`: تکمیل شده

### 2. API Endpoint برای Submit (applications_views.py)
- ✅ `POST /api/applicant/applications/{id}/submit/`
- ✅ اعتبارسنجی کامل:
  - چک کردن انتخاب حداقل یک رشته
  - چک کردن کامل بودن اطلاعات شخصی
  - چک کردن آپلود مدارک شناسایی (3 مدرک)
  - چک کردن سوابق تحصیلی (BSC برای همه، MSC برای دکتری)
  - چک کردن آپلود مدارک تحصیلی بر اساس وضعیت (فارغ‌التحصیل یا در حال تحصیل)
- ✅ تغییر وضعیت به `SUBMITTED`
- ✅ ثبت زمان ارسال (`submitted_at`)

### 3. Admin Panel Views
- ✅ فیلتر پرونده‌های `SUBMITTED` برای مسئولین دانشگاه
- ✅ آمار پرونده‌های ارسال شده
- ✅ سیستم بررسی مرحله‌ای (University → Faculty)

## ✅ موارد پیاده‌سازی شده در Frontend:

### 1. Application Service (applicationService.ts)
- ✅ `submitApplication()` تابع برای ارسال نهایی
- ✅ ارتباط با API endpoint

### 2. صفحه SubmitApplication
- ✅ چک‌لیست موارد قبل از ارسال
- ✅ هشدار عدم امکان ویرایش بعد از ارسال
- ✅ دکمه ارسال نهایی با loading state
- ✅ Toast notification برای موفقیت/خطا

### 3. Routing
- ✅ Route `/submit` در هر دو مسیر (Masters و PhD)

## ⚠️ موارد نیازمند اصلاح/تکمیل:

### 1. **ذخیره خودکار در هر مرحله** ✅ (موجود است)
- همه فرم‌ها دکمه "ذخیره" دارند
- اطلاعات بلافاصله به Backend ارسال می‌شود
- در Database ذخیره می‌شود
- وضعیت `status` به تدریج به‌روز می‌شود

### 2. **عدم نمایش در پنل Admin قبل از Submit** ❌ (نیاز به اصلاح)
**مشکل فعلی:**
```python
# admin_views.py - get_applications_for_review
queryset = Application.objects.filter(
    status__in=[
        Application.Status.SUBMITTED,  # ✅ درست
        Application.Status.UNDER_UNIVERSITY_REVIEW,
        Application.Status.APPROVED_BY_UNIVERSITY,
        Application.Status.RETURNED_FOR_CORRECTION,
    ]
)
```
این درست است! فقط پرونده‌های `SUBMITTED` و بعد از آن نمایش داده می‌شوند.

### 3. **Validation جامع قبل از Submit در Frontend** ⚠️ (نیاز به تکمیل)
**مشکل فعلی:**
- صفحه `SubmitApplication` فقط پیام‌های استاتیک دارد
- اعتبارسنجی واقعی در Backend انجام می‌شود
- Frontend باید قبل از ارسال چک کند

**راه‌حل پیشنهادی:**
```typescript
// قبل از ارسال به /submit، چک کنیم:
const checkCompleteness = async (applicationId: number) => {
  const app = await getApplicationById(applicationId);
  
  const errors = [];
  
  // چک انتخاب رشته
  if (!app.choices || app.choices.length === 0) {
    errors.push('حداقل یک رشته باید انتخاب شود');
  }
  
  // چک اطلاعات شخصی
  if (!app.applicant.first_name || !app.applicant.last_name) {
    errors.push('اطلاعات شخصی ناقص است');
  }
  
  // چک مدارک شناسایی
  const identityDocs = app.documents.filter(d => 
    ['PERSONAL_PHOTO', 'NATIONAL_CARD', 'ID_CARD'].includes(d.type)
  );
  if (identityDocs.length < 3) {
    errors.push('مدارک شناسایی کامل نیست');
  }
  
  // چک سوابق تحصیلی
  const bscRecord = app.education_records.find(r => r.degree_level === 'BSC');
  if (!bscRecord) {
    errors.push('اطلاعات تحصیلی کارشناسی الزامی است');
  }
  
  // برای دکتری: چک MSC
  if (app.round.type === 'PHD_TALENT') {
    const mscRecord = app.education_records.find(r => r.degree_level === 'MSC');
    if (!mscRecord) {
      errors.push('اطلاعات تحصیلی کارشناسی ارشد الزامی است');
    }
    
    // چک سوابق پژوهشی (حداقل 7 امتیاز)
    const researchScore = app.research_records.reduce((sum, r) => sum + (r.score || 0), 0);
    if (researchScore < 7) {
      errors.push('حداقل 7 امتیاز سوابق پژوهشی الزامی است');
    }
  }
  
  return errors;
};
```

### 4. **نمایش درصد تکمیل** ⚠️ (نیاز به تکمیل)
در Dashboard باید نمایش داده شود که چه درصدی از پرونده تکمیل شده:
```typescript
const calculateCompletionPercentage = (app: Application) => {
  let total = 0;
  let completed = 0;
  
  // اطلاعات شخصی (20%)
  total += 20;
  if (app.applicant.first_name && app.applicant.last_name && app.applicant.national_id) {
    completed += 20;
  }
  
  // انتخاب رشته (10%)
  total += 10;
  if (app.choices && app.choices.length > 0) {
    completed += 10;
  }
  
  // مدارک شناسایی (15%)
  total += 15;
  const identityDocs = app.documents.filter(d => 
    ['PERSONAL_PHOTO', 'NATIONAL_CARD', 'ID_CARD'].includes(d.type)
  );
  if (identityDocs.length >= 3) {
    completed += 15;
  }
  
  // سوابق تحصیلی (30%)
  total += 30;
  if (app.education_records.length > 0) {
    completed += 30;
  }
  
  // مدارک تحصیلی (25%)
  total += 25;
  const eduDocs = app.documents.filter(d => 
    ['BSC_CERT', 'BSC_TRANSCRIPT', 'MSC_CERT', 'MSC_TRANSCRIPT'].includes(d.type)
  );
  if (eduDocs.length >= 2) {
    completed += 25;
  }
  
  return (completed / total) * 100;
};
```

### 5. **دکمه "ثبت و ارسال نهایی" در ResearchRecordsPage** ✅ (اضافه شد)
```typescript
// در انتهای صفحه ResearchRecordsPage
<Button 
  onClick={() => navigate('/phd/olympiad-language')} 
  disabled={records.length === 0}
>
  ثبت و ارسال نهایی
</Button>
```
⚠️ **نکته:** این دکمه فقط به صفحه بعد می‌رود، نه submit نهایی!

## 📋 نقشه راه پیشنهادی:

### مرحله 1: تکمیل Validation در Frontend ⭐ (اولویت بالا)
1. ✅ ایجاد تابع `checkApplicationCompleteness()` در `applicationService.ts`
2. ✅ اضافه کردن به صفحه `SubmitApplication`
3. ✅ نمایش لیست خطاها به جای چک‌لیست استاتیک
4. ✅ غیرفعال کردن دکمه submit اگر خطا وجود دارد

### مرحله 2: اضافه کردن Progress Bar
1. ⭐ ایجاد تابع `calculateCompletionPercentage()` 
2. ⭐ نمایش Progress Bar در Dashboard
3. ⭐ نمایش کدام مراحل تکمیل شده و کدام نه

### مرحله 3: بهبود UX
1. ⭐ اضافه کردن دکمه "ثبت نهایی" در Dashboard
2. ⭐ نمایش وضعیت پرونده (Draft / Submitted / Under Review)
3. ⭐ قفل کردن صفحات ویرایش بعد از Submit
4. ⭐ نمایش Timeline از مراحل بررسی

### مرحله 4: تست و راه‌اندازی
1. ⚠️ تست فرایند کامل از ثبت‌نام تا Submit
2. ⚠️ تست اعتبارسنجی‌ها
3. ⚠️ تست نمایش در Admin Panel بعد از Submit

## 🎯 خلاصه وضعیت:

| بخش | Backend | Frontend | وضعیت |
|-----|---------|----------|-------|
| ذخیره خودکار | ✅ کامل | ✅ کامل | ✅ آماده |
| Submit API | ✅ کامل | ✅ کامل | ✅ آماده |
| Validation Backend | ✅ کامل | - | ✅ آماده |
| Validation Frontend | - | ❌ ناقص | ⚠️ نیاز به تکمیل |
| Admin Panel Filter | ✅ کامل | - | ✅ آماده |
| Progress Tracking | ⚠️ محدود | ❌ ندارد | ⚠️ نیاز به تکمیل |
| Submit Page UI | - | ✅ کامل | ✅ آماده |

## نتیجه‌گیری:

**✅ بخش عمده‌ای از فرایند پیاده‌سازی شده است:**
1. Backend کامل و آماده است
2. ذخیره خودکار کار می‌کند
3. Submit API آماده است
4. Admin Panel فقط پرونده‌های SUBMITTED را نشان می‌دهد

**⚠️ موارد نیازمند تکمیل:**
1. Validation در Frontend قبل از submit
2. نمایش Progress Bar و درصد تکمیل
3. بهبود UX در Dashboard
4. قفل کردن فرم‌ها بعد از Submit

**🚀 اولویت فعلی:**
ایجاد تابع `checkApplicationCompleteness()` و اضافه کردن به صفحه `SubmitApplication` برای validation قبل از ارسال نهایی.
