from typing import Any, Dict

from django.http import JsonResponse
from rest_framework import status
from rest_framework.exceptions import ParseError
from rest_framework.response import Response
from rest_framework.views import APIView

from asteroid.models import Asteroid
from asteroid.serializers import BriefAsteroidSerializer

from .api_calls import call_sbdb_lookup, extract_spkid
from .calculations import (caclulate_asteroid_impact_mass,
                           calculate_asteroid_fall_trajecotry_coordinates,
                           calculate_crater_depth_final,
                           calculate_crater_diameter_final,
                           calculate_crater_diameter_transient,
                           calculate_fall_time, calculate_impact_energy,
                           calculate_rings, get_population_in_radius)

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

        fall_height_m = 120 * 1000  # 12km

        normalized_params = normalize_params(raw_params)

        azimuth_angle_deg = normalized_params.get("azimuth_angle_deg", 0)
        asteroid_entry_angle_deg = normalized_params.get("entry_angle_deg", 0)
        asteroid_composition = normalized_params.get("material_type", 0)
        asteroid_density_kg_m3 = normalized_params.get("density_kg_m3", 0)
        asteroid_diameter_m = normalized_params.get("diameter_m", 0)
        lat = normalized_params.get("lat", 0)
        lon = normalized_params.get("lon", 0)
        entry_velocity_m_s = normalized_params.get("entry_velocity_m_s", 0)

        fall_time_s = calculate_fall_time(fall_height_m, entry_velocity_m_s)

        asteroid_volume_m3 = calculate_volume(asteroid_diameter_m)

        asteroid_mass_kg = calculate_mass(asteroid_volume_m3, asteroid_density_kg_m3)

        asteroid_mass_on_impact_kg = caclulate_asteroid_impact_mass(
            asteroid_mass_kg, entry_velocity_m_s, fall_time_s, asteroid_density_kg_m3
        )


        impact_energy_Mt_tnt = calculate_impact_energy(
            asteroid_mass_on_impact_kg, entry_velocity_m_s
        )

        crater_diameter_trans_m = calculate_crater_diameter_transient(
            impact_energy_Mt_tnt, asteroid_composition
        )
        crater_diameter_m = calculate_crater_diameter_final(crater_diameter_trans_m)
        crater_depth_m = calculate_crater_depth_final(crater_diameter_m)

        rings = calculate_rings(
            impact_energy_Mt_tnt, asteroid_diameter_m, asteroid_composition
        )

        kpa_70_radius_m = rings.get("kpa_70", 0)
        kpa_50_radius_m = rings.get("kpa_50", 0)
        kpa_35_radius_m = rings.get("kpa_35", 0)
        kpa_20_radius_m = rings.get("kpa_20", 0)
        kpa_10_radius_m = rings.get("kpa_10", 0)
        kpa_3_radius_m = rings.get("kpa_3", 0)

        crater_population = get_population_in_radius(lat, lon, crater_diameter_m / 2)
        kpa_70_population = (
            get_population_in_radius(lat, lon, kpa_70_radius_m) - crater_population
        )
        kpa_50_population = (
            get_population_in_radius(lat, lon, kpa_50_radius_m)
            - crater_population
            - kpa_70_population
        )
        kpa_35_population = (
            get_population_in_radius(lat, lon, kpa_35_radius_m)
            - crater_population
            - kpa_70_population
            - kpa_50_population
        )
        kpa_20_population = (
            get_population_in_radius(lat, lon, kpa_20_radius_m)
            - crater_population
            - kpa_70_population
            - kpa_50_population
            - kpa_35_population
        )
        kpa_10_population = (
            get_population_in_radius(lat, lon, kpa_10_radius_m)
            - crater_population
            - kpa_70_population
            - kpa_50_population
            - kpa_35_population
            - kpa_20_population
        )
        kpa_3_population = (
            get_population_in_radius(lat, lon, kpa_3_radius_m)
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


        asteroid_fall_coordinates = calculate_asteroid_fall_trajecotry_coordinates(
            azimuth_angle_deg, asteroid_entry_angle_deg, entry_velocity_m_s, fall_time_s
        )

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
                "crater_transient_diameter_m": crater_diameter_trans_m,
                "crater_final_diameter_m": crater_diameter_m,
                "rings": [
                    {"threshold_kpa": 70, "radius_m": kpa_70_radius_m},
                    {"threshold_kpa": 50, "radius_m": kpa_50_radius_m},
                    {"threshold_kpa": 35, "radius_m": kpa_35_radius_m},
                    {"threshold_kpa": 20, "radius_m": kpa_20_radius_m},
                    {"threshold_kpa": 10, "radius_m": kpa_10_radius_m},
                    {"threshold_kpa": 3, "radius_m": kpa_3_radius_m},
                ],
            },
            "panel": {
                "energy_released_megatons": impact_energy_Mt_tnt,
                "crater_final": {
                    "formed": True,
                    "diameter_m": crater_diameter_m,
                    "depth_m": crater_depth_m,
                },
                "rings": [
                    {
                        "threshold_kpa": 70,
                        "radius_m": kpa_70_radius_m,
                        "arrival_time_s": 5.9,
                        "delta_to_next_s": 2.4,
                        "population": kpa_70_population,
                        "estimated_deaths": kpa_70_casulties,
                        "blurb": "Severe structural damage (reinforced buildings fail).",
                    },
                    {
                        "threshold_kpa": 50,
                        "radius_m": kpa_50_radius_m,
                        "arrival_time_s": 8.3,
                        "delta_to_next_s": 2.7,
                        "population": kpa_50_population,
                        "estimated_deaths": kpa_50_casulties,
                        "blurb": "Heavy damage; most buildings uninhabitable.",
                    },
                    {
                        "threshold_kpa": 35,
                        "radius_m": kpa_35_radius_m,
                        "arrival_time_s": 11.0,
                        "delta_to_next_s": 6.0,
                        "population": kpa_35_population,
                        "estimated_deaths": kpa_35_casulties,
                        "blurb": "Moderate damage; walls collapse, serious injuries.",
                    },
                    {
                        "threshold_kpa": 20,
                        "radius_m": kpa_20_radius_m,
                        "arrival_time_s": 17.0,
                        "delta_to_next_s": 9.0,
                        "population": kpa_20_population,
                        "estimated_deaths": kpa_20_casulties,
                        "blurb": "Light damage; roofs/doors blown in.",
                    },
                    {
                        "threshold_kpa": 10,
                        "radius_m": kpa_10_radius_m,
                        "arrival_time_s": 26.0,
                        "delta_to_next_s": 28.0,
                        "population": kpa_10_population,
                        "estimated_deaths": kpa_10_casulties,
                        "blurb": "Minor damage; most windows shatter.",
                    },
                    {
                        "threshold_kpa": 3,
                        "radius_m": kpa_3_radius_m,
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
            "asteroid_fall_coordinates": [
                asteroid_fall_coordinates,
            ],
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


class NeoIdView(APIView):
    def get(self, request):
        name = (request.query_params.get("name") or "").strip()

        if not name:
            return JsonResponse(
                {"detail": "Query parameter 'name' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = call_sbdb_lookup(name)
        id = extract_spkid(payload)

        return Response({"neo_id": id}, status=status.HTTP_200_OK)
