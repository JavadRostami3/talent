# API Documentation - Announcements System

## مدیریت اطلاعیه‌ها

### ✅ پیاده‌سازی شده

#### 1. مدل Announcement با قابلیت‌های:
- ✅ کد یکتا (auto-generated 6 digits)
- ✅ عنوان مطلب
- ✅ متن کامل (body - TextField for HTML content)
- ✅ دسته‌بندی/گروه مطلب (category)
- ✅ ترتیب/اولویت نمایش (priority)
- ✅ فایل پیوست (attachment)
- ✅ وضعیت انتشار (is_published)
- ✅ تاریخ انتشار (published_at - auto-set)
- ✅ نویسنده (author - ForeignKey to User)
- ✅ شمارش بازدید (views_count)
- ✅ تاریخ ایجاد/بروزرسانی (timestamps)

#### 2. Django Admin
- نمایش کامل با تمام فیلدها
- فیلتر بر اساس: دسته‌بندی، وضعیت، تاریخ
- جستجو در: عنوان، متن، کد
- ویرایش سریع: priority, is_published
- ثبت خودکار نویسنده

#### 3. REST API Endpoints

**Base URL:** `/api/content/announcements/`

##### برای Admin (نیاز به Authentication و role=ADMIN):

```
GET    /api/content/announcements/              # لیست تمام اطلاعیه‌ها
POST   /api/content/announcements/              # ایجاد اطلاعیه جدید
GET    /api/content/announcements/{id}/         # جزئیات یک اطلاعیه
PUT    /api/content/announcements/{id}/         # ویرایش کامل
PATCH  /api/content/announcements/{id}/         # ویرایش جزئی
DELETE /api/content/announcements/{id}/         # حذف اطلاعیه

POST   /api/content/announcements/{id}/publish/    # انتشار اطلاعیه
POST   /api/content/announcements/{id}/unpublish/  # لغو انتشار
```

##### برای عموم (بدون نیاز به احراز هویت):

```
GET    /api/content/announcements/public/       # لیست اطلاعیه‌های منتشر شده
       ?category=MA_TALENT                       # فیلتر بر اساس دسته

GET    /api/content/announcements/latest/       # آخرین اطلاعیه‌ها
       ?limit=5                                  # تعداد (default: 5)
       ?category=PHD_TALENT                      # فیلتر دسته
```

##### Filters & Search:

```
GET /api/content/announcements/?category=GENERAL      # فیلتر دسته
GET /api/content/announcements/?is_published=true     # فیلتر وضعیت
GET /api/content/announcements/?search=ارشد           # جستجو
GET /api/content/announcements/?ordering=-views_count # مرتب‌سازی
```

### 📝 Request/Response Examples

#### 1. ایجاد اطلاعیه جدید

**Request:**
```json
POST /api/content/announcements/
Authorization: Bearer {token}

{
  "title": "ثبت نام استعداد درخشان ارشد سال ۱۴۰۴",
  "body": "<p>متن کامل اطلاعیه با HTML...</p>",
  "category": "MA_TALENT",
  "priority": 10,
  "is_published": true
}
```

**Response:**
```json
{
  "message": "اطلاعیه با موفقیت ایجاد شد",
  "data": {
    "id": 1,
    "code": "123456",
    "title": "ثبت نام استعداد درخشان ارشد سال ۱۴۰۴",
    "body": "<p>متن کامل اطلاعیه با HTML...</p>",
    "category": "MA_TALENT",
    "category_display": "استعداد درخشان ارشد",
    "priority": 10,
    "attachment": null,
    "is_published": true,
    "published_at": "2024-12-04T10:30:00Z",
    "author": 1,
    "author_name": "ادمین سیستم",
    "views_count": 0,
    "created_at": "2024-12-04T10:30:00Z",
    "updated_at": "2024-12-04T10:30:00Z"
  }
}
```

#### 2. لیست اطلاعیه‌های عمومی

**Request:**
```
GET /api/content/announcements/public/?category=MA_TALENT&page=1
```

