from django.urls import path
from . import admin_views

urlpatterns = [
    # Admin Profile
    path('profile/', admin_views.get_admin_profile, name='admin-profile'),
    path('announcements/', admin_views.get_admin_announcements, name='admin-announcements'),
    
    # University Admin endpoints
    path('university/applications/', admin_views.university_admin_applications_list, name='university-applications-list'),
    path('university/applications/<int:application_id>/review/', admin_views.university_review_application, name='university-review-application'),
    path('university/statistics/', admin_views.get_statistics, name='university-statistics'),
    
    # Faculty Admin endpoints
    path('faculty/applications/', admin_views.faculty_admin_applications_list, name='faculty-applications-list'),
    path('faculty/applications/<int:application_id>/review/', admin_views.faculty_review_application, name='faculty-review-application'),
    
    # Document Review endpoints
    path('applications/<int:application_id>/documents/', admin_views.manage_document_review, name='manage-document-review'),
    path('applications/<int:application_id>/documents/status/', admin_views.get_application_document_reviews, name='get-document-reviews'),
]

