from rest_framework import status
from rest_framework.exceptions import ParseError
from rest_framework.response import Response
from rest_framework.views import APIView

from asteroid.models import Asteroid
from asteroid.serializers import BriefAsteroidSerializer

from .calculations import get_population_in_area
from .constants import KPA_FATALITY_RATE
from .utils import compute_simulation_id, normalize_params


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
        except KeyError:
            raise ParseError(
                detail="Request body must include an 'inputs' object, "
                "e.g. {'inputs': {...simulation parameters...}}"
            )

        normalized_params = normalize_params(raw_params)

        lat = normalized_params.get("lat", 0)
        lon = normalized_params.get("lon", 0)
        velocity = normalized_params.get("entry_velocity_m_s", 0)

        asteroid_mass = calculate_mass(asteroid_volume, asteroid_density)

        impact_energy = calculate_impact_energy(asteroid_mass, velocity)
        crater_diameter_trans = calculate_crater_diameter_transient(impact_energy)
        crater_diameter = diamcalculate_crater_diameter_final(crater_diameter_trans)
        crater_depth = calculate_crater_depth_final(crater_diameter)

        # TODO
        kpa_70_radius = 0
        kpa_50_radius = 0
        kpa_35_radius = 0
        kpa_20_radius = 0
        kpa_10_radius = 0
        kpa_3_radius = 0

        crater_population += get_population_in_area(lat, lon, crater_diameter / 2)
        kpa_70_population = (
            get_population_in_area(lat, lon, kpa_70_radius) - crater_population
        )
        kpa_50_population = (
            get_population_in_area(lat, lon, kpa_50_radius)
            - crater_population
            - kpa_70_population
        )
        kpa_35_population = (
            get_population_in_area(lat, lon, kpa_35_radius)
            - crater_population
            - kpa_70_population
            - kpa_50_population
        )
        kpa_20_population = (
            get_population_in_area(lat, lon, kpa_20_radius)
            - crater_population
            - kpa_70_population
            - kpa_50_population
            - kpa_35_population
        )
        kpa_10_population = (
            get_population_in_area(lat, lon, kpa_10_radius)
            - crater_population
            - kpa_70_population
            - kpa_50_population
            - kpa_35_population
            - kpa_20_population
        )
        kpa_3_population = (
            get_population_in_area(lat, lon, kpa_3_radius)
            - crater_population
            - kpa_70_population
            - kpa_50_population
            - kpa_35_population
            - kpa_20_population
            - kpa_10_population
        )

        crater_casulties = crater_population
        kpa_70_casulties = kpa_70_population * KPA_FATALITY_RATE.get("kpa_70", 0)
        kpa_50_casulties = kpa_50_population * KPA_FATALITY_RATE.get("kpa_50", 0)
        kpa_35_casulties = kpa_35_population * KPA_FATALITY_RATE.get("kpa_35", 0)
        kpa_20_casulties = kpa_20_population * KPA_FATALITY_RATE.get("kpa_20", 0)
        kpa_10_casulties = kpa_10_population * KPA_FATALITY_RATE.get("kpa_10", 0)
        kpa_3_casulties = kpa_3_population * KPA_FATALITY_RATE.get("kpa_3", 0)

        total_casulties = (
            crater_casulties
            + kpa_70_casulties
            + kpa_50_casulties
            + kpa_35_casulties
            + kpa_20_casulties
            + kpa_10_casulties
            + kpa_3_casulties
        )

        return_data = {
            "id": "id",
            "map": {
                "center": {"lat": lat, "lon": lon},
                "crater_transient_diameter_m": crater_diameter_trans,
                "crater_final_diameter_m": crater_diameter,
                "rings": [
                    {"threshold_kpa": 70, "radius_m": kpa_70_radius},
                    {"threshold_kpa": 50, "radius_m": kpa_50_radius},
                    {"threshold_kpa": 35, "radius_m": kpa_35_radius},
                    {"threshold_kpa": 20, "radius_m": kpa_20_radius},
                    {"threshold_kpa": 10, "radius_m": kpa_10_radius},
                    {"threshold_kpa": 3, "radius_m": kpa_3_radius},
                ],
            },
            "panel": {
                "energy_released_megatons": 120.0,
                "crater_final": {
                    "formed": true,
                    "diameter_m": crater_diameter,
                    "depth_m": crater_depth,
                },
                "rings": [
                    {
                        "threshold_kpa": 70,
                        "radius_m": kpa_70_radius,
                        "arrival_time_s": 5.9,
                        "delta_to_next_s": 2.4,
                        "population": kpa_70_radius,
                        "estimated_deaths": kpa_70_casulties,
                        "blurb": "Severe structural damage (reinforced buildings fail).",
                    },
                    {
                        "threshold_kpa": 50,
                        "radius_m": kpa_50_radius,
                        "arrival_time_s": 8.3,
                        "delta_to_next_s": 2.7,
                        "population": kpa_50_radius,
                        "estimated_deaths": kpa_50_casulties,
                        "blurb": "Heavy damage; most buildings uninhabitable.",
                    },
                    {
                        "threshold_kpa": 35,
                        "radius_m": kpa_35_radius,
                        "arrival_time_s": 11.0,
                        "delta_to_next_s": 6.0,
                        "population": kpa_35_radius,
                        "estimated_deaths": kpa_35_casulties,
                        "blurb": "Moderate damage; walls collapse, serious injuries.",
                    },
                    {
                        "threshold_kpa": 20,
                        "radius_m": kpa_20_radius,
                        "arrival_time_s": 17.0,
                        "delta_to_next_s": 9.0,
                        "population": kpa_20_radius,
                        "estimated_deaths": kpa_20_casulties,
                        "blurb": "Light damage; roofs/doors blown in.",
                    },
                    {
                        "threshold_kpa": 10,
                        "radius_m": kpa_10_radius,
                        "arrival_time_s": 26.0,
                        "delta_to_next_s": 28.0,
                        "population": kpa_10_radius,
                        "estimated_deaths": kpa_10_casulties,
                        "blurb": "Minor damage; most windows shatter.",
                    },
                    {
                        "threshold_kpa": 3,
                        "radius_m": kpa_3_radius,
                        "arrival_time_s": 54.0,
                        "delta_to_next_s": None,
                        "population": kpa_3_population,
                        "estimated_deaths": kpa_3_casulties,
                        "blurb": "Pressure wave felt; light glass damage.",
                    },
                ],
                "entry": {
                    "h1_breakup_begin_m": None,
                    "h2_peak_energy_m": None,
                    "h3_airburst_or_surface_m": 0,
                    "terminal_type": "impact",
                },
                "totals": {"total_estimated_deaths": total_casulties},
            },
            "meta": {
                "units": "SI; lat/lon degrees WGS-84",
                "notes": [
                    "Impact case (surface crater formed).",
                    "Arrival times measured from impact time.",
                    "Population and deaths are per annulus between rings.",
                ],
                "version": "1",
            },
        }

        # TODO
        # 1. get impact coordinates lat lon
        # 2. compute rings based on the 5 tresholds
        # 3. compute rings delta_to_next_s and arrival_time
        # 4. compute h1 h2 h3

        return Response({"data": return_data}, status=status.HTTP_200_OK)



class SimulationsFetchView(APIView):
    def get(self, request, simulation_id):
        pass
