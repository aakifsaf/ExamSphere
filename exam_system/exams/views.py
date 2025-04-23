from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from .serializers import *
from .models import *
from .permissions import *
from rest_framework.generics import RetrieveAPIView, ListAPIView, CreateAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import csv
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import logging
from rest_framework.parsers import MultiPartParser
import cv2
import numpy as np
import subprocess
import tempfile
import os
import platform

logger = logging.getLogger(__name__)

# Create your views here.

class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = RegistrationSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Exam.objects.all()
        # For students, only show unsubmitted exams
        submitted_exam_ids = Submission.objects.filter(user=self.request.user).values_list('exam_id', flat=True)
        return Exam.objects.exclude(id__in=submitted_exam_ids).prefetch_related('question_set')

    def get_object(self):
        # Get the object from the base class
        obj = super().get_object()
        # If user is staff, return the object
        if self.request.user.is_staff:
            return obj
        # For students, check if they have submitted this exam
        if Submission.objects.filter(exam=obj, user=self.request.user).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You have already submitted this exam.")
        return obj

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response(
                {"detail": "Only staff users can create exams."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        # If the request method is DELETE, return all questions to ensure deletion works
        if self.request.method == 'DELETE':
            return Question.objects.all()

        # Otherwise, filter by exam_id if provided
        exam_id = self.request.query_params.get('exam', None)
        if exam_id:
            return Question.objects.filter(exam_id=exam_id)
        return Question.objects.none()

    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response(
                {"detail": "Only staff users can create questions."},
                status=status.HTTP_403_FORBIDDEN
            )
        exam_id = request.query_params.get('exam', None)
        if not exam_id:
            return Response(
                {"detail": "Exam ID is required to create a question."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            exam = Exam.objects.get(id=exam_id)
        except Exam.DoesNotExist:
            return Response(
                {"detail": "Exam not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(exam=exam)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Submission.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            # Check if the exam exists
            exam_id = request.data.get('exam')
            if not exam_id:
                return Response(
                    {"detail": "Exam ID is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                exam = Exam.objects.get(id=exam_id)
            except Exam.DoesNotExist:
                return Response(
                    {"detail": "Exam not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check if the user has already submitted this exam
            if Submission.objects.filter(exam=exam, user=request.user).exists():
                return Response(
                    {"detail": "You have already submitted this exam."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create the submission
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)

            # Evaluate coding questions if the exam type is CODING
            if exam.exam_type == 'CODING':
                self.evaluate_coding_exam(exam, serializer.instance)

            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def evaluate_coding_exam(self, exam, submission):
        questions = Question.objects.filter(exam=exam)
        results = []
        total_test_cases = 0
        passed_test_cases = 0

        for question in questions:
            test_cases = question.test_cases
            correct_outputs = question.correct_output

            for test_case, expected_output in zip(test_cases, correct_outputs):
                try:
                    process = subprocess.run(
                        ['python', '-c', submission.code],
                        input=test_case.encode(),
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        timeout=5
                    )

                    # Compare the output with the expected output
                    if process.stdout.strip() == expected_output.strip():
                        passed_test_cases += 1
                        results.append({"test_case": test_case, "status": "Passed"})
                    else:
                        results.append({"test_case": test_case, "status": "Failed", "output": process.stdout, "expected": expected_output})

                except subprocess.TimeoutExpired:
                    results.append({"test_case": test_case, "status": "Timeout"})
                except Exception as e:
                    results.append({"test_case": test_case, "status": "Error", "error": str(e)})

                total_test_cases += 1

        # Calculate the score
        score = (passed_test_cases / total_test_cases) * 100 if total_test_cases > 0 else 0
        submission.score = score
        submission.correct_answers = passed_test_cases
        submission.percentage = score
        submission.save()

class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get user's profile
            user_serializer = UserSerializer(request.user)
            
            # Get user's submissions with exam details
            try:
                submissions = Submission.objects.filter(user=request.user).select_related('exam')
                submission_serializer = SubmissionSerializer(submissions, many=True)
                submission_data = submission_serializer.data
            except Exception as e:
                print(f"Error serializing submissions: {str(e)}")
                submission_data = []
            
            # Get available exams (exams not yet taken by the user)
            try:
                submitted_exam_ids = Submission.objects.filter(user=request.user).values_list('exam_id', flat=True)
                available_exams = Exam.objects.exclude(id__in=submitted_exam_ids).prefetch_related('question_set')
                
                # Create a context with the request for the serializer
                context = {'request': request}
                
                # Serialize the exams with the context
                exam_serializer = ExamSerializer(available_exams, many=True, context=context)
                exam_data = exam_serializer.data
            except Exception as e:
                print(f"Error serializing available exams: {str(e)}")
                exam_data = []
            
            return Response({
                'profile': user_serializer.data,
                'exam_history': submission_data,
                'available_exams': exam_data
            })
        except Exception as e:
            import traceback
            print("Error in StudentDashboardView:", str(e))
            print(traceback.format_exc())
            return Response(
                {
                    "detail": "An error occurred while fetching dashboard data",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        try:
            user = request.user
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        try:
            user = request.user
            current_password = request.data.get('current_password')
            new_password = request.data.get('new_password')
            confirm_password = request.data.get('confirm_password')

            if not user.check_password(current_password):
                return Response(
                    {"detail": "Current password is incorrect"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if new_password != confirm_password:
                return Response(
                    {"detail": "New passwords do not match"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(new_password)
            user.save()
            return Response({"detail": "Password updated successfully"})
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class UploadExamsCsvView(APIView):
    def post(self, request):
        if request.FILES.get('file'):
            csv_file = request.FILES['file']
            try:
                # ✅ Decode and split to handle UTF-8 with BOM
                decoded_file = csv_file.read().decode('utf-8-sig')
                lines = decoded_file.splitlines()
                reader = csv.DictReader(lines)

                logger.info(f"CSV Headers: {reader.fieldnames}")

                for row in reader:
                    try:
                        exam_title = row.get('Exam Title', '').strip()
                        duration = row.get('Duration', '').strip()
                        question_text = row.get('Question Text', '').strip()

                        # Basic validation
                        if not (exam_title and duration and question_text):
                            logger.warning(f"Incomplete row skipped: {row}")
                            continue

                        # Get or create the exam
                        exam, created = Exam.objects.get_or_create(
                            title=exam_title,
                            defaults={'duration': duration}
                        )
                        logger.info(f"{'Created' if created else 'Retrieved'} exam: {exam.title}")

                        # Create the question
                        Question.objects.create(
                            exam=exam,
                            text=question_text,
                            option_a=row.get('Option A', '').strip(),
                            option_b=row.get('Option B', '').strip(),
                            option_c=row.get('Option C', '').strip(),
                            option_d=row.get('Option D', '').strip(),
                            correct_answer=row.get('Correct Answer', '').strip()
                        )
                        logger.info(f"Question added to exam: {exam.title}")

                    except Exception as e:
                        logger.error(f"Error with row {row}: {e}")

                return JsonResponse({'message': 'Exams and questions uploaded successfully.'}, status=201)

            except Exception as e:
                logger.error(f"Error processing CSV: {e}")
                return JsonResponse({'error': str(e)}, status=400)

        logger.warning("No file provided.")
        return JsonResponse({'error': 'No file provided.'}, status=400)

class ExecuteCodeView(APIView):
    """
    API endpoint to execute code in Python, Java, or C securely using subprocess.
    """
    def post(self, request):
        code = request.data.get('code')
        language = request.data.get('language')
        test_cases = request.data.get('test_cases', [])

        if not code or not language:
            return Response({"error": "Code and language are required."}, status=status.HTTP_400_BAD_REQUEST)

        is_windows = platform.system().lower() == "windows"

        # Define file extensions and commands for each language
        language_config = {
            'python': {
                'extension': 'py',
                'command': lambda file_path: ['python', file_path]
            },
            'java': {
                'extension': 'java',
                'command': lambda file_path: [
                    'cmd', '/c', f'javac {file_path} && java -cp {os.path.dirname(file_path)} Solution'
                ] if is_windows else [
                    'sh', '-c', f'javac {file_path} && java -cp {os.path.dirname(file_path)} Solution'
                ]
            },
            'c': {
                'extension': 'c',
                'command': lambda file_path: [
                    'cmd', '/c', f'gcc {file_path} -o {file_path[:-2]}.exe && {file_path[:-2]}.exe'
                ] if is_windows else [
                    'sh', '-c', f'gcc {file_path} -o {file_path[:-2]} && {file_path[:-2]}'
                ]
            }
        }

        if language not in language_config:
            return Response({"error": "Unsupported language."}, status=status.HTTP_400_BAD_REQUEST)

        results = []

        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                base_name = 'Solution' if language == 'java' else 'solution'
                file_name = os.path.join(temp_dir, f'{base_name}.{language_config[language]["extension"]}')

                # Write the code to the file
                with open(file_name, 'w') as code_file:
                    code_file.write(code)

                for test_case in test_cases:
                    try:
                        process = subprocess.run(
                            language_config[language]['command'](file_name),
                            input=test_case,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            text=True,
                            timeout=5,
                            cwd=temp_dir  # isolate execution to temp dir
                        )

                        results.append({
                            "test_case": test_case,
                            "output": process.stdout,
                            "error": process.stderr,
                            "return_code": process.returncode
                        })
                    except subprocess.TimeoutExpired:
                        results.append({
                            "test_case": test_case,
                            "output": "",
                            "error": "Execution timed out.",
                            "return_code": -1
                        })
                    except Exception as e:
                        results.append({
                            "test_case": test_case,
                            "output": "",
                            "error": str(e),
                            "return_code": -1
                        })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"results": results}, status=status.HTTP_200_OK)

