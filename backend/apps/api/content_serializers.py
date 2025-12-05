"""
Serializers for content app
"""
from rest_framework import serializers
from apps.content.models import Announcement, StaticPage


class AnnouncementListSerializer(serializers.ModelSerializer):
    """Serializer برای لیست اطلاعیه‌ها"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    author_name = serializers.CharField(source='author.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id', 'code', 'title', 'category', 'category_display',
            'priority', 'views_count', 'is_published', 'published_at',
            'author_name', 'created_at'
        ]
        read_only_fields = ['id', 'code', 'views_count', 'created_at']


class AnnouncementDetailSerializer(serializers.ModelSerializer):
    """Serializer برای جزئیات کامل اطلاعیه"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    author_name = serializers.CharField(source='author.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id', 'code', 'title', 'body', 'category', 'category_display',
            'priority', 'attachment', 'is_published', 'published_at',
            'author', 'author_name', 'views_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'code', 'views_count', 'created_at', 'updated_at']


class AnnouncementCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer برای ایجاد و ویرایش اطلاعیه"""
    
    class Meta:
        model = Announcement
        fields = [
            'title', 'body', 'category', 'priority',
            'attachment', 'is_published', 'published_at'
        ]
    
    def validate_title(self, value):
        """اعتبارسنجی عنوان"""
        if len(value) < 10:
            raise serializers.ValidationError("عنوان باید حداقل 10 کاراکتر باشد")
        return value
    
    def validate_body(self, value):
        """اعتبارسنجی متن"""
        if len(value) < 20:
            raise serializers.ValidationError("متن باید حداقل 20 کاراکتر باشد")
        return value


class AnnouncementPublicSerializer(serializers.ModelSerializer):
    """Serializer برای نمایش عمومی اطلاعیه‌ها (بدون اطلاعات مدیریتی)"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id', 'code', 'title', 'body', 'category', 'category_display',
            'attachment', 'published_at', 'views_count'
        ]


class StaticPageSerializer(serializers.ModelSerializer):
    """Serializer for StaticPage model"""
    
    class Meta:
        model = StaticPage
        fields = [
            'id', 'slug', 'title', 'body', 'category',
            'is_published', 'meta_description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
