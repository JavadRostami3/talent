"""
Accounts API URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.api.accounts_views import (
    AdminPermissionViewSet,
    UserViewSet,
    ApplicantProfileViewSet
)

router = DefaultRouter()
router.register(r'permissions', AdminPermissionViewSet, basename='admin-permission')
router.register(r'users', UserViewSet, basename='user')
router.register(r'profiles', ApplicantProfileViewSet, basename='applicant-profile')

urlpatterns = [
    path('', include(router.urls)),
]
