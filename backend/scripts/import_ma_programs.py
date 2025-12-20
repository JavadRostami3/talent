"""
Import Master (MA) talent programs, faculties and departments.

How to run (from repo root):
python backend/manage.py shell -c "from scripts.import_ma_programs import run; run()"
"""
from __future__ import annotations

from typing import List, Dict, Optional

from django.db import transaction

from apps.admissions.models import AdmissionRound, Program
from apps.core.models import Faculty, Department


RAW_PROGRAMS: List[Dict[str, Optional[str]]] = [
    {"name": "الهیات – علوم قران و حدیث (روزانه)", "orientation": "", "faculty": "الهیات و معارف اسلامی", "department": "علوم قرآن و حدیث", "bachelor": "الهیات و معارف اسلامی"},
    {"name": "الهیات – علوم قران و حدیث (شبانه)", "orientation": "", "faculty": "الهیات و معارف اسلامی", "department": "علوم قرآن و حدیث", "bachelor": "الهیات و معارف اسلامی"},
    {"name": "الهیات – علوم قران و حدیث (پردیس)", "orientation": "", "faculty": "الهیات و معارف اسلامی", "department": "علوم قرآن و حدیث", "bachelor": "الهیات و معارف اسلامی"},
    {"name": "الهیات – فقه و مبانی حقوق اسلامی (روزانه)", "orientation": "", "faculty": "الهیات و معارف اسلامی", "department": "فقه و مبانی حقوق اسلامی", "bachelor": "الهیات و معارف اسلامی"},
    {"name": "الهیات – فقه و مبانی حقوق اسلامی (شبانه)", "orientation": "", "faculty": "الهیات و معارف اسلامی", "department": "فقه و مبانی حقوق اسلامی", "bachelor": "الهیات و معارف اسلامی"},
    {"name": "الهیات – فقه و مبانی حقوق اسلامی (پردیس)", "orientation": "", "faculty": "الهیات و معارف اسلامی", "department": "فقه و مبانی حقوق اسلامی", "bachelor": "الهیات و معارف اسلامی"},
    {"name": "الهیات و معارف اسلامی- فلسفه و کلام اسلامی", "orientation": "فلسفه و کلام اسلامی (روزانه)", "faculty": "الهیات و معارف اسلامی", "department": "فلسفه و کلام اسلامی", "bachelor": "الهیات و معارف اسلامی"},
    {"name": "الهیات و معارف اسلامی- فلسفه و کلام اسلامی", "orientation": "فلسفه و کلام اسلامی (شبانه)", "faculty": "الهیات و معارف اسلامی", "department": "فلسفه و کلام اسلامی", "bachelor": "الهیات و معارف اسلامی"},
    {"name": "الهیات و معارف اسلامی- فلسفه و کلام اسلامی", "orientation": "فلسفه و کلام اسلامی (پردیس)", "faculty": "الهیات و معارف اسلامی", "department": "فلسفه و کلام اسلامی", "bachelor": "الهیات و معارف اسلامی"},
    {"name": "حقوق محيط زيست", "orientation": "", "faculty": "حقوق و علوم سیاسی", "department": "حقوق عمومی", "bachelor": "حقوق"},
    {"name": "حقوق بین الملل", "orientation": "", "faculty": "حقوق و علوم سیاسی", "department": "حقوق عمومی", "bachelor": "حقوق"},
    {"name": "حقوق عمومی", "orientation": "", "faculty": "حقوق و علوم سیاسی", "department": "حقوق عمومی", "bachelor": "حقوق"},
    {"name": "حقوق خصوصی", "orientation": "", "faculty": "حقوق و علوم سیاسی", "department": "حقوق عمومی", "bachelor": "حقوق"},
    {"name": "حقوق بشر", "orientation": "", "faculty": "حقوق و علوم سیاسی", "department": "حقوق عمومی", "bachelor": "حقوق"},
    {"name": "حقوق خانواده", "orientation": "", "faculty": "حقوق و علوم سیاسی", "department": "حقوق عمومی", "bachelor": "حقوق"},
    {"name": "اندیشه سیاسی در اسلام", "orientation": "", "faculty": "حقوق و علوم سیاسی", "department": "علوم سیاسی", "bachelor": "علوم سیاسی"},
    {"name": "روابط بین الملل", "orientation": "", "faculty": "حقوق و علوم سیاسی", "department": "علوم سیاسی", "bachelor": "علوم سياسي"},
    {"name": "علوم سیاسی", "orientation": "", "faculty": "حقوق و علوم سیاسی", "department": "علوم سیاسی", "bachelor": "علوم سياسي"},
    {"name": "مطالعات منطقه ای", "orientation": "آسیای مرکزی و قفقاز", "faculty": "حقوق و علوم سیاسی", "department": "علوم سیاسی", "bachelor": "علوم سیاسی"},
    {"name": "حقوق کیفری و جرم شناسی", "orientation": "", "faculty": "حقوق و علوم سیاسی", "department": "حقوق جزا وجرم شناسی", "bachelor": "حقوق"},
    {"name": "شیمی", "orientation": "شیمی آلی", "faculty": "شیمی", "department": "شیمی آلی", "bachelor": "شیمی"},
    {"name": "شیمی", "orientation": "شیمی پلیمر", "faculty": "شیمی", "department": "شیمی آلی", "bachelor": "شیمی"},
    {"name": "فیتوشیمی", "orientation": "", "faculty": "شیمی", "department": "شیمی آلی", "bachelor": "شیمی"},
    {"name": "شیمی دارویی", "orientation": "", "faculty": "شیمی", "department": "شیمی آلی", "bachelor": "شیمی"},
    {"name": "شیمی", "orientation": "شيمي تجزیه", "faculty": "شیمی", "department": "شیمی تجزیه", "bachelor": "شیمی"},
    {"name": "شیمی", "orientation": "شيمي فیزیک", "faculty": "شیمی", "department": "شیمی فیزیک", "bachelor": "شیمی"},
    {"name": "نانوشیمی", "orientation": "", "faculty": "شیمی", "department": "شیمی کاربردی", "bachelor": "شیمی"},
    {"name": "شیمی", "orientation": "شيمي کاربردی", "faculty": "شیمی", "department": "شیمی کاربردی", "bachelor": "شیمی"},
    {"name": "شیمی", "orientation": "شيمي معدنی", "faculty": "شیمی", "department": "شیمی معدنی", "bachelor": "شیمی"},
    {"name": "علوم اقتصادی", "orientation": "توسعه اقتصادي وبرنامه ريزي", "faculty": "علوم اقتصادی و اداری", "department": "علوم اقتصادی", "bachelor": "علوم اقتصادی"},
    {"name": "علوم اقتصادي", "orientation": "اقتصاد انرژی", "faculty": "علوم اقتصادی و اداری", "department": "علوم اقتصادی", "bachelor": "علوم اقتصادی"},
    {"name": "علوم اقتصادي", "orientation": "اقتصاد اسلامي", "faculty": "علوم اقتصادی و اداری", "department": "علوم اقتصادی", "bachelor": "علوم اقتصادی"},
    {"name": "علوم اقتصادي", "orientation": "اقتصاد نظري", "faculty": "علوم اقتصادی و اداری", "department": "علوم اقتصادی", "bachelor": "علوم اقتصادی"},
    {"name": "حسابداری", "orientation": "", "faculty": "علوم اقتصادی و اداری", "department": "حسابداری", "bachelor": "حسابداري"},
    {"name": "مدیریت دولتي", "orientation": "مدیریت تحول", "faculty": "علوم اقتصادی و اداری", "department": "مدیریت بازرگانی", "bachelor": "مديريت بازرگاني و مدريت دولتي"},
    {"name": "مدیریت بازرگانی", "orientation": "بازرگانی بین المللي", "faculty": "علوم اقتصادی و اداری", "department": "مدیریت بازرگانی", "bachelor": "مدیریت بازرگانی"},
    {"name": "مدیریت بازرگانی", "orientation": "بازاريابي", "faculty": "علوم اقتصادی و اداری", "department": "مدیریت بازرگانی", "bachelor": "مدیریت بازرگانی"},
    {"name": "مديرت منابع انساني", "orientation": "مديريت منابع انساني اسلامي", "faculty": "علوم اقتصادی و اداری", "department": "مدیریت بازرگانی", "bachelor": "مديريت بازرگاني و مدريت دولتي"},
    {"name": "مدیریت صنعتی", "orientation": "تحقيق درعمليات", "faculty": "علوم اقتصادی و اداری", "department": "مدیریت صنعتی", "bachelor": "مديريت صنعتي"},
    {"name": "مديريت صنعتي", "orientation": "توليد و عمليات", "faculty": "علوم اقتصادی و اداری", "department": "مدیریت صنعتی", "bachelor": "مديريت صنعتي"},
    {"name": "سیاست گذاری علم و فناوری", "orientation": "", "faculty": "علوم اقتصادی و اداری", "department": "مدیریت صنعتی", "bachelor": "کلیه گرایش های مدیریت، حسابداری و اقتصاد"},
    {"name": "مدیریت فناوری", "orientation": "همکاری ها و انتقال فناوری", "faculty": "علوم اقتصادی و اداری", "department": "مدیریت صنعتی", "bachelor": "کلیه گرایش هاي مدیریت، حسابداري و اقتصاد"},
    {"name": "کارآفرینی", "orientation": "فناوري", "faculty": "علوم اقتصادی و اداری", "department": "مدیریت صنعتی", "bachelor": "کلیه گرایش هاي مدیریت، حسابداري و اقتصاد"},
    {"name": "كارآفريني", "orientation": "كسب و كار جديد", "faculty": "علوم اقتصادی و اداری", "department": "مدیریت اجرایی", "bachelor": "كليه گرايش هاي مديريت"},
    {"name": "مدیریت كسب و كار", "orientation": "استراتژي", "faculty": "علوم اقتصادی و اداری", "department": "مدیریت اجرایی", "bachelor": "كليه گرايش هاي مديريت"},
    {"name": "آب و هواشناسی", "orientation": "آب و هواشناسی محیطی", "faculty": "علوم انسانی و اجتماعی", "department": "جغرافیا", "bachelor": "جغرافيا"},
    {"name": "طبيعت گردي", "orientation": "اکوتوریسم", "faculty": "علوم انسانی و اجتماعی", "department": "جغرافیا", "bachelor": "جغرافيا"},
    {"name": "جغرافیا و برنامه ریزی شهری", "orientation": "آمایش شهری", "faculty": "علوم انسانی و اجتماعی", "department": "جغرافیا", "bachelor": "جغرافيا"},
    {"name": "مخاطرات محیطی", "orientation": "", "faculty": "علوم انسانی و اجتماعی", "department": "جغرافیا", "bachelor": "جغرافيا"},
    {"name": "ژئومورفولوژي", "orientation": "ژئومورفولوژي و مهندسی محيطی", "faculty": "علوم انسانی و اجتماعی", "department": "جغرافیا", "bachelor": "جغرافيا، زمین شناسی، مهندسی طبیعت"},
    {"name": "سنجش از دور و سیسـتم اطلاعات جغرافیایی", "orientation": "سـنجش از دور", "faculty": "علوم انسانی و اجتماعی", "department": "جغرافیا", "bachelor": "جغرافیا"},
    {"name": "برنامه ریزی درسي", "orientation": "", "faculty": "علوم انسانی و اجتماعی", "department": "علوم تربیتی", "bachelor": "علوم تربیتی"},
    {"name": "تاریخ و فلسفه آموزش و پرورش", "orientation": "", "faculty": "علوم انسانی و اجتماعی", "department": "علوم تربیتی", "bachelor": "علوم تربیتی"},
    {"name": "برنامه ریزی آموزشی", "orientation": "", "faculty": "علوم انسانی و اجتماعی", "department": "علوم تربیتی", "bachelor": "علوم تربیتی"},
    {"name": "پژوهش علوم اجتماعی", "orientation": "", "faculty": "علوم انسانی و اجتماعی", "department": "علوم اجتماعی", "bachelor": "علوم اجتماعی"},
    {"name": "مطالعات جوانان", "orientation": "", "faculty": "علوم انسانی و اجتماعی", "department": "علوم اجتماعی", "bachelor": "علوم اجتماعی"},
    {"name": "جامعه شناسی", "orientation": "", "faculty": "علوم انسانی و اجتماعی", "department": "علوم اجتماعی", "bachelor": "علوم اجتماعی"},
    {"name": "تاریخ", "orientation": "تاریخ ایران اسلامی", "faculty": "علوم انسانی و اجتماعی", "department": "تاریخ", "bachelor": "تاریخ"},
    {"name": "مدیریت جهانگردی", "orientation": "برنامه ریزی و توسعه جهانگردی", "faculty": "علوم انسانی و اجتماعی", "department": "مدیریت جهانگردی", "bachelor": "مدیریت"},
    {"name": "مدیریت جهانگردی", "orientation": "بازاریابی جهانگردی", "faculty": "علوم انسانی و اجتماعی", "department": "مدیریت جهانگردی", "bachelor": "مدیریت"},
    {"name": "مدیریت جهانگردی", "orientation": "اوقات فراغت و برنامه ریزی فضایی", "faculty": "علوم انسانی و اجتماعی", "department": "مدیریت جهانگردی", "bachelor": "مدیریت جهانگردی، جغرافیا، علوم اجتماعی"},
    {"name": "روانشناسی تربیتی", "orientation": "", "faculty": "علوم انسانی و اجتماعی", "department": "روانشناسی تربیتی", "bachelor": "روانشناسی"},
    {"name": "توسعه محلی", "orientation": "شهری", "faculty": "علوم انسانی و اجتماعی", "department": "علوم اجتماعی-توسعه", "bachelor": "علوم اجتماعی-جغرافیا-اقتصاد"},
    {"name": "برنامه ریزی گردشگری", "orientation": "توریسم", "faculty": "علوم انسانی و اجتماعی", "department": "علوم اجتماعی-توسعه", "bachelor": "علوم اجتماعی، جغرافیا، اقتصاد، مدیریت، مدیریت جهانگردی"},
    {"name": "مردم شناسی", "orientation": "مردم شناسی", "faculty": "علوم انسانی و اجتماعی", "department": "علوم اجتماعی-مردم شناسی", "bachelor": ""},
    {"name": "فیزیک", "orientation": "فيزيك هسته ای", "faculty": "علوم پایه", "department": "فیزیک هسته ای", "bachelor": "فیزیک"},
    {"name": "فيزيك", "orientation": "فيزيك پلاسما", "faculty": "علوم پایه", "department": "فیزیک اتمی و مولکولی", "bachelor": "كليه گرايش هاي فيزيك"},
    {"name": "فناوري پلاسما", "orientation": "", "faculty": "علوم پایه", "department": "فیزیک اتمی و مولکولی", "bachelor": "كليه گرايش هاي فيزيك"},
    {"name": "فوتونيك", "orientation": "", "faculty": "علوم پایه", "department": "فیزیک اتمی و مولکولی", "bachelor": "فیزیک"},
    {"name": "فیزیک", "orientation": "اپتیک و لیزر", "faculty": "علوم پایه", "department": "فیزیک اتمی و مولکولی", "bachelor": "فیزیک"},
    {"name": "نانوفيزيك", "orientation": "", "faculty": "علوم پایه", "department": "فیزیک حالت جامد", "bachelor": "فیزیک"},
    {"name": "فيزيك", "orientation": "فيزيك ماده چگال", "faculty": "علوم پایه", "department": "فیزیک حالت جامد", "bachelor": "فیزیک"},
    {"name": "زیست شناسی گیاهی", "orientation": "سیستماتیک وبوم شناسي", "faculty": "علوم پایه", "department": "زیست شناسی", "bachelor": "زيست شناسی گياهی"},
    {"name": "بیوشیمی", "orientation": "", "faculty": "علوم پایه", "department": "زیست شناسی سلولی و مولکولی", "bachelor": "زيست شناسی"},
    {"name": "زیست شناسی – سلولی و ملکولی", "orientation": "", "faculty": "علوم پایه", "department": "زیست شناسی سلولی و مولکولی", "bachelor": "زيست شناسی سلولی و مولكولی"},
    {"name": "میکروبیولوژی", "orientation": "صنعتي", "faculty": "علوم پایه", "department": "زیست شناسی میکروبیولوژی", "bachelor": "زيست شناسی سلولی و مولكولی"},
    {"name": "ميكروبيولوژي", "orientation": "محيطي", "faculty": "علوم پایه", "department": "زیست شناسی میکروبیولوژی", "bachelor": "زيست شناسی سلولی و مولكولی"},
    {"name": "ميكروبيولوژي", "orientation": "میکرو ارگانیسم های بیماری زا", "faculty": "علوم پایه", "department": "زیست شناسی میکروبیولوژی", "bachelor": "زيست شناسی سلولی و مولكولی"},
    {"name": "زیست شناسی جانوری", "orientation": "فیزیولوژی", "faculty": "علوم پایه", "department": "زیست شناسی جانوری", "bachelor": "زيست شناسی"},
    {"name": "زيست شناسي گياهي", "orientation": "فيزيولوژي", "faculty": "علوم پایه", "department": "زیست شناسی گیاهی", "bachelor": "زيست شناسی گياهی"},
    {"name": "فیزیک", "orientation": "ذرات بنیادی ونظريه ميدان ها", "faculty": "علوم پایه", "department": "فیزیک نظری", "bachelor": "فیزیک"},
    {"name": "فیزیک", "orientation": "نجوم و اختر فیزیک", "faculty": "علوم پایه", "department": "فیزیک نظری", "bachelor": "فیزیک"},
    {"name": "فيزيك", "orientation": "گرانش وكيهان شناسي", "faculty": "علوم پایه", "department": "فیزیک نظری", "bachelor": "فیزیک"},
    {"name": "اقيانوس شناسي فيزيكي", "orientation": "", "faculty": "علوم دریایی و اقیانوسی", "department": "علوم دریایی و اقیانوسی", "bachelor": "کلیه گرایش های فيزيك، اقیانوس شناسی، مهندسی عمران آب، مهندسی مکانیک گرایش سیالات"},
    {"name": "زیست شناسی دریا", "orientation": "بوم شناسی دریا", "faculty": "علوم دریایی و اقیانوسی", "department": "علوم دریایی و اقیانوسی", "bachelor": "کلیه گرایش های زیست شناسی، اقیانوس شناسی"},
    {"name": "شیمی", "orientation": "شیمی دریا", "faculty": "علوم دریایی و اقیانوسی", "department": "علوم دریایی و اقیانوسی", "bachelor": "کلیه گرایش های شیمی، اقیانوس شناسی"},
    {"name": "علوم محیط زیست", "orientation": "", "faculty": "علوم دریایی و اقیانوسی", "department": "علوم دریایی و اقیانوسی", "bachelor": "اقیانوس شناسی، شیمی، زیست شناسی، علوم و مهندسـی محیط زیست، مهندسی منابع طبیعی"},
    {"name": "زیست شناسی دریا", "orientation": "جانوران دریا", "faculty": "علوم دریایی و اقیانوسی", "department": "علوم دریایی و اقیانوسی", "bachelor": "کلیه گرایش های زیست شناسی، اقیانوس شناسی"},
    {"name": "زیست شناسی دریا", "orientation": "آلودگی دریا", "faculty": "علوم دریایی و اقیانوسی", "department": "علوم دریایی و اقیانوسی", "bachelor": "کلیه گرایش های زیست شناسی، اقیانوس شناسی"},
    {"name": "علوم محیط زیست", "orientation": "", "faculty": "علوم دریایی و اقیانوسی", "department": "علوم دریایی و اقیانوسی", "bachelor": "اقیانوس شناسی، شیمی، زیست شناسی، علوم و مهندسـی محیط زیست، مهندسی منابع طبیعی"},
    {"name": "ریاضیات و کاربردها", "orientation": "آنالیز", "faculty": "علوم ریاضی", "department": "ریاضی", "bachelor": "ریاضیات و کاربردها"},
    {"name": "ریاضیات و کاربردها", "orientation": "جبر", "faculty": "علوم ریاضی", "department": "ریاضی", "bachelor": "ریاضیات و کاربردها"},
    {"name": "ریاضیات و کاربردها", "orientation": "هندسه", "faculty": "علوم ریاضی", "department": "ریاضی", "bachelor": "ریاضیات و کاربردها"},
    {"name": "ریاضی کاربردی", "orientation": "آنالیز عددی", "faculty": "علوم ریاضی", "department": "ریاضی", "bachelor": "ریاضیات و کاربردها"},
    {"name": "ریاضی کاربردی", "orientation": "بهينه سازي", "faculty": "علوم ریاضی", "department": "ریاضی", "bachelor": "ریاضیات و کاربردها"},
    {"name": "ریاضیات و کاربردها", "orientation": "گراف و ترکیبیات", "faculty": "علوم ریاضی", "department": "ریاضی", "bachelor": "ریاضیات و کاربردها"},
    {"name": "ریاضی کاربردی", "orientation": "ریاضی مالی", "faculty": "علوم ریاضی", "department": "ریاضی", "bachelor": "ریاضیات و کاربردها"},
    {"name": "آمار رياضي", "orientation": "", "faculty": "علوم ریاضی", "department": "آمار", "bachelor": "آمار"},
    {"name": "آمار", "orientation": "آمار اقتصادی", "faculty": "علوم ریاضی", "department": "آمار", "bachelor": "آمار"},
    {"name": "علوم کامپیوتر", "orientation": "محاسبات علمی", "faculty": "علوم ریاضی", "department": "علوم کامپیوتر", "bachelor": "علوم کامپیوتر"},
    {"name": "فیزیولوژی ورزشی", "orientation": "فیزیولوژی ورزشی كاربردي", "faculty": "تربیت بدنی و علوم ورزشی", "department": "فیزیولوژی ورزشی", "bachelor": "تربیت بدنی"},
    {"name": "فیزیولوژی ورزشی", "orientation": "فیزیولوژی ورزشي و تندرستی", "faculty": "تربیت بدنی و علوم ورزشی", "department": "فیزیولوژی ورزشی", "bachelor": "تربیت بدنی"},
    {"name": "فیزیولوژی ورزشی", "orientation": "فیزیولوژی و تغذيه ورزشی", "faculty": "تربیت بدنی و علوم ورزشی", "department": "فیزیولوژی ورزشی", "bachelor": "تربیت بدنی"},
    {"name": "مدیریت ورزشی", "orientation": "مديريت بازاريابي و ارتباطات ورزشی", "faculty": "تربیت بدنی و علوم ورزشی", "department": "مدیریت ورزشی", "bachelor": "تربیت بدنی"},
    {"name": "مديريت ورزشی", "orientation": "مديريت رویدادها و گردشگری ورزشی", "faculty": "تربیت بدنی و علوم ورزشی", "department": "مدیریت ورزشی", "bachelor": "تربیت بدنی"},
    {"name": "مديريت ورزشي", "orientation": "مديريت سازمان ها و باشگاه های ورزشي", "faculty": "تربیت بدنی و علوم ورزشی", "department": "مدیریت ورزشی", "bachelor": "تربیت بدنی"},
    {"name": "بیومکانیک ورزشی", "orientation": "", "faculty": "تربیت بدنی و علوم ورزشی", "department": "بیومکانیک ورزشی", "bachelor": "تربیت بدنی"},
    {"name": "رفتار حرکتی", "orientation": "یادگیری و کنترل حرکتی", "faculty": "تربیت بدنی و علوم ورزشی", "department": "بیومکانیک ورزشی", "bachelor": "علوم ورزشی"},
    {"name": "آسیب شناسی ورزشی و تمرینات اصلاحی", "orientation": "آسیب شناسی ورزشی", "faculty": "تربیت بدنی و علوم ورزشی", "department": "بیومکانیک ورزشی", "bachelor": "تربیت بدنی و علوم ورزشی"},
    {"name": "روانشناسی ورزشی", "orientation": "", "faculty": "تربیت بدنی و علوم ورزشی", "department": "روانشناسی ورزشی", "bachelor": "علوم ورزشی و تربیت بدنی"},
    {"name": "مهندسی برق", "orientation": "سیستم های قدرت", "faculty": "فنی و مهندسی", "department": "مهندسی برق", "bachelor": "مهندسی برق"},
    {"name": "مهندسی برق", "orientation": "مدارهاي مجتمع الکترونیک", "faculty": "فنی و مهندسی", "department": "مهندسی برق", "bachelor": "مهندسی برق"},
    {"name": "مهندسی کامپیوتر", "orientation": "شبکه های کامپیوتری", "faculty": "فنی و مهندسی", "department": "مهندسی کامپیوتر", "bachelor": "مهندسی کامپیوتر"},
    {"name": "مهندسی کامپیوتر", "orientation": "هوش مصنوعی و رباتیک", "faculty": "فنی و مهندسی", "department": "مهندسی کامپیوتر", "bachelor": "مهندسی کامپیوتر"},
    {"name": "مهندسي مكانيك-طراحي كاربردي", "orientation": "", "faculty": "فنی و مهندسی", "department": "مهندسی مکانیک", "bachelor": "مهندسی مکانیک"},
    {"name": "مهندسی انرژی های تجدید پذیر", "orientation": "", "faculty": "فنی و مهندسی", "department": "مهندسی مکانیک", "bachelor": "مهندسی مکانیک، مهندسی برق، مهندسی شیمی"},
    {"name": "مهندسی عمران", "orientation": "زلزله", "faculty": "فنی و مهندسی", "department": "مهندسی عمران", "bachelor": "مهندسی عمران"},
    {"name": "مهندسی عمران", "orientation": "سازه", "faculty": "فنی و مهندسی", "department": "مهندسی عمران", "bachelor": "مهندسی عمران"},
    {"name": "مهندسی عمران", "orientation": "مدیریت منابع آب", "faculty": "فنی و مهندسی", "department": "مهندسی عمران", "bachelor": "مهندسی عمران"},
    {"name": "مهندسی شیمی", "orientation": "طراحي فرآيند", "faculty": "فنی و مهندسی", "department": "مهندسی شیمی", "bachelor": "مهندسی شیمی"},
    {"name": "مهندسي شيمي", "orientation": "پليمر", "faculty": "فنی و مهندسی", "department": "مهندسی شیمی", "bachelor": "مهندسی شیمی، مهندسی پلیمر"},
    {"name": "مطالعات معماری ایران", "orientation": "مطالعات معماری ایران", "faculty": "میراث فرهنگی، صنایع دستی و گردشگری (مستقر در شهرستان چالوس)", "department": "باستان شناسی", "bachelor": "هنرهای صناعی-باستانشناسی-گردشگری"},
    {"name": "کتاب آرایی", "orientation": "", "faculty": "میراث فرهنگی، صنایع دستی و گردشگری (مستقر در شهرستان چالوس)", "department": "باستان شناسی", "bachelor": "هنرهای صناعی-باستانشناسی"},
    {"name": "مدیریت میراث فرهنگی", "orientation": "ابنیه و اماکن تاریخی-فرهنگی", "faculty": "میراث فرهنگی، صنایع دستی و گردشگری (مستقر در شهرستان چالوس)", "department": "باستان شناسی", "bachelor": "هنرهای صناعی-باستانشناسی"},
    {"name": "باستان شناسی", "orientation": "تمدن و فرهنگ اسلامی ایران و سرزمین های دیگر", "faculty": "هنر و معماری", "department": "باستان شناسی", "bachelor": "باستان شناسی"},
    {"name": "باستان شناسی", "orientation": "پیش از تاریخ ايران", "faculty": "هنر و معماری", "department": "باستان شناسی", "bachelor": "باستان شناسی"},
    {"name": "باستان شناسی", "orientation": "دوران تاریخی ايران", "faculty": "هنر و معماری", "department": "باستان شناسی", "bachelor": "باستان شناسی"},
    {"name": "صنايع دستی", "orientation": "طراحی (روزانه)", "faculty": "هنر و معماری", "department": "پژوهش هنر", "bachelor": "صنايع دستی"},
    {"name": "پژوهش هنر (روزانه)", "orientation": "", "faculty": "هنر و معماری", "department": "پژوهش هنر", "bachelor": "كليه رشته های كارشناسی هنر"},
    {"name": "پژوهش هنر (شبانه)", "orientation": "", "faculty": "هنر و معماری", "department": "پژوهش هنر", "bachelor": "كليه رشته های كارشناسی هنر"},
    {"name": "صنايع دستی", "orientation": "طراحی (شبانه)", "faculty": "هنر و معماری", "department": "پژوهش هنر", "bachelor": "صنايع دستی"},
    {"name": "برنامه ریزی شهری (روزانه)", "orientation": "", "faculty": "هنر و معماری", "department": "شهر سازی", "bachelor": "مهندسی شهرسازی"},
    {"name": "برنامه ریزی شهری (شبانه)", "orientation": "", "faculty": "هنر و معماری", "department": "شهر سازی", "bachelor": "مهندسی شهرسازی"},
    {"name": "مدیریت پروژه و ساخت (روزانه)", "orientation": "", "faculty": "هنر و معماری", "department": "معماری", "bachelor": "مهندسی معماری و مهندسی عمران"},
    {"name": "مهندسی معماری (روزانه)", "orientation": "", "faculty": "هنر و معماری", "department": "معماری", "bachelor": "مهندسی معماری"},
    {"name": "فناوری معماری", "orientation": "معماری بیونیک (روزانه)", "faculty": "هنر و معماری", "department": "معماری", "bachelor": "مهندسی معماری"},
    {"name": "مهندسی معماری منظر (روزانه)", "orientation": "", "faculty": "هنر و معماری", "department": "معماری", "bachelor": "مهندسی معماری"},
    {"name": "مهندسی معماری (شبانه)", "orientation": "", "faculty": "هنر و معماری", "department": "معماری", "bachelor": "مهندسی معماری"},
    {"name": "فناوری معماری", "orientation": "معماری بیونیک (شبانه)", "faculty": "هنر و معماری", "department": "معماری", "bachelor": "مهندسی معماری"},
    {"name": "مهندسی معماری منظر (شبانه)", "orientation": "", "faculty": "هنر و معماری", "department": "معماری", "bachelor": "مهندسی معماری"},
    {"name": "مدیریت پروژه و ساخت (شبانه)", "orientation": "", "faculty": "هنر و معماری", "department": "معماری", "bachelor": "مهندسی معماری و مهندسی عمران"},
    {"name": "زبان و ادبیات فارسی", "orientation": "", "faculty": "ادبیات فارسی و زبان های خارجی", "department": "آموزش زبان و ادبیات فارسی", "bachelor": "زبان و ادبیات فارسی"},
    {"name": "ادبیات عربي", "orientation": "", "faculty": "ادبیات فارسی و زبان های خارجی", "department": "آموزش زبان و ادبیات عربی", "bachelor": "زبان و ادبيات عرب"},
    {"name": "آموزش زبان انگلیسی", "orientation": "", "faculty": "ادبیات فارسی و زبان های خارجی", "department": "آموزش زبان و ادبیات انگلیسی", "bachelor": "آموزش زبان انگلیسی"},
    {"name": "زبان و ادبیات انگلیسی", "orientation": "", "faculty": "ادبیات فارسی و زبان های خارجی", "department": "آموزش زبان و ادبیات انگلیسی", "bachelor": "زبان و ادبیات انگلیسی"},
    {"name": "مترجمی زبان روسی", "orientation": "", "faculty": "ادبیات فارسی و زبان های خارجی", "department": "آموزش مترجمی زبان روسی", "bachelor": "زبان روسی"},
]


