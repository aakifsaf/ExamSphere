# Generated by Django 5.1.7 on 2025-03-30 07:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("exams", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="submission",
            name="score",
            field=models.IntegerField(default=0),
        ),
    ]
