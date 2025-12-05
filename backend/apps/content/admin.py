from django.contrib import admin
from .models import Announcement, StaticPage


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = [
        'code',
        'title',
        'category',
        'priority',
        'views_count',
        'is_published',
        'published_at',
        'author',
        'created_at'
    ]
    list_filter = ['category', 'is_published', 'published_at', 'created_at']
    search_fields = ['title', 'body', 'code']
    list_editable = ['priority', 'is_published']
    readonly_fields = ['code', 'views_count', 'created_at', 'updated_at']
    date_hierarchy = 'published_at'
    raw_id_fields = ['author']
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('code', 'title', 'category')
        }),
        ('محتوا', {
            'fields': ('body', 'attachment')
        }),
        ('تنظیمات نمایش', {
            'fields': ('priority', 'is_published', 'published_at')
        }),
        ('اطلاعات تکمیلی', {
            'fields': ('author', 'views_count'),
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # اگر اطلاعیه جدید است
            obj.author = request.user
        super().save_model(request, obj, form, change)


@admin.register(StaticPage)
class StaticPageAdmin(admin.ModelAdmin):
    list_display = [
        'title',
        'slug',
        'category',
        'is_published',
        'created_at'
    ]
    list_filter = ['category', 'is_published']
    search_fields = ['title', 'slug', 'body']
    list_editable = ['is_published']
    prepopulated_fields = {'slug': ('title',)}
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('title', 'slug', 'category')
        }),
        ('محتوا', {
            'fields': ('body',)
        }),
        ('SEO', {
            'fields': ('meta_description',)
        }),
        ('تنظیمات', {
            'fields': ('is_published',)
        }),
    )
