from typing import Dict, Any, Optional
import requests
from requests.exceptions import RequestException
from rest_framework import status
from dataclasses import dataclass

SBDB_LOOKUP_URL = "https://ssd-api.jpl.nasa.gov/sbdb.api"
DEFAULT_TIMEOUT = 10  # seconds

@dataclass
class SBDBError(Exception):
    message: str
    http_status: int = status.HTTP_502_BAD_GATEWAY

# viskas aisku
def call_sbdb_lookup(search_str: str):
    """Call SBDB Lookup API with sstr=<search_str>.

    SBDB returns either:
      - `object` (dict) for an exact/unique match, or
      - `list` (list of dicts) for multiple candidates, or
      - `message` (string) for not found.

    Docs: https://ssd-api.jpl.nasa.gov/ (SBDB Lookup)  """
    params = {
        "sstr": search_str,
        "full-prec": "false", # flag to request objects in full precision
    }
    try:
        response = requests.get(SBDB_LOOKUP_URL, params=params)
    except requests.RequestException as e:
        raise SBDBError(f"Upstream SBDB error: {e}", status.HTTP_502_BAD_GATEWAY)

    if response.status_code != 200:
        raise SBDBError(f"SBDB returned HTTP {response.status_code}", response.status_code)

    try:
        data = response.json()
    except ValueError:
        raise SBDBError("SBDB response was not valid JSON")

    return data

# gaidys
def extract_spkid(data) -> str:
    """
    Return the first SPK-ID (as a string) from an SBDB Lookup payload.
    Handles:
      - Unique match:   payload["object"] (possibly nested under "object")
      - Multiple match: payload["list"] (each item may be nested under "object")
    Falls back to 'id' if 'spkid' is absent. Returns None if not found.
    """
    def from_entry(entry: Dict[str, Any]) -> Optional[str]:
        # Entries can be the object itself or nested under "object"
        o = entry.get("object", entry) if isinstance(entry, dict) else {}
        spk = o.get("spkid") or o.get("id")
        if spk is None:
            return None
        s = str(spk).strip()
        return s or None

    # Case 1: unique match
    obj = data.get("object")
    if isinstance(obj, dict):
        spk = from_entry(obj)
        if spk:
            return spk

    # Case 2: multiple matches
    lst = data.get("list")
    if isinstance(lst, list):
        for item in lst:
            spk = from_entry(item)
            if spk:
                return spk

    # Nothing usable
    return None