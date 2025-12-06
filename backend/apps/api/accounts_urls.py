"""
Accounts API URLs
"""
from django.urls import path, include
from rest_framework.routers import SimpleRouter
from apps.api.accounts_views import (
    AdminPermissionViewSet,
    UserViewSet,
    ApplicantProfileViewSet,
    current_user_profile
)

router = SimpleRouter()
router.register(r'permissions', AdminPermissionViewSet, basename='admin-permission')
router.register(r'users', UserViewSet, basename='user')
router.register(r'profiles', ApplicantProfileViewSet, basename='applicant-profile')

urlpatterns = [
    path('profile/', current_user_profile, name='current-user-profile'),
] + router.urls
