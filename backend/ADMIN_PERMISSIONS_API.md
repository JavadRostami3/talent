# Admin Permission System API

## معرفی

سیستم دسترسی‌های ادمین به شما این امکان را می‌دهد که برای ادمین‌های مختلف، دسترسی‌های متفاوتی تعریف کنید. این دسترسی‌ها شامل موارد زیر است:

1. **دسترسی به نوع دوره‌ها**: استعداد درخشان ارشد، استعداد درخشان دکتری، آزمون دکتری، المپیاد
2. **دسترسی به دانشکده‌ها**: انتخاب دانشکده‌های خاص یا همه دانشکده‌ها
3. **دسترسی به گروه‌های آموزشی**: انتخاب گروه‌های خاص یا همه گروه‌ها
4. **دسترسی کامل**: برای سوپرادمین‌ها

## مدل AdminPermission

```python
class AdminPermission:
    user: User  # کاربر ادمین
    
    # دسترسی به نوع دوره‌ها
    has_ma_talent_access: bool
    has_phd_talent_access: bool
    has_phd_exam_access: bool
    has_olympiad_access: bool
    
    # دسترسی به دانشکده‌ها و گروه‌ها
    faculties: ManyToManyField  # خالی = همه دانشکده‌ها
    departments: ManyToManyField  # خالی = همه گروه‌های دانشکده‌های انتخابی
    
    # دسترسی کامل (برای سوپرادمین)
    has_full_access: bool
```

## API Endpoints

### 1. دریافت لیست دسترسی‌ها

```http
GET /api/accounts/permissions/
```

**Authorization**: Bearer Token (فقط سوپرادمین)

**Response**:
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "user": 1,
      "user_name": "احمد محمدی",
      "has_ma_talent_access": true,
      "has_phd_talent_access": false,
      "has_phd_exam_access": false,
      "has_olympiad_access": false,
      "faculties": [1, 2],
      "faculty_names": ["دانشکده مهندسی", "دانشکده علوم"],
      "departments": [3, 4],
      "department_names": [
        "دانشکده مهندسی - مهندسی کامپیوتر",
        "دانشکده علوم - ریاضی"
      ],
      "has_full_access": false,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 2. ایجاد دسترسی جدید

```http
POST /api/accounts/permissions/
```

**Authorization**: Bearer Token (فقط سوپرادمین)

**Request Body**:
```json
{
  "user": 2,
  "has_ma_talent_access": true,
  "has_phd_talent_access": true,
  "has_phd_exam_access": false,
  "has_olympiad_access": false,
  "faculties": [1],
  "departments": [],
  "has_full_access": false
}
```

**Response**: 201 Created

### 3. ویرایش دسترسی

```http
PUT /api/accounts/permissions/{id}/
PATCH /api/accounts/permissions/{id}/
```

**Authorization**: Bearer Token (فقط سوپرادمین)

### 4. حذف دسترسی

```http
DELETE /api/accounts/permissions/{id}/
```

**Authorization**: Bearer Token (فقط سوپرادمین)

### 5. دریافت دسترسی‌های خود

```http
GET /api/accounts/permissions/my_permissions/
```

**Authorization**: Bearer Token

هر ادمینی می‌تواند دسترسی‌های خود را ببیند.

**Response**:
```json
{
  "id": 1,
  "user": 1,
  "user_name": "احمد محمدی",
  "has_ma_talent_access": true,
  "has_phd_talent_access": false,
  "faculties": [1, 2],
  "faculty_names": ["دانشکده مهندسی", "دانشکده علوم"],
  "departments": [],
  "department_names": ["همه گروه‌های دانشکده‌های انتخابی"],
  "has_full_access": false
}
```

### 6. بررسی دسترسی به دانشکده

```http
GET /api/accounts/permissions/{id}/check_faculty_access/?faculty_id=1
```

**Response**:
```json
{
  "has_access": true
}
```

### 7. بررسی دسترسی به گروه آموزشی

