from rest_framework import permissions

class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow all authenticated users to read
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        # Only allow staff users to write
        return request.user and request.user.is_staff
    
    def has_object_permission(self, request, view, obj):
        # Allow all authenticated users to read
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        # Only allow staff users to write
        return request.user and request.user.is_staff

class IsStudentOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method == "POST":
            return not request.user.is_staff
        return request.user.is_staff 
