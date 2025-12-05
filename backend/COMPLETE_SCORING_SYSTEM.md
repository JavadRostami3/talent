# 📊 سیستم کامل امتیازدهی - استعداد درخشان دکتری

## 🎯 **جدول کامل امتیازدهی**

### **۱. معدل و کیفیت دانشگاه تحصیل دوره کارشناسی (تا 6 امتیاز)**

| معدل کارشناسی | امتیاز معدل |
|---------------|-------------|
| 19.00 - 17.50 | 6 امتیاز |
| 17.49 - 16.00 | 5 امتیاز |
| 15.99 - 14.00 | 2 امتیاز |
| 13.99 - 12.00 | 3 امتیاز |
| زیر 12 | 0 امتیاز |

**+ امتیاز دانشگاه** (بر اساس ضریب دانشگاه در جدول `UniversityWeight`)

---

### **۲. معدل و کیفیت دانشگاه تحصیل دوره کارشناسی ارشد (تا 5 امتیاز)**

| معدل ارشد | امتیاز معدل |
|-----------|-------------|
| 19.00 - 17.50 | 5 امتیاز |
| 17.49 - 16.00 | 4 امتیاز |
| 15.99 - 14.00 | 2 امتیاز |
| 13.99 - 12.00 | 2 امتیاز |
| زیر 12 | 0 امتیاز |

**+ امتیاز دانشگاه** (بر اساس ضریب دانشگاه)

---

### **۳. طول مدت دوره کارشناسی (تا 3 امتیاز)**

| طول مدت | امتیاز |
|---------|--------|
| 8 ترم یا کمتر | 3 امتیاز |
| 9 ترم | 2 امتیاز |
| 10 ترم | 1 امتیاز |
| بیشتر از 10 ترم | 0 امتیاز |

---

### **۴. طول مدت دوره کارشناسی ارشد (تا 3 امتیاز)**

| طول مدت | امتیاز |
|---------|--------|
| 4 ترم | 3 امتیاز |
| 5 ترم | 2 امتیاز |
| 6 ترم | 1 امتیاز |
| بیشتر از 6 ترم | 0 امتیاز |

---

### **۵. برگزیدگان المپیادهای علمی (تا 5 امتیاز)**

| رتبه المپیاد | امتیاز |
|--------------|--------|
| طلای المپیاد بین‌المللی | 5 امتیاز |
| نقره المپیاد بین‌المللی | 4 امتیاز |
| برنز المپیاد بین‌المللی | 3 امتیاز |
| طلای المپیاد کشوری | 4 امتیاز |
| نقره المپیاد کشوری | 3 امتیاز |
| برنز المپیاد کشوری | 2 امتیاز |
| 10 نفر برتر | 2 امتیاز |
| 20 نفر برتر | 1 امتیاز |

**انواع المپیاد:** فیزیک، شیمی، ریاضی، کامپیوتر، زیست‌شناسی و سایر المپیادهای علمی

---

### **۶. مدرک زبان معتبر (تا 8 امتیاز)**

#### **زبان انگلیسی:**

| نوع آزمون | نمره | امتیاز |
|----------|------|--------|
| **TOEFL iBT** | 100-120 | 8 امتیاز |
| | 90-99 | 6 امتیاز |
| | 80-89 | 4 امتیاز |
| | 70-79 | 2 امتیاز |
| **IELTS Academic** | 7.5-9 | 8 امتیاز |
| | 6.5-7 | 6 امتیاز |
| | 6-6.5 | 4 امتیاز |
| | 5.5-6 | 2 امتیاز |
| **GRE** | Verbal 160+ | 8 امتیاز |
| | Verbal 150-159 | 6 امتیاز |
| **MSRT** | 60-100 | 6 امتیاز |
| | 50-59 | 4 امتیاز |
| | 40-49 | 2 امتیاز |
| **EPT دانشگاه آزاد** | بر اساس نمره | تا 6 امتیاز |

#### **سایر زبان‌ها:**

- **فرانسه:** DELF, DALF, TCF (تا 8 امتیاز)
- **آلمانی:** Goethe, TestDaF (تا 8 امتیاز)
- **عربی:** تافل عربی (تا 8 امتیاز)

---

## 📋 **مدل‌های دیتابیس**

### **1️⃣ ApplicationEducationRecord**

