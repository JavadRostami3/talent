"""
Document management URLs.
"""
from django.urls import path
from . import documents_views

urlpatterns = [
    path('documents/<int:document_id>/', documents_views.document_delete, name='document-delete'),
]
