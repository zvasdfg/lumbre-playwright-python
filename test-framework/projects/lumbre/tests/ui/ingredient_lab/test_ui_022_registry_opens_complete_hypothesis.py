import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-022",
    "The hypothesis registry opens the selected complete technical sheet",
)
def test_registry_opens_complete_hypothesis(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    lab = home.ingredient_lab
    hypothesis_id = "LHC-003"

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
