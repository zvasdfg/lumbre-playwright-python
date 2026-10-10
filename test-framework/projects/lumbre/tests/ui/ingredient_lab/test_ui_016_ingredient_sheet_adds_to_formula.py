import pytest
from playwright.sync_api import expect

from projects.lumbre.components.ingredient_lab import IngredientLab
from projects.lumbre.data.cases import INGREDIENTS

pytestmark = [
    pytest.mark.ui,
    pytest.mark.regression,
    pytest.mark.laboratory,
    pytest.mark.matrix,
    pytest.mark.ingredients_matrix,
    pytest.mark.portal,
]


@pytest.mark.case("UI-016", "Every catalog ingredient can be inspected, selected and removed")
@pytest.mark.parametrize("item", INGREDIENTS, ids=lambda item: item["id"])
def test_each_ingredient(screen, item):
    lab = IngredientLab(screen)
    lab.open()
    card = lab.card(item["id"])
    group = lab.family(card)
    expect(group).to_be_visible()
    lab.expand(group)
    card.get_by_role("button", name="Ficha", exact=True).click()
    dialog = screen.get_by_role("dialog")
    expect(dialog).to_contain_text(item["nombre"])
    dialog.get_by_role("button", name="Cerrar ficha", exact=True).click()
    card.get_by_role("button", name="Agregar", exact=True).click()
    expect(screen.get_by_label("Componentes seleccionados")).to_contain_text(item["nombre"])
    expect(group.locator("summary")).to_contain_text("1 seleccionados")
    screen.get_by_role("button", name=f"Retirar {item['nombre']}", exact=True).click()
    expect(
        screen.get_by_label("Componentes seleccionados").locator("li:not(.empty-slot)")
    ).to_have_count(0)
    expect(card.get_by_role("button", name="Agregar", exact=True)).to_have_attribute(
        "aria-pressed", "false"
    )
