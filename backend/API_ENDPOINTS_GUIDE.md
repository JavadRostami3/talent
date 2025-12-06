# 📚 راهنمای کامل API Endpoints

**تاریخ:** 6 دسامبر 2025  
**نسخه:** 1.0

---

## 📑 فهرست

1. [احراز هویت (Authentication)](#1-احراز-هویت-authentication)
2. [مدیریت حساب کاربری (Accounts)](#2-مدیریت-حساب-کاربری-accounts)
3. [برنامه‌های تحصیلی (Programs)](#3-برنامه‌های-تحصیلی-programs)
4. [درخواست‌های ثبت‌نام (Applications)](#4-درخواست‌های-ثبت‌نام-applications)
5. [سوابق پژوهشی (Research Records)](#5-سوابق-پژوهشی-research-records)
6. [پنل ادمین - مسئول دانشگاه](#6-پنل-ادمین---مسئول-دانشگاه)
7. [پنل ادمین - مسئول دانشکده](#7-پنل-ادمین---مسئول-دانشکده)
8. [بررسی مدارک (Document Review)](#8-بررسی-مدارک-document-review)
9. [اطلاعیه‌ها و محتوا (Content)](#9-اطلاعیه‌ها-و-محتوا-content)
10. [دانشگاه‌ها و دانشکده‌ها (Core)](#10-دانشگاه‌ها-و-دانشکده‌ها-core)
11. [مستندات API](#11-مستندات-api)

---

## Base URL

```
Production: https://yourdomain.com/api/
Development: http://localhost:8000/api/
```

---

## Authentication Header

تمام endpoint های محافظت‌شده نیاز به JWT Token دارند:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

---

## 1. احراز هویت (Authentication)

### 1.1 ثبت‌نام اولیه

```http
POST /api/auth/register/
```

**دسترسی:** عمومی (بدون نیاز به احراز هویت)

**توضیحات:** ثبت‌نام اولیه داوطلب و ایجاد پرونده جدید

**Request Body:**
```json
{
  "national_id": "1234567890",
  "first_name": "علی",
  "last_name": "احمدی",
  "mobile": "09123456789",
  "email": "ali@example.com",
  "round_type": "MA_TALENT"
}
```

**انواع round_type:**
- `MA_TALENT` - استعداد درخشان کارشناسی ارشد
- `PHD_TALENT` - استعداد درخشان دکتری
- `PHD_EXAM` - آزمون دکتری
- `OLYMPIAD` - المپیاد علمی

**Response 201:**
```json
{
  "message": "ثبت‌نام با موفقیت انجام شد",
  "tracking_code": "TRK-ABC123XYZ",
  "application_id": 1,
  "user_id": 5
}
```

**خطاهای ممکن:**
- `400` - اطلاعات نامعتبر یا ناقص
- `400` - کد ملی قبلاً ثبت شده
- `404` - فراخوان فعالی برای این نوع یافت نشد

---

### 1.2 ورود به سیستم

```http
POST /api/auth/login/
```

**دسترسی:** عمومی

**توضیحات:** ورود با کد ملی و کد پیگیری، دریافت JWT tokens

**Request Body:**
```json
{
  "national_id": "1234567890",
  "tracking_code": "TRK-ABC123XYZ",
  "captcha": "5678"
}
```

**Response 200:**
```json
{
  "message": "ورود موفقیت‌آمیز",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhb...",
  "user": {
    "id": 5,
    "national_id": "1234567890",
    "full_name": "علی احمدی",
    "role": "APPLICANT"
  },
  "application_id": 1,
  "tracking_code": "TRK-ABC123XYZ"
}
```

**خطاهای ممکن:**
- `400` - اطلاعات ورود نادرست
- `404` - کاربر یا پرونده یافت نشد

---

### 1.3 تمدید توکن

```http
POST /api/auth/refresh/
```

**دسترسی:** عمومی

**توضیحات:** دریافت access token جدید با استفاده از refresh token

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhb..."
}
```

**Response 200:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## 2. مدیریت حساب کاربری (Accounts)

### 2.1 دریافت پروفایل کاربر

```http
GET /api/accounts/profile/
```

**دسترسی:** کاربران احراز هویت شده

**توضیحات:** دریافت اطلاعات کامل پروفایل کاربر جاری

**Response 200:**
```json
{
  "id": 5,
  "national_id": "1234567890",
  "first_name": "علی",
  "last_name": "احمدی",
  "father_name": "محمد",
  "mobile": "09123456789",
  "email": "ali@example.com",
  "gender": "MALE",
  "gender_display": "مرد",
  "birth_year": 1375,
  "birth_place": "تهران",
  "military_status": "FINISHED",
  "military_status_display": "پایان خدمت",
  "role": "APPLICANT",
  "profile": {
    "address": "تهران، خیابان...",
    "phone": "02112345678"
  }
}
```

---

### 2.2 ویرایش پروفایل

```http
PATCH /api/accounts/profile/update/
```

**دسترسی:** کاربران احراز هویت شده

**توضیحات:** ویرایش محدود اطلاعات پروفایل (فیلدهای خاص قابل ویرایش)

**فیلدهای قابل ویرایش:**
- `father_name`
- `birth_certificate_number`
- `birth_certificate_serial`
- `birth_certificate_issue_place`
- `mobile`
- `birth_year`
- `birth_place`
- `gender`
- `military_status` (برای مردان)

**فیلدهای محافظت‌شده (غیرقابل ویرایش):**
- `national_id`
- `first_name`
- `last_name`
- `email`
- `role`

**Request Body:**
```json
{
  "father_name": "محمد",
  "mobile": "09121111111",
  "birth_year": 1375,
  "gender": "MALE",
  "military_status": "FINISHED"
}
```

**Response 200:**
```json
{
  "message": "پروفایل با موفقیت به‌روزرسانی شد",
  "user": { ... }
}
```

**Validation:**
- اگر `gender=MALE` باشد، `military_status` الزامی است

---

## 3. برنامه‌های تحصیلی (Programs)

### 3.1 لیست برنامه‌های در دسترس

```http
GET /api/programs/
```

**دسترسی:** کاربران احراز هویت شده

**توضیحات:** لیست رشته‌های قابل انتخاب برای فراخوان جاری

**Query Parameters:**
- `round_id` (اختیاری) - فیلتر بر اساس فراخوان
- `faculty` (اختیاری) - فیلتر بر اساس دانشکده
- `department` (اختیاری) - فیلتر بر اساس گروه آموزشی
- `degree_level` (اختیاری) - مقطع تحصیلی (BSC, MSC, PHD)
- `search` (اختیاری) - جستجو در نام رشته

**مثال:**
```
GET /api/programs/?faculty=1&degree_level=MSC&search=فلسفه
```

**Response 200:**
```json
{
  "count": 25,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "فلسفه و کلام",
      "degree_level": "MSC",
      "degree_level_display": "کارشناسی ارشد",
      "study_type": "FULL_TIME",
      "study_type_display": "روزانه",
      "capacity": 10,
      "faculty": {
        "id": 1,
        "name": "الهیات و معارف اسلامی",
        "code": "01"
      },
      "department": {
        "id": 1,
        "name": "فلسفه و کلام اسلامی"
      },
      "description": "توضیحات رشته..."
    }
  ]
}
```

---

### 3.2 جزئیات برنامه تحصیلی

```http
GET /api/programs/{id}/
```

**دسترسی:** کاربران احراز هویت شده

**توضیحات:** دریافت اطلاعات کامل یک برنامه تحصیلی

**Response 200:**
```json
{
  "id": 1,
  "name": "فلسفه و کلام",
  "degree_level": "MSC",
  "study_type": "FULL_TIME",
  "capacity": 10,
  "faculty": { ... },
  "department": { ... },
  "description": "توضیحات کامل...",
  "requirements": "شرایط پذیرش...",
  "is_active": true
}
```

---

## 4. درخواست‌های ثبت‌نام (Applications)

### 4.1 لیست درخواست‌های من

```http
GET /api/applications/
```

**دسترسی:** APPLICANT

**توضیحات:** لیست تمام درخواست‌های ثبت‌نام کاربر جاری

**Response 200:**
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "tracking_code": "TRK-ABC123XYZ",
      "round": {
        "id": 1,
        "title": "فراخوان استعداد درخشان ارشد 1404",
        "type": "MA_TALENT",
        "start_date": "2025-01-01",
        "end_date": "2025-02-01"
      },
      "status": "SUBMITTED",
      "status_display": "ارسال شده",
      "created_at": "2025-12-01T10:00:00Z",
      "updated_at": "2025-12-05T14:30:00Z"
    }
  ]
}
```

---

### 4.2 جزئیات درخواست

```http
GET /api/applications/{application_id}/
```

**دسترسی:** APPLICANT (صاحب پرونده) یا ADMIN

**توضیحات:** دریافت اطلاعات کامل یک درخواست شامل انتخاب‌ها، سوابق، مدارک و...

**Response 200:**
```json
{
  "id": 1,
  "tracking_code": "TRK-ABC123XYZ",
  "applicant": {
    "user": {
      "national_id": "1234567890",
      "full_name": "علی احمدی",
      "mobile": "09123456789"
    }
  },
  "round": { ... },
  "status": "UNDER_UNIVERSITY_REVIEW",
  "status_display": "در حال بررسی مسئول دانشگاه",
  
  // انتخاب رشته‌ها (حداکثر 3)
  "choices": [
    {
      "id": 1,
      "priority": 1,
      "program": {
        "id": 5,
        "name": "فلسفه و کلام",
        "faculty": { ... }
      },
      "admission_status": "PENDING",
      "admission_status_display": "در انتظار"
    }
  ],
  
  // سوابق تحصیلی
  "education_records": [
    {
      "id": 1,
      "degree_level": "BSC",
      "university": "دانشگاه تهران",
      "field_of_study": "فلسفه",
      "gpa": 18.50,
      "status": "GRADUATED"
    }
  ],
  
  // مدارک
  "documents": [
    {
      "id": 1,
      "type": "PERSONAL_PHOTO",
      "type_display": "عکس پرسنلی",
      "file": "/media/documents/photo.jpg",
      "status": "UPLOADED",
      "uploaded_at": "2025-12-01T10:00:00Z"
    }
  ],
  
  // امتیازات
  "education_score": 25.5,
  "research_score": 35.0,
  "interview_score": 28.0,
  "total_score": 88.5,
  
  // وضعیت بررسی
  "university_review_status": "APPROVED",
  "faculty_review_completed": false,
  "admission_overall_status": "PENDING",
  
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-05T14:30:00Z"
}
```

---

### 4.3 به‌روزرسانی درخواست

```http
PATCH /api/applications/{application_id}/update/
```

**دسترسی:** APPLICANT (صاحب پرونده)

**توضیحات:** به‌روزرسانی اطلاعات درخواست (قبل از ارسال نهایی)

**محدودیت:** فقط قبل از `status=SUBMITTED` قابل ویرایش است

**Request Body:**
```json
{
  "status": "PERSONAL_INFO_COMPLETED"
}
```

---

### 4.4 ارسال نهایی درخواست

```http
POST /api/applications/{application_id}/submit/
```

**دسترسی:** APPLICANT (صاحب پرونده)

**توضیحات:** ارسال نهایی پرونده برای بررسی

**شرایط ارسال:**
1. حداقل 1 رشته انتخاب شده باشد (حداکثر 3)
2. اطلاعات شخصی کامل باشد
3. مدارک شناسایی آپلود شده باشد
4. سوابق تحصیلی ثبت شده باشد
5. مدارک تحصیلی آپلود شده باشد

**Response 200:**
```json
{
  "message": "درخواست با موفقیت ارسال شد",
  "application": { ... },
  "tracking_code": "TRK-ABC123XYZ"
}
```

**خطاهای ممکن:**
- `400` - شرایط ارسال رعایت نشده (با لیست موارد ناقص)
- `400` - درخواست قبلاً ارسال شده

---

### 4.5 مدیریت انتخاب رشته‌ها

```http
GET    /api/applications/{application_id}/choices/
POST   /api/applications/{application_id}/choices/
DELETE /api/applications/{application_id}/choices/
```

**دسترسی:** APPLICANT (صاحب پرونده)

#### GET - دریافت لیست انتخاب‌ها

**Response 200:**
```json
{
  "choices": [
    {
      "id": 1,
      "priority": 1,
      "program": { ... },
      "admission_status": "PENDING"
    }
  ]
}
```

#### POST - افزودن انتخاب رشته

**محدودیت:** حداکثر 3 رشته

**Request Body:**
```json
{
  "program_id": 5,
  "priority": 1
}
```

**Response 201:**
```json
{
  "message": "انتخاب رشته با موفقیت ثبت شد",
  "choice": { ... }
}
```

**خطاهای ممکن:**
- `400` - حداکثر 3 انتخاب رشته مجاز است
- `400` - این اولویت قبلاً انتخاب شده
- `400` - این برنامه قبلاً انتخاب شده

#### DELETE - حذف انتخاب رشته

**Request Body:**
```json
{
  "choice_id": 1
}
```

**Response 200:**
```json
{
  "message": "انتخاب رشته حذف شد"
}
```

---

### 4.6 مدیریت سوابق تحصیلی

```http
GET    /api/applications/{application_id}/education/
POST   /api/applications/{application_id}/education/
PUT    /api/applications/{application_id}/education/
DELETE /api/applications/{application_id}/education/
```

**دسترسی:** APPLICANT (صاحب پرونده)

#### POST - افزودن سابقه تحصیلی

**Request Body:**
```json
{
  "degree_level": "BSC",
  "university_id": 1,
  "field_of_study": "فلسفه",
  "gpa": 18.50,
  "status": "GRADUATED",
  "total_units_passed": 140,
  "semester_count": 8,
  "class_size": 30,
  "rank_status": "رتبه 2 از 30",
  "start_date": "2018-09-01",
  "end_date": "2022-07-01"
}
```

**انواع degree_level:**
- `BSC` - کارشناسی
- `MSC` - کارشناسی ارشد
- `PHD` - دکتری

**انواع status:**
- `STUDYING` - در حال تحصیل
- `GRADUATED` - فارغ‌التحصیل

**Response 201:**
```json
{
  "message": "سابقه تحصیلی ثبت شد",
  "record": { ... }
}
```

---

## 5. سوابق پژوهشی (Research Records)

### 5.1 دریافت تمام سوابق پژوهشی (Unified API)

```http
GET /api/applications/{application_id}/research-records/
```

**دسترسی:** APPLICANT (صاحب) یا ADMIN

**توضیحات:** دریافت تمام سوابق پژوهشی در یک response واحد

**Response 200:**
```json
{
  "total_records": 10,
  "total_score": 35.5,
  "summary": {
    "articles": 5,
    "patents": 2,
    "awards": 1,
    "conferences": 1,
    "books": 1,
    "thesis": 0
  },
  "records": [
    {
      "id": 1,
      "type": "ARTICLE",
      "article_type": "مقاله پژوهشی بین‌المللی",
      "title_fa": "عنوان فارسی",
      "title_en": "English Title",
      "journal_name": "Nature",
      "doi": "10.1234/nature.2024",
      "publish_year": 2024,
      "status": "منتشر شده",
      "score": 8.0,
      "file": "/media/research/article1.pdf",
      "reviewed_by": "دکتر احمدی",
      "created_at": "2024-12-01T10:00:00Z"
    },
    {
      "id": 2,
      "type": "PATENT",
      "title_fa": "سیستم هوشمند...",
      "patent_number": "123456",
      "registration_date": "1402/09/15",
      "score": 5.0,
      "created_at": "2024-11-20T14:00:00Z"
    }
  ]
}
```

**انواع type:**
- `ARTICLE` - مقاله
- `PATENT` - اختراع
- `FESTIVAL_AWARD` - جایزه جشنواره
- `CONFERENCE` - مقاله کنفرانس
- `BOOK` - کتاب
- `MASTERS_THESIS` - پایان‌نامه ارشد

---

### 5.2 ایجاد سابقه پژوهشی جدید

```http
POST /api/applications/{application_id}/research-records/create/
```

**دسترسی:** APPLICANT (صاحب)

**توضیحات:** افزودن سابقه پژوهشی جدید

#### مثال 1: مقاله

**Request Body:**
```json
{
  "type": "ARTICLE",
  "data": {
    "title_fa": "عنوان فارسی مقاله",
    "title_en": "English Title",
    "article_type": "RESEARCH_INTERNATIONAL",
    "journal_name": "Nature",
    "doi": "10.1234/...",
    "publish_year": 2024,
    "status": "PUBLISHED",
    "authors": "نویسنده 1، نویسنده 2"
  }
}
```

**انواع article_type:**
- `RESEARCH_NATIONAL` - علمی-پژوهشی (ملی)
- `RESEARCH_INTERNATIONAL` - علمی-پژوهشی (بین‌المللی)
- `PROMOTIONAL_NATIONAL` - علمی-ترویجی (ملی)
- `PROMOTIONAL_INTERNATIONAL` - علمی-ترویجی (بین‌المللی)

#### مثال 2: اختراع

**Request Body:**
```json
{
  "type": "PATENT",
  "data": {
    "title_fa": "عنوان اختراع",
    "patent_number": "123456",
    "registration_date": "1402/09/15",
    "inventors": "مخترع 1، مخترع 2",
    "description": "توضیحات"
  }
}
```

#### مثال 3: جایزه جشنواره

**Request Body:**
```json
{
  "type": "FESTIVAL_AWARD",
  "data": {
    "festival_name": "جشنواره خوارزمی",
    "award_title": "رتبه اول",
    "year": 1402,
    "description": "توضیحات"
  }
}
```

#### مثال 4: مقاله کنفرانس

**Request Body:**
```json
{
  "type": "CONFERENCE",
  "data": {
    "title_fa": "عنوان فارسی",
    "title_en": "English Title",
    "conference_name": "ICML 2024",
    "conference_type": "INTERNATIONAL",
    "year": 2024,
    "authors": "نویسندگان"
  }
}
```

**انواع conference_type:**
- `NATIONAL` - داخلی
- `INTERNATIONAL` - خارجی

#### مثال 5: کتاب

**Request Body:**
```json
{
  "type": "BOOK",
  "data": {
    "title_fa": "عنوان کتاب",
    "book_type": "AUTHORSHIP",
    "publisher": "نشر علم",
    "isbn": "978-1234567890",
    "publish_year": 2023,
    "authors_or_translators": "نویسندگان"
  }
}
```

**انواع book_type:**
- `AUTHORSHIP` - تألیف
- `TRANSLATION` - ترجمه

#### مثال 6: پایان‌نامه ارشد

**Request Body:**
```json
{
  "type": "MASTERS_THESIS",
  "data": {
    "title_fa": "عنوان پایان‌نامه",
    "grade": 19.50,
    "defense_date": "1402/06/15",
    "main_supervisor": "دکتر احمدی",
    "second_supervisor": "دکتر محمدی",
    "advisor_1": "دکتر رضایی"
  }
}
```

**Response 201:**
```json
{
  "message": "سابقه پژوهشی با موفقیت ثبت شد",
  "record_id": 15,
  "type": "ARTICLE"
}
```

---

### 5.3 خلاصه آماری سوابق

```http
GET /api/applications/{application_id}/research-records/summary/
```

**دسترسی:** APPLICANT (صاحب) یا ADMIN

**توضیحات:** خلاصه آمار و امتیازات سوابق پژوهشی

**Response 200:**
```json
{
  "total_score": 35.5,
  "max_possible_score": 58,
  "completion_percentage": 61.2,
  "breakdown": {
    "articles_score": 20.0,
    "patents_score": 8.0,
    "awards_score": 5.0,
    "conferences_score": 1.5,
    "books_score": 1.0,
    "thesis_score": 0.0
  },
  "max_limits": {
    "articles": 40,
    "promotional_articles": 6,
    "conferences": 4,
    "books": 4,
    "thesis": 4
  }
}
```

---

### 5.4 ویرایش/حذف سابقه پژوهشی

```http
PUT    /api/applications/{application_id}/research-records/{record_type}/{record_id}/
DELETE /api/applications/{application_id}/research-records/{record_type}/{record_id}/
```

**دسترسی:** APPLICANT (صاحب)

**مثال PUT:**
```
PUT /api/applications/123/research-records/article/5/
```

**Request Body:**
```json
{
  "title_fa": "عنوان جدید",
  "journal_name": "Science"
}
```

**مثال DELETE:**
```
DELETE /api/applications/123/research-records/patent/3/
```

**Response 200:**
```json
{
  "message": "سابقه پژوهشی حذف شد"
}
```

---

## 6. پنل ادمین - مسئول دانشگاه

### 6.1 لیست درخواست‌ها

```http
GET /api/admin/university/applications/
```

**دسترسی:** UNIVERSITY_ADMIN

**توضیحات:** لیست تمام درخواست‌های ارسال شده برای بررسی

**Query Parameters:**
- `status` - فیلتر بر اساس وضعیت
- `university_review_status` - فیلتر وضعیت بررسی
- `round` - فیلتر بر اساس فراخوان
- `faculty` - فیلتر بر اساس دانشکده
- `department` - فیلتر بر اساس گروه
- `search` - جستجو در کد ملی، نام، کد پیگیری
- `page` - شماره صفحه
- `page_size` - تعداد در هر صفحه (پیش‌فرض: 20)

**مثال:**
```
GET /api/admin/university/applications/?status=SUBMITTED&faculty=1&page=1
```

**Response 200:**
```json
{
  "count": 150,
  "next": "http://localhost:8000/api/admin/university/applications/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "tracking_code": "TRK-ABC123",
      "applicant_name": "علی احمدی",
      "national_id": "1234567890",
      "status": "SUBMITTED",
      "university_review_status": "PENDING",
      "choices": [
        {
          "priority": 1,
          "program_name": "فلسفه و کلام",
          "faculty_name": "الهیات"
        }
      ],
      "submitted_at": "2025-12-05T10:00:00Z"
    }
  ]
}
```

---

### 6.2 بررسی و تصمیم‌گیری درخواست

```http
POST /api/admin/university/applications/{application_id}/review/
```

**دسترسی:** UNIVERSITY_ADMIN

**توضیحات:** تایید، رد یا برگشت درخواست توسط مسئول دانشگاه

**Request Body:**
```json
{
  "decision": "APPROVED",
  "comment": "مدارک تایید شد"
}
```

**انواع decision:**
- `APPROVED` - تایید (ارجاع به دانشکده)
- `REJECTED` - رد
- `RETURNED_FOR_CORRECTION` - برگشت برای اصلاح

**Response 200:**
```json
{
  "message": "بررسی با موفقیت ثبت شد",
  "application": {
    "id": 1,
    "university_review_status": "APPROVED",
    "status": "UNDER_FACULTY_REVIEW"
  }
}
```

---

### 6.3 آمار و گزارشات

```http
GET /api/admin/university/statistics/
```

**دسترسی:** UNIVERSITY_ADMIN

**توضیحات:** آمار کلی درخواست‌ها

**Response 200:**
```json
{
  "total_applications": 250,
  "by_status": {
    "NEW": 10,
    "SUBMITTED": 80,
    "UNDER_UNIVERSITY_REVIEW": 50,
    "APPROVED_BY_UNIVERSITY": 70,
    "REJECTED_BY_UNIVERSITY": 20,
    "UNDER_FACULTY_REVIEW": 20
  },
  "by_round": {
    "MA_TALENT": 150,
    "PHD_TALENT": 80,
    "PHD_EXAM": 20
  },
  "pending_reviews": 50,
  "today_submissions": 5
}
```

---

### 6.4 دریافت پروفایل ادمین

```http
GET /api/admin/profile/
```

**دسترسی:** UNIVERSITY_ADMIN, FACULTY_ADMIN, SUPERADMIN

**توضیحات:** دریافت اطلاعات و دسترسی‌های ادمین جاری

**Response 200:**
```json
{
  "user": {
    "id": 10,
    "national_id": "9876543210",
    "full_name": "دکتر احمد رضایی",
    "role": "UNIVERSITY_ADMIN"
  },
  "permissions": {
    "has_ma_talent_access": true,
    "has_phd_talent_access": true,
    "has_phd_exam_access": false,
    "has_olympiad_access": false,
    "has_full_access": false,
    "faculties": [
      { "id": 1, "name": "الهیات" }
    ],
    "departments": []
  }
}
```

---

### 6.5 اطلاعیه‌های ادمین

```http
GET /api/admin/announcements/
```

**دسترسی:** ADMIN

**توضیحات:** دریافت اطلاعیه‌های مربوط به ادمین

**Response 200:**
```json
{
  "announcements": [
    {
      "id": 1,
      "title": "مهلت بررسی مدارک",
      "content": "لطفاً تا تاریخ...",
      "created_at": "2025-12-05T10:00:00Z"
    }
  ]
}
```

---

## 7. پنل ادمین - مسئول دانشکده

### 7.1 لیست درخواست‌های دانشکده

```http
GET /api/admin/faculty/applications/
```

**دسترسی:** FACULTY_ADMIN

**توضیحات:** لیست درخواست‌های تایید شده توسط دانشگاه که باید دانشکده بررسی کند

**Query Parameters:** (مشابه university/applications/)

**Response 200:**
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "tracking_code": "TRK-ABC123",
      "applicant_name": "علی احمدی",
      "status": "UNDER_FACULTY_REVIEW",
      "choices": [ ... ],
      "total_score": 85.5,
      "education_score": 25.0,
      "research_score": 35.5,
      "interview_score": 25.0
    }
  ]
}
```

---

### 7.2 بررسی و تصمیم پذیرش

```http
POST /api/admin/faculty/applications/{application_id}/review/
```

**دسترسی:** FACULTY_ADMIN

**توضیحات:** تصمیم نهایی پذیرش در رشته‌های انتخابی

**Request Body:**
```json
{
  "decision": "APPROVED",
  "comment": "پذیرفته شد در رشته اولویت اول",
  "choices_decisions": [
    {
      "choice_id": 1,
      "admission_status": "ACCEPTED",
      "admission_note": "پذیرش در اولویت 1"
    },
    {
      "choice_id": 2,
      "admission_status": "REJECTED",
      "admission_note": "ظرفیت تکمیل"
    }
  ]
}
```

**انواع decision:**
- `APPROVED` - پذیرش
- `REJECTED` - عدم پذیرش

**انواع admission_status برای هر choice:**
- `ACCEPTED` - پذیرفته شده
- `REJECTED` - پذیرفته نشده
- `WAITING` - لیست انتظار

**Response 200:**
```json
{
  "message": "بررسی دانشکده با موفقیت ثبت شد",
  "application": {
    "id": 1,
    "faculty_review_completed": true,
    "admission_overall_status": "ADMITTED",
    "status": "COMPLETED"
  }
}
```

**نکات:**
- اگر `decision=APPROVED` باشد، باید حداقل یک choice با `ACCEPTED` وجود داشته باشد
- سیستم خودکار `admission_overall_status` را تعیین می‌کند
- زمان اعلام نتیجه (`admission_result_published_at`) ثبت می‌شود

---

## 8. بررسی مدارک (Document Review)

### 8.1 دریافت/ایجاد بررسی مدارک

```http
GET  /api/admin/applications/{application_id}/documents/
POST /api/admin/applications/{application_id}/documents/
```

**دسترسی:** UNIVERSITY_ADMIN

**توضیحات:** مدیریت بررسی مدارک شناسایی و تحصیلی

#### GET - دریافت لیست بررسی‌ها

**Response 200:**
```json
{
  "application_id": 123,
  "tracking_code": "TRK-ABC123",
  "reviews": [
    {
      "id": 1,
      "document_type": "IDENTITY_DOCS",
      "document_type_display": "مدارک شناسایی",
      "status": "APPROVED",
      "status_display": "تایید شده",
      "comment": "مدارک شناسایی تایید شد",
      "defects": {},
      "reviewer": 10,
      "reviewer_name": "دکتر احمدی",
      "reviewed_at": "2025-12-05T10:00:00Z"
    },
    {
      "id": 2,
      "document_type": "EDUCATION_DOCS",
      "status": "APPROVED_WITH_DEFECT",
      "status_display": "تایید شده با نقص",
      "defects": {
        "missing_documents": ["ریزنمرات ترم 8"],
        "quality_issues": ["عکس واضح نیست"]
      },
      "comment": "نیاز به اصلاح",
      "reviewed_at": "2025-12-05T11:00:00Z"
    }
  ]
}
```

#### POST - ایجاد/به‌روزرسانی بررسی

**Request Body:**
```json
{
  "document_type": "IDENTITY_DOCS",
  "status": "APPROVED",
  "comment": "مدارک شناسایی تایید شد",
  "defects": {}
}
```

**انواع document_type:**
- `IDENTITY_DOCS` - مدارک شناسایی (عکس، کارت ملی، شناسنامه)
- `EDUCATION_DOCS` - مدارک تحصیلی (مدرک، ریزنمرات)

**انواع status:**
- `PENDING` - در انتظار بررسی
- `APPROVED` - تایید شده
- `APPROVED_WITH_DEFECT` - تایید شده با نقص
- `REJECTED` - رد شده

**Response 201:**
```json
{
  "id": 1,
  "document_type": "IDENTITY_DOCS",
  "status": "APPROVED",
  "comment": "مدارک شناسایی تایید شد",
  "reviewer": 10,
  "reviewed_at": "2025-12-05T10:00:00Z"
}
```

**Validation:**
- اگر `status=APPROVED_WITH_DEFECT` باشد، `defects` باید پر شود
- `reviewer` و `reviewed_at` خودکار ثبت می‌شوند

---

### 8.2 دریافت وضعیت کلی بررسی مدارک

```http
GET /api/admin/applications/{application_id}/documents/status/
```

**دسترسی:** APPLICANT (صاحب) یا ADMIN

**توضیحات:** دریافت خلاصه وضعیت بررسی تمام مدارک

**Response 200:**
```json
{
  "application_id": 123,
  "tracking_code": "TRK-ABC123",
  "reviews": [ ... ],
  "overall_status": {
    "status": "APPROVED_WITH_DEFECT",
    "status_display": "تایید شده با نقص",
    "description": "برخی مدارک با نقص تایید شده"
  }
}
```

**منطق محاسبه overall_status:**
1. اگر همه `APPROVED` → `APPROVED`
2. اگر حداقل یکی `REJECTED` → `REJECTED`
3. اگر حداقل یکی `APPROVED_WITH_DEFECT` → `APPROVED_WITH_DEFECT`
4. در غیر اینصورت → `PENDING`

---

## 9. اطلاعیه‌ها و محتوا (Content)

### 9.1 لیست اطلاعیه‌ها (عمومی)

```http
GET /api/content/announcements/
```

**دسترسی:** عمومی

**توضیحات:** لیست اطلاعیه‌های منتشر شده

**Query Parameters:**
- `is_published=true` - فقط منتشر شده‌ها
- `is_important=true` - فقط مهم‌ها
- `search` - جستجو در عنوان و متن

**Response 200:**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "title": "مهلت ثبت‌نام تمدید شد",
      "content": "به اطلاع می‌رساند...",
      "is_important": true,
      "published_at": "2025-12-01T10:00:00Z",
      "created_at": "2025-12-01T09:00:00Z"
    }
  ]
}
```

---

### 9.2 جزئیات اطلاعیه

```http
GET /api/content/announcements/{id}/
```

**دسترسی:** عمومی

**Response 200:**
```json
{
  "id": 1,
  "title": "مهلت ثبت‌نام تمدید شد",
  "content": "محتوای کامل اطلاعیه...",
  "is_important": true,
  "is_published": true,
  "published_at": "2025-12-01T10:00:00Z",
  "attachments": [
    {
      "title": "فایل پیوست",
      "file": "/media/announcements/file1.pdf"
    }
  ]
}
```

---

### 9.3 مدیریت اطلاعیه‌ها (ادمین)

```http
POST   /api/content/announcements/
PATCH  /api/content/announcements/{id}/
DELETE /api/content/announcements/{id}/
```

**دسترسی:** ADMIN

#### POST - ایجاد اطلاعیه

**Request Body:**
```json
{
  "title": "عنوان اطلاعیه",
  "content": "متن کامل",
  "is_important": true,
  "is_published": false
}
```

**Response 201:**
```json
{
  "id": 5,
  "title": "عنوان اطلاعیه",
  "is_published": false,
  "created_at": "2025-12-06T10:00:00Z"
}
```

#### PATCH - ویرایش اطلاعیه

**Request Body:**
```json
{
  "title": "عنوان جدید",
  "is_published": true
}
```

#### DELETE - حذف اطلاعیه

**Response 204:** No Content

---

### 9.4 انتشار اطلاعیه

```http
POST /api/content/announcements/{id}/publish/
```

**دسترسی:** ADMIN

**توضیحات:** انتشار اطلاعیه (تنظیم `is_published=True` و ثبت `published_at`)

**Response 200:**
```json
{
  "message": "اطلاعیه منتشر شد",
  "announcement": {
    "id": 5,
    "is_published": true,
    "published_at": "2025-12-06T10:30:00Z"
  }
}
```

---

### 9.5 صفحات استاتیک

```http
GET    /api/content/pages/
GET    /api/content/pages/{id}/
POST   /api/content/pages/            (ADMIN)
PATCH  /api/content/pages/{id}/       (ADMIN)
DELETE /api/content/pages/{id}/       (ADMIN)
```

**توضیحات:** مدیریت صفحات استاتیک مانند "درباره ما"، "تماس با ما"، "راهنما"

**ساختار مشابه Announcements**

---

## 10. دانشگاه‌ها و دانشکده‌ها (Core)

### 10.1 لیست دانشگاه‌ها

```http
GET /api/core/universities/
```

**دسترسی:** عمومی

**Query Parameters:**
- `search` - جستجو در نام دانشگاه
- `is_active=true` - فقط فعال‌ها

**Response 200:**
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "name": "دانشگاه تهران",
      "code": "01",
      "city": "تهران",
      "is_active": true
    }
  ]
}
```

---

### 10.2 جزئیات دانشگاه

```http
GET /api/core/universities/{id}/
```

**دسترسی:** عمومی

**Response 200:**
```json
{
  "id": 1,
  "name": "دانشگاه تهران",
  "code": "01",
  "city": "تهران",
  "address": "تهران، خیابان...",
  "website": "https://ut.ac.ir",
  "is_active": true,
  "faculties": [
    {
      "id": 1,
      "name": "الهیات و معارف اسلامی",
      "code": "01"
    }
  ]
}
```

---

### 10.3 ضرایب دانشگاه‌ها

```http
GET   /api/core/university-weights/
GET   /api/core/university-weights/{id}/
POST  /api/core/university-weights/bulk-update/  (ADMIN)
```

**دسترسی:** عمومی (GET), ADMIN (POST)

**توضیحات:** ضرایب وزنی دانشگاه‌ها برای محاسبه امتیاز

#### GET - لیست ضرایب

**Response 200:**
```json
{
  "results": [
    {
      "id": 1,
      "university": {
        "id": 1,
        "name": "دانشگاه تهران"
      },
      "weight": 2.0,
      "is_active": true
    }
  ]
}
```

#### POST - به‌روزرسانی دسته‌ای

**Request Body:**
```json
{
  "weights": [
    { "university_id": 1, "weight": 2.0 },
    { "university_id": 2, "weight": 1.5 }
  ]
}
```

---

### 10.4 دانشکده‌ها و گروه‌ها

```http
GET /api/core/faculties/
GET /api/core/faculties/{id}/
GET /api/core/departments/
GET /api/core/departments/{id}/
```

**دسترسی:** عمومی

**توضیحات:** لیست و جزئیات دانشکده‌ها و گروه‌های آموزشی

**Response مشابه دانشگاه‌ها**

---

## 11. مستندات API

### 11.1 Swagger UI (تعاملی)

```
GET /api/docs/
```

**دسترسی:** عمومی

**توضیحات:** رابط گرافیکی Swagger برای تست API ها

---

### 11.2 OpenAPI Schema

```
GET /api/schema/
```

**دسترسی:** عمومی

**توضیحات:** فایل JSON/YAML schema کامل API

---

## 📊 کدهای وضعیت HTTP

| کد | عنوان | معنی |
|----|-------|------|
| 200 | OK | درخواست موفق |
| 201 | Created | منبع جدید ایجاد شد |
| 204 | No Content | عملیات موفق بدون محتوای بازگشتی |
| 400 | Bad Request | خطا در داده‌های ورودی |
| 401 | Unauthorized | نیاز به احراز هویت |
| 403 | Forbidden | عدم دسترسی |
| 404 | Not Found | منبع یافت نشد |
| 500 | Internal Server Error | خطای سرور |

---

## 🔒 نکات امنیتی

1. **همیشه از HTTPS استفاده کنید** (در production)
2. **Token ها را ایمن نگه دارید** و در localStorage ذخیره نکنید
3. **Access token عمر کوتاهی دارد** (60 دقیقه) - از refresh استفاده کنید
4. **Rate Limiting:** سیستم محدودیت تعداد درخواست دارد
5. **CORS:** فقط دامنه‌های مجاز می‌توانند API را فراخوانی کنند

---

## 📝 نمونه کد استفاده

### JavaScript (Fetch API)

```javascript
// ثبت‌نام
const response = await fetch('http://localhost:8000/api/auth/register/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    national_id: '1234567890',
    first_name: 'علی',
    last_name: 'احمدی',
    mobile: '09123456789',
    email: 'ali@example.com',
    round_type: 'MA_TALENT'
  })
});

