from math import floor

import pytest
from playwright.sync_api import expect

from projects.lumbre.data.cases import INGREDIENTS

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.laboratory, pytest.mark.portal]


@pytest.mark.case("UI-068", "Four peppers contribute to the radar by their recorded grams")
def test_multiple_peppers(lab):
    ids = ["sal_mar_gruesa", "pimienta_negra", "pimienta_blanca", "pimienta_rosa", "pimienta_verde"]
    catalog = {item["id"]: item for item in INGREDIENTS}
    amounts = {ingredient: (75 if ingredient == "sal_mar_gruesa" else 18.75) for ingredient in ids}
    for ingredient in ids:
        lab.add(ingredient)
    page = lab.page
    group = lab.family(lab.card("pimienta_verde"))
    expect(group.locator("summary")).to_contain_text("4 seleccionados")
    for ingredient, grams in amounts.items():
        page.get_by_label("Gramos de " + catalog[ingredient]["nombre"], exact=True).fill(str(grams))
    axes = [
        ("salado", "Salado"),
        ("dulce", "Dulce"),
        ("acido", "Ácido"),
        ("amargo", "Amargo"),
        ("umami", "Umami"),
    ]
    raw = [
        sum(catalog[i]["perfil_sensorial"][axis] * amounts[i] for i in ids) / 150
        for axis, _ in axes
    ]
    title = page.locator(".experiment-bench .lab-radar svg title")
    for (_, label), value in zip(axes, raw, strict=True):
        expect(title).to_contain_text(f"{label} {floor(value / max(raw) * 100 + 0.5)}% del máximo")
    previous = title.text_content()
    page.get_by_label("Gramos de pimienta negra", exact=True).fill("1")
    expect(title).not_to_have_text(previous)
    page.get_by_role("button", name="Retirar pimienta blanca", exact=True).click()
    expect(group.locator("summary")).to_contain_text("3 seleccionados")
    expect(page.get_by_label("Gramos de pimienta blanca", exact=True)).to_have_count(0)
