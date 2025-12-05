# 📊 سیستم امتیازدهی دستی سوابق تحصیلی

## 🎯 مدل: EducationScoring

این مدل برای **امتیازدهی دستی سوابق تحصیلی توسط کارشناس** طراحی شده است.

### ✅ فیلدهای امتیازدهی (6 فیلد):

| ردیف | فیلد | حداکثر امتیاز | توضیحات |
|------|------|---------------|---------|
| 1️⃣ | `bsc_gpa_university_score` | 6 امتیاز | معدل و کیفیت دانشگاه تحصیل دوره کارشناسی |
| 2️⃣ | `msc_gpa_university_score` | 5 امتیاز | معدل و کیفیت دانشگاه تحصیل دوره کارشناسی ارشد |
| 3️⃣ | `bsc_duration_score` | 3 امتیاز | طول مدت دوره کارشناسی |
| 4️⃣ | `msc_duration_score` | 3 امتیاز | طول مدت دوره کارشناسی ارشد |
| 5️⃣ | `olympiad_score` | 5 امتیاز | برگزیدگان المپیادهای علمی |
| 6️⃣ | `language_certificate_score` | 8 امتیاز | مدرک زبان معتبر |
| | **جمع کل** | **30 امتیاز** | محاسبه خودکار |

---

## 📋 ساختار مدل

```python
class EducationScoring(TimeStampedModel):
    """
    امتیازدهی دستی - بدون فرمول خودکار
    کارشناس تمام امتیازها را به صورت دستی وارد می‌کند
    """
    application = models.OneToOneField(Application, ...)
    
    # 6 فیلد امتیاز (دستی)
    bsc_gpa_university_score = models.FloatField(default=0)  # تا 6
    msc_gpa_university_score = models.FloatField(default=0)  # تا 5
    bsc_duration_score = models.FloatField(default=0)        # تا 3
    msc_duration_score = models.FloatField(default=0)        # تا 3
    olympiad_score = models.FloatField(default=0)            # تا 5
    language_certificate_score = models.FloatField(default=0) # تا 8
    
    # جمع (محاسبه خودکار)
    total_score = models.FloatField(default=0)  # حداکثر 30
    
    # اطلاعات ثبت
    scored_by = models.ForeignKey(User, ...)
    scored_at = models.DateTimeField(...)
    comment = models.TextField(...)
```

---

## 🎯 نحوه استفاده

### **1. کارشناس مدارک داوطلب را بررسی می‌کند:**
- معدل کارشناسی و ارشد
- دانشگاه محل تحصیل
- طول مدت دوره‌ها (تعداد ترم)
- مدارک المپیاد
- مدارک زبان

### **2. کارشناس امتیاز هر بخش را دستی وارد می‌کند:**
```python
# مثال:
education_scoring = EducationScoring.objects.create(
    application=application,
    bsc_gpa_university_score=5.5,  # کارشناس تصمیم می‌گیرد
    msc_gpa_university_score=4.0,
    bsc_duration_score=2.5,
    msc_duration_score=3.0,
    olympiad_score=4.0,
    language_certificate_score=7.0,
    scored_by=request.user
)
# جمع کل خودکار محاسبه می‌شود: 26 امتیاز
```

### **3. جمع امتیاز به صورت خودکار محاسبه می‌شود:**
```python
def calculate_total(self):
    self.total_score = (
        self.bsc_gpa_university_score +
        self.msc_gpa_university_score +
        self.bsc_duration_score +
        self.msc_duration_score +
        self.olympiad_score +
        self.language_certificate_score
    )
    return self.total_score
```

---

## 🖥️ Admin Panel

کارشناس در پنل ادمین:

1. وارد صفحه "امتیازدهی سوابق تحصیلی" می‌شود
2. درخواست (Application) را انتخاب می‌کند
3. هر 6 فیلد را **دستی** پر می‌کند
4. توضیحات اضافه می‌کند (اختیاری)
5. ذخیره می‌کند
6. سیستم خودکار:
   - جمع امتیازها را محاسبه می‌کند
   - کارشناس و زمان را ثبت می‌کند

---

## ⚠️ نکات مهم

- ✅ **هیچ فرمول خودکاری وجود ندارد**
- ✅ کارشناس تمام امتیازها را دستی وارد می‌کند
- ✅ فقط جمع امتیازها خودکار محاسبه می‌شود
- ✅ هر Application فقط یک EducationScoring دارد (OneToOne)
- ✅ امتیازها بر اساس نظر هیئت مصاحبه وارد می‌شود

---

## 📝 API Endpoints پیشنهادی

```python
# ایجاد/ویرایش امتیازدهی
POST   /api/admin/applications/{id}/education-scoring/
PUT    /api/admin/applications/{id}/education-scoring/

# مشاهده امتیاز
GET    /api/admin/applications/{id}/education-scoring/

# مثال Request Body:
{
    "bsc_gpa_university_score": 5.5,
    "msc_gpa_university_score": 4.0,
    "bsc_duration_score": 2.5,
    "msc_duration_score": 3.0,
    "olympiad_score": 4.0,
    "language_certificate_score": 7.0,
    "comment": "داوطلب سوابق عالی دارد"
}

# Response:
{
    "id": 1,
    "application": 123,
    "bsc_gpa_university_score": 5.5,
    "msc_gpa_university_score": 4.0,
    "bsc_duration_score": 2.5,
    "msc_duration_score": 3.0,
    "olympiad_score": 4.0,
    "language_certificate_score": 7.0,
    "total_score": 26.0,  // محاسبه خودکار
    "scored_by": 5,
    "scored_at": "2025-12-05T10:30:00Z",
    "comment": "داوطلب سوابق عالی دارد"
}
```

---

## ✅ وضعیت پیاده‌سازی

- [x] مدل EducationScoring با 6 فیلد امتیازدهی
- [x] محاسبه خودکار جمع امتیاز
- [x] Admin Panel با راهنمای کامل
- [x] ثبت خودکار کارشناس و زمان
- [ ] Serializer
- [ ] API Views
- [ ] Migrations

---

**🎉 سیستم امتیازدهی دستی ساده و کاربردی آماده است!**

**نکته:** مدل‌های `OlympiadRecord` و `LanguageCertificate` فقط برای ذخیره مدارک هستند، امتیاز آنها در `EducationScoring` ثبت می‌شود.
