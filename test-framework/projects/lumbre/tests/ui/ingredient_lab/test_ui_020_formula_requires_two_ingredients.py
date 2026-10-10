import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.laboratory]


@pytest.mark.case("UI-020", "A saved blend requires at least two ingredients")
def test_formula_requires_two_ingredients(lab, test_log):
    save = lab.page.get_by_role("button", name="Guardar en esta sesión", exact=True)
    with test_log.step("Give the blend a valid alias and check the empty boundary"):
        lab.page.get_by_label("Nombre de tu blend", exact=True).fill("Prueba mínima")
        expect(save).to_be_disabled()
    with test_log.step("One ingredient is insufficient"):
        lab.add("sal_kosher")
        expect(save).to_be_disabled()
    with test_log.step("A second ingredient completes the minimum"):
        lab.add("pimienta_negra")
        expect(save).to_be_enabled()
