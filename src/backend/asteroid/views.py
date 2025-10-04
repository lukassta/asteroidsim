from asteroid.models import Asteroid
from asteroid.serializers import BriefAsteroidSerializer
from rest_framework.views import APIView
from rest_framework.response import Response


class AsteroidListView(APIView):
    queryset = Asteroid.objects.all()
    serializers = BriefAsteroidSerializer

class AsteroidsListView(APIView):
    def get(self, request, application_id):
        return 

        return Response({"data": request.data}, status=status.HTTP_400_BAD_REQUEST)
