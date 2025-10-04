import os

import geopandas as gpd
import numpy as np
import rioxarray
from pyproj import Transformer
from shapely.geometry import Point
import math
import numbers
from .constants import ENERGY_JOULES_PER_MEGATON_TNT

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
    """Calculate mass given volume and density.

    Parameters:
        volume_m3 (float): Volume in cubic meters (m³).
        density_kg_m3 (float): Density in kilograms per cubic meter (kg/m³).

    Returns:
        float: Mass in kilograms (kg).

    Raises:
        ValueError: If volume or density are not positive.
    """
    if volume_m3 <= 0 or density_kg_m3 <= 0:
        raise ValueError("Volume and density must be positive numbers.")

    mass = volume_m3 * density_kg_m3
    return mass

def calculate_impact_energy(mass_kg: float, velocity_m_s: float) -> float:
    """Calculate kinetic energy released by an impactor in megatons of TNT.

    Parameters:
        mass_kg (float): Mass of the impactor in kilograms (kg).
        velocity_m_s (float): Velocity of the impactor in meters per second (m/s).

    Returns:
        float: Energy released in megatons of TNT (Mt).

    Raises:
        ValueError: If mass or velocity are not positive.
    """
    if mass_kg <= 0 or velocity_m_s <= 0:
        raise ValueError("Mass and velocity must be positive numbers.")

    joules = 0.5 * mass_kg * velocity_m_s**2
    megatons_tnt = joules / ENERGY_JOULES_PER_MEGATON_TNT
    return megatons_tnt

def calculate_transient_crater_diameter(diameter_m: float, energy_tnt: float, material_type: str) -> float:
    material_sf = {
        "water": 0.05,
        "sedimentary": 0.30,
        "crystalline": 0.50
    }

    # A and B constants are backed in the scientific justification file for this project
    scaling_factor = material_sf[material_type]
    A = 0.0162
    B = 0.29

    crater_diameter_m = A * (energy_tnt * scaling_factor * ENERGY_JOULES_PER_MEGATON_TNT) ** B
    return crater_diameter_m

def calculate_final_crater_diameter(D_tc_m: float) -> float:
    """Return final rim-to-rim diameter from transient diameter (meters).
    Uses D_fr = 1.25 * D_tc for simple craters. For complex, raise for now.
    """
    if D_tc_m <= 0:
        raise ValueError("D_tc_m must be positive")
    return D_tc_m * 1.25