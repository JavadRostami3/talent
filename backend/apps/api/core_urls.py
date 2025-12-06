"""
URL routing for core (Faculty, Department, Universities)
"""
from django.urls import path, include
from rest_framework.routers import SimpleRouter
from apps.api.core_views import FacultyViewSet, DepartmentViewSet
from apps.api import universities_views

router = SimpleRouter()
router.register(r'faculties', FacultyViewSet, basename='faculty')
router.register(r'departments', DepartmentViewSet, basename='department')

urlpatterns = [
    path('', include(router.urls)),
    
    # Universities management
    path('universities/', universities_views.universities_list, name='universities-list'),
    path('universities/<int:pk>/', universities_views.university_detail, name='university-detail'),
    
    # University weights management
    path('university-weights/', universities_views.university_weights_list, name='university-weights-list'),
    path('university-weights/<int:pk>/', universities_views.university_weight_detail, name='university-weight-detail'),
    path('university-weights/bulk-update/', universities_views.bulk_update_weights, name='university-weights-bulk-update'),
]
