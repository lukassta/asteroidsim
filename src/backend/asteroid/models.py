from django.db import models


class Asteroid(models.Model):
    name = models.CharField(max_length=255)
