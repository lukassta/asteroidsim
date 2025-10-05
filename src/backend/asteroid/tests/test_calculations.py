import math

import pytest

from asteroid.calculations import (calculate_crater_depth_final,
                                   calculate_crater_diameter_final,
                                   calculate_crater_diameter_transient,
                                   calculate_impact_energy)
from asteroid.constants import (CRATER_A, CRATER_B, CRATER_MATERIAL_SF,
                                J_PER_MT, SIMPLE_CRATER_DEPTH_FACTOR,
                                SIMPLE_TRANSIENT_TO_FINAL_FACTOR)

# ---------------------------------------------
# calculate_impact_energy
# ---------------------------------------------


@pytest.mark.parametrize(
    "m, v",
    [
        (1.0, 1_000.0),
        (10_000.0, 500.0),
        (3.5e6, 12_000.0),
        (1.0, 1.0),  # minimal but valid
        (1e12, 50_000.0),  # large but safe
    ],
)
def test_impact_energy_formula_and_finiteness(m: float, v: float) -> None:
    """E_mt = 0.5*m*v^2 / J_PER_MT; must be finite & positive for valid inputs."""
    got_mt = calculate_impact_energy(m, v)
    expected_mt = (0.5 * m * v * v) / J_PER_MT
    assert math.isfinite(got_mt)
    assert got_mt > 0.0
    assert math.isclose(got_mt, expected_mt, rel_tol=1e-12)


def test_impact_energy_monotonicity() -> None:
    """E increases with m and with v (independently)."""
    m = 1e6
    e1 = calculate_impact_energy(m, 1_000.0)
    e2 = calculate_impact_energy(m, 2_000.0)
    assert e2 > e1

    v = 2_000.0
    e3 = calculate_impact_energy(1e5, v)
    e4 = calculate_impact_energy(2e5, v)
    assert e4 > e3


@pytest.mark.parametrize(
    "m_bad, v_bad",
    [
        (0.0, 100.0),
        (-1.0, 100.0),
        (1.0, 0.0),
        (1.0, -100.0),
        (math.inf, 1.0),
        (1.0, math.inf),
        (math.nan, 1.0),
        (1.0, math.nan),
        ("1", 100.0),  # wrong types
        (1.0, "1000"),
    ],
)
def test_impact_energy_rejects_bad_inputs(m_bad, v_bad) -> None:
    with pytest.raises((ValueError, TypeError)):
        calculate_impact_energy(m_bad, v_bad)  # type: ignore[arg-type]


@pytest.mark.parametrize("tiny", [1e-15, 1e-12, 1e-9])
def test_impact_energy_tiny_but_positive(tiny: float) -> None:
    got = calculate_impact_energy(1.0, tiny)
    assert 0.0 < got < 1e-12


# ---------------------------------------------
# calculate_crater_diameter_transient
# ---------------------------------------------


@pytest.mark.parametrize("material", list(CRATER_MATERIAL_SF.keys()))
@pytest.mark.parametrize("E_mt", [0.1, 1.0, 25.0, 1_000.0])
def test_transient_formula(material: str, E_mt: float) -> None:
    """D_tc = A * (E_mt * scaling * J_PER_MT) ** B"""
    got = calculate_crater_diameter_transient(E_mt, material)
    expected = CRATER_A * (E_mt * CRATER_MATERIAL_SF[material] * J_PER_MT) ** CRATER_B
    assert math.isfinite(got)
    assert got > 0.0
    assert math.isclose(got, expected, rel_tol=1e-12)


def test_transient_monotonic_in_energy() -> None:
    a = calculate_crater_diameter_transient(10.0, "sedimentary")
    b = calculate_crater_diameter_transient(20.0, "sedimentary")
    assert b > a


@pytest.mark.parametrize(
    "bad_E", [0.0, -1.0, -123.4, math.inf, -math.inf, math.nan, "10"]
)
def test_transient_rejects_bad_energy(bad_E) -> None:
    with pytest.raises((ValueError, TypeError)):
        calculate_crater_diameter_transient(bad_E, "crystalline")  # type: ignore[arg-type]


