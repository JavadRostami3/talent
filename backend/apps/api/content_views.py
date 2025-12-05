"""
Views for content management (Announcements & Static Pages)
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from apps.content.models import Announcement, StaticPage
from apps.api.content_serializers import (
    AnnouncementListSerializer,
    AnnouncementDetailSerializer,
    AnnouncementCreateUpdateSerializer,
    AnnouncementPublicSerializer,
    StaticPageSerializer
)
from apps.api.permissions import IsAdmin, IsAdminOrReadOnly


class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing announcements
    
    - List: GET /api/announcements/
    - Retrieve: GET /api/announcements/{id}/
    - Create: POST /api/announcements/
    - Update: PUT/PATCH /api/announcements/{id}/
    - Delete: DELETE /api/announcements/{id}/
    - Publish: POST /api/announcements/{id}/publish/
    - Unpublish: POST /api/announcements/{id}/unpublish/
    """
    queryset = Announcement.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_published']
    search_fields = ['title', 'body', 'code']
    ordering_fields = ['priority', 'published_at', 'created_at', 'views_count']
    ordering = ['-priority', '-published_at']
    
    def get_serializer_class(self):
        """انتخاب Serializer بر اساس action"""
        if self.action == 'list':
            return AnnouncementListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return AnnouncementCreateUpdateSerializer
        elif self.action == 'retrieve':
            return AnnouncementDetailSerializer
        return AnnouncementDetailSerializer
    
    def get_queryset(self):
        """فیلتر queryset بر اساس نقش کاربر"""
        queryset = super().get_queryset()
        
        # اگر کاربر Admin نیست، فقط اطلاعیه‌های منتشر شده را نشان بده
        if not self.request.user.is_authenticated or self.request.user.role not in ['ADMIN', 'SUPERADMIN']:
            queryset = queryset.filter(is_published=True, published_at__lte=timezone.now())
        
        return queryset
    
    def perform_create(self, serializer):
        """ثبت نویسنده هنگام ایجاد"""
        serializer.save(author=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        """نمایش جزئیات و افزایش شمارنده بازدید"""
        instance = self.get_object()
        
        # افزایش تعداد بازدید
        instance.increment_views()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def publish(self, request, pk=None):
        """انتشار اطلاعیه"""
        announcement = self.get_object()
        announcement.is_published = True
        if not announcement.published_at:
            announcement.published_at = timezone.now()
        announcement.save()
        
        serializer = self.get_serializer(announcement)
        return Response({
            'message': 'اطلاعیه با موفقیت منتشر شد',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def unpublish(self, request, pk=None):
        """لغو انتشار اطلاعیه"""
        announcement = self.get_object()
        announcement.is_published = False
        announcement.save()
        
        serializer = self.get_serializer(announcement)
        return Response({
            'message': 'انتشار اطلاعیه لغو شد',
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """لیست اطلاعیه‌های عمومی منتشر شده"""
        queryset = self.get_queryset().filter(
            is_published=True,
            published_at__lte=timezone.now()
        )
        
        # فیلتر بر اساس category
        category = request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = AnnouncementPublicSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = AnnouncementPublicSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def latest(self, request):
        """آخرین اطلاعیه‌های منتشر شده"""
        limit = int(request.query_params.get('limit', 5))
        category = request.query_params.get('category', None)
        
        queryset = self.get_queryset().filter(
            is_published=True,
            published_at__lte=timezone.now()
        )
        
        if category:
            queryset = queryset.filter(category=category)
        
        queryset = queryset[:limit]
        serializer = AnnouncementPublicSerializer(queryset, many=True)
        
        return Response(serializer.data)


class StaticPageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing static pages
    """
    queryset = StaticPage.objects.all()
    serializer_class = StaticPageSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_published']
    search_fields = ['title', 'body', 'slug']
    lookup_field = 'slug'
    
    def get_queryset(self):
        """فیلتر queryset بر اساس نقش کاربر"""
        queryset = super().get_queryset()
        
        # اگر کاربر Admin نیست، فقط صفحات منتشر شده را نشان بده
        if not self.request.user.is_authenticated or self.request.user.role not in ['ADMIN', 'SUPERADMIN']:
            queryset = queryset.filter(is_published=True)
        
        return queryset