const data = await response.json();
console.log(data.tracking_code);

// ورود
const loginResponse = await fetch('http://localhost:8000/api/auth/login/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    national_id: '1234567890',
    tracking_code: data.tracking_code
  })
});

const loginData = await loginResponse.json();
const accessToken = loginData.access;

// استفاده از API با token
const profileResponse = await fetch('http://localhost:8000/api/accounts/profile/', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const profile = await profileResponse.json();
```

---

### Python (requests)

```python
import requests

BASE_URL = 'http://localhost:8000/api'

# ثبت‌نام
response = requests.post(f'{BASE_URL}/auth/register/', json={
    'national_id': '1234567890',
    'first_name': 'علی',
    'last_name': 'احمدی',
    'mobile': '09123456789',
    'email': 'ali@example.com',
    'round_type': 'MA_TALENT'
})

data = response.json()
tracking_code = data['tracking_code']

# ورود
login_response = requests.post(f'{BASE_URL}/auth/login/', json={
    'national_id': '1234567890',
    'tracking_code': tracking_code
})

login_data = login_response.json()
access_token = login_data['access']

# استفاده از API با token
headers = {'Authorization': f'Bearer {access_token}'}
profile_response = requests.get(f'{BASE_URL}/accounts/profile/', headers=headers)
profile = profile_response.json()
```

---

## 🆘 پشتیبانی

- **مستندات کامل:** `backend/DOCUMENTATION.md`
- **Issues:** https://github.com/JavadRostami3/talent/issues
- **Email:** rostamii1378@gmail.com

---

**تاریخ به‌روزرسانی:** 6 دسامبر 2025  
**نسخه API:** 1.0