```python
class ApplicationEducationRecord(TimeStampedModel):
    """
    سوابق تحصیلی داوطلب با امتیازدهی کامل
    """
    application = models.ForeignKey(Application, ...)
    degree_level = models.CharField(...)  # BSC / MSC / PHD
    university = models.ForeignKey(University, ...)
    field_of_study = models.CharField(...)
    gpa = models.DecimalField(...)
    status = models.CharField(...)  # STUDYING / GRADUATED
    
    # تاریخ شروع و پایان
    start_month = models.PositiveIntegerField(...)
    start_year = models.PositiveIntegerField(...)
    graduation_month = models.PositiveIntegerField(...)
    graduation_year = models.PositiveIntegerField(...)
    
    # ============================================
    # امتیازدهی
    # ============================================
    
    # 1. امتیاز معدل
    gpa_score = models.FloatField(default=0)
    # کارشناسی: تا 6 امتیاز
    # ارشد: تا 5 امتیاز
    
    # 2. امتیاز دانشگاه
    university_score = models.FloatField(default=0)
    # بر اساس ضریب دانشگاه
    
    # 3. امتیاز طول مدت دوره
    duration_score = models.FloatField(default=0)
    # کارشناسی: تا 3 امتیاز (8-10 ترم)
    # ارشد: تا 3 امتیاز (4-6 ترم)
    
    # 4. جمع امتیاز
    total_score = models.FloatField(default=0)
    # = gpa_score + university_score + duration_score
    
    # بررسی کارشناس
    reviewed_by = models.ForeignKey(User, ...)
    reviewed_at = models.DateTimeField(...)
    review_comment = models.TextField(...)
```

**فرمول محاسبه:**

```python
def calculate_score(self):
    """محاسبه امتیاز کامل این مقطع تحصیلی"""
    # 1. امتیاز معدل (بر اساس جدول)
    self.gpa_score = self.get_gpa_score()
    
    # 2. امتیاز دانشگاه
    self.university_score = self.university.weight.score
    
    # 3. امتیاز طول مدت
    self.duration_score = self.calculate_duration_score()
    
    # جمع
    self.total_score = (
        self.gpa_score + 
        self.university_score + 
        self.duration_score
    )
    return self.total_score
```

---

### **2️⃣ OlympiadRecord (مدل جدید)**

```python
class OlympiadRecord(TimeStampedModel):
    """
    برگزیدگان المپیادهای علمی - تا 5 امتیاز
    """
    application = models.ForeignKey(Application, ...)
    
    # نوع المپیاد
    olympiad_type = models.CharField(
        choices=[
            ("PHYSICS", "المپیاد فیزیک"),
            ("CHEMISTRY", "المپیاد شیمی"),
            ("MATHEMATICS", "المپیاد ریاضی"),
            ("COMPUTER", "المپیاد کامپیوتر"),
            ("BIOLOGY", "المپیاد زیست‌شناسی"),
            ("OTHER", "سایر المپیادها")
        ]
    )
    
    olympiad_name = models.CharField(...)
    # مثال: "المپیاد فیزیک کشور - مرحله کشوری"
    
    year = models.PositiveIntegerField(...)
    
    # رتبه
    rank_level = models.CharField(
        choices=[
            ("GOLD", "رتبه طلا"),
            ("SILVER", "رتبه نقره"),
            ("BRONZE", "رتبه برنز"),
            ("TOP_10", "10 نفر برتر"),
            ("TOP_20", "20 نفر برتر"),
            ("PARTICIPANT", "شرکت‌کننده")
        ]
    )
    rank_number = models.PositiveIntegerField(...)  # optional
    
    # مدرک
    certificate_file = models.FileField(...)
    
    # امتیازدهی
    score = models.FloatField(default=0)  # حداکثر 5 امتیاز
    reviewed_by = models.ForeignKey(User, ...)
    reviewed_at = models.DateTimeField(...)
    review_comment = models.TextField(...)
```

---

### **3️⃣ LanguageCertificate (مدل جدید)**

```python
class LanguageCertificate(TimeStampedModel):
    """
    مدرک زبان معتبر - تا 8 امتیاز
    """
    application = models.ForeignKey(Application, ...)
    
    # زبان
    language = models.CharField(
        choices=[
            ("ENGLISH", "انگلیسی"),
            ("FRENCH", "فرانسه"),
            ("GERMAN", "آلمانی"),
            ("ARABIC", "عربی"),
            ("OTHER", "سایر زبان‌ها")
        ]
    )
    
    # نوع مدرک
    certificate_type = models.CharField(
        choices=[
            # انگلیسی
            ("TOEFL", "تافل (TOEFL)"),
            ("IELTS", "آیلتس (IELTS)"),
            ("GRE", "جی آر ای (GRE)"),
            ("MSRT", "ام اس آر تی (MSRT)"),
            ("EPT", "EPT دانشگاه آزاد"),
            
            # فرانسه
            ("DELF", "DELF"),
            ("DALF", "DALF"),
            ("TCF", "TCF"),
            
            # آلمانی
            ("GOETHE", "گوته (Goethe)"),
            ("TESTDAF", "TestDaF"),
            
            # عربی
            ("ARABIC_TOAFL", "تافل عربی"),
            
            ("OTHER", "سایر مدارک")
        ]
    )
    
    certificate_number = models.CharField(...)
    issue_date = models.CharField(...)
    expiry_date = models.CharField(...)
    
    # نمره آزمون
    test_score = models.CharField(...)
    # مثال: "7.5" برای IELTS یا "100" برای TOEFL
    
    # مدرک
    certificate_file = models.FileField(...)
    
    # امتیازدهی
    score = models.FloatField(default=0)  # حداکثر 8 امتیاز
    reviewed_by = models.ForeignKey(User, ...)
    reviewed_at = models.DateTimeField(...)
    review_comment = models.TextField(...)
```

