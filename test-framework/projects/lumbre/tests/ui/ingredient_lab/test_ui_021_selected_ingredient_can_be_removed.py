import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.laboratory]


@pytest.mark.case(
    "UI-021",
    "Removing an ingredient restores its add control and recalculates the remaining amounts",
)
def test_selected_ingredient_can_be_removed(lab, test_log):
    with test_log.step("Create the three-component salt-pepper-garlic blend"):
        for ingredient in ("sal_kosher", "pimienta_negra", "ajo_granulado"):
            lab.add(ingredient)
        expect(lab.page.get_by_label("Gramos de ajo granulado", exact=True)).to_have_value("22.5")
    with test_log.step("Remove garlic and restore the two-component 50/50 calculation"):
        lab.page.get_by_role("button", name="Retirar ajo granulado", exact=True).click()
        expect(lab.page.get_by_label("Gramos de ajo granulado", exact=True)).to_have_count(0)
        expect(lab.page.get_by_label("Gramos de sal kosher", exact=True)).to_have_value("75")
        expect(lab.page.get_by_label("Gramos de pimienta negra", exact=True)).to_have_value("75")
        expect(
            lab.card("ajo_granulado").get_by_role("button", name="Agregar", exact=True)
        ).to_have_attribute("aria-pressed", "false")
