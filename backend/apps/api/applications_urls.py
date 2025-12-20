"""
URLs for applicant applications management
"""
from django.urls import path
from . import applications_views
from . import documents_views

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
    path(
        'applications/<int:application_id>/choices/<int:choice_id>/',
        applications_views.application_choice_detail,
        name='application-choice-detail'
    ),
    
    # Education records
    path('applications/<int:application_id>/education/', applications_views.manage_education, name='manage-education'),
    path('applications/<int:application_id>/education-records/', applications_views.manage_education, name='manage-education-records'),
    path(
        'applications/<int:application_id>/education/<int:record_id>/',
        applications_views.education_record_detail,
        name='education-record-detail'
    ),

    # Applicant documents
    path('applications/<int:application_id>/documents/', documents_views.applicant_documents, name='applicant-documents'),
    path('applications/<int:application_id>/documents/<int:document_id>/', documents_views.applicant_document_delete, name='applicant-document-delete'),
]