**مثال امتیازدهی:**

```python
def calculate_language_score(certificate_type, test_score):
    """محاسبه امتیاز مدرک زبان"""
    if certificate_type == "TOEFL":
        score = int(test_score)
        if score >= 100:
            return 8
        elif score >= 90:
            return 6
        elif score >= 80:
            return 4
        elif score >= 70:
            return 2
        
    elif certificate_type == "IELTS":
        score = float(test_score)
        if score >= 7.5:
            return 8
        elif score >= 6.5:
            return 6
        elif score >= 6:
            return 4
        elif score >= 5.5:
            return 2
    
    # ... سایر انواع
    return 0
```

---

## 🎤 **سیستم مصاحبه (برای دکتری)**

### **مدل Interview**

```python
class Interview(TimeStampedModel):
    """
    مصاحبه داوطلب - حداکثر 30 امتیاز
    """
    application = models.OneToOneField(Application, ...)
    
    # زمان‌بندی
    scheduled_date = models.DateTimeField(...)
    location = models.CharField(...)
    status = models.CharField(...)  # PENDING / SCHEDULED / COMPLETED / ABSENT / CANCELLED
    
    # ============================================
    # امتیازدهی مصاحبه (6 شاخص)
    # ============================================
    
    # 1. تشارک در تجربه و تحلیل مسائل علمی (3 امتیاز)
    experience_analysis_score = models.FloatField(default=0)
    
    # 2. وسعت نظر، خلاقیت و کاربردی‌بودن (3 امتیاز)
    creativity_score = models.FloatField(default=0)
    
    # 3. شخصیت، صحت و حجم بیان (3 امتیاز)
    personality_expression_score = models.FloatField(default=0)
    
    # 4. نگارش و مدارک فراواحد (3 امتیاز)
    documentation_score = models.FloatField(default=0)
    
    # 5. برناسی فن بیان و احتمال موفق (3 امتیاز)
    speech_success_probability_score = models.FloatField(default=0)
    
    # 6. همراستایی پژوهشی با آزمایشگاه‌ها (15 امتیاز)
    lab_alignment_score = models.FloatField(default=0)
    
    # جمع
    total_interview_score = models.FloatField(default=0)  # حداکثر 30
    
    # مصاحبه‌کنندگان
    interviewers = models.ManyToManyField(User, ...)
    interviewer_comment = models.TextField(...)
    
    def calculate_total_score(self):
        """محاسبه خودکار جمع امتیاز"""
        self.total_interview_score = (
            self.experience_analysis_score +
            self.creativity_score +
            self.personality_expression_score +
            self.documentation_score +
            self.speech_success_probability_score +
            self.lab_alignment_score
        )
        return self.total_interview_score
```

---

## 📊 **محاسبه امتیاز نهایی**

### **فرمول کامل:**

```text
امتیاز نهایی داوطلب = 
    
    [1] سوابق تحصیلی:
        ├─ کارشناسی: (معدل + دانشگاه) تا 6 + طول مدت تا 3
        └─ ارشد: (معدل + دانشگاه) تا 5 + طول مدت تا 3
    
    + [2] المپیاد: تا 5 امتیاز
    
    + [3] مدرک زبان: تا 8 امتیاز
    
    + [4] سوابق پژوهشی (حداکثر 58 امتیاز):
        ├─ مقالات پژوهشی + اختراع + جشنواره (40)
        ├─ مقالات ترویجی (6)
        ├─ مقالات کنفرانس (4)
        ├─ کتاب (4)
        └─ پایان‌نامه (4)
    
    + [5] مصاحبه: تا 30 امتیاز
```

### **پیاده‌سازی در Application:**

