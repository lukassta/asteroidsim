from rest_framework import status
from rest_framework.exceptions import ParseError
from rest_framework.response import Response
from rest_framework.views import APIView

from asteroid.models import Asteroid
from asteroid.serializers import BriefAsteroidSerializer

from .calculations import (calculate_crater_depth_final,
                           calculate_crater_diameter_final,
                           calculate_crater_diameter_transient,
                           calculate_impact_energy, calculate_rings,
                           get_population_in_area,
                           caclulate_asteroid_impact_mass)
from .constants import KPA_FATALITY_RATE
from .physics_helpers import calculate_mass, calculate_volume
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

        asteroid_composition = normalized_params.get("material_type", 0)
        asteroid_density = normalized_params.get("density_kg_m3", 0)
        asteroid_diameter = normalized_params.get("diameter_m", 0)
        lat = normalized_params.get("lat", 0)
        lon = normalized_params.get("lon", 0)
        velocity = normalized_params.get("entry_velocity_m_s", 0)

        asteroid_volume = calculate_volume(asteroid_diameter)
        asteroid_mass = calculate_mass(asteroid_volume, asteroid_density)
        asteroid_mass_on_impact = caclulate_asteroid_impact_mass(asteroid_mass, velocity, 156.41, asteroid_density)

        impact_energy = calculate_impact_energy(asteroid_mass_on_impact, velocity)
        crater_diameter_trans = calculate_crater_diameter_transient(
            impact_energy, asteroid_composition
        )
        crater_diameter = calculate_crater_diameter_final(crater_diameter_trans)
        crater_depth = calculate_crater_depth_final(crater_diameter)

        rings = calculate_rings(impact_energy, asteroid_diameter, asteroid_composition)

        kpa_70_radius = rings.get("kpa_70", 0)
        kpa_50_radius = rings.get("kpa_50", 0)
        kpa_35_radius = rings.get("kpa_35", 0)
        kpa_20_radius = rings.get("kpa_20", 0)
        kpa_10_radius = rings.get("kpa_10", 0)
        kpa_3_radius = rings.get("kpa_3", 0)

        crater_population = get_population_in_area(lat, lon, crater_diameter / 2)
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

        print(kpa_70_population,  kpa_70_casulties)
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
                    "formed": True,
                    "diameter_m": crater_diameter,
                    "depth_m": crater_depth,
                },
                "rings": [
                    {
                        "threshold_kpa": 70,
                        "radius_m": kpa_70_radius,
                        "arrival_time_s": 5.9,
                        "delta_to_next_s": 2.4,
                        "population": kpa_70_population,
                        "estimated_deaths": kpa_70_casulties,
                        "blurb": "Severe structural damage (reinforced buildings fail).",
                    },
                    {
                        "threshold_kpa": 50,
                        "radius_m": kpa_50_radius,
                        "arrival_time_s": 8.3,
                        "delta_to_next_s": 2.7,
                        "population": kpa_50_population,
                        "estimated_deaths": kpa_50_casulties,
                        "blurb": "Heavy damage; most buildings uninhabitable.",
                    },
                    {
                        "threshold_kpa": 35,
                        "radius_m": kpa_35_radius,
                        "arrival_time_s": 11.0,
                        "delta_to_next_s": 6.0,
                        "population": kpa_35_population,
                        "estimated_deaths": kpa_35_casulties,
                        "blurb": "Moderate damage; walls collapse, serious injuries.",
                    },
                    {
                        "threshold_kpa": 20,
                        "radius_m": kpa_20_radius,
                        "arrival_time_s": 17.0,
                        "delta_to_next_s": 9.0,
                        "population": kpa_20_population,
                        "estimated_deaths": kpa_20_casulties,
                        "blurb": "Light damage; roofs/doors blown in.",
                    },
                    {
                        "threshold_kpa": 10,
                        "radius_m": kpa_10_radius,
                        "arrival_time_s": 26.0,
                        "delta_to_next_s": 28.0,
                        "population": kpa_10_population,
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

        return Response({"data": return_data}, status=status.HTTP_200_OK)


class SimulationsFetchView(APIView):
    def get(self, request, simulation_id):
        pass
