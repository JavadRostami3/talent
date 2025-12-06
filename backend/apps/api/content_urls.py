"""
URL routing for content API
"""
from django.urls import path, include
from rest_framework.routers import SimpleRouter
from apps.api.content_views import AnnouncementViewSet, StaticPageViewSet

router = SimpleRouter()
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'pages', StaticPageViewSet, basename='staticpage')

urlpatterns = router.urls
