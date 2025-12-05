# 🎯 Unified Research Records API - یکپارچه‌سازی سوابق پژوهشی

## 📊 **مشکل قبلی:**

در سیستم قبلی، سوابق پژوهشی در 6 مدل جداگانه بودند:
- `ResearchArticle` - مقالات پژوهشی و ترویجی
- `Patent` - اختراعات
- `FestivalAward` - جوایز جشنواره
- `ConferenceArticle` - مقالات کنفرانس
- `Book` - کتاب‌ها
- `MastersThesis` - پایان‌نامه ارشد

**مشکلات:**
1. فرانت‌اند باید 6 درخواست API جداگانه می‌فرستاد
2. نمایش در یک جدول واحد سخت بود
3. کد تکراری در فرانت‌اند
4. پیچیدگی مدیریت state

---

## ✅ **راه‌حل: Unified API**

### **فلسفه طراحی:**
- **Backend:** ساختار دیتابیس تفکیک‌شده حفظ شد (نرمال‌سازی صحیح)
- **Frontend:** یک API واحد با فرمت مشترک برای همه سوابق

### **مزایا:**
- ✅ یک درخواست به جای 6 درخواست
- ✅ فرمت یکپارچه برای نمایش
- ✅ فیلتر و جستجوی آسان
- ✅ نمایش در یک جدول
- ✅ محاسبه خودکار آمار

---

## 🚀 **API Endpoints جدید:**

### **1️⃣ دریافت تمام سوابق پژوهشی (Unified)**

```http
GET /api/applications/{application_id}/research-records/
Authorization: Bearer {token}
```

**Response:**
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
      "score": 8,
      "file": "/media/...",
      "reviewed_by": "دکتر احمدی",
      "created_at": "2024-12-01T10:00:00Z"
    },
    {
      "id": 2,
      "type": "PATENT",
      "title_fa": "سیستم هوشمند...",
      "patent_number": "123456",
      "registration_date": "1402/09/15",
      "score": 5,
      "created_at": "2024-11-20T14:00:00Z"
    },
    // ... سایر سوابق
  ]
}
```

**ویژگی‌ها:**
- تمام سوابق در یک لیست
- مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
- خلاصه آماری (summary)
- جمع کل امتیاز

---

### **2️⃣ ایجاد سابقه جدید**

```http
POST /api/applications/{application_id}/research-records/create/
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body (مثال - مقاله):**
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

**Request Body (مثال - اختراع):**
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

**انواع type:**
- `ARTICLE` - مقاله
- `PATENT` - اختراع
- `FESTIVAL_AWARD` - جایزه جشنواره
- `CONFERENCE` - مقاله کنفرانس
- `BOOK` - کتاب
- `MASTERS_THESIS` - پایان‌نامه ارشد

**Response:**
```json
{
  "message": "سابقه پژوهشی با موفقیت ثبت شد",
  "record_id": 15,
  "type": "ARTICLE"
}
```

---

### **3️⃣ ویرایش سابقه**

```http
PUT /api/applications/{application_id}/research-records/{record_type}/{record_id}/
Authorization: Bearer {token}
```

**مثال:**
```http
PUT /api/applications/123/research-records/article/5/
```

**Request Body:**
```json
{
  "title_fa": "عنوان جدید",
  "journal_name": "Science"
}
```

---

### **4️⃣ حذف سابقه**

```http
DELETE /api/applications/{application_id}/research-records/{record_type}/{record_id}/
```

**مثال:**
```http
DELETE /api/applications/123/research-records/patent/3/
```

---

### **5️⃣ خلاصه آماری**

```http
GET /api/applications/{application_id}/research-records/summary/
```

**Response:**
```json
{
  "total_score": 35.5,
  "max_possible_score": 58,
  "completion_percentage": 61.2,
  "breakdown": {
    "articles_score": 20,
    "patents_score": 8,
    "awards_score": 5,
    "conferences_score": 1.5,
    "books_score": 1,
    "thesis_score": 0
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

## 🔧 **پیاده‌سازی در Frontend:**

### **React/Vue Example:**

```javascript
// دریافت تمام سوابق
const fetchResearchRecords = async (applicationId) => {
  const response = await axios.get(
    `/api/applications/${applicationId}/research-records/`
  );
  
  return response.data; // { total_records, summary, records }
};

