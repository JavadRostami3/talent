"""
اسکریپت ساخت ده داوطلب تستی استعداد درخشان

این دستور براساس فراخوان‌های موجود، کاربران، مدارک و سوابق تحصیلی
را وارد دیتابیس پروژه می‌کند تا در پنل‌های کارشناس نمایشی برای تست وجود داشته باشند.
"""
import os
import sys
from pathlib import Path

DJANGO_APP_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(DJANGO_APP_DIR))

import django
from django.conf import settings
from django.core.files import File
from django.db import transaction
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import ApplicantProfile, User
from apps.admissions.models import AdmissionRound, Program
from apps.applications.models import (
    Application,
    ApplicationChoice,
    ApplicationEducationRecord,
    EducationScoring,
)
from apps.core.models import Department, University
from apps.documents.models import ApplicationDocument


IDENTITY_DOCS = ['PERSONAL_PHOTO', 'NATIONAL_CARD', 'ID_CARD']
BSC_DOCS = ['BSC_CERT', 'BSC_TRANSCRIPT']
MSC_DOCS = ['MSC_CERT', 'MSC_TRANSCRIPT']


def resolve_media_root() -> Path:
    media_root = Path(settings.MEDIA_ROOT)
    if not media_root.is_absolute():
        media_root = Path(settings.BASE_DIR) / media_root
    media_root.mkdir(parents=True, exist_ok=True)
    return media_root


def ensure_placeholder_document(media_root: Path) -> Path:
    placeholder = media_root / 'talent-placeholder.pdf'
    if not placeholder.exists():
        placeholder.write_bytes(
            'این فایل صرفاً برای تست ایجاد شده است.\n'.encode('utf-8')
        )
    return placeholder


def ensure_universities() -> dict[str, University]:
    definitions = [
        ('دانشگاه تهران', 'UT'),
        ('دانشگاه صنعتی شریف', 'Sharif'),
        ('دانشگاه علم و صنعت ایران', 'IUST'),
        ('دانشگاه فردوسی مشهد', 'FUM'),
        ('دانشگاه تبریز', 'UTR'),
    ]
    created = {}
    for name, code in definitions:
        university, _ = University.objects.get_or_create(
            name=name,
            defaults={'code': code, 'is_active': True}
        )
        created[name] = university
    return created


def build_phd_programs(phd_round: AdmissionRound) -> list[Program]:
    if not phd_round:
        return []

    templates = [
        {
            'code': 'PHD-AI',
            'name': 'هوش مصنوعی پیشرفته',
            'orientation': 'سیستم‌های یادگیری عمیق',
            'department_name': 'علوم کامپیوتر',
            'bachelor_related_field': 'علوم کامپیوتر',
            'capacity': 5,
        },
        {
            'code': 'PHD-SW',
            'name': 'مهندسی نرم‌افزار سیستم‌های نوین',
            'orientation': 'مهندسی نرم‌افزار',
            'department_name': 'مهندسی کامپیوتر',
            'bachelor_related_field': 'مهندسی نرم‌افزار',
            'capacity': 5,
        },
        {
            'code': 'PHD-PE',
            'name': 'مهندسی قدرت و انرژی‌های نو',
            'orientation': 'مهندسی برق',
            'department_name': 'مهندسی برق',
            'bachelor_related_field': 'مهندسی برق',
            'capacity': 4,
        },
    ]

    programs = []
    for template in templates:
        department = Department.objects.filter(name=template['department_name']).first()
        if not department:
            raise ValueError(
                f"گروه آموزشی '{template['department_name']}' در دیتابیس پیدا نشد."
            )

        program, created = Program.objects.get_or_create(
            round=phd_round,
            code=template['code'],
            defaults={
                'degree_level': Program.DEGREE_PHD,
                'faculty': department.faculty,
                'department': department,
                'name': template['name'],
                'orientation': template['orientation'],
                'bachelor_related_field': template['bachelor_related_field'],
                'capacity': template['capacity'],
                'is_active': True,
            }
        )

        # Make sure fields stay in sync when the script reruns
        program.degree_level = Program.DEGREE_PHD
        program.faculty = department.faculty
        program.department = department
        program.name = template['name']
        program.orientation = template['orientation']
        program.bachelor_related_field = template['bachelor_related_field']
        program.capacity = template['capacity']
        program.is_active = True
        for attr in ('round', 'code'):
            setattr(program, attr, getattr(program, attr))
        program.save()
        programs.append(program)
    return programs


