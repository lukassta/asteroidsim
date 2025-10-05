import math
import os
from typing import Any, List, Tuple

import numpy as np
import rioxarray
from pyproj import Geod, Transformer

from .constants import *
from .utils import as_finite_positive_float


# @lukas
# --------- maybe call this file metrics.py and keep it strictly for functions that compute metrics?
# --------- also, we should probably have similar styled functions, maybe im doing too much with the type hints
# and as_finite_positive_float(), but i feel like an app like this should have the most robust calculation functions possible
def calculate_impact_energy(mass_kg: float, velocity_m_s: float) -> float:
    """Calculate kinetic energy released by an impactor in megatons of TNT.

    Parameters:
        mass_kg (float): mass of the impactor in kilograms (kg).
        velocity_m_s (float): velocity of the impactor in meters per second (m/s).

    Returns:
        float: energy released in megatons of TNT (Mt).
    """
    if mass_kg <= 0:
        return 0

    mass_kg_validated = as_finite_positive_float("mass_kg", mass_kg)
    velocity_m_s_validated = as_finite_positive_float("velocity_m_s", velocity_m_s)

    E_joules = 0.5 * mass_kg_validated * (velocity_m_s_validated**2)
    E_mt = E_joules / J_PER_MT
    return E_mt


def caclulate_asteroid_impact_mass(
    entry_mass_kg: float,
    entry_velocity_m_s: float,
    decay_time_s: float,
    asteroid_density,
) -> float:
    impact_mass_kg = entry_mass_kg - (
        entry_velocity_m_s**2 * decay_time_s * 0.0025 ** (1 / 3)
    ) / (asteroid_density ** (1 / 3))

    impact_mass_kg = max(0, impact_mass_kg)

    return impact_mass_kg


def calculate_crater_depth_final(D_f_m: float) -> float:
    """
    Calculates the depth of a simple crater in its final state.

    Params:
        D_f_m (float): final crater diameter in meters (m)

    Returns:
        float: depth of a simple crater in meters (m)
    """

    if D_f_m <= 0:
        return 0

    D_f_m_validated = as_finite_positive_float("D_f_m", D_f_m)

    crater_depth_final_m = D_f_m_validated * SIMPLE_CRATER_DEPTH_FACTOR
    return crater_depth_final_m


def calculate_crater_diameter_final(D_tc_m: float) -> float:
    """
    Calculate final rim-to-rim crater diameter from transient diameter.

    Params:
        D_tc_m (float): transient crater diameter in meters (m)

    Returns:
        float: final rim-to-rim crater diameter in meters (m)
    """

    if D_tc_m <= 0:
        return 0

    D_tc_m_validated = as_finite_positive_float("D_tc_m", D_tc_m)

    crater_diameter_final_m = D_tc_m_validated * SIMPLE_TRANSIENT_TO_FINAL_FACTOR
    return crater_diameter_final_m


def calculate_crater_diameter_transient(E_mt: float, material_type: str) -> float:
    """
    Calculate transient crater diameter from impact energy and material type.

    Params:
        E_mt (float): energy in megatons of TNT
        material_type (str): One of "sedimentary" | "crystalline" | "water"

    Returns:
        float: transient crater diameter (m)
    """

    if E_mt <= 0:
        return 0

    E_mt_validated = as_finite_positive_float("E_mt", E_mt)
    try:
        scaling_factor = CRATER_MATERIAL_SF[material_type]
    except KeyError:
        allowed = ", ".join(sorted(CRATER_MATERIAL_SF.keys()))
        raise ValueError(f"material_type must be one of: {allowed}.")

    crater_diameter_transient_m = (
        CRATER_A * (E_mt_validated * scaling_factor * J_PER_MT) ** CRATER_B
    )
    return crater_diameter_transient_m


def calculate_landing_time(staring_height_m: float, velocity_m_s: float) -> float:
    landing_time_s = (
        math.sqrt(
            velocity_m_s**2 / EARTH_GRAVITATIONAL_CONSTANT**2
            + 2 * staring_height_m / EARTH_GRAVITATIONAL_CONSTANT
        )
        - velocity_m_s / EARTH_GRAVITATIONAL_CONSTANT
    )

    return landing_time_s


def calculate_rings(
    E_mt: float, asteroid_diameter_m: float, material_type: str
) -> Dict[str, List[Dict[str, Any]]]:
    """Build the rings dict from pressure thresholds (kPa)."""
    thresholds_kpa = [70, 50, 35, 20, 10, 3]

    rings: Dict[str, Any] = {}
    for kpa in thresholds_kpa:
        radius_m = calculate_ring_radius(
            E_mt,
            kpa * 1_000.0,  # kPa -> Pa
            asteroid_diameter_m,
            material_type,
        )
        rings[f"kpa_{kpa}"] = radius_m

    return rings


