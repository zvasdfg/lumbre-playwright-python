import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-015",
    "The ingredient catalog combines family and text filters",
)
def test_ingredient_catalog_combines_filters(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    lab = home.ingredient_lab

    with test_log.step("Filter the catalog by the Chile family"):
        selected_family = "Chile"
        lab.filter_by_family(selected_family)
        test_log.values(selected_family=selected_family)

    with test_log.step("Search within the selected family"):
        search_query = "morita"
        lab.search(search_query)
        test_log.values(search_query=search_query)

    with test_log.step("Validate the single matching ingredient"):
        expected_ingredient = "chile morita"
        expect(lab.catalog_status).to_have_text("1 componentes encontrados")
        expect(lab.ingredient_cards).to_have_count(1)
        expect(lab.ingredient_card(expected_ingredient)).to_be_visible()

        observed_names = lab.ingredient_cards.get_by_role("heading").all_inner_texts()
        test_log.values(
            observed_ingredient_names=observed_names,
            expected_ingredient_name=expected_ingredient,
            observed_card_count=lab.ingredient_cards.count(),
            expected_card_count=1,
        )
