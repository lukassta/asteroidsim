from .utils import as_finite_positive_float
from math import pi

def calculate_volume(diameter_m: float) -> float:
    """Calculate the volume of a perfect sphere from its diameter.

    Parameters:
        diameter_m (float): sphere diameter in meters (m).

    Returns:
        float: volume in cubic meters (m^3).
    """
    diameter_m_validated = as_finite_positive_float("diameter_m", diameter_m)
    radius_m = diameter_m_validated / 2.0
    volume = (4.0 / 3.0) * pi * (radius_m ** 3)
    return volume

def calculate_mass(volume_m3: float, density_kg_m3: float) -> float:
    """Calculate mass from volume and density.

    Parameters:
        volume_m3 (float): volume in cubic meters (m^3).
        density_kg_m3 (float): density in kilograms per cubic meter (kg/m^3).

    Returns:
        float: mass in kilograms (kg).
    """
    volume_m3_validated = as_finite_positive_float("volume_m3", volume_m3)
    density_kg_m3_validated = as_finite_positive_float("density_kg_m3", density_kg_m3)

    mass = volume_m3_validated * density_kg_m3_validated
    return mass