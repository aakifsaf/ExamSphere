from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ExamViewSet, QuestionViewSet, SubmissionViewSet, UserViewSet,
    RegisterView, StudentDashboardView, UpdateProfileView, ChangePasswordView,
    CustomTokenObtainPairView, UploadExamsCsvView, ExecuteCodeView
)
# from .views import ProctoringFrameAnalysisView

router = DefaultRouter()
router.register(r'exams', ExamViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('student/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('profile/update/', UpdateProfileView.as_view(), name='update-profile'),
    path('profile/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('upload-exams-csv/', UploadExamsCsvView.as_view(), name='upload_exams_csv'),
    path('execute-code/', ExecuteCodeView.as_view(), name='execute_code'),

    # path('proctoring/frame-analysis/', ProctoringFrameAnalysisView.as_view(), name='proctoring-frame-analysis'),
]
