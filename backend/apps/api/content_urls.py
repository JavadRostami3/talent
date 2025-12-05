"""
URL routing for content API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.api.content_views import AnnouncementViewSet, StaticPageViewSet

router = DefaultRouter()
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'pages', StaticPageViewSet, basename='staticpage')

urlpatterns = [
    path('', include(router.urls)),
]
