"""
ViewSets for accounts app
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from apps.accounts.models import User, ApplicantProfile, AdminPermission
from apps.api.accounts_serializers import (
    UserSerializer,
    ApplicantProfileSerializer,
    AdminPermissionSerializer,
    AdminPermissionCreateUpdateSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_profile(request):
    """
    دریافت اطلاعات پروفایل کاربر فعلی
    """
    user = request.user
    
    # اطلاعات پایه کاربر
    profile_data = {
        'id': user.id,
        'national_id': user.national_id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': user.get_full_name(),
        'email': user.email,
        'mobile': user.mobile,
        'role': user.role,
    }
    
    return Response(profile_data)


class AdminPermissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet برای مدیریت دسترسی‌های ادمین‌ها
    فقط سوپرادمین‌ها می‌توانند دسترسی‌ها را مدیریت کنند
    """
    queryset = AdminPermission.objects.select_related('user').prefetch_related('faculties', 'departments')
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['has_full_access', 'has_ma_talent_access', 'has_phd_talent_access', 'has_phd_exam_access', 'has_olympiad_access']
    search_fields = ['user__first_name', 'user__last_name', 'user__national_id']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """انتخاب Serializer بر اساس action"""
        if self.action in ['create', 'update', 'partial_update']:
            return AdminPermissionCreateUpdateSerializer
        return AdminPermissionSerializer
    
    def get_queryset(self):
        """فقط سوپرادمین می‌تواند همه دسترسی‌ها را ببیند"""
        if self.request.user.role == 'SUPERADMIN':
            return self.queryset
        # ادمین‌های عادی فقط دسترسی خودشان را می‌بینند
        return self.queryset.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """ایجاد دسترسی جدید - فقط سوپرادمین"""
        if self.request.user.role != 'SUPERADMIN':
            return Response(
                {'error': 'فقط سوپرادمین می‌تواند دسترسی ایجاد کند'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()
    
    def perform_update(self, serializer):
        """ویرایش دسترسی - فقط سوپرادمین"""
        if self.request.user.role != 'SUPERADMIN':
            return Response(
                {'error': 'فقط سوپرادمین می‌تواند دسترسی را ویرایش کند'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()
    
    def perform_destroy(self, instance):
        """حذف دسترسی - فقط سوپرادمین"""
        if self.request.user.role != 'SUPERADMIN':
            return Response(
                {'error': 'فقط سوپرادمین می‌تواند دسترسی را حذف کند'},
                status=status.HTTP_403_FORBIDDEN
            )
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def my_permissions(self, request):
        """دریافت دسترسی‌های خود کاربر"""
        try:
            permission = AdminPermission.objects.get(user=request.user)
            serializer = AdminPermissionSerializer(permission)
            return Response(serializer.data)
        except AdminPermission.DoesNotExist:
            return Response(
                {'error': 'دسترسی برای این کاربر تعریف نشده است'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def check_faculty_access(self, request, pk=None):
        """بررسی دسترسی به یک دانشکده خاص"""
        permission = self.get_object()
        faculty_id = request.query_params.get('faculty_id')
        
        if not faculty_id:
            return Response({'error': 'faculty_id الزامی است'}, status=status.HTTP_400_BAD_REQUEST)
        
        has_access = permission.has_access_to_faculty(int(faculty_id))
        return Response({'has_access': has_access})
    
    @action(detail=True, methods=['get'])
    def check_department_access(self, request, pk=None):
        """بررسی دسترسی به یک گروه آموزشی خاص"""
        permission = self.get_object()
        department_id = request.query_params.get('department_id')
        
        if not department_id:
            return Response({'error': 'department_id الزامی است'}, status=status.HTTP_400_BAD_REQUEST)
        
        has_access = permission.has_access_to_department(int(department_id))
        return Response({'has_access': has_access})
    
    @action(detail=True, methods=['get'])
    def allowed_faculties(self, request, pk=None):
        """لیست دانشکده‌های مجاز"""
        permission = self.get_object()
        faculties = permission.get_allowed_faculties()
        
        return Response({
            'faculties': [
                {'id': f.id, 'name': f.name, 'code': f.code}
                for f in faculties
            ]
        })
    
    @action(detail=True, methods=['get'])
    def allowed_departments(self, request, pk=None):
        """لیست گروه‌های آموزشی مجاز"""
        permission = self.get_object()
        departments = permission.get_allowed_departments()
        
        return Response({
            'departments': [
                {
                    'id': d.id,
                    'name': d.name,
                    'code': d.code,
                    'faculty': d.faculty.name
                }
                for d in departments
            ]
        })


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet برای مشاهده اطلاعات کاربران
    فقط برای ادمین‌ها
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role']
    search_fields = ['first_name', 'last_name', 'national_id', 'email']
    ordering_fields = ['created_at', 'last_login']
    ordering = ['-created_at']
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """دریافت اطلاعات کاربر جاری"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def admins(self, request):
        """لیست ادمین‌ها - فقط برای سوپرادمین"""
        if request.user.role != 'SUPERADMIN':
            return Response(
                {'error': 'فقط سوپرادمین می‌تواند لیست ادمین‌ها را ببیند'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        admins = User.objects.filter(role__in=['ADMIN', 'SUPERADMIN'])
        serializer = self.get_serializer(admins, many=True)
        return Response(serializer.data)


class ApplicantProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet برای مدیریت پروفایل متقاضیان
    """
    queryset = ApplicantProfile.objects.select_related('user')
    serializer_class = ApplicantProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__national_id']
    
    def get_queryset(self):
        """کاربران عادی فقط پروفایل خود را می‌بینند"""
        if self.request.user.role in ['UNIVERSITY_ADMIN', 'FACULTY_ADMIN', 'SUPERADMIN']:
            return self.queryset
        return self.queryset.filter(user=self.request.user)
