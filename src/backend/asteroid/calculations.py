import os

import geopandas as gpd
import numpy as np
import rioxarray
from pyproj import Transformer
from shapely.geometry import Point
import math
import numbers
from .constants import *
from .utils import as_finite_positive_float

def get_population_in_area(latitude, longtitude, radius):
    """
    Inputs: impact longtitude, impact latitude, impact radius (m)
    Outputs: Approximate population in circle radius
    """

    ghsl_file = os.getenv("DATASET_GHS_POP_URL")
    ghsl = rioxarray.open_rasterio(ghsl_file)

    transformer = Transformer.from_crs("EPSG:4326", "ESRI:54009", always_xy=True)
    center_x, center_y = transformer.transform(longtitude, latitude)

    resolution = abs(ghsl.rio.resolution()[0])

    multiplier = 1
    if radius < resolution / 2:
        multiplier = radius / resolution
        radius = resolution / 2

    radius_in_pixels = int(np.ceil(radius / resolution)) + 1

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
        mask = distances <= radius

        # Apply mask and sum (only loads the subset into memory)
        ghsl_values = subset.values
        if ghsl_values.ndim == 3:  # If there's a band dimension
            ghsl_values = ghsl_values[0]

        population = float(np.sum(ghsl_values[mask])) * multiplier

    except Exception as e:
        print(f"Error: {e}")
        return None

    return population

def calculate_volume(diameter_m: float) -> float:
    """Calculate the volume of a sphere given its diameter.

    Parameters:
        diameter_m (float): Sphere diameter in meters (m).

    Returns:
        float: Volume in cubic meters (m^3).

    Raises:
        ValueError: If diameter is not positive.
    """
    if diameter_m <= 0:
        raise ValueError("diameter must be a positive number.")
    
    radius_m = diameter_m / 2.0
    volume = (4.0 / 3.0) * math.pi * (radius_m ** 3)
    return volume

def calculate_mass(volume_m3: float, density_kg_m3: float) -> float:
    """Calculate mass from volume and density.

    Parameters:
        volume_m3 (float): volume in cubic meters (m^3).
        density_kg_m3 (float): density in kilograms per cubic meter (kg/m^3).

    Returns:
        float: mass in kilograms (kg).
    """
    if volume_m3 <= 0 or density_kg_m3 <= 0:
        raise ValueError("Volume and density must be positive numbers.")

    mass = volume_m3 * density_kg_m3
    return mass

def calculate_impact_energy(mass_kg: float, velocity_m_s: float) -> float:
    """Calculate kinetic energy released by an impactor in megatons of TNT.

    Parameters:
        mass_kg (float): mass of the impactor in kilograms (kg).
        velocity_m_s (float): velocity of the impactor in meters per second (m/s).

    Returns:
        float: energy released in megatons of TNT (Mt).
    """
    mass_kg_validated = as_finite_positive_float("mass_kg", mass_kg)
    velocity_m_s_validated = as_finite_positive_float("velocity_m_s", velocity_m_s)

    E_joules = 0.5 * mass_kg_validated * (velocity_m_s_validated ** 2)
    E_mt = E_joules / J_PER_MT
    return E_mt

def calculate_crater_diameter_transient(E_mt: float, material_type: str) -> float:
    """
    Calculate transient crater diameter from impact energy and material type.

    Params:
        E_mt (float): energy in megatons of TNT
        material_type (str): One of "sedimentary" | "crystalline" | "water"

    Returns:
        float: transient crater diameter (m)
    """
    E_mt_validated = as_finite_positive_float("E_mt", E_mt)
    try:
        scaling_factor = CRATER_MATERIAL_SF[material_type]
    except KeyError:
        allowed = ", ".join(sorted(CRATER_MATERIAL_SF.keys()))
        raise ValueError(f"material_type must be one of: {allowed}.")

    crater_diameter_transient_m = CRATER_A * (E_mt_validated * scaling_factor * J_PER_MT) ** CRATER_B
    return crater_diameter_transient_m


def calculate_crater_diameter_final(D_tc_m: float) -> float:
    """
    Calculate final rim-to-rim crater diameter from transient diameter.
    
    Params:
        D_tc_m (float): transient crater diameter in meters (m)

    Returns:
        float: final rim-to-rim crater diameter in meters (m)
    """
    D_tc_m_validated = as_finite_positive_float("D_tc_m", D_tc_m)

    crater_diameter_final_m = D_tc_m_validated * SIMPLE_TRANSIENT_TO_FINAL_FACTOR
    return crater_diameter_final_m