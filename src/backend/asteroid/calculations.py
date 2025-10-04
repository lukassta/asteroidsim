import math
import numbers
from .constants import ENERGY_JOULES_PER_MEGATON_TNT

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