```http
GET /api/accounts/permissions/{id}/check_department_access/?department_id=3
```

**Response**:
```json
{
  "has_access": true
}
```

### 8. لیست دانشکده‌های مجاز

```http
GET /api/accounts/permissions/{id}/allowed_faculties/
```

**Response**:
```json
{
  "faculties": [
    {
      "id": 1,
      "name": "دانشکده مهندسی",
      "code": "ENG"
    },
    {
      "id": 2,
      "name": "دانشکده علوم",
      "code": "SCI"
    }
  ]
}
```

### 9. لیست گروه‌های آموزشی مجاز

```http
GET /api/accounts/permissions/{id}/allowed_departments/
```

**Response**:
```json
{
  "departments": [
    {
      "id": 3,
      "name": "مهندسی کامپیوتر",
      "code": "CE",
      "faculty": "دانشکده مهندسی"
    },
    {
      "id": 4,
      "name": "ریاضی",
      "code": "MATH",
      "faculty": "دانشکده علوم"
    }
  ]
}
```

## منطق دسترسی

### 1. دسترسی کامل (Full Access)
اگر `has_full_access = True` باشد:
- دسترسی به همه دوره‌ها
- دسترسی به همه دانشکده‌ها
- دسترسی به همه گروه‌های آموزشی

### 2. دسترسی به دانشکده‌ها
- اگر `faculties` خالی باشد → دسترسی به همه دانشکده‌ها
- اگر `faculties` پر باشد → فقط دسترسی به دانشکده‌های انتخاب شده

### 3. دسترسی به گروه‌های آموزشی
- اگر `departments` خالی باشد → دسترسی به همه گروه‌های دانشکده‌های انتخابی
- اگر `departments` پر باشد → فقط دسترسی به گروه‌های انتخاب شده

### 4. قانون سلسله مراتبی
گروه‌های آموزشی باید زیرمجموعه دانشکده‌های انتخابی باشند.

## مثال‌های کاربردی

### مثال 1: ادمین با دسترسی به یک دانشکده خاص

```json
{
  "user": 2,
  "has_ma_talent_access": true,
  "has_phd_talent_access": false,
  "faculties": [1],  // فقط دانشکده مهندسی
  "departments": [],  // همه گروه‌های دانشکده مهندسی
  "has_full_access": false
}
```

### مثال 2: ادمین با دسترسی به چند گروه خاص

```json
{
  "user": 3,
  "has_ma_talent_access": true,
  "has_phd_talent_access": true,
  "faculties": [1, 2],  // مهندسی و علوم
  "departments": [3, 4, 5],  // فقط 3 گروه خاص
  "has_full_access": false
}
```

### مثال 3: سوپرادمین

```json
{
  "user": 1,
  "has_ma_talent_access": true,
  "has_phd_talent_access": true,
  "has_phd_exam_access": true,
  "has_olympiad_access": true,
  "faculties": [],
  "departments": [],
  "has_full_access": true
}
```

## نکات امنیتی

1. **فقط سوپرادمین** می‌تواند دسترسی‌ها را مدیریت کند (CRUD)
2. ادمین‌های عادی فقط می‌توانند دسترسی خود را مشاهده کنند
3. کاربر باید نقش ADMIN یا SUPERADMIN داشته باشد
4. گروه‌های انتخابی باید از دانشکده‌های انتخابی باشند

## فیلترها و جستجو

### فیلترها
```
?has_full_access=true
?has_ma_talent_access=true
?has_phd_talent_access=true
```

### جستجو
```
?search=احمد
?search=1234567890
```

### مرتب‌سازی
```
?ordering=-created_at
?ordering=updated_at
```

## کدهای خطا

- `400 Bad Request`: داده‌های نامعتبر
- `403 Forbidden`: عدم دسترسی (باید سوپرادمین باشید)
- `404 Not Found`: دسترسی یافت نشد
- `201 Created`: ایجاد موفق
- `200 OK`: عملیات موفق
