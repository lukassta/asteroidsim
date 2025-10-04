import math
import pytest
from asteroid.utils import as_finite_positive_float
from asteroid.calculations import (
    calculate_impact_energy,
    calculate_mass,
    calculate_volume
)

from asteroid.constants import (
    J_PER_MT
)

def calculate_impact_energy(mass_kg: float, velocity_m_s: float) -> float:
    m = as_finite_positive_float("mass_kg", mass_kg)
    v = as_finite_positive_float("velocity_m_s", velocity_m_s)
    return (0.5 * m * v * v) / J_PER_MT


@pytest.mark.parametrize(
    "m,v,expected_mt",
    [
        # Simple hand-check: 0.5 * 1e3 * (1e3)^2 = 5e8 J -> ~1.195e-7 Mt
        (1_000.0, 1_000.0, 5e8 / J_PER_MT),
        # Larger realistic case: m=1e8 kg, v=20000 m/s -> 2e16 J -> ~4.781 Mt
        (1e8, 20_000.0, (0.5 * 1e8 * (20_000.0**2)) / J_PER_MT),
        # Accept numeric strings
        ("1000", "1000", 5e8 / J_PER_MT),
    ],
)
def test_calculate_impact_energy_valid(m, v, expected_mt):
    got = calculate_impact_energy(m, v)
    assert got == pytest.approx(expected_mt, rel=1e-12, abs=0.0)


@pytest.mark.parametrize("m,v", [
    (0.0, 1000.0),
    (1000.0, 0.0),
    (-1.0, 1000.0),
    (1000.0, -1.0),
    (float("nan"), 1000.0),
    (1000.0, float("inf")),
    (None, 1000.0),
    (1000.0, "not-a-number"),
])
def test_calculate_impact_energy_invalid(m, v):
    with pytest.raises(ValueError):
        calculate_impact_energy(m, v)
