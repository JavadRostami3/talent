"""
Authentication URLs
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.api.auth_views import register_initial, login_applicant

urlpatterns = [
    path('register/', register_initial, name='register'),
    path('login/', login_applicant, name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