@transaction.atomic
def run() -> None:
    round_obj = (
        AdmissionRound.objects.filter(type=AdmissionRound.RoundType.MA_TALENT)
        .order_by("-year", "-created_at")
        .first()
    )
    if not round_obj:
        raise SystemExit("No MA_TALENT admission round found. Create one first.")

    created_programs = 0
    updated_programs = 0
    created_faculties = 0
    created_departments = 0

    for idx, row in enumerate(RAW_PROGRAMS, start=1):
        faculty_name = (row["faculty"] or "").strip()
        dept_name = (row["department"] or "").strip()
        program_name = (row["name"] or "").strip()
        orientation = (row["orientation"] or "").strip()
        bachelor = (row["bachelor"] or "").strip()

        faculty_obj, fac_created = Faculty.objects.get_or_create(name=faculty_name, defaults={"is_active": True})
        if fac_created:
            created_faculties += 1

        department_obj, dept_created = Department.objects.get_or_create(
            faculty=faculty_obj,
            name=dept_name,
            defaults={"is_active": True},
        )
        if dept_created:
            created_departments += 1

        code = f"MA-{idx:03d}"
        program_obj, prog_created = Program.objects.get_or_create(
            round=round_obj,
            faculty=faculty_obj,
            department=department_obj,
            name=program_name,
            orientation=orientation,
            defaults={
                "degree_level": Program.DEGREE_MA,
                "code": code,
                "bachelor_related_field": bachelor,
                "capacity": 0,
                "is_active": True,
            },
        )

        if prog_created:
            created_programs += 1
        else:
            # Update fields in case data changed
            program_obj.code = code
            program_obj.degree_level = Program.DEGREE_MA
            program_obj.bachelor_related_field = bachelor
            program_obj.is_active = True
            program_obj.save(update_fields=["code", "degree_level", "bachelor_related_field", "is_active"])
            updated_programs += 1

    print(f"Round: {round_obj.title} ({round_obj.year})")
    print(f"Faculties created: {created_faculties}")
    print(f"Departments created: {created_departments}")
    print(f"Programs created: {created_programs}, updated: {updated_programs}")

