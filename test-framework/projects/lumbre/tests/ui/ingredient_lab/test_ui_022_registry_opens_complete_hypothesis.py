import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-022",
    "The hypothesis registry opens the selected complete technical sheet",
)
def test_registry_opens_complete_hypothesis(
    home: HomePage,
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    hypothesis_id = "LHC-001"

    with test_log.step("Register a formula and reload its user-created archive"):
        response = api.create_hypothesis(
            {
                "ingredient_ids": ["sal_kosher", "pimienta_negra", "ajo_granulado"],
                "objective": "Costra para res",
            }
        )
        assert response.status == 201
        home.open()
        lab = home.ingredient_lab
        test_log.values(
            observed_status=response.status,
            observed_hypothesis_id=response.json()["data"]["id"],
        )

    with test_log.step("Find a known hypothesis in the registry"):
        card = lab.hypothesis_card(hypothesis_id)
        expect(card).to_be_visible()
        expect(card).to_contain_text("Costra para res")
        test_log.values(
            selected_hypothesis_id=hypothesis_id,
            observed_card_text=card.inner_text(),
        )

    with test_log.step("Open the selected technical sheet"):
        lab.open_hypothesis(hypothesis_id)
        dialog = lab.hypothesis_dialog(hypothesis_id)
        expect(dialog).to_be_visible()

    with test_log.step("Validate the complete sheet content"):
        expected_sections = [
            "Componentes de la fórmula",
            "Método propuesto",
            "Perfil sensorial esperado",
        ]
        for section in expected_sections:
            expect(dialog).to_contain_text(section)
        for ingredient_name in ["ajo granulado", "pimienta negra", "sal kosher"]:
            expect(dialog).to_contain_text(ingredient_name)
        test_log.values(
            observed_dialog_heading=hypothesis_id,
            expected_sections=expected_sections,
            expected_ingredients=["ajo granulado", "pimienta negra", "sal kosher"],
        )
