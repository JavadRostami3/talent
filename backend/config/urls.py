"""
URL configuration for Talent Admission System
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# تنظیمات Admin
admin.site.site_header = "پنل مدیریت سامانه ثبت‌نام تحصیلات تکمیلی"
admin.site.site_title = "سامانه ثبت‌نام"
admin.site.index_title = "مدیریت سامانه"

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # API endpoints
    path('api/auth/', include('apps.api.auth_urls')),
    path('api/accounts/', include('apps.api.accounts_urls')),
    path('api/content/', include('apps.api.content_urls')),
    path('api/core/', include('apps.api.core_urls')),
    path('api/', include('apps.api.programs_urls')),  # Programs for selection
    path('api/', include('apps.api.applications_urls')),  # Applicant applications management
    path('api/', include('apps.api.research_urls')),  # Unified Research Records API
    path('api/admin/', include('apps.api.admin_urls')),  # Admin endpoints
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
