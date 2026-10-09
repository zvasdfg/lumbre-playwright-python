"""Independent test contracts. Changes require review, not auto-accepting app output."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
INGREDIENTS = [json.loads(p.read_text()) for p in sorted(
    (ROOT / "portal/app/api/ingredientes").glob("*.json"))]
FUELS = {
    "abierta": ("carbon", "briquetas", "lena"),
    "kettle": ("carbon", "briquetas", "lena"),
    "kamado": ("carbon", "briquetas", "lena"),
    "ahumador": ("carbon", "briquetas", "lena"),
    "offset": ("lena", "carbon", "briquetas"),
    "gas": ("gas_lp", "gas_natural"), "pellets": ("pellets",),
}
PLANNER_CASES = [(goal, equipment, fuel) for goal in ("asar", "ahumar", "hornear")
                 for equipment, fuels in FUELS.items()
                 if equipment != "abierta" or goal == "asar" for fuel in fuels]
