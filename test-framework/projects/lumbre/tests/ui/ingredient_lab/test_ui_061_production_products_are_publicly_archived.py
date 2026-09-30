import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-061",
    "Production seasonings are available in the public laboratory archive",
)
def test_production_products_are_publicly_archived(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    lab = home.ingredient_lab
    expected_ids = ["LMB-F-001", "LMB-F-002", "LMB-F-003", "LMB-F-004"]

    with test_log.step("Find the four production records in the public archive"):
        for product_id in expected_ids:
            expect(lab.hypothesis_card(product_id)).to_be_visible()
        test_log.values(observed_product_ids=expected_ids)

    with test_log.step("Open the beef seasoning production record"):
        lab.open_hypothesis("LMB-F-002")
        dialog = lab.hypothesis_dialog("LMB-F-002")
        expect(dialog).to_be_visible()

    with test_log.step("Validate declared ingredients and formula-scope disclosure"):
        for expected_text in [
            "Producto en producción",
            "Sazonador para carne de res",
            "Ingredientes declarados",
            "Sal de mar",
            "Pimienta negra molida",
            "Hongo shiitake molido",
            "no documenta proporciones",
        ]:
            expect(dialog).to_contain_text(expected_text)
        test_log.values(
            observed_product_id="LMB-F-002",
            expected_ingredients=[
                "Sal de mar",
                "Pimienta negra molida",
                "Hongo shiitake molido",
            ],
        )
