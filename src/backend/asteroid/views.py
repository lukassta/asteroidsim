from asteroid.models import Asteroid
from asteroid.serializers import BriefAsteroidSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import normalize_params


class AsteroidListView(APIView):
    queryset = Asteroid.objects.all()
    serializers = BriefAsteroidSerializer


class SimulationsComputeView(APIView):
    def post(self, request):
        raw_params = request.data["inputs"]
        normalized_params = normalize_params(raw_params)
        simulation_id = compute_simulation_id(normalized_params)


class SimulationsFetchView(APIView):
    def get(self, request, simulation_id):
        pass
