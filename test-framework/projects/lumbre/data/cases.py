"""Independent test contracts. Changes require review, not auto-accepting app output."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
INGREDIENTS = [
    json.loads(p.read_text()) for p in sorted((ROOT / "portal/data/ingredientes").glob("*.json"))
]
FUELS = {
    "abierta": ("carbon", "briquetas", "lena"),
    "kettle": ("carbon", "briquetas", "lena"),
    "kamado": ("carbon", "briquetas", "lena"),
    "ahumador": ("carbon", "briquetas", "lena"),
    "offset": ("lena", "carbon", "briquetas"),
    "gas": ("gas_lp", "gas_natural"),
    "pellets": ("pellets",),
}
PLANNER_CASES = [
    (goal, equipment, fuel)
    for goal in ("asar", "ahumar", "hornear")
    for equipment, fuels in FUELS.items()
    if equipment != "abierta" or goal == "asar"
    for fuel in fuels
]

# Archive edition: 001–105, including two different originals printed as 059.
# The suffix identifies the second asset; it does not renumber the printed original.
ALMANAC_DOCUMENTS = (
    tuple(f"{n:03d}" for n in range(1, 60))
    + ("059-cepillo",)
    + tuple(f"{n:03d}" for n in range(60, 106))
)
ALMANAC_PORTRAIT_DOCUMENTS = (11, 12, 13, 14)
BLEND_COMPONENT_IDS = (
    "sal_kosher",
    "pimienta_negra",
    "ajo_granulado",
    "cebolla_granulada",
    "chile_ancho",
    "comino",
    "oregano_mexicano",
    "romero",
    "tomillo",
    "laurel",
    "pimienta_blanca",
    "pimienta_verde",
)
