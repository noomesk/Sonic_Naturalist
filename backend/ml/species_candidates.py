"""
Candidatas de especie por ubicación y altitud.

Cruza dos fuentes públicas:
  - iNaturalist: especies de anuros observadas (grado de investigación) alrededor del punto.
  - GBIF: especies de anuros registradas dentro de la banda de altitud del audio.
Una especie solo se marca como "en altitud" si GBIF la tiene en esa banda.

Esto NO identifica el canto: solo ordena qué especies son probables en el lugar.
"""
from functools import lru_cache

import requests

INAT_URL = "https://api.inaturalist.org/v1"
GBIF_URL = "https://api.gbif.org/v1"
INAT_ANURA_TAXON_ID = 20979      # orden Anura (ranas y sapos); excluye salamandras
GBIF_ANURA_ORDER_KEY = 952
TIMEOUT = 10
ALTITUDE_TOLERANCE_M = 300   # ±m alrededor de la altitud del audio
DEFAULT_RADIUS_KM = 10
MAX_CANDIDATES = 5


@lru_cache(maxsize=128)
def geocode(location: str):
    """
    Convierte un nombre de lugar en (lat, lng, nombre) con los lugares de iNaturalist.
    iNaturalist no acepta comas ("Chicaque, Colombia" no devuelve nada), así que
    probamos el texto completo y luego solo la primera parte antes de la coma.
    """
    if not location or not location.strip():
        return None
    queries = [location.strip(), location.split(",")[0].strip()]
    for q in dict.fromkeys(queries):  # sin duplicados, en orden
        res = requests.get(f"{INAT_URL}/places/autocomplete", params={"q": q}, timeout=TIMEOUT)
        res.raise_for_status()
        for place in res.json().get("results", []):
            if place.get("location"):
                lat, lng = (float(x) for x in place["location"].split(","))
                return lat, lng, place.get("display_name") or place.get("name")
    return None


def _binomial(scientific_name: str):
    """'Dendropsophus molitor (Schmidt, 1857)' -> 'Dendropsophus molitor'. Descarta géneros sueltos."""
    parts = scientific_name.split()
    if len(parts) < 2 or not parts[0][:1].isupper() or not parts[1][:1].islower():
        return None
    return f"{parts[0]} {parts[1]}"


@lru_cache(maxsize=64)
def _inat_species(lat: float, lng: float, radius_km: int):
    res = requests.get(
        f"{INAT_URL}/observations/species_counts",
        params={
            "lat": lat, "lng": lng, "radius": radius_km,
            "taxon_id": INAT_ANURA_TAXON_ID,
            "quality_grade": "research",
            "per_page": 100,
        },
        timeout=TIMEOUT,
    )
    res.raise_for_status()
    out = {}
    for r in res.json().get("results", []):
        taxon = r["taxon"]
        name = taxon.get("name")
        if not name:
            continue
        out[name] = {
            "name": name,
            "commonName": taxon.get("preferred_common_name", ""),
            "photo": (taxon.get("default_photo") or {}).get("medium_url"),
            "inatCount": r.get("count", 0),
        }
    return out


@lru_cache(maxsize=64)
def _gbif_altitude_species(lat: float, lng: float, radius_km: int, elev_min: int, elev_max: int):
    res = requests.get(
        f"{GBIF_URL}/occurrence/search",
        params={
            "geoDistance": f"{lat},{lng},{radius_km}km",
            "orderKey": GBIF_ANURA_ORDER_KEY,
            "elevation": f"{elev_min},{elev_max}",
            "limit": 0,
            "facet": "scientificName",
            "facetLimit": 300,
        },
        timeout=TIMEOUT,
    )
    res.raise_for_status()
    facets = [f for f in res.json().get("facets", []) if f.get("field") == "SCIENTIFIC_NAME"]
    names = {}
    for item in (facets[0]["counts"] if facets else []):
        binomial = _binomial(item["name"])
        if binomial:
            names[binomial] = names.get(binomial, 0) + item["count"]
    return names


def candidates_for(lat: float | None, lng: float | None, altitude: float | None,
                   radius_km: int = DEFAULT_RADIUS_KM):
    """
    Devuelve hasta 5 candidatas ordenadas: primero las compatibles con la altitud,
    luego por número de observaciones en iNaturalist.
    """
    if lat is None or lng is None:
        return {"status": "sin coordenadas", "candidates": []}

    lat, lng = round(lat, 4), round(lng, 4)
    try:
        inat = _inat_species(lat, lng, radius_km)
    except requests.RequestException as e:
        return {"status": f"error iNaturalist: {e}", "candidates": []}

    alt_names, alt_status = None, "sin altitud: no se filtró por altura"
    if altitude is not None:
        elev_min = max(0, int(altitude - ALTITUDE_TOLERANCE_M))
        elev_max = int(altitude + ALTITUDE_TOLERANCE_M)
        try:
            alt_names = _gbif_altitude_species(lat, lng, radius_km, elev_min, elev_max)
            alt_status = (f"filtrado por altitud {elev_min}-{elev_max} m (GBIF)"
                          if alt_names else "GBIF sin registros con altitud en esa banda")
        except requests.RequestException as e:
            alt_status = f"error GBIF: {e}"

    merged = {name: dict(sp, sources=["iNaturalist"], inAltitude=None) for name, sp in inat.items()}
    if alt_names:
        for name in alt_names:
            if name in merged:
                merged[name]["sources"].append("GBIF altitud")
                merged[name]["inAltitude"] = True
            else:
                merged[name] = {"name": name, "commonName": "", "photo": None, "inatCount": 0,
                                "sources": ["GBIF altitud"], "inAltitude": True}
        for name, sp in merged.items():
            if sp["inAltitude"] is None:
                sp["inAltitude"] = False

    ranked = sorted(merged.values(), key=lambda s: (s["inAltitude"] is True, s["inatCount"]), reverse=True)
    if alt_names:
        ranked = [s for s in ranked if s["inAltitude"]] or ranked

    top = ranked[:MAX_CANDIDATES]
    for sp in top:
        if not sp["photo"] or not sp["commonName"]:
            _enrich_from_inat(sp)
    return {"status": alt_status, "candidates": top}


@lru_cache(maxsize=256)
def _inat_taxon_info(name: str):
    """Foto y nombre común de iNaturalist para un nombre científico (para especies solo de GBIF)."""
    try:
        res = requests.get(f"{INAT_URL}/taxa",
                           params={"q": name, "rank": "species", "per_page": 5},
                           timeout=TIMEOUT)
        res.raise_for_status()
    except requests.RequestException:
        return {}
    for t in res.json().get("results", []):
        if t.get("name", "").lower() == name.lower():
            return {"photo": (t.get("default_photo") or {}).get("medium_url"),
                    "commonName": t.get("preferred_common_name", "")}
    return {}


def _enrich_from_inat(sp: dict):
    info = _inat_taxon_info(sp["name"])
    sp["photo"] = sp["photo"] or info.get("photo")
    sp["commonName"] = sp["commonName"] or info.get("commonName", "")
