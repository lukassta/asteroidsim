import os

import geopandas as gpd
import numpy as np
import rioxarray
from pyproj import Transformer
from shapely.geometry import Point


def test_calculation(var):
    data = {"test": var}

    return data


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
