"""
Notifications API URLs - Mock endpoints
"""
from django.urls import path
from apps.api import notifications_views

urlpatterns = [
    path('notifications/', notifications_views.notification_list, name='notification-list'),
    path('notifications/stats/', notifications_views.notification_stats, name='notification-stats'),
    path('notifications/<int:pk>/read/', notifications_views.mark_notification_read, name='notification-mark-read'),
    path('notifications/mark-all-read/', notifications_views.mark_all_read, name='notification-mark-all-read'),
    path('notifications/<int:pk>/', notifications_views.delete_notification, name='notification-delete'),
]
