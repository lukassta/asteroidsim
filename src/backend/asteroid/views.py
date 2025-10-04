from asteroid.models import Asteroid
from asteroid.serializers import BriefAsteroidSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .calculations import test_calculation


class AsteroidListView(APIView):
    queryset = Asteroid.objects.all()
    serializers = BriefAsteroidSerializer


class SimulationsListView(APIView):
    def get(self, request):
        data = test_calculation("test")

        if False:
            return Response({"data": request.data}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"data": data}, status=status.HTTP_200_OK)


class SimulationDetailsView(APIView):
    def get(self, request, simulation_id):
        data = test_calculation(simulation_id)


        if False:
            return Response({"data": request.data}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"data": data}, status=status.HTTP_200_OK)
