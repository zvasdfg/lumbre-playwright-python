"""Validate all 100 PDFs produced by test-recipe-sheets.py; requires pypdf."""
from collections import Counter
from pathlib import Path
from pypdf import PdfReader

directory = Path("/tmp/lumbre-recipe-qa")
counts = Counter()
for recipe_id in range(1, 101):
    reader = PdfReader(directory / f"recipe-{recipe_id:03}.pdf")
    texts = [(page.extract_text() or "").strip() for page in reader.pages]
    assert 1 <= len(texts) <= 3, (recipe_id, len(texts))
    assert all(len(text) > 80 for text in texts), (recipe_id, "Empty or almost empty page")
    combined = " ".join(" ".join(texts).split())
    for marker in ("Ingredientes", "Preparación paso a paso", "Cómo saber que está listo", "Manejo seguro", "Notas y fuentes", "todavía no probada en cocina", "CDC"):
        assert marker in combined, (recipe_id, "Missing", marker)
    assert "El fuego nos" not in combined, (recipe_id, "Underlying portal printed")
    if "Blend recomendado" in combined or "Variante opcional" in combined:
        assert any(f"LMB-F-00{n}" in combined for n in range(1, 5))
        assert "no están documentadas" in combined
        assert "Ver ficha de" not in combined
    counts[len(texts)] += 1
print(f"PASS: all 100 printouts complete, no blank pages. Page counts: {dict(counts)}")
