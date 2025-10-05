from typing import Dict

from pyproj import Geod
# Constant for joules per megatons TNT
J_PER_MT: float = 4.184e15

# Unitless factor for converting transient diameter to final diameter
# for simple craters. Empirically ~1.25 * D_transient
# (see Collins, Melosh & Marcus, 2005, Earth Impact Effects).
SIMPLE_TRANSIENT_TO_FINAL_FACTOR: float = 1.25


SIMPLE_CRATER_DEPTH_FACTOR = 0.2
# ---------------- ASK PHYSICIST FOR SOURCES SO I CAN CITE HERE IN COMMENTS ----------------
# Crater scaling
CRATER_MATERIAL_SF: Dict[str, float] = {
    "sedimentary": 0.30,
    "crystalline": 0.50,
    "water": 0.05,
}

KPA_FATALITY_RATE: Dict[str, float] = {
    "kpa_70": 0.9,
    "kpa_50": 0.6,
    "kpa_35": 0.3,
    "kpa_20": 0.2,
    "kpa_10": 0.1,
    "kpa_3": 0.05,
}

CRATER_A: float = 0.0162  # <-- document source
CRATER_B: float = 0.29  # <-- document source
# ---------------- ASK PHYSICIST FOR SOURCES SO I CAN CITE HERE IN COMMENTS ----------------

BLAST_RADIUS_SF: Dict[str, float] = {
    "sedimentary": 2.5,
    "crystalline": 3,
    "water": 2
}