from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Exam, Question, Submission

class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'confirm_password')

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser')
        read_only_fields = ('id', 'is_staff', 'is_superuser')

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'  # Ensure test_cases and correct_output are included

    def to_representation(self, instance):
        try:
            data = super().to_representation(instance)
            request = self.context.get('request')
            if request and not request.user.is_staff:
                # Remove correct_answer for non-staff users
                data.pop('correct_answer', None)
            return data
        except Exception as e:
            print(f"Error in QuestionSerializer.to_representation: {str(e)}")
            return {
                'id': instance.id,
                'text': instance.text,
                'option_a': instance.option_a,
                'option_b': instance.option_b,
                'option_c': instance.option_c,
                'option_d': instance.option_d
            }

class ExamSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True, source='question_set')
    has_submitted = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = ['id', 'title', 'duration', 'questions', 'has_submitted', 'exam_type']
        read_only_fields = ['id']

    def get_has_submitted(self, obj):
        try:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                return Submission.objects.filter(exam=obj, user=request.user).exists()
            return False
        except Exception as e:
            print(f"Error in get_has_submitted: {str(e)}")
            return False

    def to_representation(self, instance):
        try:
            data = super().to_representation(instance)
            # Ensure questions are properly serialized
            if 'questions' in data and not isinstance(data['questions'], list):
                data['questions'] = []
            return data
        except Exception as e:
            print(f"Error in ExamSerializer.to_representation: {str(e)}")
            return {
                'id': instance.id,
                'title': instance.title,
                'duration': instance.duration,
                'questions': [],
                'has_submitted': False
            }

class SubmissionSerializer(serializers.ModelSerializer):
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    exam_duration = serializers.IntegerField(source='exam.duration', read_only=True)
    submitted_date = serializers.DateTimeField(source='submitted_at', format='%Y-%m-%d %H:%M', read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id', 'exam', 'exam_title', 'exam_duration', 
            'submitted_date', 'time_taken', 'total_questions',
            'correct_answers', 'score', 'percentage', 'answers',

        ]
        read_only_fields = [
            'id', 'submitted_date', 'time_taken', 'total_questions',
            'correct_answers', 'score', 'percentage'
        ]