// نمایش در جدول واحد
<Table>
  <thead>
    <tr>
      <th>نوع</th>
      <th>عنوان</th>
      <th>امتیاز</th>
      <th>تاریخ</th>
      <th>عملیات</th>
    </tr>
  </thead>
  <tbody>
    {records.map(record => (
      <tr key={`${record.type}-${record.id}`}>
        <td>{getTypeLabel(record.type)}</td>
        <td>{record.title_fa}</td>
        <td>{record.score}</td>
        <td>{formatDate(record.created_at)}</td>
        <td>
          <button onClick={() => editRecord(record)}>ویرایش</button>
          <button onClick={() => deleteRecord(record.type, record.id)}>حذف</button>
        </td>
      </tr>
    ))}
  </tbody>
</Table>

// آمار
<div className="summary">
  <h3>خلاصه سوابق پژوهشی</h3>
  <p>تعداد کل: {data.total_records}</p>
  <p>جمع امتیاز: {data.total_score}</p>
  <ul>
    <li>مقالات: {data.summary.articles}</li>
    <li>اختراعات: {data.summary.patents}</li>
    <li>جوایز: {data.summary.awards}</li>
    <li>کنفرانس: {data.summary.conferences}</li>
    <li>کتاب: {data.summary.books}</li>
  </ul>
</div>
```

---

## 📚 **Serializer های جداگانه MA و PhD:**

### **مشکل قبلی:**
مدل `ApplicationEducationRecord` هم برای ارشد و هم برای دکتری استفاده می‌شد، اما فیلدهای مختلفی داشت:
- فیلدهای ارشد: `total_units_passed`, `semester_count`, `rank_status`
- فیلدهای دکتری: همه فیلدها ساده

### **راه‌حل:**

```python
class MAEducationRecordSerializer:
    """فقط فیلدهای ضروری برای ارشد"""
    fields = [
        'degree_level', 'university', 'field_of_study', 'gpa',
        'total_units_passed',  # ویژه ارشد
        'semester_count',      # ویژه ارشد
        'class_size',          # ویژه ارشد
        'rank_status',         # ویژه ارشد
    ]

class PhDEducationRecordSerializer:
    """فیلدهای ساده برای دکتری"""
    fields = [
        'degree_level', 'university', 'field_of_study', 'gpa',
        'start_month', 'start_year',
        'graduation_month', 'graduation_year',
    ]

class ApplicationEducationRecordSerializer:
    """Serializer پویا که خودکار انتخاب می‌کند"""
    def to_representation(self, instance):
        if instance.application.round.type == 'MA':
            return MAEducationRecordSerializer(instance).data
        else:
            return PhDEducationRecordSerializer(instance).data
```

**مزایا:**
- کاربر ارشد فیلدهای اضافه نمی‌بیند
- کاربر دکتری فیلدهای غیرضروری نمی‌بیند
- API تمیزتر و سادهتر
- Validation بهتر

---

## ✅ **خلاصه تغییرات:**

### **فایل‌های جدید:**
1. `apps/api/research_serializers.py`
   - `UnifiedResearchRecordSerializer`
   - `ResearchRecordCreateSerializer`

2. `apps/api/research_views.py`
   - `get_research_records()` - دریافت همه
   - `create_research_record()` - ایجاد جدید
   - `manage_research_record()` - ویرایش/حذف
   - `get_research_summary()` - خلاصه آماری

3. `apps/api/research_urls.py`
   - URL patterns برای API

### **فایل‌های ویرایش شده:**
4. `apps/api/applications_serializers.py`
   - `MAEducationRecordSerializer` (جدید)
   - `PhDEducationRecordSerializer` (جدید)
   - `ApplicationEducationRecordSerializer` (بازنویسی با to_representation)

5. `config/urls.py`
   - اضافه شدن `research_urls`

---

## 🎯 **نتیجه:**

### **قبل:**
- ❌ 6 مدل جداگانه
- ❌ 6 API Endpoint جداگانه
- ❌ کد تکراری در Frontend
- ❌ نمایش سخت در جدول واحد

### **بعد:**
- ✅ یک API یکپارچه
- ✅ یک درخواست = تمام سوابق
- ✅ فرمت مشترک برای نمایش
- ✅ آمار خودکار
- ✅ Serializer های جداگانه MA/PhD
- ✅ Backend تفکیک‌شده (نرمال)
- ✅ Frontend یکپارچه (ساده)

---

**🚀 سیستم حرفه‌ای، قابل نگهداری و کاربرپسند!**