**Response:**
```json
{
  "count": 12,
  "next": "http://api.../announcements/public/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "code": "123456",
      "title": "ثبت نام استعداد درخشان ارشد",
      "body": "<p>متن کامل...</p>",
      "category": "MA_TALENT",
      "category_display": "استعداد درخشان ارشد",
      "attachment": "http://.../media/announcements/file.pdf",
      "published_at": "2024-12-04T10:30:00Z",
      "views_count": 58
    },
    ...
  ]
}
```

#### 3. نمایش جزئیات (با افزایش بازدید خودکار)

**Request:**
```
GET /api/content/announcements/1/
```

**Response:**
```json
{
  "id": 1,
  "code": "123456",
  "title": "ثبت نام استعداد درخشان ارشد سال ۱۴۰۴",
  "body": "<p>متن کامل اطلاعیه...</p>",
  "category": "MA_TALENT",
  "category_display": "استعداد درخشان ارشد",
  "priority": 10,
  "attachment": "http://.../media/announcements/file.pdf",
  "is_published": true,
  "published_at": "2024-12-04T10:30:00Z",
  "author": 1,
  "author_name": "ادمین سیستم",
  "views_count": 59,  // افزایش یافته
  "created_at": "2024-12-04T10:30:00Z",
  "updated_at": "2024-12-04T10:30:00Z"
}
```

#### 4. انتشار اطلاعیه

**Request:**
```
POST /api/content/announcements/1/publish/
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "message": "اطلاعیه با موفقیت منتشر شد",
  "data": {
    "id": 1,
    "is_published": true,
    "published_at": "2024-12-04T11:00:00Z",
    ...
  }
}
```

### 🎯 دسته‌بندی‌ها (Categories)

```python
GENERAL = "GENERAL"       # عمومی
MA_TALENT = "MA_TALENT"   # استعداد درخشان ارشد
PHD_TALENT = "PHD_TALENT" # استعداد درخشان دکتری
PHD_EXAM = "PHD_EXAM"     # آزمون دکتری
OLYMPIAD = "OLYMPIAD"     # المپیاد علمی
```

### 🔐 Permissions

- **Public endpoints** (`/public/`, `/latest/`): بدون احراز هویت
- **List/Retrieve**: همه می‌توانند اطلاعیه‌های منتشر شده را ببینند
- **Create/Update/Delete**: فقط ADMIN و SUPERADMIN
- **Publish/Unpublish**: فقط ADMIN و SUPERADMIN

### 📊 Ordering Options

```
?ordering=priority          # بر اساس اولویت (صعودی)
?ordering=-priority         # بر اساس اولویت (نزولی)
?ordering=-published_at     # جدیدترین‌ها
?ordering=-views_count      # پربازدیدترین‌ها
?ordering=-created_at       # آخرین ایجاد شده‌ها
```

### 🔍 Search

جستجو در فیلدهای:
- عنوان (title)
- متن (body)
- کد (code)

```
GET /api/content/announcements/?search=ارشد
```

### ✨ ویژگی‌های خاص

1. **کد یکتا خودکار**: هر اطلاعیه کد 6 رقمی یکتا دارد
2. **تاریخ انتشار خودکار**: هنگام publish شدن، تاریخ set می‌شود
3. **شمارش بازدید**: هر بار retrieve شود، views_count++ می‌شود
4. **نویسنده خودکار**: هنگام create، user فعلی به عنوان author ثبت می‌شود
5. **فیلتر هوشمند**: کاربران عادی فقط اطلاعیه‌های منتشر شده را می‌بینند
6. **پشتیبانی از HTML**: فیلد body می‌تواند HTML ذخیره کند

### 🚀 نحوه استفاده در Frontend

```javascript
// دریافت آخرین اطلاعیه‌های استعداد ارشد
fetch('http://api.../content/announcements/latest/?category=MA_TALENT&limit=5')
  .then(res => res.json())
  .then(data => console.log(data));

// دریافت جزئیات یک اطلاعیه (با افزایش بازدید)
fetch('http://api.../content/announcements/123/')
  .then(res => res.json())
  .then(announcement => {
    // نمایش عنوان، متن، پیوست
    document.getElementById('title').innerHTML = announcement.title;
    document.getElementById('body').innerHTML = announcement.body;
  });
```

## 🎉 همه چیز آماده است!

سیستم کامل مدیریت اطلاعیه‌ها با تمام ویژگی‌های درخواستی پیاده‌سازی شد.
