"""Invalid quantities must not become saved customer blends."""
import pytest
from playwright.sync_api import expect
from projects.lumbre_static.components.laboratory import Laboratory

pytestmark = [pytest.mark.ui, pytest.mark.regression]


@pytest.mark.case("LAB-BOUNDS-001", "Invalid grams and short aliases block saving, then recover")
@pytest.mark.parametrize("grams", ["", "0", "-1", "151", "100"])
def test_invalid_quantities(page, app_url, grams):
    page.goto(app_url)
    lab = Laboratory(page)
    lab.open()
    for ingredient in ["sal_kosher", "pimienta_negra"]:
        card = lab.card(ingredient)
        lab.expand(lab.family(card))
        card.get_by_role("button", name="Agregar", exact=True).click()
    title = page.get_by_label("Nombre de tu blend", exact=True)
    save = page.get_by_role("button", name="Guardar en esta sesión", exact=True)
    title.fill("AB")
    expect(save).to_be_disabled()
    title.fill("Lote válido")
    expect(save).to_be_enabled()
    salt = page.get_by_label("Gramos de sal kosher", exact=True)
    salt.fill(grams)
    expect(save).to_be_disabled()
    expect(page.get_by_test_id("hypothesis-print-preview")).to_have_count(0)
    salt.fill("75")
    expect(save).to_be_enabled()
    save.click()
    expect(page.get_by_test_id("hypothesis-print-preview")).to_be_visible()