# AI says this is incorrect?
def calculate_ring_radius(
    E_mt: float, pressure_pa: float, asteroid_diameter_m: float, material_type: str
) -> float:
    if E_mt == 0:
        return 0

    E_joules = E_mt * J_PER_MT
    asteroid_radius_m = asteroid_diameter_m / 2.0
    volume = (
        (4.0 / 3.0)
        * math.pi
        * (CRATER_MATERIAL_SF[material_type] * asteroid_radius_m) ** 3.0
    )
    ring_radius_m = (CRATER_MATERIAL_SF[material_type] * asteroid_radius_m) * (
        (E_joules * 3.0) / (pressure_pa * volume)
    ) ** (1.0 / 3.0)
    return ring_radius_m


def get_asteroid_trajecotry_coordinates(entry_angle_deg: float) -> float:
    asteroid_coordinates = []

    for step in np.arange(0, 360, 0.1):
        r = SEMI_MAJOR_AXIS_ECCENTRY_RATIO / (1 - 0.0167 * math.cos(step))

        x = r * math.cos(step)
        y = r * math.sin(step) * math.cos(entry_angle_deg)
        z = r * math.sin(step) * math.sin(entry_angle_deg)

        asteroid_coordinates.append((x, y, z))

    return asteroid_coordinates


def get_population_in_radius(
    latitude: float, longtitude: float, radius_m: float
) -> float:
    """
    Inputs: impact longtitude, impact latitude, impact radius (m)
    Outputs: Approximate population in circle radius
    """

    ghsl_file = os.getenv("DATASET_GHS_POP_URL")
    ghsl = rioxarray.open_rasterio(ghsl_file)

    transformer = Transformer.from_crs("EPSG:4326", "ESRI:54009", always_xy=True)
    center_x, center_y = transformer.transform(longtitude, latitude)

    resolution_m = abs(ghsl.rio.resolution()[0])

    multiplier = 1
    if radius_m < resolution_m / 2:
        multiplier = radius_m / resolution_m
        radius_m = resolution_m / 2

    radius_in_pixels = int(np.ceil(radius_m / resolution_m)) + 1

    try:
        x_coords = ghsl.x.values
        y_coords = ghsl.y.values

        # Optimization
        # Find nearest indices
        x_idx = np.argmin(np.abs(x_coords - center_x))
        y_idx = np.argmin(np.abs(y_coords - center_y))

        # Create slice with bounds checking
        x_min = max(0, x_idx - radius_in_pixels)
        x_max = min(len(x_coords), x_idx + radius_in_pixels)
        y_min = max(0, y_idx - radius_in_pixels)
        y_max = min(len(y_coords), y_idx + radius_in_pixels)

        # Slice the data (load only the region we need)
        subset = ghsl.isel(x=slice(x_min, x_max), y=slice(y_min, y_max))

        # Get coordinates for each pixel in subset
        xx, yy = np.meshgrid(subset.x.values, subset.y.values)

        # Calculate distances from center
        distances = np.sqrt((xx - center_x) ** 2 + (yy - center_y) ** 2)

        # Create mask for pixels within radius
        mask = distances <= radius_m

        # Apply mask and sum (only loads the subset into memory)
        ghsl_values = subset.values
        if ghsl_values.ndim == 3:  # If there's a band dimension
            ghsl_values = ghsl_values[0]

        population = float(np.sum(ghsl_values[mask])) * multiplier

    except Exception as e:
        print(f"Error: {e}")
        return None

    return population


def ground_intercept_from_spawn(
    lat_deg: float,
    lon_deg: float,
    entry_angle_deg: float,  # from horizontal
    azimuth_deg: float,  # bearing: 0°=North, 90°=East
    spawn_height_m: float = 120_000.0,
) -> Tuple[float, float, float]:
    """
    Compute ground intercept assuming straight-line path from height H.

    Parameters:
        lat_deg (float):
        lon_deg (float):
        entry_angle_deg (float):
        azimuth_deg (float):
        spawn_height_m (float):

    Returns:
        tuple: (impact_lat_deg, impact_lon_deg, ground_range_m)

    Model:
        L = H / tan(entry_angle)
        east =  L * sin(az), north = L * cos(az), with az from North, clockwise.
        Endpoint solved on WGS84 using forward geodesic with distance L and bearing az.
    """
    if not math.isfinite(spawn_height_m) or spawn_height_m <= 0:
        raise ValueError("spawn_height_m must be finite and > 0.")
    if not math.isfinite(entry_angle_deg):
        raise ValueError("entry_angle_deg must be finite.")
    if not (0.0 < entry_angle_deg < 90.0):
        # tan(0) blows up; 90° means straight down (L≈0)
        raise ValueError("entry_angle_deg must be in (0, 90) degrees.")
    if not math.isfinite(azimuth_deg):
        raise ValueError("azimuth_deg must be finite.")

    # horizontal run
    entry_rad = math.radians(entry_angle_deg)
    L = spawn_height_m / math.tan(entry_rad)  # meters

    # Use geodesic forward with distance L and bearing azimuth_deg (from North, CW)
    fwd_lon, fwd_lat, _ = WGS84.fwd(lon_deg, lat_deg, azimuth_deg, L)
    return fwd_lat, fwd_lon, L
