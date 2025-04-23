from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class Exam(models.Model):
    title = models.CharField(max_length=200, default=None, null=True)
    duration = models.IntegerField(default=None, null=True, help_text="Duration in minutes")
    created_at = models.DateTimeField(auto_now_add=True)
    EXAM_TYPE_CHOICES = [
        ('APTITUDE', 'Aptitude Exam'),
        ('CODING', 'Coding Exam'),
    ]
    exam_type = models.CharField(max_length=10, choices=EXAM_TYPE_CHOICES, default='APTITUDE')

    def __str__(self):
        return self.title

class Question(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, null=True, default=None)
    text = models.TextField()
    option_a = models.CharField(max_length=255, null=True, blank=True)
    option_b = models.CharField(max_length=255, null=True, blank=True)
    option_c = models.CharField(max_length=255, null=True, blank=True)
    option_d = models.CharField(max_length=255, null=True, blank=True)
    correct_answer = models.CharField(
        max_length=1,
        choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')],
        null=True,
        blank=True
    )
    test_cases = models.JSONField(default=list, blank=True, help_text="List of test cases for coding questions")
    correct_output = models.JSONField(default=list, blank=True, help_text="Expected outputs for the test cases")

    def __str__(self):
        return self.exam.title + " - "+ str(self.id)+ " - " + self.text  # Display first 50 characters of the question text
class Submission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, null=True)
    answers = models.JSONField()
    score = models.IntegerField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)
    time_taken = models.IntegerField(default=0, help_text="Time taken in minutes")
    total_questions = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)

    def save(self, *args, **kwargs):
        # Calculate score and percentage when saving
        if self.answers:
            total_questions = len(self.answers)
            correct_answers = 0
            for question_id, answer in self.answers.items():
                try:
                    question = Question.objects.get(id=question_id)
                    if answer == question.correct_answer:
                        correct_answers += 1
                except Question.DoesNotExist:
                    print(f"Question with ID {question_id} not found")
                except Exception as e:
                    print(f"Error processing question {question_id}: {str(e)}")
            
            self.total_questions = total_questions
            self.correct_answers = correct_answers
            self.score = correct_answers
            self.percentage = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.exam.title} - {self.submitted_at}"