def create_or_update_user(entry: dict[str, str]) -> tuple[User, bool]:
    user = User.objects.filter(national_id=entry['national_id']).first()
    if not user:
        user = User.objects.create_user(
            national_id=entry['national_id'],
            email=entry['email'],
            password='TestPass123!',
            first_name=entry['first_name'],
            last_name=entry['last_name'],
            mobile=entry['mobile'],
            father_name=entry['father_name'],
            gender=entry['gender'],
            birth_year=entry['birth_year'],
            birth_place=entry['birth_place'],
            military_status=entry.get('military_status', ''),
        )
        return user, True

    user.email = entry['email']
    user.first_name = entry['first_name']
    user.last_name = entry['last_name']
    user.mobile = entry['mobile']
    user.father_name = entry['father_name']
    user.gender = entry['gender']
    user.birth_year = entry['birth_year']
    user.birth_place = entry['birth_place']
    if entry.get('military_status'):
        user.military_status = entry['military_status']
    user.save()
    return user, False


def populate_applicants():
    ma_round = AdmissionRound.objects.filter(type='MA_TALENT').order_by('-year').first()
    phd_round = AdmissionRound.objects.filter(type='PHD_TALENT').order_by('-year').first()
    if not ma_round or not phd_round:
        raise RuntimeError('فراخوان استعداد درخشان ارشد یا دکتری در دیتابیس پیدا نشد.')

    ma_programs = list(Program.objects.filter(round=ma_round).order_by('id'))
    phd_programs = build_phd_programs(phd_round)
    if not ma_programs:
        raise RuntimeError(f'هیچ برنامه‌ای برای {ma_round.title} تعریف نشده است.')
    if not phd_programs:
        raise RuntimeError(f'هیچ برنامه‌ای برای {phd_round.title} تعریف نشده است.')

    universities = ensure_universities()
    placeholder_media = ensure_placeholder_document(resolve_media_root())

    superuser = User.objects.filter(role='SUPERADMIN').first()
    if not superuser:
        superuser = User.objects.filter(role='ADMIN').first()
    if not superuser:
        raise RuntimeError('هیچ کاربر ادمین برای ثبت نتایج یافت نشد.')

    applicant_entries = [
        {
            'national_id': '1000000001',
            'first_name': 'آرش',
            'last_name': 'نوروزی',
            'father_name': 'حسین',
            'gender': 'MALE',
            'email': 'talent.test1@example.com',
            'mobile': '09120000001',
            'birth_year': 1378,
            'birth_place': 'تهران',
            'address': 'خیابان ولیعصر، پلاک ۱۶',
            'phone': '02110000001',
            'military_status': 'EDUCATIONAL_EXEMPT',
            'round_type': 'MA_TALENT',
            'university_name': 'دانشگاه تهران',
        },
        {
            'national_id': '1000000002',
            'first_name': 'لاله',
            'last_name': 'محمدی',
            'father_name': 'علی',
            'gender': 'FEMALE',
            'email': 'talent.test2@example.com',
            'mobile': '09120000002',
            'birth_year': 1380,
            'birth_place': 'شیراز',
            'address': 'خیابان انقلاب، پلاک ۲',
            'phone': '02110000002',
            'round_type': 'MA_TALENT',
            'university_name': 'دانشگاه صنعتی شریف',
        },
        {
            'national_id': '1000000003',
            'first_name': 'فرهاد',
            'last_name': 'رحیمی',
            'father_name': 'محمود',
            'gender': 'MALE',
            'email': 'talent.test3@example.com',
            'mobile': '09120000003',
            'birth_year': 1379,
            'birth_place': 'اصفهان',
            'address': 'خیابان چهار باغ بالا، پلاک ۵',
            'phone': '03111000003',
            'military_status': 'EDUCATIONAL_EXEMPT',
            'round_type': 'MA_TALENT',
            'university_name': 'دانشگاه فردوسی مشهد',
        },
        {
            'national_id': '1000000004',
            'first_name': 'نگین',
            'last_name': 'صادقی',
            'father_name': 'روح‌الله',
            'gender': 'FEMALE',
            'email': 'talent.test4@example.com',
            'mobile': '09120000004',
            'birth_year': 1381,
            'birth_place': 'کرج',
            'address': 'خیابان بهشت، پلاک ۱۰',
            'phone': '02621000004',
            'round_type': 'MA_TALENT',
            'university_name': 'دانشگاه علم و صنعت ایران',
        },
        {
            'national_id': '1000000005',
            'first_name': 'پویا',
            'last_name': 'عظیمی',
            'father_name': 'سعید',
            'gender': 'MALE',
            'email': 'talent.test5@example.com',
            'mobile': '09120000005',
            'birth_year': 1377,
            'birth_place': 'مشهد',
            'address': 'خیابان طبرسی، پلاک ۲۰',
            'phone': '05111000005',
            'military_status': 'EDUCATIONAL_EXEMPT',
            'round_type': 'MA_TALENT',
            'university_name': 'دانشگاه تبریز',
        },
        {
            'national_id': '1000000006',
            'first_name': 'سارا',
            'last_name': 'کاوه',
            'father_name': 'حسین',
            'gender': 'FEMALE',
            'email': 'talent.test6@example.com',
            'mobile': '09120000006',
            'birth_year': 1376,
            'birth_place': 'تهران',
            'address': 'خیابان نیاوران، پلاک ۹',
            'phone': '02122000006',
            'round_type': 'PHD_TALENT',
            'university_name': 'دانشگاه تهران',
        },
        {
            'national_id': '1000000007',
            'first_name': 'کیان',
            'last_name': 'اکبری',
            'father_name': 'علیرضا',
            'gender': 'MALE',
            'email': 'talent.test7@example.com',
            'mobile': '09120000007',
            'birth_year': 1375,
            'birth_place': 'کرمانشاه',
            'address': 'خیابان طالقانی، پلاک ۷',
            'phone': '08311000007',
            'military_status': 'EDUCATIONAL_EXEMPT',
            'round_type': 'PHD_TALENT',
            'university_name': 'دانشگاه صنعتی شریف',
        },
        {
            'national_id': '1000000008',
            'first_name': 'پریسا',
            'last_name': 'دستجردی',
            'father_name': 'حسین',
            'gender': 'FEMALE',
            'email': 'talent.test8@example.com',
            'mobile': '09120000008',
            'birth_year': 1378,
            'birth_place': 'بندرعباس',
            'address': 'خیابان امام، پلاک ۸',
            'phone': '07611000008',
            'round_type': 'PHD_TALENT',
            'university_name': 'دانشگاه فردوسی مشهد',
        },
        {
            'national_id': '1000000009',
            'first_name': 'امیر',
            'last_name': 'محسنی',
            'father_name': 'مهدی',
            'gender': 'MALE',
            'email': 'talent.test9@example.com',
            'mobile': '09120000009',
            'birth_year': 1377,
            'birth_place': 'یزد',
            'address': 'خیابان امام خمینی، پلاک ۱۲',
            'phone': '03511000009',
            'military_status': 'EDUCATIONAL_EXEMPT',
            'round_type': 'PHD_TALENT',
            'university_name': 'دانشگاه علم و صنعت ایران',
        },
        {
            'national_id': '1000000010',
            'first_name': 'شیما',
            'last_name': 'توکلی',
            'father_name': 'محمود',
            'gender': 'FEMALE',
            'email': 'talent.test10@example.com',
            'mobile': '09120000010',
            'birth_year': 1379,
            'birth_place': 'کرمان',
            'address': 'خیابان امام علی، پلاک ۱۳',
            'phone': '03411000010',
            'round_type': 'PHD_TALENT',
            'university_name': 'دانشگاه تبریز',
        },
    ]

    counters = {
        'users_created': 0,
        'applications_created': 0,
        'applications_processed': 0,
        'documents_created': 0,
        'education_records': 0,
    }
    ma_cycle = 0
    phd_cycle = 0

    for entry in applicant_entries:
        with transaction.atomic():
            now = timezone.now()
            counters['applications_processed'] += 1
            user, created_user = create_or_update_user(entry)
            if created_user:
                counters['users_created'] += 1
            profile, _ = ApplicantProfile.objects.get_or_create(user=user)
            profile.address = entry['address']
            profile.phone = entry['phone']
            profile.save()

            if entry['round_type'] == 'MA_TALENT':
                round_obj = ma_round
                program = ma_programs[ma_cycle % len(ma_programs)]
                ma_cycle += 1
            else:
                round_obj = phd_round
                program = phd_programs[phd_cycle % len(phd_programs)]
                phd_cycle += 1

            university = universities.get(entry['university_name'])
            if not university:
                raise ValueError(f"دانشگاه {entry['university_name']} تعریف نشده است.")

            application, created_app = Application.objects.get_or_create(
                applicant=profile,
                round=round_obj,
                defaults={
                    'status': Application.Status.COMPLETED,
                    'university_of_study': university,
                    'rank_percentile_group': 'پنجم درصد بالاتر',
                    'total_score': 0,
                    'university_review_status': Application.UniversityReviewStatus.APPROVED,
                    'university_review_comment': 'پرونده توسط دانشگاه تایید اولیه شده است.',
                    'university_reviewed_by': superuser,
                    'university_reviewed_at': now,
                    'faculty_review_completed': True,
                    'faculty_review_comment': 'کارشناس دانشکده همه مدارک را تایید کرده است.',
                    'faculty_reviewed_by': superuser,
                    'faculty_reviewed_at': now,
                    'admission_overall_status': 'ADMITTED',
                    'admission_result_published_at': now,
                }
            )
            if created_app:
                counters['applications_created'] += 1

            application.status = Application.Status.COMPLETED
            application.university_of_study = university
            application.rank_percentile_group = 'پنجم درصد بالاتر'
            application.university_review_status = Application.UniversityReviewStatus.APPROVED
            application.university_review_comment = 'پرونده توسط دانشگاه تایید اولیه شده است.'
            application.university_reviewed_by = superuser
            application.university_reviewed_at = now
            application.faculty_review_completed = True
            application.faculty_review_comment = 'کارشناس دانشکده همه مدارک را تایید کرده است.'
            application.faculty_reviewed_by = superuser
            application.faculty_reviewed_at = now
            application.admission_overall_status = 'ADMITTED'
            application.admission_result_published_at = now

            application.save()

            choice_defaults = {
                'program': program,
                'priority': 1,
                'admission_status': 'ACCEPTED',
                'admission_priority_result': 1,
                'admission_note': 'رشته اصلی فراخوان استعداد درخشان',
            }
            choice, _ = ApplicationChoice.objects.update_or_create(
                application=application,
                priority=1,
                defaults=choice_defaults
            )

            bsc_record, _ = ApplicationEducationRecord.objects.get_or_create(
                application=application,
                degree_level='BSC',
                defaults={
                    'status': 'GRADUATED',
                    'university': university,
                    'field_of_study': 'مهندسی کامپیوتر',
                    'gpa': 18.25,
                    'start_month': 7,
                    'start_year': 1396,
                    'graduation_month': 2,
                    'graduation_year': 1400,
                    'total_units_passed': 140,
                    'semester_count': 8,
                    'class_size': 40,
                    'rank_status': 'رتبه ممتاز میان دانشجویان',
                }
            )
            counters['education_records'] += 1
            bsc_record.status = 'GRADUATED'
            bsc_record.university = university
            bsc_record.field_of_study = 'مهندسی کامپیوتر'
            bsc_record.gpa = 18.25
            bsc_record.start_month = 7
            bsc_record.start_year = 1396
            bsc_record.graduation_month = 2
            bsc_record.graduation_year = 1400
            bsc_record.total_units_passed = 140
            bsc_record.semester_count = 8
            bsc_record.class_size = 40
            bsc_record.rank_status = 'رتبه ممتاز میان دانشجویان'
            bsc_record.save()

            if entry['round_type'] == 'PHD_TALENT':
                msc_record, _ = ApplicationEducationRecord.objects.get_or_create(
                    application=application,
                    degree_level='MSC',
                    defaults={
                        'status': 'GRADUATED',
                        'university': university,
                        'field_of_study': 'مهندسی نرم‌افزار',
                        'gpa': 19.2,
                        'start_month': 7,
                        'start_year': 1400,
                        'graduation_month': 2,
                        'graduation_year': 1402,
                        'total_units_passed': 32,
                        'semester_count': 3,
                        'class_size': 22,
                        'rank_status': 'دانشجوی ممتاز',
                    }
                )
                counters['education_records'] += 1
                msc_record.status = 'GRADUATED'
                msc_record.university = university
                msc_record.field_of_study = 'مهندسی نرم‌افزار'
                msc_record.gpa = 19.2
                msc_record.start_month = 7
                msc_record.start_year = 1400
                msc_record.graduation_month = 2
                msc_record.graduation_year = 1402
                msc_record.total_units_passed = 32
                msc_record.semester_count = 3
                msc_record.class_size = 22
                msc_record.rank_status = 'دانشجوی ممتاز'
                msc_record.save()

            scoring = EducationScoring.objects.filter(application=application).first()
            if not scoring:
                scoring = EducationScoring(application=application)
            base = 5.0 if entry['round_type'] == 'MA_TALENT' else 5.5
            scoring.bsc_gpa_university_score = base + 0.2
            scoring.msc_gpa_university_score = 0 if entry['round_type'] == 'MA_TALENT' else base
            scoring.bsc_duration_score = 2.4
            scoring.msc_duration_score = 0 if entry['round_type'] == 'MA_TALENT' else 2.6
            scoring.olympiad_score = 1.5
            scoring.language_certificate_score = 3.0
            scoring.scored_by = superuser
            scoring.scored_at = now
            scoring.comment = 'اسکریپت نمونه برای پنل کارشناس'
            scoring.save()

            application.calculate_final_score()

            doc_types = IDENTITY_DOCS + BSC_DOCS
            if entry['round_type'] == 'PHD_TALENT':
                doc_types += MSC_DOCS

            for doc_type in doc_types:
                document, _ = ApplicationDocument.objects.get_or_create(
                    application=application,
                    type=doc_type,
                )
                document.status = ApplicationDocument.Status.APPROVED
                document.reviewed_by = superuser
                document.reviewed_at = now
                document.review_comment = 'مدرک تستی تایید شده'
                with open(placeholder_media, 'rb') as doc_file:
                    document.file.save(
                        f'{doc_type.lower()}_{entry["national_id"]}.pdf',
                        File(doc_file),
                        save=False,
                    )
                document.save()
                counters['documents_created'] += 1

    print('✅ ده داوطلب استعداد درخشان به صورت تستی ایجاد شد.')
    print('• کاربران جدید:', counters['users_created'])
    print('• پرونده‌های جدید:', counters['applications_created'])
    print('• پرونده‌های پردازش‌شده (ایجاد یا به‌روزرسانی):', counters['applications_processed'])
    print('• مدارک به‌روزرسانی شده:', counters['documents_created'])
    print('• سوابق تحصیلی ثبت یا بروزرسانی شد:', counters['education_records'])


if __name__ == '__main__':
    populate_applicants()
