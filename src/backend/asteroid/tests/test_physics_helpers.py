# tests/test_physics_strict.py
import math
import pytest

from asteroid.physics_helpers import (
    calculate_volume,
    calculate_mass,
)

# ---------- calculate_volume (strict) ----------

@pytest.mark.parametrize(
    "diameter_m, expected_m3",
    [
        (1.0, (4.0/3.0) * math.pi * (0.5**3)),   # radius=0.5
        (2.0, (4.0/3.0) * math.pi * (1.0**3)),   # radius=1
        (1e6, (4.0/3.0) * math.pi * ((5e5)**3)), # large but finite
    ],
)
def test_calculate_volume_valid(diameter_m, expected_m3):
    got = calculate_volume(diameter_m)
    assert got == pytest.approx(expected_m3, rel=1e-12)


@pytest.mark.parametrize(
    "bad",
    [
        # numeric but invalid → ValueError
        0.0,
        -1.0,
        float("nan"),
        float("inf"),
        -float("inf"),
        # non-numeric types → TypeError
        None,
        "2.0",
        "1e1",
        "abc",
        [],
        {},
        True,   # bools explicitly rejected
        False,
    ],
)
def test_calculate_volume_invalid_strict(bad):
    with pytest.raises((ValueError, TypeError)):
        calculate_volume(bad)  # type: ignore[arg-type]


# ---------- calculate_mass (strict) ----------

@pytest.mark.parametrize(
    "volume_m3, density_kg_m3, expected_kg",
    [
        (2.0, 1000.0, 2000.0),
        (0.5235987755982989, 3000.0, 1570.7963267948967),
        (1e12, 5.5e3, 5.5e15),
    ],
)
def test_calculate_mass_valid(volume_m3, density_kg_m3, expected_kg):
    got = calculate_mass(volume_m3, density_kg_m3)
    assert got == pytest.approx(expected_kg, rel=1e-12)


@pytest.mark.parametrize(
    "v_bad, rho_bad",
    [
        # numeric but invalid → ValueError
        (0.0, 1000.0),
        (1.0, 0.0),
        (-1.0, 1000.0),
        (1.0, -1000.0),
        (float("nan"), 1000.0),
        (1.0, float("nan")),
        (float("inf"), 1.0),
        (1.0, -float("inf")),
        # non-numeric types → TypeError
        (None, 1000.0),
        (1.0, None),
        ("2.0", 1000.0),
        (1.0, "1000"),
        ("abc", 1000.0),
        (1.0, "abc"),
        ([], 1000.0),
        (1.0, {}),
        (True, 1000.0),
        (1.0, False),
    ],
)
def test_calculate_mass_invalid_strict(v_bad, rho_bad):
    with pytest.raises((ValueError, TypeError)):
        calculate_mass(v_bad, rho_bad)  # type: ignore[arg-type]


# ---------- Non-mutation sanity ----------

def test_functions_do_not_mutate_inputs():
    # These funcs only take numbers; this is a lightweight sanity check
    _ = calculate_volume(2.0)
    _ = calculate_mass(2.0, 1000.0)
