from typing import Any, Dict
import math
import json
import hashlib

def normalize_params(params: Dict[str, Any]) -> Dict[str, Any]:
    """Return a new dict with defaults applied and fields rounded.
    Expects the inner 'inputs' dict (not the whole payload)."""
    if not isinstance(params, dict):
        raise ValueError("inputs must be a dict[str, Any].")

    # Per-field rounding precision
    PRECISION = {
        "diameter_m": 3,
        "density_kg_m3": 1,
        "entry_speed_m_s": 3,
        "entry_angle_deg": 3,
        "azimuth_deg": 3,
        "lat": 5,   # only used inside aim_point
        "lon": 5,
    }

    # Defaults for top-level fields
    DEFAULTS = {
        "diameter_m": 100.0,
        "density_kg_m3": 3000.0,
        "material_type": "crystalline rock",  # not rounded
        "entry_speed_m_s": 20000.0,
        "entry_angle_deg": 45.0,
        "azimuth_deg": 90.0,
    }
    AIM_POINT_DEFAULTS = {"lat": 0.0, "lon": 0.0}

    def _round_if_numeric(key: str, value: Any) -> Any:
        """Round using PRECISION[key] if present and value is numeric; else return as-is."""
        if key not in PRECISION:
            return value
        try:
            num = float(value)
        except (TypeError, ValueError):
            return value  # leave non-numeric unchanged
        return round(num, PRECISION[key])

    # Start with a shallow copy to preserve unknown fields
    normalized_params = dict(params)

    # Apply defaults + rounding
    for key, default in DEFAULTS.items():
        normalized_params[key] = _round_if_numeric(key, params.get(key, default))

    # Ensure aim_point exists, fill defaults for lat/lon, and round them
    aim_point_param = params.get("aim_point")
    if not isinstance(aim_point_param, dict):
        aim_point_param = {}

    lat = _round_if_numeric("lat", aim_point_param.get("lat", AIM_POINT_DEFAULTS["lat"]))
    lon = _round_if_numeric("lon", aim_point_param.get("lon", AIM_POINT_DEFAULTS["lon"]))
    normalized_params["aim_point"] = {**aim_point_param, "lat": lat, "lon": lon}

    return normalized_params

def compute_simulation_id(normalized_params: Dict[str, Any]) -> str:
    """
    Compute a stable SHA-256 hash ID from normalized simulation parameters.

    Parameters:
        normalized_params (dict[str, Any]): Dictionary of normalized parameters

    Returns:
        str: simulation_id
    """
    # Ensure deterministic ordering and consistent formatting
    serialized: str = json.dumps(normalized_params, sort_keys=True, separators=(",", ":"))

    # Encode to bytes for hashing
    encoded: bytes = serialized.encode("utf-8")

    # Compute SHA-256 digest
    simulation_id: str = hashlib.sha256(encoded).hexdigest()

    # Return with clear prefix (so ID type is explicit)
    return simulation_id
    

def as_finite_positive_float(name: str, value: Any) -> float:
    """Require a real number (int/float), finite, and > 0.

    - strings are NOT accepted.
    - bool is NOT accepted
    - raises TypeError for non-numeric types; ValueError for non-finite/≤0.
    """
    # allow only int/float (but reject bool explicitly, since it's a subclass of int)
    # and thus True would pass the isinstance check -> get coerced to 1.0 and get returned as a valid value
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError(f"{name} must be a number.")

    x = float(value)  # safe now
    if not math.isfinite(x):
        raise ValueError(f"{name} must be finite (no NaN/inf).")
    if x <= 0:
        raise ValueError(f"{name} must be positive.")
    return x
