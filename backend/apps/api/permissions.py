"""
Custom permissions for the API
"""
from rest_framework import permissions


class IsApplicant(permissions.BasePermission):
    """
    Permission for applicants only
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'APPLICANT'
        )


class IsAdmin(permissions.BasePermission):
    """
    Permission for admin users only
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'SUPERADMIN']
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission for admin to modify, others can only read
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'SUPERADMIN']
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission for object owner or admin
    """
    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.role in ['ADMIN', 'SUPERADMIN']:
            return True
        # Owner can access their own objects
        return obj.user == request.user or obj == request.user


class IsUniversityAdmin(permissions.BasePermission):
    """
    Permission for University Admin only
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.role in ['SUPERADMIN', 'ADMIN']:
            return True
        
        if request.user.role != 'UNIVERSITY_ADMIN':
            return False
        
        # Check if user has AdminPermission
        try:
            admin_permission = request.user.admin_permission
            return admin_permission.is_university_admin()
        except:
            return False


class IsFacultyAdmin(permissions.BasePermission):
    """
    Permission for Faculty Admin only
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.role == 'SUPERADMIN':
            return True
        
        if request.user.role != 'FACULTY_ADMIN':
            return False
        
        # Check if user has AdminPermission
        try:
            admin_permission = request.user.admin_permission
            return admin_permission.is_faculty_admin()
        except:
            return False

        if request.user.role in ['ADMIN', 'SUPERADMIN']:
            return True
        
        # Applicant can only access their own data
        if hasattr(obj, 'applicant'):
            return obj.applicant.user == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False
