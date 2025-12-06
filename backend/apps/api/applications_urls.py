"""
URLs for applicant applications management
"""
from django.urls import path
from . import applications_views

urlpatterns = [
    # Get current user's applications
    path('applications/', applications_views.my_applications_list, name='my-applications'),
    
    # Get specific application details
    path('applications/<int:application_id>/', applications_views.application_detail, name='application-detail'),
    
    # Update application status/data
    path('applications/<int:application_id>/update/', applications_views.update_application, name='update-application'),
    
    # Submit application for review
    path('applications/<int:application_id>/submit/', applications_views.submit_application, name='submit-application'),
    
    # Application choices (program selection)
    path('applications/<int:application_id>/choices/', applications_views.manage_choices, name='manage-choices'),
    
    # Education records
    path('applications/<int:application_id>/education/', applications_views.manage_education, name='manage-education'),
]
