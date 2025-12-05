"""
URL routing for core (Faculty & Department)
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.api.core_views import FacultyViewSet, DepartmentViewSet

router = DefaultRouter()
router.register(r'faculties', FacultyViewSet, basename='faculty')
router.register(r'departments', DepartmentViewSet, basename='department')

urlpatterns = [
    path('', include(router.urls)),
]
