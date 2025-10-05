from rest_framework import serializers

from asteroid.models import Asteroid


class BriefAsteroidSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Asteroid
        fields = ["name"]
