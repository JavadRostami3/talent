"""
Program API Views - برای انتخاب رشته توسط متقاضیان
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Q
from apps.admissions.models import Program, AdmissionRound
from apps.api.admissions_serializers import ProgramListSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def available_programs(request):
    """
    لیست رشته‌های فعال و قابل انتخاب
    
    Query Parameters:
    - round_type: نوع فراخوان (MA_TALENT, PHD_TALENT, PHD_EXAM, OLYMPIAD)
    - degree_level: مقطع (MA, PHD)
    - faculty_id: شناسه دانشکده
    - department_id: شناسه گروه آموزشی
    - search: جستجو در نام رشته
    """
    # فیلتر پایه: فقط رشته‌های فعال
    queryset = Program.objects.filter(
        is_active=True,
        round__is_active=True
    ).select_related('faculty', 'department', 'round')
    
    # فیلتر بر اساس نوع فراخوان
    round_type = request.query_params.get('round_type')
    if round_type:
        queryset = queryset.filter(round__type=round_type)
    
    # فیلتر بر اساس مقطع
    degree_level = request.query_params.get('degree_level')
    if degree_level:
        queryset = queryset.filter(degree_level=degree_level)
    
    # فیلتر بر اساس دانشکده
    faculty_id = request.query_params.get('faculty_id')
    if faculty_id:
        queryset = queryset.filter(faculty_id=faculty_id)
    
    # فیلتر بر اساس گروه آموزشی
    department_id = request.query_params.get('department_id')
    if department_id:
        queryset = queryset.filter(department_id=department_id)
    
    # جستجو در نام رشته
    search = request.query_params.get('search')
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search) |
            Q(orientation__icontains=search) |
            Q(code__icontains=search)
        )
    
    # مرتب‌سازی
    queryset = queryset.order_by('faculty__name', 'department__name', 'name')
    
    serializer = ProgramListSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def program_detail(request, pk):
    """
    جزئیات یک رشته
    """
    try:
        program = Program.objects.select_related(
            'faculty', 'department', 'round'
        ).get(pk=pk, is_active=True)
        serializer = ProgramListSerializer(program)
        return Response(serializer.data)
    except Program.DoesNotExist:
        return Response(
            {'error': 'رشته یافت نشد'},
            status=404
        )
