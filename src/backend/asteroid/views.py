from asteroid.models import Asteroid
from asteroid.serializers import BriefAsteroidSerializer
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ParseError
from .utils import normalize_params, compute_simulation_id

# are we still doing the character thing to need this? @lukas
class AsteroidListView(APIView):
    queryset = Asteroid.objects.all()
    serializers = BriefAsteroidSerializer


class SimulationsComputeView(APIView):
    def post(self, request):
        """
        Accepts a POST payload containing an 'inputs' object, e.g.:
        {
            "inputs": { ...simulation parameters... }
        }
        """
        try:
            raw_params = request.data["inputs"]
        except(KeyError):
            raise ParseError(
                detail="Request body must include an 'inputs' object, "
                       "e.g. {'inputs': {...simulation parameters...}}"
            )
        normalized_params = normalize_params(raw_params)
        simulation_id = compute_simulation_id(normalized_params)
        # TODO
        # 1. get impact coordinates lat lon
        # 2. compute rings based on the 5 tresholds
        # 3. compute rings delta_to_next_s and arrival_time
        # 4. compute h1 h2 h3

class SimulationsFetchView(APIView):
    def get(self, request, simulation_id):
        pass
