from asteroid.models import Asteroid
from rest_framework import serializers


class BriefAsteroidSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Asteroid
        fields = ["name"]
