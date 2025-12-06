from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, Prefetch
from django.utils import timezone
from apps.applications.models import Application
from apps.accounts.models import AdminPermission
from apps.core.models import Faculty, Department
from .applications_serializers import ApplicationListSerializer, ApplicationDetailSerializer
from .permissions import IsUniversityAdmin, IsFacultyAdmin


class ApplicationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


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
        'faculty_reviewed_by'
    ).prefetch_related(
        'choices__program__faculty',
        'choices__program__department'
    )
    
    # فیلتر نوع فراخوان بر اساس دسترسی
    round_type = request.GET.get('round_type')
    if round_type:
        if not admin_permission.has_access_to_round_type(round_type):
            return Response(
                {'error': f'شما به فراخوان {round_type} دسترسی ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )
        queryset = queryset.filter(round__round_type=round_type)
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
        
        queryset = queryset.filter(round__round_type__in=allowed_types)
    
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
    
    # فیلتر گروه آموزشی
    department_id = request.GET.get('department_id')
    if department_id:
        queryset = queryset.filter(
            selected_programs__program__department_id=department_id
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
        serializer = ApplicationListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    serializer = ApplicationListSerializer(queryset, many=True)
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
        'faculty_reviewed_by'
    ).prefetch_related(
        'choices__program__faculty',
        'choices__program__department',
        'education_records'
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
        queryset = queryset.filter(round__round_type=round_type)
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
        
        queryset = queryset.filter(round__round_type__in=allowed_types)
    
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
        serializer = ApplicationListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    serializer = ApplicationListSerializer(queryset, many=True)
    return Response(serializer.data)


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
    if not admin_permission.has_access_to_round_type(application.round.round_type):
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
    
    serializer = ApplicationDetailSerializer(application)
    return Response(serializer.data)


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
    if not admin_permission.has_access_to_round_type(application.round.round_type):
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
    if manual_scores and application.round.round_type in ['PHD_TALENT', 'PHD_EXAM']:
        # TODO: ذخیره امتیازهای دستی در مدل مرتبط
        pass
    
    # تغییر وضعیت پرونده
    application.status = Application.Status.FACULTY_REVIEW_COMPLETED
    application.save()
    
    serializer = ApplicationDetailSerializer(application)
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
        queryset = queryset.filter(round__round_type=round_type)
    
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
    if user.role not in ['UNIVERSITY_ADMIN', 'FACULTY_ADMIN', 'SUPERADMIN']:
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
    if admin_permission.has_full_access:
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
    if user.role in ['FACULTY_ADMIN', 'SUPERADMIN']:
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
            # Optionally, fetch all faculties
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