```python
class Application:
    # فیلدهای امتیاز جزئی
    education_total_score = models.FloatField(default=0)
    olympiad_score = models.FloatField(default=0)
    language_score = models.FloatField(default=0)
    research_total_score = models.FloatField(default=0)
    interview_total_score = models.FloatField(default=0)
    
    # امتیاز نهایی
    total_score = models.FloatField(default=0)
    score_calculated_at = models.DateTimeField(...)
    
    def calculate_final_score(self):
        """محاسبه امتیاز نهایی"""
        # 1. جمع امتیاز تحصیلی (کارشناسی + ارشد)
        self.education_total_score = sum([
            record.total_score 
            for record in self.education_records.all()
        ])
        
        # 2. بالاترین امتیاز المپیاد (تا 5)
        olympiad_scores = [
            r.score for r in self.olympiad_records.all()
        ]
        self.olympiad_score = max(olympiad_scores) if olympiad_scores else 0
        
        # 3. بالاترین امتیاز زبان (تا 8)
        language_scores = [
            c.score for c in self.language_certificates.all()
        ]
        self.language_score = max(language_scores) if language_scores else 0
        
        # 4. جمع امتیاز پژوهشی
        self.research_total_score = (
            sum([a.score for a in self.research_articles.all()]) +
            sum([p.score for p in self.patents.all()]) +
            sum([f.score for f in self.festival_awards.all()]) +
            sum([c.score for c in self.conference_articles.all()]) +
            sum([b.score for b in self.books.all()]) +
            (self.masters_thesis.score if hasattr(self, 'masters_thesis') else 0)
        )
        
        # 5. امتیاز مصاحبه
        self.interview_total_score = (
            self.interview.total_interview_score 
            if hasattr(self, 'interview') else 0
        )
        
        # جمع نهایی
        self.total_score = (
            self.education_total_score +
            self.olympiad_score +
            self.language_score +
            self.research_total_score +
            self.interview_total_score
        )
        self.score_calculated_at = timezone.now()
        
        return self.total_score
```

---

## 🎯 **خلاصه تغییرات**

### ✅ **مدل‌های موجود:**

1. **ApplicationEducationRecord**
   - ✅ `gpa_score` - امتیاز معدل (کارشناسی: 0-6، ارشد: 0-5)
   - ✅ `university_score` - امتیاز دانشگاه
   - ✅ `duration_score` - امتیاز طول مدت دوره (0-3)
   - ✅ `total_score` - جمع سه امتیاز بالا
   - ✅ فیلدهای بررسی کارشناس

2. **Interview**
   - ✅ 6 شاخص امتیازدهی (مجموع 30 امتیاز)
   - ✅ محاسبه خودکار جمع امتیاز

### ✅ **مدل‌های جدید:**

3. **OlympiadRecord** ⭐ جدید
   - ✅ انواع المپیاد (فیزیک، شیمی، ریاضی، کامپیوتر، زیست)
   - ✅ سطوح رتبه (طلا، نقره، برنز، ...)
   - ✅ امتیازدهی تا 5 امتیاز
   - ✅ آپلود مدرک

4. **LanguageCertificate** ⭐ جدید
   - ✅ انواع زبان (انگلیسی، فرانسه، آلمانی، عربی)
   - ✅ انواع مدرک (TOEFL, IELTS, GRE, MSRT, ...)
   - ✅ امتیازدهی تا 8 امتیاز
   - ✅ آپلود مدرک

### ✅ **Admin Panel:**

- ✅ `OlympiadRecordAdmin` با فیلترها و جستجو
- ✅ `LanguageCertificateAdmin` با فیلترها و جستجو
- ✅ `ApplicationEducationRecordAdmin` آپدیت شده با فیلدهای جدید

---

## 📝 **قدم‌های بعدی**

### **1. Migrations:**

```bash
python manage.py makemigrations
python manage.py migrate
```

### **2. Serializers:**

- `OlympiadRecordSerializer`
- `LanguageCertificateSerializer`
- آپدیت `ApplicationEducationRecordSerializer`

### **3. API Endpoints:**

```python
# المپیاد
POST   /api/applications/{id}/olympiad-records/
GET    /api/applications/{id}/olympiad-records/
PUT    /api/applications/{id}/olympiad-records/{olympiad_id}/
DELETE /api/applications/{id}/olympiad-records/{olympiad_id}/

# مدرک زبان
POST   /api/applications/{id}/language-certificates/
GET    /api/applications/{id}/language-certificates/
PUT    /api/applications/{id}/language-certificates/{cert_id}/
DELETE /api/applications/{id}/language-certificates/{cert_id}/

# امتیازدهی کارشناس
POST   /api/admin/education-records/{id}/score/
POST   /api/admin/olympiad-records/{id}/score/
POST   /api/admin/language-certificates/{id}/score/

# محاسبه امتیاز نهایی
POST   /api/admin/applications/{id}/calculate-final-score/
```

---

**🚀 سیستم کامل امتیازدهی با موفقیت پیاده‌سازی شد!**
