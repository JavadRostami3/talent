"""
Views for Faculty and Department management
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from apps.core.models import Faculty, Department
from apps.api.core_serializers import FacultySerializer, DepartmentSerializer
from apps.api.permissions import IsAdmin


class FacultyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing faculties (دانشکده‌ها)
    
    - List: GET /api/core/faculties/
    - Retrieve: GET /api/core/faculties/{id}/
    - Create: POST /api/core/faculties/
    - Update: PUT/PATCH /api/core/faculties/{id}/
    - Delete: DELETE /api/core/faculties/{id}/
    - Departments: GET /api/core/faculties/{id}/departments/
    """
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        """فقط ادمین‌ها می‌توانند ایجاد/ویرایش/حذف کنند"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['get'])
    def departments(self, request, pk=None):
        """دریافت لیست گروه‌های آموزشی یک دانشکده"""
        faculty = self.get_object()
        departments = faculty.departments.filter(is_active=True)
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """لیست دانشکده‌های فعال"""
        faculties = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(faculties, many=True)
        return Response(serializer.data)


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing departments (گروه‌های آموزشی)
    
    - List: GET /api/core/departments/
    - Retrieve: GET /api/core/departments/{id}/
    - Create: POST /api/core/departments/
    - Update: PUT/PATCH /api/core/departments/{id}/
    - Delete: DELETE /api/core/departments/{id}/
    """
    queryset = Department.objects.select_related('faculty').all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'faculty']
    search_fields = ['name', 'code', 'faculty__name']
    ordering_fields = ['name', 'created_at']
    ordering = ['faculty__name', 'name']
    
    def get_permissions(self):
        """فقط ادمین‌ها می‌توانند ایجاد/ویرایش/حذف کنند"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def by_faculty(self, request):
        """
        دریافت گروه‌های آموزشی بر اساس دانشکده
        Query params: faculty_id
        """
        faculty_id = request.query_params.get('faculty_id')
        
        if not faculty_id:
            return Response(
                {'error': 'faculty_id الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        departments = self.get_queryset().filter(
            faculty_id=faculty_id,
            is_active=True
        )
        
        serializer = self.get_serializer(departments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """لیست گروه‌های آموزشی فعال"""
        departments = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(departments, many=True)
        return Response(serializer.data)
