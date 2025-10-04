import math
import pytest

from asteroid.calculations import (
    calculate_crater_diameter_transient,
    calculate_crater_diameter_final,
)

from asteroid.constants import (
    CRATER_A,
    CRATER_B,
    CRATER_MATERIAL_SF,
    J_PER_MT,
    SIMPLE_TRANSIENT_TO_FINAL_FACTOR,
)


# ---------- calculate_crater_diameter_transient ----------

@pytest.mark.parametrize("material_type", list(CRATER_MATERIAL_SF.keys()))
@pytest.mark.parametrize("E_mt", [0.1, 1.0, 12.5, 1_000.0])
def test_transient_happy_path(material_type: str, E_mt: float) -> None:
    """D_tc = A * (E_mt * scaling * J_PER_MT)^B"""
    got = calculate_crater_diameter_transient(E_mt, material_type)
    scaling = CRATER_MATERIAL_SF[material_type]
    expected = CRATER_A * (E_mt * scaling * J_PER_MT) ** CRATER_B
    assert math.isclose(got, expected, rel_tol=1e-12)


@pytest.mark.parametrize("bad_E", [0.0, -1.0, -123.4, math.inf, -math.inf, math.nan])
def test_transient_rejects_bad_energy(bad_E: float) -> None:
    with pytest.raises((ValueError, TypeError)):
        calculate_crater_diameter_transient(bad_E, "sedimentary")


@pytest.mark.parametrize("bad_material", ["", "sand", "granite", "SEDIMENTARY", None])
def test_transient_rejects_bad_material(bad_material) -> None:
    with pytest.raises(ValueError):
        calculate_crater_diameter_transient(10.0, bad_material)  # valid energy


def test_transient_monotonic_with_energy() -> None:
    """If energy increases, transient diameter increases for a fixed material."""
    a = calculate_crater_diameter_transient(10.0, "sedimentary")
    b = calculate_crater_diameter_transient(20.0, "sedimentary")
    assert b > a


@pytest.mark.parametrize("E_mt", [5.0, 50.0])
def test_transient_respects_material_scaling(E_mt: float) -> None:
    """
    Material effect is purely via CRATER_MATERIAL_SF. We assert numeric consistency
    rather than a specific ordering.
    """
    results = {
        m: calculate_crater_diameter_transient(E_mt, m)
        for m in CRATER_MATERIAL_SF.keys()
    }
    # Recompute via constants to ensure mapping matches exactly
    for m, got in results.items():
        scaling = CRATER_MATERIAL_SF[m]
        expected = CRATER_A * (E_mt * scaling * J_PER_MT) ** CRATER_B
        assert math.isclose(got, expected, rel_tol=1e-12)


# ---------- calculate_crater_diameter_final ----------

@pytest.mark.parametrize("D_tc_m", [0.1, 1.0, 123.456, 10_000.0])
def test_final_happy_path(D_tc_m: float) -> None:
    got = calculate_crater_diameter_final(D_tc_m)
    expected = D_tc_m * SIMPLE_TRANSIENT_TO_FINAL_FACTOR
    assert math.isclose(got, expected, rel_tol=1e-12)


@pytest.mark.parametrize("bad_D", [0.0, -1.0, -5.5, math.inf, -math.inf, math.nan])
def test_final_rejects_bad_input(bad_D: float) -> None:
    with pytest.raises((ValueError, TypeError)):
        calculate_crater_diameter_final(bad_D)


def test_final_monotonic_with_transient_size() -> None:
    a = calculate_crater_diameter_final(100.0)
    b = calculate_crater_diameter_final(200.0)
    assert b > a


# ---------- end-to-end consistency (transient -> final) ----------

@pytest.mark.parametrize("material_type", list(CRATER_MATERIAL_SF.keys()))
@pytest.mark.parametrize("E_mt", [0.5, 10.0, 250.0])
def test_end_to_end_transient_to_final(material_type: str, E_mt: float) -> None:
    """
    final = 1.25 * transient, where transient follows the power-law.
    Verifies no hidden unit/constant mismatches.
    """
    D_tc = calculate_crater_diameter_transient(E_mt, material_type)
    D_final = calculate_crater_diameter_final(D_tc)

    scaling = CRATER_MATERIAL_SF[material_type]
    expected_tc = CRATER_A * (E_mt * scaling * J_PER_MT) ** CRATER_B
    expected_final = expected_tc * SIMPLE_TRANSIENT_TO_FINAL_FACTOR

    assert math.isclose(D_tc, expected_tc, rel_tol=1e-12)
    assert math.isclose(D_final, expected_final, rel_tol=1e-12)
