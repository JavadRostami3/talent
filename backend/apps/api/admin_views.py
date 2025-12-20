from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db import transaction
from django.db.models import Q, Count
from django.utils import timezone
from apps.applications.models import Application
from apps.accounts.models import AdminPermission
from apps.admissions.models import Program
from apps.core.models import Faculty, Department
from apps.workflow.models import FormReview
from .applications_serializers import (
    AdminApplicationListSerializer,
    AdminApplicationDetailSerializer,
)
from .workflow_serializers import FormReviewSerializer, FormReviewCreateUpdateSerializer
from .permissions import IsUniversityAdmin, IsFacultyAdmin
from apps.admissions.models import Program, AdmissionRound
from apps.applications.models import ApplicationChoice


class ApplicationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


def _check_ma_talent_access(user):
    """
    کمک‌کننده برای بررسی دسترسی ادمین به فراخوان استعداد درخشان ارشد
    """
    try:
        admin_permission = user.admin_permission
    except AdminPermission.DoesNotExist:
        return None, Response(
            {'error': 'دسترسی ادمین یافت نشد'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if not admin_permission.has_access_to_round_type('MA_TALENT'):
        return None, Response(
            {'error': 'به فراخوان استعداد درخشان ارشد دسترسی ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    return admin_permission, None


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsUniversityAdmin])
def university_admin_applications_list(request):
    """
    لیست پرونده‌های ثبت‌نام برای مسئول دانشگاه
    
    فیلترها:
    - round_type: نوع فراخوان (MA_TALENT, PHD_TALENT, PHD_EXAM, OLYMPIAD)
    - university_review_status: وضعیت بررسی (PENDING, APPROVED, APPROVED_WITH_DEFECT, REJECTED)
    - faculty_id: دانشکده
    - department_id: گروه آموزشی
    - status: وضعیت پرونده (SUBMITTED, UNDER_UNIVERSITY_REVIEW, etc.)
    - search: جستجو در کد ملی، نام، نام خانوادگی، کد پیگیری
    - is_corrected: پرونده‌های ویرایش شده (بعد از برگشت)
    """
    try:
        admin_permission = request.user.admin_permission
    except AdminPermission.DoesNotExist:
        return Response(
            {'error': 'شما دسترسی مسئول دانشگاه ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # بررسی دسترسی‌ها
    if not admin_permission.is_university_admin():
        return Response(
            {'error': 'شما دسترسی مسئول دانشگاه ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # شروع Query
    queryset = Application.objects.select_related(
        'applicant__user',
        'round',
        'university_reviewed_by',
        'faculty_reviewed_by',
        'university_of_study',
        'university_weight'
    ).prefetch_related(
        'choices__program__faculty',
        'choices__program__department',
        # سوابق تحقیقاتی
        'research_articles',
        'patents',
        'festival_awards',
        'conference_articles',
        'books',
        'masters_thesis',
        # سوابق المپیاد و زبان
        'olympiad_records',
        'language_certificates',
        # مصاحبه
        'interview'
    )
    
    # فیلتر نوع فراخوان بر اساس دسترسی
    round_type = request.GET.get('round_type')
    if round_type:
        if not admin_permission.has_access_to_round_type(round_type):
            return Response(
                {'error': f'شما به فراخوان {round_type} دسترسی ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )
        queryset = queryset.filter(round__type=round_type)
    else:
        # اگر نوع مشخص نشده، فقط موارد مجاز نمایش داده شود
        allowed_types = []
        if admin_permission.has_ma_talent_access or admin_permission.has_full_access:
            allowed_types.append('MA_TALENT')
        if admin_permission.has_phd_talent_access or admin_permission.has_full_access:
            allowed_types.append('PHD_TALENT')
        if admin_permission.has_phd_exam_access or admin_permission.has_full_access:
            allowed_types.append('PHD_EXAM')
        if admin_permission.has_olympiad_access or admin_permission.has_full_access:
            allowed_types.append('OLYMPIAD')
        
        if not allowed_types:
            return Response({'results': [], 'count': 0})
        
        queryset = queryset.filter(round__type__in=allowed_types)
    
    # فیلتر وضعیت بررسی مسئول دانشگاه
    university_review_status = request.GET.get('university_review_status')
    if university_review_status:
        queryset = queryset.filter(university_review_status=university_review_status)
    
    # فیلتر پرونده‌های ویرایش شده (بعد از برگشت)
    is_corrected = request.GET.get('is_corrected')
    if is_corrected == 'true':
        # پرونده‌هایی که وضعیت RETURNED_FOR_CORRECTION داشتند و دوباره SUBMITTED شدند
        queryset = queryset.filter(
            status=Application.Status.SUBMITTED,
            university_review_status=Application.UniversityReviewStatus.PENDING
        ).exclude(
            university_reviewed_at__isnull=True
        )
    
    # فیلتر وضعیت پرونده
    app_status = request.GET.get('status')
    if app_status:
        queryset = queryset.filter(status=app_status)
    else:
        # پیش‌فرض: فقط پرونده‌های ارسال شده و در حال بررسی
        queryset = queryset.filter(
            status__in=[
                Application.Status.SUBMITTED,
                Application.Status.UNDER_UNIVERSITY_REVIEW,
                Application.Status.RETURNED_FOR_CORRECTION
            ]
        )
    
    # فیلتر دانشکده
    faculty_id = request.GET.get('faculty_id')
    if faculty_id:
        queryset = queryset.filter(
            choices__program__faculty_id=faculty_id
        ).distinct()

    # فیلتر دانشگاه محل تحصیل
    university_id = request.GET.get('university_id')
    if university_id:
        queryset = queryset.filter(
            university_of_study_id=university_id
        ).distinct()
    
    # فیلتر گروه آموزشی
    department_id = request.GET.get('department_id')
    if department_id:
        queryset = queryset.filter(
            choices__program__department_id=department_id
        ).distinct()
    
    # جستجو
    search = request.GET.get('search', '').strip()
    if search:
        queryset = queryset.filter(
            Q(applicant__user__national_id__icontains=search) |
            Q(applicant__user__first_name__icontains=search) |
            Q(applicant__user__last_name__icontains=search) |
            Q(tracking_code__icontains=search)
        )
    
    # مرتب‌سازی
    sort_by = request.GET.get('sort_by', '-created_at')
    queryset = queryset.order_by(sort_by)
    
    # Pagination
    paginator = ApplicationPagination()
    page = paginator.paginate_queryset(queryset, request)
    
    if page is not None:
        serializer = AdminApplicationListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    serializer = AdminApplicationListSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsFacultyAdmin])
def faculty_admin_applications_list(request):
    """
    لیست پرونده‌های ثبت‌نام برای مسئول دانشکده
    
    فیلترها:
    - round_type: نوع فراخوان (MA_TALENT, PHD_TALENT, PHD_EXAM, OLYMPIAD)
    - faculty_id: دانشکده (باید در دسترسی‌های مسئول باشد)
    - department_id: گروه آموزشی
    - faculty_review_completed: بررسی دانشکده تکمیل شده یا نه
    - search: جستجو در کد ملی، نام، نام خانوادگی، کد پیگیری
    """
    try:
        admin_permission = request.user.admin_permission
    except AdminPermission.DoesNotExist:
        return Response(
            {'error': 'شما دسترسی مسئول دانشکده ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # بررسی دسترسی‌ها
    if not admin_permission.is_faculty_admin():
        return Response(
            {'error': 'شما دسترسی مسئول دانشکده ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # شروع Query - فقط پرونده‌های تایید شده توسط مسئول دانشگاه
    queryset = Application.objects.select_related(
        'applicant__user',
        'round',
        'university_reviewed_by',
        'faculty_reviewed_by',
        'university_of_study',
        'university_weight'
    ).prefetch_related(
        'choices__program__faculty',
        'choices__program__department',
        'education_records',
        # سوابق تحقیقاتی
        'research_articles',
        'patents',
        'festival_awards',
        'conference_articles',
        'books',
        'masters_thesis',
        # سوابق المپیاد و زبان
        'olympiad_records',
        'language_certificates',
        # مصاحبه
        'interview'
    ).filter(
        status__in=[
            Application.Status.APPROVED_BY_UNIVERSITY,
            Application.Status.UNDER_FACULTY_REVIEW,
            Application.Status.FACULTY_REVIEW_COMPLETED
        ]
    )
    
    # فیلتر نوع فراخوان
    round_type = request.GET.get('round_type')
    if round_type:
        if not admin_permission.has_access_to_round_type(round_type):
            return Response(
                {'error': f'شما به فراخوان {round_type} دسترسی ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )
        queryset = queryset.filter(round__type=round_type)
    else:
        # فیلتر بر اساس دسترسی‌های مسئول
        allowed_types = []
        if admin_permission.has_ma_talent_access or admin_permission.has_full_access:
            allowed_types.append('MA_TALENT')
        if admin_permission.has_phd_talent_access or admin_permission.has_full_access:
            allowed_types.append('PHD_TALENT')
        if admin_permission.has_phd_exam_access or admin_permission.has_full_access:
            allowed_types.append('PHD_EXAM')
        if admin_permission.has_olympiad_access or admin_permission.has_full_access:
            allowed_types.append('OLYMPIAD')
        
        if not allowed_types:
            return Response({'results': [], 'count': 0})
        
        queryset = queryset.filter(round__type__in=allowed_types)
    
    # فیلتر دانشکده (بر اساس دسترسی)
    faculty_id = request.GET.get('faculty_id')
    if faculty_id:
        # بررسی دسترسی به دانشکده
        if not admin_permission.has_full_access:
            allowed_faculties = admin_permission.faculties.all()
            if allowed_faculties.exists():
                if not allowed_faculties.filter(id=faculty_id).exists():
                    return Response(
                        {'error': 'شما به این دانشکده دسترسی ندارید'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        queryset = queryset.filter(
            choices__program__faculty_id=faculty_id
        ).distinct()
    else:
        # اگر دانشکده مشخص نشده، فیلتر بر اساس دسترسی
        if not admin_permission.has_full_access:
            allowed_faculties = admin_permission.faculties.all()
            if allowed_faculties.exists():
                queryset = queryset.filter(
                    choices__program__faculty__in=allowed_faculties
                ).distinct()
    
    # فیلتر گروه آموزشی
    department_id = request.GET.get('department_id')
    if department_id:
        queryset = queryset.filter(
            choices__program__department_id=department_id
        ).distinct()
    
    # فیلتر وضعیت بررسی دانشکده
    faculty_review_completed = request.GET.get('faculty_review_completed')
    if faculty_review_completed == 'true':
        queryset = queryset.filter(faculty_review_completed=True)
    elif faculty_review_completed == 'false':
        queryset = queryset.filter(faculty_review_completed=False)
    
    # جستجو
    search = request.GET.get('search', '').strip()
    if search:
        queryset = queryset.filter(
            Q(applicant__user__national_id__icontains=search) |
            Q(applicant__user__first_name__icontains=search) |
            Q(applicant__user__last_name__icontains=search) |
            Q(tracking_code__icontains=search)
        )
    
    # مرتب‌سازی
    sort_by = request.GET.get('sort_by', '-created_at')
    queryset = queryset.order_by(sort_by)
    
    # Pagination
    paginator = ApplicationPagination()
    page = paginator.paginate_queryset(queryset, request)
    
    if page is not None:
        serializer = AdminApplicationListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    serializer = AdminApplicationListSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_application_detail(request, application_id):
    """
    جزئیات پرونده برای ادمین‌ها (دانشگاه/دانشکده/سوپرادمین)
    """
    user = request.user
    if user.role not in ['UNIVERSITY_ADMIN', 'FACULTY_ADMIN', 'SUPERADMIN', 'ADMIN']:
        return Response(
            {'error': 'شما دسترسی ادمین ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        application = Application.objects.select_related(
            'applicant__user',
            'round',
            'university_reviewed_by',
            'faculty_reviewed_by'
        ).prefetch_related(
            'choices__program__faculty',
            'choices__program__department',
            'education_records',
            'documents',
            # سوابق تحقیقاتی
            'research_articles',
            'patents',
            'festival_awards',
            'conference_articles',
            'books',
            'masters_thesis',
            # سوابق المپیاد و زبان
            'olympiad_records',
            'language_certificates',
            # مصاحبه
            'interview'
        ).get(id=application_id)
    except Application.DoesNotExist:
        return Response(
            {'error': 'پرونده یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )

    if user.role not in ['SUPERADMIN', 'ADMIN']:
        try:
            admin_permission = user.admin_permission
        except AdminPermission.DoesNotExist:
            return Response(
                {'error': 'شما دسترسی ادمین ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not admin_permission.can_review_application(application):
            return Response(
                {'error': 'شما دسترسی به این پرونده ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )

    try:
        serializer = AdminApplicationDetailSerializer(application, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        import traceback, os
        tb = traceback.format_exc()
        log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'admin_error.log')
        try:
            with open(log_path, 'a') as f:
                f.write(f"\n--- {timezone.now().isoformat()} ---\n")
                f.write(tb)
        except Exception:
            pass
        return Response(
            {'error': 'خطا در نمایش جزئیات پرونده', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsUniversityAdmin])
def ma_program_admissions(request):
    """
    نمایش لیست برنامه‌های کارشناسی ارشد و متقاضیان پذیرفته اولیه بر اساس ظرفیت

    Query params:
    - round_id (اختیاری): شناسه فراخوان. اگر ارسال نشود، از فراخوان فعال MA_TALENT استفاده می‌کند.
    """
    try:
        # انتخاب فراخوان
        round_id = request.GET.get('round_id')
        if round_id:
            try:
                round_obj = AdmissionRound.objects.get(id=round_id)
            except AdmissionRound.DoesNotExist:
                return Response({'error': 'فراخوان یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        else:
            round_obj = AdmissionRound.objects.filter(type='MA_TALENT', is_active=True).order_by('-year').first()
            if not round_obj:
                return Response({'programs': []})

        programs = Program.objects.filter(round=round_obj, degree_level=Program.DEGREE_MA, is_active=True).select_related('faculty','department')

        result = []
        for program in programs:
            # جمع آوری انتخاب‌های مرتبط
            choices_qs = ApplicationChoice.objects.select_related('application__applicant__user', 'application__education_scoring').filter(
                program=program,
                application__status__in=[
                    Application.Status.NEW,
                    Application.Status.SUBMITTED,
                    Application.Status.UNDER_UNIVERSITY_REVIEW,
                    Application.Status.APPROVED_BY_UNIVERSITY,
                    Application.Status.UNDER_FACULTY_REVIEW,
                    Application.Status.FACULTY_REVIEW_COMPLETED,
                    Application.Status.COMPLETED
                ]
            )

            candidates = []
            for ch in choices_qs:
                app = ch.application
                user = app.applicant.user
                # bsc record
                bsc = app.education_records.filter(degree_level='BSC').first()
                gpa = None
                if bsc and bsc.gpa is not None:
                    gpa = float(bsc.gpa)

                edu_score = None
                if hasattr(app, 'education_scoring'):
                    edu_score = app.education_scoring.total_score

                top_choices = ApplicationChoice.objects.filter(
                    application=app
                ).order_by('priority').select_related('program')[:3]

                serialized_choices = [
                    {
                        'priority': choice.priority,
                        'program_name': choice.program.name,
                        'orientation': choice.program.orientation,
                    } for choice in top_choices
                ]

                candidates.append({
                    'application_id': app.id,
                    'tracking_code': app.tracking_code,
                    'applicant': {
                        'id': app.applicant.id,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'national_id': user.national_id,
                        'email': user.email,
                        'mobile': user.mobile,
                    },
                    'bsc_gpa': gpa,
                    'education_score': edu_score,
                    'total_score': app.total_score,
                    'choice_priority': ch.priority,
                    'choice_id': ch.id,
                    'choice_admission_status': ch.admission_status,
                    'top_three_choices': serialized_choices,
                })

            # sort by total_score desc, then by priority asc
            candidates_sorted = sorted(candidates, key=lambda x: (-(x['total_score'] or 0), x['choice_priority'] or 99))

            capacity = program.capacity or 0
            prelim_accepted = candidates_sorted[:capacity]
            prelim_waiting = candidates_sorted[capacity:]

            result.append({
                'program_id': program.id,
                'program_name': program.name,
                'program_code': program.code,
                'orientation': program.orientation,
                'faculty': {'id': program.faculty.id, 'name': program.faculty.name},
                'department': {'id': program.department.id, 'name': program.department.name},
                'capacity': capacity,
                'prelim_accepted': prelim_accepted,
                'prelim_waiting': prelim_waiting,
                'candidates_count': len(candidates_sorted),
            })

        return Response({'round': {'id': round_obj.id, 'title': round_obj.title}, 'programs': result})

    except Exception as e:
        import traceback, os
        tb = traceback.format_exc()
        log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'admin_error.log')
        try:
            with open(log_path, 'a') as f:
                f.write(f"\n--- {timezone.now().isoformat()} ---\n")
                f.write(tb)
        except Exception:
            pass
        return Response({'error': 'خطا در تولید گزارش پذیرش', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsUniversityAdmin])
def ma_run_admissions(request):
    """
    Run final admissions allocation for MA programs in a round.

    Body (optional): { "round_id": <id> }
    This will mark top N candidates per program as ACCEPTED (both on ApplicationChoice.admission_status
    and Application.admission_overall_status) where N = program.capacity.
    """
    try:
        round_id = request.data.get('round_id')
        if round_id:
            try:
                round_obj = AdmissionRound.objects.get(id=round_id)
            except AdmissionRound.DoesNotExist:
                return Response({'error': 'فراخوان یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        else:
            round_obj = AdmissionRound.objects.filter(type='MA_TALENT', is_active=True).order_by('-year').first()
            if not round_obj:
                return Response({'error': 'فراخوان فعال یافت نشد'}, status=status.HTTP_400_BAD_REQUEST)

        programs = Program.objects.filter(round=round_obj, degree_level=Program.DEGREE_MA, is_active=True)

        updated = {
            'programs_processed': 0,
            'accepted_total': 0,
        }

        with transaction.atomic():
            for program in programs:
                # gather candidates who chose this program
                choices_qs = ApplicationChoice.objects.select_related('application', 'application__education_scoring').filter(
                    program=program,
                        application__status__in=[
                            Application.Status.NEW,
                            Application.Status.SUBMITTED,
                            Application.Status.UNDER_UNIVERSITY_REVIEW,
                            Application.Status.APPROVED_BY_UNIVERSITY,
                            Application.Status.UNDER_FACULTY_REVIEW,
                            Application.Status.FACULTY_REVIEW_COMPLETED,
                            Application.Status.COMPLETED
                        ]
                )

                candidates = []
                for ch in choices_qs:
                    app = ch.application
                    edu_score = None
                    if hasattr(app, 'education_scoring'):
                        edu_score = app.education_scoring.total_score
                    candidates.append((ch, app, edu_score or 0, app.total_score or 0))

                # sort by total_score desc, then education_score desc, then priority asc
                candidates_sorted = sorted(candidates, key=lambda t: (-(t[3] or 0), -(t[2] or 0), t[0].priority))

                capacity = program.capacity or 0
                accepted = candidates_sorted[:capacity]
                # reset statuses for all choices of this program
                choices_qs.update(admission_status='PENDING', admission_priority_result=None)

                # mark accepted
                for idx, (ch, app, edu_s, total_s) in enumerate(accepted, start=1):
                    ch.admission_status = 'ACCEPTED'
                    ch.admission_priority_result = idx
                    ch.save(update_fields=['admission_status', 'admission_priority_result'])
                    # also update application overall
                    app.admission_overall_status = 'ADMITTED'
                    app.admission_result_published_at = timezone.now()
                    app.save(update_fields=['admission_overall_status', 'admission_result_published_at'])
                    updated['accepted_total'] += 1

                # mark remaining as WAITING
                waiting = candidates_sorted[capacity:]
                for ch, app, edu_s, total_s in waiting:
                    ch.admission_status = 'WAITING'
                    ch.admission_priority_result = None
                    ch.save(update_fields=['admission_status', 'admission_priority_result'])

                updated['programs_processed'] += 1

        return Response({'message': 'عملیات پذیرش اجرا شد', 'summary': updated})

    except Exception as e:
        import traceback, os
        tb = traceback.format_exc()
        log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'admin_error.log')
        try:
            with open(log_path, 'a') as f:
                f.write(f"\n--- {timezone.now().isoformat()} ---\n")
                f.write(tb)
        except Exception:
            pass
        return Response({'error': 'خطا در اجرای پذیرش', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsUniversityAdmin])
def ma_accept_choice(request, choice_id):
    """
    Accept a single ApplicationChoice (manual acceptance by admin).

    This will set the specified choice's admission_status to ACCEPTED,
    set the related application's overall status to ADMITTED, and
    mark other choices of the same application as REJECTED.
    """
    try:
        try:
            ch = ApplicationChoice.objects.select_related('application').get(id=choice_id)
        except ApplicationChoice.DoesNotExist:
            return Response({'error': 'choice not found'}, status=status.HTTP_404_NOT_FOUND)

        # permission check: ensure user has access to this program/round
        admin_permission = None
        try:
            admin_permission = request.user.admin_permission
        except AdminPermission.DoesNotExist:
            return Response({'error': 'no admin permission'}, status=status.HTTP_403_FORBIDDEN)

        # Only university admins (or full access) should be allowed
        if not admin_permission.is_university_admin() and not admin_permission.has_full_access:
            return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

        app = ch.application

        # perform update
        ch.admission_status = 'ACCEPTED'
        ch.admission_priority_result = ch.priority
        ch.save(update_fields=['admission_status', 'admission_priority_result'])

        # mark other choices of the same application as rejected
        app.choices.exclude(id=ch.id).update(admission_status='REJECTED', admission_priority_result=None)

        app.admission_overall_status = 'ADMITTED'
        app.admission_result_published_at = timezone.now()
        app.save(update_fields=['admission_overall_status', 'admission_result_published_at'])

        return Response({'message': 'choice accepted'})
    except Exception as e:
        import traceback, os
        tb = traceback.format_exc()
        log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'admin_error.log')
        try:
            with open(log_path, 'a') as f:
                f.write(f"\n--- {timezone.now().isoformat()} ---\n")
                f.write(tb)
        except Exception:
            pass
        return Response({'error': 'خطا در پذیرش انتخابی', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsUniversityAdmin])
def university_review_application(request, application_id):
    """
    بررسی و تایید/رد پرونده توسط مسئول دانشگاه
    
    Body:
    {
        "review_status": "APPROVED" | "APPROVED_WITH_DEFECT" | "REJECTED",
        "comment": "نظر مسئول دانشگاه",
        "defects": ["نقص 1", "نقص 2"] // برای حالت APPROVED_WITH_DEFECT
    }
    """
    try:
        admin_permission = request.user.admin_permission
    except AdminPermission.DoesNotExist:
        return Response(
            {'error': 'شما دسترسی مسئول دانشگاه ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        application = Application.objects.select_related(
            'applicant__user',
            'round'
        ).get(id=application_id)
    except Application.DoesNotExist:
        return Response(
            {'error': 'پرونده یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # بررسی دسترسی به نوع فراخوان
    if not admin_permission.has_access_to_round_type(application.round.type):
        return Response(
            {'error': 'شما به این نوع فراخوان دسترسی ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # بررسی وضعیت پرونده
    if application.status not in [
        Application.Status.SUBMITTED,
        Application.Status.UNDER_UNIVERSITY_REVIEW
    ]:
        return Response(
            {'error': 'این پرونده قابل بررسی نیست'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    review_status = request.data.get('review_status')
    comment = request.data.get('comment', '')
    defects = request.data.get('defects', [])
    
    if review_status not in ['APPROVED', 'APPROVED_WITH_DEFECT', 'REJECTED']:
        return Response(
            {'error': 'وضعیت بررسی نامعتبر است'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # ذخیره نتیجه بررسی
    application.university_review_status = review_status
    application.university_review_comment = comment
    application.university_reviewed_by = request.user
    application.university_reviewed_at = timezone.now()
    
    # تغییر وضعیت پرونده
    if review_status == 'APPROVED':
        application.status = Application.Status.APPROVED_BY_UNIVERSITY
    elif review_status == 'APPROVED_WITH_DEFECT':
        application.status = Application.Status.RETURNED_FOR_CORRECTION
        # ذخیره نواقص
        if defects:
            application.university_review_comment = f"{comment}\n\nنواقص:\n" + "\n".join([f"- {d}" for d in defects])
    elif review_status == 'REJECTED':
        application.status = Application.Status.REJECTED_BY_UNIVERSITY
    
    application.save()
    
    serializer = AdminApplicationDetailSerializer(application, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsUniversityAdmin])
def university_application_detail(request, application_id):
    """
    جزئیات پرونده برای مسئول دانشگاه (نسخه اختصاصی که مسیر frontend را می‌زنند)
    """
    try:
        admin_permission = request.user.admin_permission
    except AdminPermission.DoesNotExist:
        return Response({'error': 'شما دسترسی مسئول دانشگاه ندارید'}, status=status.HTTP_403_FORBIDDEN)

    try:
        application = Application.objects.select_related(
            'applicant__user',
            'round',
            'university_reviewed_by',
            'faculty_reviewed_by'
        ).prefetch_related(
            'choices__program__faculty',
            'choices__program__department',
            'education_records',
            'documents',
            'research_articles',
            'patents',
            'festival_awards',
            'conference_articles',
            'books',
            'masters_thesis',
            'olympiad_records',
            'language_certificates',
            'interview'
        ).get(id=application_id)
    except Application.DoesNotExist:
        return Response({'error': 'پرونده یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    # بررسی دسترسی به نوع فراخوان
    if not admin_permission.can_review_application(application):
        return Response({'error': 'شما دسترسی به این پرونده ندارید'}, status=status.HTTP_403_FORBIDDEN)

    try:
        serializer = AdminApplicationDetailSerializer(application, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        import traceback, os
        tb = traceback.format_exc()
        log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'admin_error.log')
        try:
            with open(log_path, 'a') as f:
                f.write(f"\n--- {timezone.now().isoformat()} (university_application_detail) ---\n")
                f.write(tb)
        except Exception:
            pass
        return Response({'error': 'خطا در نمایش جزئیات پرونده', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsFacultyAdmin])
def faculty_review_application(request, application_id):
    """
    بررسی و تصمیم‌گیری نهایی توسط مسئول دانشکده
    
    Body:
    {
        "decision": "APPROVED" | "REJECTED",
        "comment": "نظر مسئول دانشکده",
        "manual_scores": {  // فقط برای دکتری
            "research_score": 10,
            "publication_score": 15
        }
    }
    """
    try:
        admin_permission = request.user.admin_permission
    except AdminPermission.DoesNotExist:
        return Response(
            {'error': 'شما دسترسی مسئول دانشکده ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        application = Application.objects.select_related(
            'applicant__user',
            'round'
        ).get(id=application_id)
    except Application.DoesNotExist:
        return Response(
            {'error': 'پرونده یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # بررسی دسترسی به نوع فراخوان
    if not admin_permission.has_access_to_round_type(application.round.type):
        return Response(
            {'error': 'شما به این نوع فراخوان دسترسی ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # بررسی دسترسی به دانشکده
    application_faculties = application.choices.values_list(
        'program__faculty_id', flat=True
    )
    if not admin_permission.has_full_access:
        allowed_faculties = admin_permission.faculties.values_list('id', flat=True)
        if allowed_faculties and not any(f in allowed_faculties for f in application_faculties):
            return Response(
                {'error': 'شما به این دانشکده دسترسی ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    # بررسی وضعیت پرونده
    if application.status not in [
        Application.Status.APPROVED_BY_UNIVERSITY,
        Application.Status.UNDER_FACULTY_REVIEW
    ]:
        return Response(
            {'error': 'این پرونده قابل بررسی توسط مسئول دانشکده نیست'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    decision = request.data.get('decision')
    comment = request.data.get('comment', '')
    manual_scores = request.data.get('manual_scores', {})
    
    if decision not in ['APPROVED', 'REJECTED']:
        return Response(
            {'error': 'تصمیم نامعتبر است'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # ذخیره نتیجه بررسی
    application.faculty_review_completed = True
    application.faculty_review_comment = comment
    application.faculty_reviewed_by = request.user
    application.faculty_reviewed_at = timezone.now()
    
    # اعمال امتیازهای دستی (برای دکتری)
    if manual_scores and application.round.type in ['PHD_TALENT', 'PHD_EXAM']:
        # TODO: ذخیره امتیازهای دستی در مدل مرتبط
        pass
    
    # تعیین نتیجه نهایی پذیرش
    if decision == 'APPROVED':
        application.admission_overall_status = 'ADMITTED'
        # تعیین وضعیت انتخاب‌ها
        accepted_choice = application.choices.filter(
            program__faculty__in=admin_permission.faculties.all()
        ).order_by('priority').first()
        
        if accepted_choice:
            accepted_choice.admission_status = 'ACCEPTED'
            accepted_choice.admission_priority_result = accepted_choice.priority
            accepted_choice.save()
            # بقیه رد می‌شوند
            application.choices.exclude(id=accepted_choice.id).update(admission_status='REJECTED')
    else:
        application.admission_overall_status = 'REJECTED'
        application.choices.update(admission_status='REJECTED')
    
    application.admission_result_published_at = timezone.now()
    
    # تغییر وضعیت پرونده
    application.status = Application.Status.COMPLETED
    application.save()
    
    serializer = AdminApplicationDetailSerializer(application, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsUniversityAdmin])
def get_statistics(request):
    """
    آمار پرونده‌ها برای داشبورد مسئول دانشگاه
    """
    try:
        admin_permission = request.user.admin_permission
    except AdminPermission.DoesNotExist:
        return Response(
            {'error': 'شما دسترسی ادمین ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    round_type = request.GET.get('round_type')
    
    # فیلتر بر اساس دسترسی
    queryset = Application.objects.all()
    
    if round_type:
        if not admin_permission.has_access_to_round_type(round_type):
            return Response({'error': 'شما به این نوع فراخوان دسترسی ندارید'}, status=403)
        queryset = queryset.filter(round__type=round_type)
    
    stats = {
        'total': queryset.count(),
        'submitted': queryset.filter(status=Application.Status.SUBMITTED).count(),
        'under_review': queryset.filter(status=Application.Status.UNDER_UNIVERSITY_REVIEW).count(),
        'approved': queryset.filter(university_review_status=Application.UniversityReviewStatus.APPROVED).count(),
        'returned_for_correction': queryset.filter(status=Application.Status.RETURNED_FOR_CORRECTION).count(),
        'rejected': queryset.filter(university_review_status=Application.UniversityReviewStatus.REJECTED).count(),
        'corrected_and_resubmitted': queryset.filter(
            status=Application.Status.SUBMITTED,
            university_reviewed_at__isnull=False
        ).count(),
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_profile(request):
    """
    دریافت اطلاعات کامل ادمین لاگین شده
    شامل: اطلاعات شخصی، نوع کاربر، دسترسی‌ها، دانشکده‌های مجاز
    """
    user = request.user
    
    # Check if user is admin
    if user.role not in ['UNIVERSITY_ADMIN', 'FACULTY_ADMIN', 'SUPERADMIN', 'ADMIN']:
        return Response(
            {'detail': 'شما دسترسی ادمین ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get admin permissions
    try:
        admin_permission = AdminPermission.objects.select_related('user').prefetch_related('faculties').get(user=user)
    except AdminPermission.DoesNotExist:
        return Response(
            {'detail': 'دسترسی‌های ادمین یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Build response data
    data = {
        'id': user.id,
        'national_id': user.national_id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': user.get_full_name(),
        'email': user.email,
        'mobile': user.mobile,
        'role': user.role,
        'role_display': user.get_role_display(),
        
        # Access levels
        'permissions': {
            'has_full_access': admin_permission.has_full_access,
            'has_ma_talent_access': admin_permission.has_ma_talent_access,
            'has_phd_talent_access': admin_permission.has_phd_talent_access,
            'has_phd_exam_access': admin_permission.has_phd_exam_access,
            'has_olympiad_access': admin_permission.has_olympiad_access,
        },
        
        # Accessible round types
        'accessible_round_types': [],
        
        # Faculties (for faculty admin)
        'faculties': [],
        'has_all_faculties_access': False,
    }
    
    # Determine accessible round types
    if user.role in ['ADMIN', 'SUPERADMIN'] or admin_permission.has_full_access:
        data['accessible_round_types'] = ['MA_TALENT', 'PHD_TALENT', 'PHD_EXAM', 'OLYMPIAD']
    else:
        if admin_permission.has_ma_talent_access:
            data['accessible_round_types'].append('MA_TALENT')
        if admin_permission.has_phd_talent_access:
            data['accessible_round_types'].append('PHD_TALENT')
        if admin_permission.has_phd_exam_access:
            data['accessible_round_types'].append('PHD_EXAM')
        if admin_permission.has_olympiad_access:
            data['accessible_round_types'].append('OLYMPIAD')
    
    # Faculty access (for faculty admin)
    if user.role in ['FACULTY_ADMIN', 'SUPERADMIN', 'ADMIN']:
        faculties_qs = admin_permission.faculties.all()
        if faculties_qs.exists():
            data['faculties'] = [
                {
                    'id': f.id,
                    'name': f.name,
                    'code': f.code,
                }
                for f in faculties_qs
            ]
            data['has_all_faculties_access'] = False
        else:
            # Empty = access to all faculties
            data['has_all_faculties_access'] = True
            all_faculties = Faculty.objects.filter(is_active=True)
            data['faculties'] = [
                {
                    'id': f.id,
                    'name': f.name,
                    'code': f.code,
                }
                for f in all_faculties
            ]
    elif user.role in ['ADMIN']:
        # System admins: full faculties access
        data['has_all_faculties_access'] = True
        all_faculties = Faculty.objects.filter(is_active=True)
        data['faculties'] = [
            {
                'id': f.id,
                'name': f.name,
                'code': f.code,
            }
            for f in all_faculties
        ]
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_announcements(request):
    """
    دریافت اطلاعیه‌های مخصوص ادمین‌های لاگین شده
    فیلتر شده براساس نقش و دسترسی‌های کاربر
    """
    from apps.content.models import AdminAnnouncement
    from django.utils import timezone
    
    user = request.user
    
    # Check if user is admin
    if user.role not in ['UNIVERSITY_ADMIN', 'FACULTY_ADMIN', 'SUPERADMIN']:
        return Response(
            {'detail': 'شما دسترسی ادمین ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        admin_permission = AdminPermission.objects.get(user=user)
    except AdminPermission.DoesNotExist:
        return Response({'announcements': []})
    
    # Base queryset - active and not expired
    queryset = AdminAnnouncement.objects.filter(
        is_active=True
    ).filter(
        Q(expires_at__isnull=True) | Q(expires_at__gte=timezone.now())
    )
    
    # Filter by role
    if user.role == 'UNIVERSITY_ADMIN':
        queryset = queryset.filter(for_university_admins=True)
    elif user.role == 'FACULTY_ADMIN':
        queryset = queryset.filter(for_faculty_admins=True)
    
    # Filter by accessible round types
    if not admin_permission.has_full_access:
        round_type_filter = Q()
        if admin_permission.has_ma_talent_access:
            round_type_filter |= Q(for_ma_talent=True)
        if admin_permission.has_phd_talent_access:
            round_type_filter |= Q(for_phd_talent=True)
        if admin_permission.has_phd_exam_access:
            round_type_filter |= Q(for_phd_exam=True)
        if admin_permission.has_olympiad_access:
            round_type_filter |= Q(for_olympiad=True)
        
        if round_type_filter:
            queryset = queryset.filter(round_type_filter)
        else:
            queryset = queryset.none()
    
    # Prepare response
    announcements = []
    for announcement in queryset[:10]:  # Limit to 10 latest
        announcements.append({
            'id': announcement.id,
            'title': announcement.title,
            'content': announcement.content,
            'priority': announcement.priority,
            'priority_display': announcement.get_priority_display(),
            'is_important': announcement.priority in ['HIGH', 'URGENT'],
            'created_at': announcement.created_at.isoformat(),
        })
    
    return Response({'announcements': announcements})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsUniversityAdmin])
def manage_document_review(request, application_id):
    """
    مدیریت بررسی مدارک توسط مسئول دانشگاه
    
    GET: دریافت لیست بررسی‌های مدارک یک درخواست
    POST: ایجاد یا به‌روزرسانی بررسی مدارک
    """
    try:
        application = Application.objects.select_related(
            'applicant__user',
            'round'
        ).get(id=application_id)
    except Application.DoesNotExist:
        return Response(
            {'error': 'درخواست یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # بررسی دسترسی
    admin_permission = request.user.admin_permission
    if not admin_permission.can_review_application(application):
        return Response(
            {'error': 'شما دسترسی بررسی این درخواست را ندارید'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        # دریافت لیست بررسی‌های موجود
        reviews = FormReview.objects.filter(
            application=application
        ).select_related('reviewer').order_by('document_type')
        
        serializer = FormReviewSerializer(reviews, many=True)
        return Response({
            'application_id': application.id,
            'tracking_code': application.tracking_code,
            'reviews': serializer.data
        })
    
    elif request.method == 'POST':
        # ایجاد یا به‌روزرسانی بررسی
        document_type = request.data.get('document_type')
        
        if not document_type:
            return Response(
                {'error': 'نوع مدارک (document_type) الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # بررسی اگر قبلاً بررسی شده
            review = FormReview.objects.get(
                application=application,
                document_type=document_type
            )
            serializer = FormReviewCreateUpdateSerializer(
                review,
                data=request.data,
                context={'request': request, 'application': application},
                partial=True
            )
        except FormReview.DoesNotExist:
            # ایجاد بررسی جدید
            serializer = FormReviewCreateUpdateSerializer(
                data=request.data,
                context={'request': request, 'application': application}
            )
        
        if serializer.is_valid():
            review = serializer.save()
            
            # ثبت لاگ در workflow
            from apps.workflow.models import ApplicationWorkflowLog
            ApplicationWorkflowLog.objects.create(
                application=application,
                step_type='DOCUMENT_REVIEW',
                description=f"بررسی مدارک {review.get_document_type_display()}: {review.get_status_display()}",
                created_by=request.user
            )
            
            return Response(
                FormReviewSerializer(review).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_application_document_reviews(request, application_id):
    """
    دریافت وضعیت بررسی مدارک یک درخواست (برای داوطلب یا ادمین)
    """
    try:
        application = Application.objects.get(id=application_id)
    except Application.DoesNotExist:
        return Response(
            {'error': 'درخواست یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # بررسی دسترسی
    user = request.user
    if user.role == 'APPLICANT':
        # داوطلب فقط به پرونده خودش دسترسی دارد
        if application.applicant.user != user:
            return Response(
                {'error': 'شما دسترسی به این درخواست ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )
    elif user.role in ['UNIVERSITY_ADMIN', 'FACULTY_ADMIN', 'SUPERADMIN']:
        # ادمین‌ها باید دسترسی لازم داشته باشند
        try:
            admin_permission = user.admin_permission
            if not admin_permission.can_review_application(application):
                return Response(
                    {'error': 'شما دسترسی به این درخواست ندارید'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except AdminPermission.DoesNotExist:
            return Response(
                {'error': 'شما دسترسی ادمین ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    # دریافت بررسی‌ها
    reviews = FormReview.objects.filter(
        application=application
    ).select_related('reviewer').order_by('document_type')
    
    serializer = FormReviewSerializer(reviews, many=True)
    
    return Response({
        'application_id': application.id,
        'tracking_code': application.tracking_code,
        'reviews': serializer.data,
        'overall_status': _get_overall_document_status(reviews)
    })


def _get_overall_document_status(reviews):
    """محاسبه وضعیت کلی بررسی مدارک"""
    if not reviews.exists():
        return {
            'status': 'PENDING',
            'status_display': 'در انتظار بررسی',
            'description': 'هنوز بررسی نشده'
        }
    
    # اگر همه تایید شده
    all_approved = all(r.status == 'APPROVED' for r in reviews)
    if all_approved:
        return {
            'status': 'APPROVED',
            'status_display': 'تایید شده',
            'description': 'تمام مدارک تایید شده'
        }
    
    # اگر حداقل یکی رد شده
    any_rejected = any(r.status == 'REJECTED' for r in reviews)
    if any_rejected:
        return {
            'status': 'REJECTED',
            'status_display': 'رد شده',
            'description': 'برخی مدارک رد شده'
        }
    
    # اگر برخی با نقص تایید شده
    any_defect = any(r.status == 'APPROVED_WITH_DEFECT' for r in reviews)
    if any_defect:
        return {
            'status': 'APPROVED_WITH_DEFECT',
            'status_display': 'تایید شده با نقص',
            'description': 'برخی مدارک با نقص تایید شده'
        }
    
    return {
        'status': 'PENDING',
        'status_display': 'در انتظار بررسی',
        'description': 'در حال بررسی'
    }
