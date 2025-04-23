from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, StudentAnalyticsView,UploadStudentsCsvView
from . import views

router = DefaultRouter()
router.register(r'students', StudentViewSet, basename='student')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:student_id>/analytics/', StudentAnalyticsView.as_view(), name='student-analytics'),
    path('upload-students-csv/', UploadStudentsCsvView.as_view(), name='upload_students_csv'),
]