@pytest.mark.parametrize("bad_material", ["", "SEDIMENTARY", "granite", None, 123])
def test_transient_rejects_bad_material(bad_material) -> None:
    with pytest.raises(ValueError):
        calculate_crater_diameter_transient(10.0, bad_material)  # type: ignore[arg-type]


@pytest.mark.parametrize("E_mt", [1e-12, 1e-9, 1e-6])
def test_transient_tiny_energy_still_positive(E_mt: float) -> None:
    got = calculate_crater_diameter_transient(E_mt, "water")
    assert got > 0.0 and math.isfinite(got)


@pytest.mark.parametrize("E_mt", [1e6, 1e9])  # huge energies; B<1 damps growth
def test_transient_huge_energy_is_finite(E_mt: float) -> None:
    got = calculate_crater_diameter_transient(E_mt, "sedimentary")
    assert math.isfinite(got) and got > 0.0


# ---------------------------------------------
# calculate_crater_diameter_final
# ---------------------------------------------


@pytest.mark.parametrize("D_tc_m", [0.1, 1.0, 123.456, 10_000.0])
def test_final_formula(D_tc_m: float) -> None:
    got = calculate_crater_diameter_final(D_tc_m)
    expected = D_tc_m * SIMPLE_TRANSIENT_TO_FINAL_FACTOR
    assert math.isfinite(got)
    assert got > 0.0
    assert math.isclose(got, expected, rel_tol=1e-12)


def test_final_monotonic_in_transient() -> None:
    a = calculate_crater_diameter_final(100.0)
    b = calculate_crater_diameter_final(200.0)
    assert b > a


@pytest.mark.parametrize("bad", [0.0, -1.0, -5.5, math.inf, -math.inf, math.nan, "1"])
def test_final_rejects_bad_inputs(bad) -> None:
    with pytest.raises((ValueError, TypeError)):
        calculate_crater_diameter_final(bad)  # type: ignore[arg-type


# ---------------------------------------------
# End-to-end consistency (transient -> final)
# ---------------------------------------------


@pytest.mark.parametrize("material", list(CRATER_MATERIAL_SF.keys()))
@pytest.mark.parametrize("E_mt", [0.5, 10.0, 250.0])
def test_end_to_end_transient_to_final(material: str, E_mt: float) -> None:
    D_tc = calculate_crater_diameter_transient(E_mt, material)
    D_final = calculate_crater_diameter_final(D_tc)

    expected_tc = (
        CRATER_A * (E_mt * CRATER_MATERIAL_SF[material] * J_PER_MT) ** CRATER_B
    )
    expected_final = expected_tc * SIMPLE_TRANSIENT_TO_FINAL_FACTOR

    assert math.isclose(D_tc, expected_tc, rel_tol=1e-12)
    assert math.isclose(D_final, expected_final, rel_tol=1e-12)


# ---------------------------------------------
# calculate_crater_depth_final
# ---------------------------------------------
@pytest.mark.parametrize("D_f", [0.1, 1.0, 12.5, 10_000.0])
def test_depth_final_formula_and_finiteness(D_f: float) -> None:
    got = calculate_crater_depth_final(D_f)
    expected = D_f * SIMPLE_CRATER_DEPTH_FACTOR
    assert math.isfinite(got)
    assert got > 0.0
    assert math.isclose(got, expected, rel_tol=1e-12)


def test_depth_final_monotonic() -> None:
    a = calculate_crater_depth_final(100.0)
    b = calculate_crater_depth_final(200.0)
    assert b > a


@pytest.mark.parametrize(
    "bad",
    [
        0.0,
        -1.0,
        -5.5,
        float("nan"),
        float("inf"),
        -float("inf"),
        # strict: non-numeric types rejected
        None,
        "100",
        "abc",
        True,
        [],
        {},
    ],
)
def test_depth_final_rejects_bad_inputs(bad) -> None:
    with pytest.raises((ValueError, TypeError)):
        calculate_crater_depth_final(bad)  # type: ignore[arg-type]


@pytest.mark.parametrize("tiny", [1e-12, 1e-9, 1e-6])
def test_depth_final_tiny_positive(tiny: float) -> None:
    got = calculate_crater_depth_final(tiny)
    assert 0.0 < got < 1.0
    assert math.isfinite(got)
